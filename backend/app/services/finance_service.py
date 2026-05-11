from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.barber import Barber
from app.models.booking import Booking
from app.models.finance import (
    BarberDailySettlement,
    DemoBarberTransaction,
    DemoDailySettlement,
    PaymentTransaction,
    TopUpOrder,
)
from app.schemas.finance import (
    AdminBarberFinanceRead,
    AdminDemoBarberFinanceRead,
    AdminDemoFinanceOverview,
    AdminFinanceOverview,
    BarberBalanceRead,
    BarberDebtItem,
    TopUpConfirmResponse,
    TopUpOrderRead,
    DemoBarberDebtItem,
    DemoBarberFinanceRead,
    DemoDailySettlementRunResponse,
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
    active_debt = max(getattr(barber, "debt", 0), 0)
    barber.is_financially_blocked = threshold > 0 and active_debt >= threshold


def sync_demo_finance_aliases(barber: Barber) -> None:
    if hasattr(barber, "demo_balance"):
        barber.demo_balance = barber.balance
    if hasattr(barber, "demo_debt"):
        barber.demo_debt = barber.debt


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
        and (booking.commission_amount > 0 or booking.barber_earning > 0 or booking.commission_charged or booking.commission_percent > 0)
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
    debt_before: int = 0,
    debt_after: int = 0,
    top_up_order_id: int | None = None,
    provider: str = "manual",
    payment_status: str = "paid",
    external_transaction_id: str | None = None,
) -> PaymentTransaction:
    transaction = PaymentTransaction(
        barber_id=barber_id,
        top_up_order_id=top_up_order_id,
        booking_id=booking_id,
        provider=provider,
        type=transaction_type,
        status=payment_status,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        debt_before=debt_before,
        debt_after=debt_after,
        external_transaction_id=external_transaction_id,
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
    debt_before = barber.debt
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
        debt_before=debt_before,
        debt_after=barber.debt,
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
            debt_before=debt_before,
            debt_after=barber.debt,
            description="Commission shortage converted to debt",
        )

    apply_financial_blocking(barber)
    sync_demo_finance_aliases(barber)
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
            total_completed_bookings=len(bookings),
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
        today_completed_bookings=len(bookings),
        today_gross_revenue=gross_revenue,
        today_commission=commission_total,
        today_net_earning=barber_earning_total,
        is_financially_blocked=barber.is_financially_blocked,
    )


def list_barber_transactions(db: Session, barber_id: int, limit: int = 100) -> list[PaymentTransaction]:
    return list(
        db.scalars(
            select(PaymentTransaction)
            .where(PaymentTransaction.barber_id == barber_id)
            .order_by(PaymentTransaction.created_at.desc(), PaymentTransaction.id.desc())
            .limit(limit)
        ).all()
    )


def list_payment_transactions(db: Session, limit: int = 200) -> list[PaymentTransaction]:
    return list(
        db.scalars(
            select(PaymentTransaction)
            .order_by(PaymentTransaction.created_at.desc(), PaymentTransaction.id.desc())
            .limit(limit)
        ).all()
    )


def list_top_up_orders(db: Session, barber_id: int | None = None, limit: int = 200) -> list[TopUpOrder]:
    stmt = select(TopUpOrder)
    if barber_id is not None:
        stmt = stmt.where(TopUpOrder.barber_id == barber_id)
    stmt = stmt.order_by(TopUpOrder.created_at.desc(), TopUpOrder.id.desc()).limit(limit)
    return list(db.scalars(stmt).all())


def _ensure_provider_available(provider: str) -> str:
    provider = provider.strip().lower()
    if provider != "mock":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{provider} provider is not connected yet",
        )
    if provider not in settings.payment_providers_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{provider} provider is disabled")
    return provider


def create_top_up_order(db: Session, barber: Barber, amount: int, provider: str = "mock") -> TopUpOrder:
    from app.services.booking_service import tashkent_now
    from app.services.payments.mock_provider import MockProvider

    provider = _ensure_provider_available(provider)
    normalized_amount = money_to_int(amount)
    if normalized_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="amount must be greater than zero")
    order = TopUpOrder(
        barber_id=barber.id,
        amount=normalized_amount,
        provider=provider,
        status="pending",
        expires_at=tashkent_now() + timedelta(minutes=30),
        description="Platforma ichki hisobini to'ldirish",
    )
    if provider == "mock":
        MockProvider().create_top_up_order(db, order)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def _top_up_order_response(order: TopUpOrder, barber: Barber) -> TopUpConfirmResponse:
    return TopUpConfirmResponse(order=TopUpOrderRead.model_validate(order), balance=barber.balance, debt=barber.debt)


def apply_successful_top_up(
    db: Session,
    order_id: int,
    *,
    external_transaction_id: str | None = None,
    provider_payload: dict | None = None,
) -> TopUpConfirmResponse:
    from app.services.booking_service import tashkent_now

    order = db.scalar(select(TopUpOrder).where(TopUpOrder.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Top-up order not found")
    barber = db.scalar(select(Barber).where(Barber.id == order.barber_id).with_for_update())
    if not barber:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber not found")
    if order.status == "paid":
        return _top_up_order_response(order, barber)
    if order.status not in {"pending", "waiting_provider"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Top-up order is {order.status}")
    existing_transaction = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.top_up_order_id == order.id,
            PaymentTransaction.status == "paid",
            PaymentTransaction.type.in_(("top_up", "debt_paid")),
        )
    )
    if existing_transaction:
        order.status = "paid"
        order.paid_at = order.paid_at or tashkent_now()
        db.commit()
        db.refresh(order)
        db.refresh(barber)
        return _top_up_order_response(order, barber)

    remaining = order.amount
    if barber.debt > 0:
        paid = min(remaining, barber.debt)
        if paid > 0:
            debt_before = barber.debt
            barber.debt -= paid
            remaining -= paid
            create_transaction(
                db,
                barber_id=barber.id,
                top_up_order_id=order.id,
                provider=order.provider,
                external_transaction_id=external_transaction_id or order.external_transaction_id,
                transaction_type="debt_paid",
                amount=paid,
                balance_before=barber.balance,
                balance_after=barber.balance,
                debt_before=debt_before,
                debt_after=barber.debt,
                description="Top-up used to pay platform debt",
            )

    if remaining > 0:
        balance_before = barber.balance
        debt_before = barber.debt
        barber.balance += remaining
        create_transaction(
            db,
            barber_id=barber.id,
            top_up_order_id=order.id,
            provider=order.provider,
            external_transaction_id=external_transaction_id or order.external_transaction_id,
            transaction_type="top_up",
            amount=remaining,
            balance_before=balance_before,
            balance_after=barber.balance,
            debt_before=debt_before,
            debt_after=barber.debt,
            description="Platform balance top-up",
        )

    order.status = "paid"
    order.paid_at = tashkent_now()
    if external_transaction_id:
        order.external_transaction_id = external_transaction_id
    if provider_payload:
        order.provider_payload = provider_payload
    apply_financial_blocking(barber)
    sync_demo_finance_aliases(barber)
    _send_finance_notification(
        db,
        barber,
        "top_up_success",
        "Balans to'ldirildi",
        f"Hisobingiz {order.amount:,} UZS ga to'ldirildi.",
    )
    db.commit()
    db.refresh(order)
    db.refresh(barber)
    return _top_up_order_response(order, barber)


def confirm_mock_top_up_order(db: Session, barber: Barber, order_id: int) -> TopUpConfirmResponse:
    order = db.scalar(select(TopUpOrder).where(TopUpOrder.id == order_id, TopUpOrder.barber_id == barber.id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Top-up order not found")
    if order.provider != "mock":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only mock orders can be confirmed here")
    return apply_successful_top_up(db, order_id, external_transaction_id=f"mock-{order_id}")


def top_up_barber_balance(db: Session, barber: Barber, amount: int) -> BarberBalanceRead:
    order = create_top_up_order(db, barber, amount, provider="mock")
    confirm_mock_top_up_order(db, barber, order.id)
    db.refresh(barber)
    return get_barber_balance_summary(db, barber)


def adjust_barber_balance(db: Session, barber_id: int, amount: int, description: str) -> AdminBarberFinanceRead:
    barber = db.scalar(select(Barber).where(Barber.id == barber_id).with_for_update())
    if not barber:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Barber not found")

    balance_before = barber.balance
    debt_before = barber.debt
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
    sync_demo_finance_aliases(barber)
    create_transaction(
        db,
        barber_id=barber.id,
        transaction_type="adjustment",
        amount=amount,
        balance_before=balance_before,
        balance_after=barber.balance,
        debt_before=debt_before,
        debt_after=barber.debt,
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

    total_balance = db.scalar(select(func.coalesce(func.sum(Barber.balance), 0))) or 0
    total_debt = db.scalar(select(func.coalesce(func.sum(Barber.debt), 0))) or 0
    total_topups = (
        db.scalar(
            select(func.coalesce(func.sum(PaymentTransaction.amount), 0)).where(
                PaymentTransaction.type.in_(("top_up", "debt_paid")),
                PaymentTransaction.status == "paid",
            )
        )
        or 0
    )
    pending_top_up_orders = db.scalar(select(func.count(TopUpOrder.id)).where(TopUpOrder.status.in_(("pending", "waiting_provider")))) or 0
    paid_top_up_orders = db.scalar(select(func.count(TopUpOrder.id)).where(TopUpOrder.status == "paid")) or 0
    failed_top_up_orders = (
        db.scalar(select(func.count(TopUpOrder.id)).where(TopUpOrder.status.in_(("failed", "cancelled", "expired"))))
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
        total_balance=total_balance,
        total_debt=total_debt,
        today_commission=today_commission,
        month_commission=month_commission,
        pending_top_up_orders=pending_top_up_orders,
        paid_top_up_orders=paid_top_up_orders,
        failed_top_up_orders=failed_top_up_orders,
        unsettled_commission=unsettled_commission,
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
            select(func.coalesce(func.sum(PaymentTransaction.amount), 0)).where(
                PaymentTransaction.barber_id == barber.id,
                PaymentTransaction.type == "commission_charge",
                PaymentTransaction.status == "paid",
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


def create_demo_transaction(
    db: Session,
    *,
    barber_id: int,
    transaction_type: str,
    amount: int,
    balance_before: int,
    balance_after: int,
    debt_before: int,
    debt_after: int,
    description: str,
    booking_id: int | None = None,
) -> DemoBarberTransaction:
    transaction = DemoBarberTransaction(
        barber_id=barber_id,
        booking_id=booking_id,
        type=transaction_type,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        debt_before=debt_before,
        debt_after=debt_after,
        description=description,
    )
    db.add(transaction)
    return transaction


def _apply_demo_commission_charge(
    db: Session,
    barber: Barber,
    *,
    amount: int,
    description: str,
    booking_id: int | None = None,
) -> int:
    if amount <= 0:
        return 0

    balance_before = barber.demo_balance
    debt_before = barber.demo_debt
    shortage = max(amount - barber.demo_balance, 0)
    barber.demo_balance = max(barber.demo_balance - amount, 0)
    if shortage > 0:
        barber.demo_debt += shortage
    apply_financial_blocking(barber)

    create_demo_transaction(
        db,
        barber_id=barber.id,
        booking_id=booking_id,
        transaction_type="demo_commission_charge",
        amount=amount,
        balance_before=balance_before,
        balance_after=barber.demo_balance,
        debt_before=debt_before,
        debt_after=barber.demo_debt,
        description=description,
    )
    if shortage > 0:
        create_demo_transaction(
            db,
            barber_id=barber.id,
            booking_id=booking_id,
            transaction_type="demo_debt_created",
            amount=shortage,
            balance_before=barber.demo_balance,
            balance_after=barber.demo_balance,
            debt_before=debt_before,
            debt_after=barber.demo_debt,
            description="Demo commission shortage converted to demo debt",
        )
    return shortage


def get_demo_barber_finance(db: Session, barber: Barber, summary_date: date | None = None) -> DemoBarberFinanceRead:
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

    return DemoBarberFinanceRead(
        demo_balance=barber.balance,
        demo_debt=barber.debt,
        balance=barber.balance,
        debt=barber.debt,
        commission_percent=effective_commission_percent(barber),
        today_completed_bookings=len(bookings),
        today_gross_revenue=gross_revenue,
        today_commission=commission_total,
        today_net_earning=barber_earning_total,
        is_financially_blocked=barber.is_financially_blocked,
    )


def list_demo_barber_transactions(db: Session, barber_id: int, limit: int = 100) -> list[PaymentTransaction]:
    return list_barber_transactions(db, barber_id, limit)


def top_up_demo_barber_balance(db: Session, barber: Barber, amount: int) -> DemoBarberFinanceRead:
    order = create_top_up_order(db, barber, amount, provider="mock")
    confirm_mock_top_up_order(db, barber, order.id)
    db.refresh(barber)
    return get_demo_barber_finance(db, barber)


def run_demo_daily_settlement(db: Session, settlement_date: date | None = None) -> DemoDailySettlementRunResponse:
    result = run_daily_settlement(db, settlement_date)
    return DemoDailySettlementRunResponse(
        date=result.date,
        settlements_created=result.settlements_created,
        bookings_charged=result.bookings_charged,
        commission_total=result.commission_total,
        debt_created=result.debt_created,
        settlements=result.settlements,
    )


def get_admin_demo_finance_overview(db: Session) -> AdminDemoFinanceOverview:
    overview = get_admin_finance_overview(db)
    return AdminDemoFinanceOverview(
        total_platform_commission_today=overview.total_platform_commission_today,
        total_platform_commission_month=overview.total_platform_commission_month,
        total_barber_debt=overview.total_barber_debt,
        total_demo_topups=overview.total_topups,
        unsettled_commissions=overview.unsettled_commissions,
        top_earning_barbers=overview.top_earning_barbers,
        barbers_with_debt=[
            DemoBarberDebtItem(
                barber_id=item.barber_id,
                full_name=item.full_name,
                demo_balance=item.balance,
                demo_debt=item.debt,
                is_financially_blocked=item.is_financially_blocked,
            )
            for item in overview.barbers_with_debt
        ],
    )


def get_admin_demo_barber_finance(db: Session, barber_id: int) -> AdminDemoBarberFinanceRead:
    finance = get_admin_barber_finance(db, barber_id)
    return AdminDemoBarberFinanceRead(
        barber_id=finance.barber_id,
        full_name=finance.full_name,
        demo_balance=finance.balance,
        demo_debt=finance.debt,
        commission_percent=finance.commission_percent,
        is_financially_blocked=finance.is_financially_blocked,
        total_revenue=finance.total_revenue,
        commission_paid=finance.commission_paid,
        unsettled_commission=finance.unsettled_commission,
        transactions=finance.transactions,
        settlements=finance.settlements,
    )


def adjust_demo_barber_balance(db: Session, barber_id: int, amount: int, description: str) -> AdminDemoBarberFinanceRead:
    adjust_barber_balance(db, barber_id, amount, description)
    return get_admin_demo_barber_finance(db, barber_id)
