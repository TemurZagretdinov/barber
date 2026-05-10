from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.barber import Barber
from app.models.booking import Booking
from app.models.finance import BarberDailySettlement, BarberTransaction
from app.schemas.finance import (
    AdminBarberFinanceRead,
    AdminFinanceOverview,
    BarberBalanceRead,
    BarberDebtItem,
    DailySettlementRunResponse,
    FinanceTopBarber,
)
from app.services.notification_service import create_notification


def money_to_int(value: float | int | None) -> int:
    if value is None:
        return 0
    return max(int(round(float(value))), 0)


def effective_commission_percent(barber: Barber) -> int:
    if barber.commission_percent is None:
        return settings.commission_percent_default
    return barber.commission_percent


def apply_financial_blocking(barber: Barber) -> None:
    threshold = max(settings.financial_block_threshold, 0)
    barber.is_financially_blocked = threshold > 0 and barber.debt >= threshold


def booking_finance_price(booking: Booking, barber: Barber | None = None) -> int:
    if booking.service_price > 0:
        return booking.service_price
    if booking.price is not None:
        return money_to_int(booking.price)
    if booking.service and booking.service.price is not None:
        return money_to_int(booking.service.price)
    source_barber = barber or booking.barber
    if source_barber:
        return money_to_int(source_barber.base_price if source_barber.base_price is not None else source_barber.price_from)
    return 0


def booking_financial_preview(booking: Booking, barber: Barber | None = None) -> tuple[int, int, int, int]:
    source_barber = barber or booking.barber
    service_price = booking_finance_price(booking, source_barber)
    has_snapshot = (
        booking.status == "completed"
        and (booking.service_price > 0 or booking.barber_earning > 0 or booking.commission_charged or booking.commission_percent > 0)
    )
    percent = (
        booking.commission_percent
        if has_snapshot
        else effective_commission_percent(source_barber) if source_barber else settings.commission_percent_default
    )
    commission_amount = booking.commission_amount if booking.commission_amount > 0 else (service_price * percent) // 100
    barber_earning = booking.barber_earning if booking.barber_earning > 0 else service_price - commission_amount
    return service_price, percent, commission_amount, barber_earning


def calculate_booking_commission(booking: Booking, barber: Barber | None = None) -> None:
    if booking.commission_charged:
        return
    service_price, percent, commission_amount, barber_earning = booking_financial_preview(booking, barber)
    booking.service_price = service_price
    booking.commission_percent = percent
    booking.commission_amount = commission_amount
    booking.barber_earning = barber_earning


def create_transaction(
    db: Session,
    *,
    barber_id: int,
    transaction_type: str,
    amount: int,
    balance_before: int,
    balance_after: int,
    description: str,
    booking_id: int | None = None,
) -> BarberTransaction:
    transaction = BarberTransaction(
        barber_id=barber_id,
        booking_id=booking_id,
        type=transaction_type,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        description=description,
    )
    db.add(transaction)
    return transaction


def _send_finance_notification(db: Session, barber: Barber, event_type: str, title: str, message: str) -> None:
    create_notification(db, title=title, message=message, event_type=event_type, user_id=barber.user_id)


def _apply_commission_charge(
    db: Session,
    barber: Barber,
    *,
    amount: int,
    description: str,
    booking_id: int | None = None,
) -> int:
    if amount <= 0:
        return 0

    balance_before = barber.balance
    shortage = max(amount - barber.balance, 0)
    barber.balance = max(barber.balance - amount, 0)
    balance_after = barber.balance

    create_transaction(
        db,
        barber_id=barber.id,
        booking_id=booking_id,
        transaction_type="commission_charge",
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        description=description,
    )

    if shortage > 0:
        barber.debt += shortage
        create_transaction(
            db,
            barber_id=barber.id,
            booking_id=booking_id,
            transaction_type="debt_created",
            amount=shortage,
            balance_before=balance_after,
            balance_after=balance_after,
            description="Commission shortage converted to debt",
        )

    apply_financial_blocking(barber)
    return shortage


def charge_booking_commission_immediately(db: Session, booking: Booking) -> int:
    if booking.commission_charged:
        return 0
    barber = db.scalar(select(Barber).where(Barber.id == booking.barber_id).with_for_update())
    if not barber:
        return 0
    calculate_booking_commission(booking, barber)
    debt_created = _apply_commission_charge(
        db,
        barber,
        amount=booking.commission_amount,
        description=f"Immediate commission charge for booking {booking.booking_code}",
        booking_id=booking.id,
    )
    from app.services.booking_service import tashkent_now

    booking.commission_charged = True
    booking.commission_charged_at = tashkent_now()
    return debt_created


def _daily_totals(bookings: list[Booking], barber: Barber) -> tuple[int, int, int]:
    gross_revenue = 0
    commission_total = 0
    barber_earning_total = 0
    for booking in bookings:
        calculate_booking_commission(booking, barber)
        gross_revenue += booking.service_price
        commission_total += booking.commission_amount
        barber_earning_total += booking.barber_earning
    return gross_revenue, commission_total, barber_earning_total


def run_daily_settlement(db: Session, settlement_date: date | None = None) -> DailySettlementRunResponse:
    from app.services.booking_service import tashkent_now

    target_date = settlement_date or tashkent_now().date()
    now = tashkent_now()
    settlements: list[BarberDailySettlement] = []
    total_bookings = 0
    total_commission = 0
    total_debt_created = 0

    barber_ids = list(db.scalars(select(Barber.id).order_by(Barber.id)).all())
    for barber_id in barber_ids:
        barber = db.scalar(select(Barber).where(Barber.id == barber_id).with_for_update())
        if not barber:
            continue
        bookings = list(
            db.scalars(
                select(Booking)
                .options(selectinload(Booking.service), selectinload(Booking.barber))
                .where(
                    Booking.barber_id == barber.id,
                    Booking.booking_date == target_date,
                    Booking.status == "completed",
                    Booking.commission_charged.is_(False),
                )
                .order_by(Booking.id)
                .with_for_update()
            ).all()
        )
        if not bookings:
            continue

        gross_revenue, commission_total, barber_earning_total = _daily_totals(bookings, barber)
        balance_before = barber.balance
        settlement = BarberDailySettlement(
            barber_id=barber.id,
            date=target_date,
            total_bookings=len(bookings),
            gross_revenue=gross_revenue,
            commission_total=commission_total,
            barber_earning_total=barber_earning_total,
            balance_before=balance_before,
            balance_after=balance_before,
            debt_created=0,
            status="pending",
        )
        db.add(settlement)
        db.flush()

        debt_created = _apply_commission_charge(
            db,
            barber,
            amount=commission_total,
            description=f"Daily commission settlement for {target_date.isoformat()}",
        )
        for booking in bookings:
            booking.commission_charged = True
            booking.commission_charged_at = now

        settlement.balance_after = barber.balance
        settlement.debt_created = debt_created
        settlement.status = "completed"
        settlement.completed_at = now
        settlements.append(settlement)

        total_bookings += len(bookings)
        total_commission += commission_total
        total_debt_created += debt_created

        _send_finance_notification(
            db,
            barber,
            "settlement_completed",
            "Komissiya hisoblandi",
            "Bugungi komissiya hisoblandi. Hisobingizni tekshiring.",
        )
        if debt_created > 0:
            _send_finance_notification(
                db,
                barber,
                "debt_created",
                "Qarzdorlik yaratildi",
                "Bugungi komissiya hisoblandi. Hisobingizni to'ldiring.",
            )
        if barber.is_financially_blocked:
            _send_finance_notification(
                db,
                barber,
                "balance_low",
                "Hisob bloklangan",
                "Balansingizda qarzdorlik bor. Yangi bookinglar uchun hisobni to'ldiring.",
            )
        elif barber.debt > 0 or (settings.financial_block_threshold > 0 and barber.balance < settings.financial_block_threshold):
            _send_finance_notification(
                db,
                barber,
                "balance_low",
                "Balans kam",
                "Balansingiz kam. Ertangi bookinglarni olish uchun hisobni to'ldiring.",
            )

    db.commit()
    for settlement in settlements:
        db.refresh(settlement)

    return DailySettlementRunResponse(
        date=target_date,
        settlements_created=len(settlements),
        bookings_charged=total_bookings,
        commission_total=total_commission,
        debt_created=total_debt_created,
        settlements=settlements,
    )


def get_barber_balance_summary(db: Session, barber: Barber, summary_date: date | None = None) -> BarberBalanceRead:
    from app.services.booking_service import tashkent_now

    target_date = summary_date or tashkent_now().date()
    bookings = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.service), selectinload(Booking.barber))
            .where(Booking.barber_id == barber.id, Booking.booking_date == target_date, Booking.status == "completed")
        ).all()
    )
    gross_revenue = 0
    commission_total = 0
    barber_earning_total = 0
    for booking in bookings:
        service_price, _, commission_amount, barber_earning = booking_financial_preview(booking, barber)
        gross_revenue += service_price
        commission_total += commission_amount
        barber_earning_total += barber_earning

    return BarberBalanceRead(
        balance=barber.balance,
        debt=barber.debt,
        commission_percent=effective_commission_percent(barber),
        today_gross_revenue=gross_revenue,
        today_commission=commission_total,
        today_net_earning=barber_earning_total,
        is_financially_blocked=barber.is_financially_blocked,
    )


def list_barber_transactions(db: Session, barber_id: int, limit: int = 100) -> list[BarberTransaction]:
    return list(
        db.scalars(
            select(BarberTransaction)
            .where(BarberTransaction.barber_id == barber_id)
            .order_by(BarberTransaction.created_at.desc(), BarberTransaction.id.desc())
            .limit(limit)
        ).all()
    )


def top_up_barber_balance(db: Session, barber: Barber, amount: int) -> BarberBalanceRead:
    barber = db.scalar(select(Barber).where(Barber.id == barber.id).with_for_update()) or barber
    remaining = amount

    if barber.debt > 0:
        paid = min(remaining, barber.debt)
        barber.debt -= paid
        remaining -= paid
        create_transaction(
            db,
            barber_id=barber.id,
            transaction_type="debt_paid",
            amount=paid,
            balance_before=barber.balance,
            balance_after=barber.balance,
            description="Top-up used to pay debt",
        )

    if remaining > 0:
        balance_before = barber.balance
        barber.balance += remaining
        create_transaction(
            db,
            barber_id=barber.id,
            transaction_type="top_up",
            amount=remaining,
            balance_before=balance_before,
            balance_after=barber.balance,
            description="Manual balance top-up",
        )

    apply_financial_blocking(barber)
    _send_finance_notification(
        db,
        barber,
        "top_up_success",
        "Balans to'ldirildi",
        f"Hisobingiz {amount:,} UZS ga to'ldirildi.",
    )
    db.commit()
    db.refresh(barber)
    return get_barber_balance_summary(db, barber)


def adjust_barber_balance(db: Session, barber_id: int, amount: int, description: str) -> AdminBarberFinanceRead:
    barber = db.scalar(select(Barber).where(Barber.id == barber_id).with_for_update())
    if not barber:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Barber not found")

    balance_before = barber.balance
    if amount > 0:
        barber.balance += amount
    else:
        deduction = abs(amount)
        if deduction <= barber.balance:
            barber.balance -= deduction
        else:
            shortage = deduction - barber.balance
            barber.balance = 0
            barber.debt += shortage

    apply_financial_blocking(barber)
    create_transaction(
        db,
        barber_id=barber.id,
        transaction_type="adjustment",
        amount=amount,
        balance_before=balance_before,
        balance_after=barber.balance,
        description=description,
    )
    db.commit()
    return get_admin_barber_finance(db, barber.id)


def _completed_financials(bookings: list[Booking], barber: Barber | None = None) -> tuple[int, int, int]:
    gross_revenue = 0
    commission_total = 0
    count = 0
    for booking in bookings:
        if booking.status != "completed":
            continue
        service_price, _, commission_amount, _ = booking_financial_preview(booking, barber or booking.barber)
        gross_revenue += service_price
        commission_total += commission_amount
        count += 1
    return gross_revenue, commission_total, count


def get_admin_finance_overview(db: Session) -> AdminFinanceOverview:
    from app.services.booking_service import tashkent_now

    today = tashkent_now().date()
    month_start = today.replace(day=1)

    completed_today = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber), selectinload(Booking.service))
            .where(Booking.booking_date == today, Booking.status == "completed")
        ).all()
    )
    completed_month = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber), selectinload(Booking.service))
            .where(Booking.booking_date >= month_start, Booking.booking_date <= today, Booking.status == "completed")
        ).all()
    )
    unsettled = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber), selectinload(Booking.service))
            .where(Booking.status == "completed", Booking.commission_charged.is_(False))
        ).all()
    )

    _, today_commission, _ = _completed_financials(completed_today)
    _, month_commission, _ = _completed_financials(completed_month)
    _, unsettled_commission, _ = _completed_financials(unsettled)

    total_debt = db.scalar(select(func.coalesce(func.sum(Barber.debt), 0))) or 0
    total_topups = (
        db.scalar(
            select(func.coalesce(func.sum(BarberTransaction.amount), 0)).where(
                BarberTransaction.type.in_(("top_up", "debt_paid"))
            )
        )
        or 0
    )

    top_by_barber: dict[int, FinanceTopBarber] = {}
    for booking in completed_month:
        barber = booking.barber
        if not barber:
            continue
        service_price, _, commission_amount, _ = booking_financial_preview(booking, barber)
        current = top_by_barber.get(barber.id)
        if current is None:
            current = FinanceTopBarber(
                barber_id=barber.id,
                full_name=barber.full_name,
                gross_revenue=0,
                completed_bookings=0,
                commission_total=0,
            )
            top_by_barber[barber.id] = current
        current.gross_revenue += service_price
        current.completed_bookings += 1
        current.commission_total += commission_amount

    debtors = list(
        db.scalars(select(Barber).where(Barber.debt > 0).order_by(Barber.debt.desc(), Barber.full_name)).all()
    )
    return AdminFinanceOverview(
        total_platform_commission_today=today_commission,
        total_platform_commission_month=month_commission,
        total_barber_debt=total_debt,
        total_topups=total_topups,
        unsettled_commissions=unsettled_commission,
        top_earning_barbers=sorted(top_by_barber.values(), key=lambda item: item.gross_revenue, reverse=True)[:5],
        barbers_with_debt=[
            BarberDebtItem(
                barber_id=barber.id,
                full_name=barber.full_name,
                balance=barber.balance,
                debt=barber.debt,
                is_financially_blocked=barber.is_financially_blocked,
            )
            for barber in debtors[:20]
        ],
    )


def get_admin_barber_finance(db: Session, barber_id: int) -> AdminBarberFinanceRead:
    from fastapi import HTTPException

    barber = db.get(Barber, barber_id)
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    bookings = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber), selectinload(Booking.service))
            .where(Booking.barber_id == barber.id, Booking.status == "completed")
        ).all()
    )
    gross_revenue, _, _ = _completed_financials(bookings, barber)
    unsettled_bookings = [booking for booking in bookings if not booking.commission_charged]
    _, unsettled_commission, _ = _completed_financials(unsettled_bookings, barber)
    commission_paid = (
        db.scalar(
            select(func.coalesce(func.sum(BarberTransaction.amount), 0)).where(
                BarberTransaction.barber_id == barber.id,
                BarberTransaction.type == "commission_charge",
            )
        )
        or 0
    )
    transactions = list_barber_transactions(db, barber.id)
    settlements = list(
        db.scalars(
            select(BarberDailySettlement)
            .where(BarberDailySettlement.barber_id == barber.id)
            .order_by(BarberDailySettlement.date.desc(), BarberDailySettlement.id.desc())
            .limit(60)
        ).all()
    )
    return AdminBarberFinanceRead(
        barber_id=barber.id,
        full_name=barber.full_name,
        balance=barber.balance,
        debt=barber.debt,
        commission_percent=effective_commission_percent(barber),
        is_financially_blocked=barber.is_financially_blocked,
        total_revenue=gross_revenue,
        commission_paid=commission_paid,
        unsettled_commission=unsettled_commission,
        transactions=transactions,
        settlements=settlements,
    )
