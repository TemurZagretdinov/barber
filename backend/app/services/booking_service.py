from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.barber import Barber
from app.models.barber_service import BarberService
from app.models.barber_time_off import BarberDayOff, BarberVacation
from app.models.blocked_slot import BlockedSlot
from app.models.booking import Booking
from app.models.working_hour import WorkingHour
from app.schemas.barber import AvailableSlot, AvailableSlotsResponse
from app.schemas.booking import BookingCreate


ACTIVE_STATUSES = ("pending", "completed")
WEEKDAY_NAMES = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
DEFAULT_START = time(9, 0)
DEFAULT_END = time(18, 0)
APP_TIMEZONE = ZoneInfo("Asia/Tashkent")


def _time_range(start: time, end: time, minutes: int) -> list[time]:
    cursor = datetime.combine(date.today(), start)
    limit = datetime.combine(date.today(), end)
    step = max(minutes, 10)
    slots: list[time] = []
    while cursor < limit:
        slots.append(cursor.time())
        cursor += timedelta(minutes=step)
    return slots


def _combine(slot_date: date, slot_time: time) -> datetime:
    return datetime.combine(slot_date, slot_time, tzinfo=APP_TIMEZONE)


def _add_minutes(slot_date: date, slot_time: time, minutes: int) -> datetime:
    return _combine(slot_date, slot_time) + timedelta(minutes=minutes)


def _ranges_overlap(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    return start_a < end_b and start_b < end_a


def get_barber_or_404(db: Session, barber_id: int) -> Barber:
    barber = db.get(Barber, barber_id)
    if not barber or not barber.is_active or (settings.financial_blocking_enabled and barber.is_financially_blocked):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber not found")
    return barber


def tashkent_now() -> datetime:
    return datetime.now(APP_TIMEZONE)


def is_past_slot(booking_date: date, booking_time: time) -> bool:
    requested = datetime.combine(booking_date, booking_time, tzinfo=APP_TIMEZONE)
    return requested <= tashkent_now()


def ensure_not_past_slot(booking_date: date, booking_time: time) -> None:
    if is_past_slot(booking_date, booking_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O'tib ketgan vaqtga booking qilib bo'lmaydi",
        )


def get_service_or_404(db: Session, barber_id: int, service_id: int, active_only: bool = True) -> BarberService:
    stmt = select(BarberService).where(BarberService.id == service_id, BarberService.barber_id == barber_id)
    if active_only:
        stmt = stmt.where(BarberService.is_active.is_(True))
    service = db.scalar(stmt)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


def _is_barber_time_off(db: Session, barber_id: int, booking_date: date) -> bool:
    day_off = db.scalar(
        select(BarberDayOff).where(BarberDayOff.barber_id == barber_id, BarberDayOff.date == booking_date)
    )
    if day_off:
        return True
    vacation = db.scalar(
        select(BarberVacation).where(
            BarberVacation.barber_id == barber_id,
            BarberVacation.start_date <= booking_date,
            BarberVacation.end_date >= booking_date,
        )
    )
    return vacation is not None


def _slot_overlaps_break(slot_date: date, slot_time: time, duration_minutes: int, working_hour: WorkingHour | None) -> bool:
    if not working_hour or not working_hour.break_start_time or not working_hour.break_end_time:
        return False
    return _ranges_overlap(
        _combine(slot_date, slot_time),
        _add_minutes(slot_date, slot_time, duration_minutes),
        _combine(slot_date, working_hour.break_start_time),
        _combine(slot_date, working_hour.break_end_time),
    )


def _slot_overlaps_bookings(
    db: Session,
    barber_id: int,
    booking_date: date,
    slot_time: time,
    duration_minutes: int,
    exclude_booking_id: int | None = None,
) -> bool:
    requested_start = _combine(booking_date, slot_time)
    requested_end = _add_minutes(booking_date, slot_time, duration_minutes)
    stmt = select(Booking).where(
        Booking.barber_id == barber_id,
        Booking.booking_date == booking_date,
        Booking.status.in_(ACTIVE_STATUSES),
    )
    if exclude_booking_id:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    bookings = db.scalars(stmt).all()
    for booking in bookings:
        booking_start = _combine(booking.booking_date, booking.booking_time)
        booking_end = booking_start + timedelta(minutes=booking.duration_minutes or 30)
        if _ranges_overlap(requested_start, requested_end, booking_start, booking_end):
            return True
    return False


def _is_blocked_start(db: Session, barber_id: int, booking_date: date, slot_time: time) -> bool:
    return db.scalar(
        select(BlockedSlot).where(
            BlockedSlot.barber_id == barber_id,
            BlockedSlot.date == booking_date,
            BlockedSlot.time == slot_time,
        )
    ) is not None


def get_available_slots(
    db: Session,
    barber_id: int,
    booking_date: date,
    service_id: int | None = None,
) -> list[AvailableSlot]:
    barber = get_barber_or_404(db, barber_id)
    duration_minutes = 30
    if service_id is not None:
        duration_minutes = get_service_or_404(db, barber_id, service_id).duration_minutes
    if _is_barber_time_off(db, barber_id, booking_date):
        return []
    weekday_name = WEEKDAY_NAMES[booking_date.weekday()]
    if weekday_name in (barber.off_days or []):
        return []

    working_hour = db.scalar(
        select(WorkingHour).where(
            WorkingHour.barber_id == barber_id,
            WorkingHour.weekday == booking_date.weekday(),
        )
    )
    if working_hour and not working_hour.is_active:
        return []
    start_time = working_hour.start_time if working_hour else barber.work_start_time or DEFAULT_START
    end_time = working_hour.end_time if working_hour else barber.work_end_time or DEFAULT_END

    slots: list[AvailableSlot] = []
    for slot in _time_range(start_time, end_time, duration_minutes):
        if _add_minutes(booking_date, slot, duration_minutes).time() > end_time:
            continue
        reason = None
        if _is_blocked_start(db, barber_id, booking_date, slot):
            reason = "blocked"
        elif _slot_overlaps_break(booking_date, slot, duration_minutes, working_hour):
            reason = "break"
        elif _slot_overlaps_bookings(db, barber_id, booking_date, slot, duration_minutes):
            reason = "booked"
        is_expired = is_past_slot(booking_date, slot)
        if is_expired:
            reason = "expired"
        is_booked = reason in {"blocked", "break", "booked"}
        is_available = reason is None
        slots.append(
            AvailableSlot(
                time=slot.strftime("%H:%M"),
                is_available=is_available,
                available=is_available,
                is_booked=is_booked,
                is_expired=is_expired,
                reason=reason,
            )
        )
    return slots


def get_available_slots_response(
    db: Session,
    barber_id: int,
    booking_date: date,
    service_id: int | None = None,
) -> AvailableSlotsResponse:
    duration_minutes = 30
    if service_id is not None:
        duration_minutes = get_service_or_404(db, barber_id, service_id).duration_minutes
    return AvailableSlotsResponse(
        date=booking_date,
        barber_id=barber_id,
        service_id=service_id,
        duration_minutes=duration_minutes,
        slots=get_available_slots(db, barber_id, booking_date, service_id),
    )


def _working_context(db: Session, barber: Barber, booking_date: date) -> tuple[WorkingHour | None, time, time]:
    if _is_barber_time_off(db, barber.id, booking_date):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu vaqt ish jadvalidan tashqarida")
    weekday_name = WEEKDAY_NAMES[booking_date.weekday()]
    if weekday_name in (barber.off_days or []):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu vaqt ish jadvalidan tashqarida")
    working_hour = db.scalar(
        select(WorkingHour).where(
            WorkingHour.barber_id == barber.id,
            WorkingHour.weekday == booking_date.weekday(),
        )
    )
    if working_hour and not working_hour.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu vaqt ish jadvalidan tashqarida")
    start_time = working_hour.start_time if working_hour else barber.work_start_time or DEFAULT_START
    end_time = working_hour.end_time if working_hour else barber.work_end_time or DEFAULT_END
    return working_hour, start_time, end_time


def ensure_slot_available(
    db: Session,
    *,
    barber_id: int,
    service_id: int,
    booking_date: date,
    booking_time: time,
    exclude_booking_id: int | None = None,
) -> BarberService:
    barber = get_barber_or_404(db, barber_id)
    service = get_service_or_404(db, barber_id, service_id)
    ensure_not_past_slot(booking_date, booking_time)

    working_hour, start_time, end_time = _working_context(db, barber, booking_date)
    requested_start = _combine(booking_date, booking_time)
    requested_end = _add_minutes(booking_date, booking_time, service.duration_minutes)
    if requested_start < _combine(booking_date, start_time) or requested_end > _combine(booking_date, end_time):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu vaqt ish jadvalidan tashqarida")
    valid_slot_times = {
        slot
        for slot in _time_range(start_time, end_time, service.duration_minutes)
        if _add_minutes(booking_date, slot, service.duration_minutes) <= _combine(booking_date, end_time)
    }
    if booking_time.replace(second=0, microsecond=0) not in valid_slot_times:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu vaqt ish jadvalidan tashqarida")
    if _is_blocked_start(db, barber_id, booking_date, booking_time) or _slot_overlaps_break(
        booking_date, booking_time, service.duration_minutes, working_hour
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu vaqt ish jadvalidan tashqarida")
    if _slot_overlaps_bookings(db, barber_id, booking_date, booking_time, service.duration_minutes, exclude_booking_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu vaqt band qilingan")
    return service


def create_booking(db: Session, payload: BookingCreate, customer_id: int | None = None) -> Booking:
    from app.services.finance_service import money_to_int

    service = ensure_slot_available(
        db,
        barber_id=payload.barber_id,
        service_id=payload.service_id,
        booking_date=payload.booking_date,
        booking_time=payload.booking_time,
    )
    booking = Booking(
        **payload.model_dump(exclude={"customer_id"}),
        customer_id=customer_id,
        price=service.price,
        service_price=money_to_int(service.price),
        duration_minutes=service.duration_minutes,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    from app.services.notification_service import booking_event_notification

    booking_event_notification(db, booking, "booking_created")
    db.commit()
    db.refresh(booking)
    return booking


def booking_to_with_barber(booking: Booking):
    from app.schemas.booking import BookingWithBarber

    return BookingWithBarber(
        id=booking.id,
        booking_code=booking.booking_code,
        client_name=booking.client_name,
        client_phone=booking.client_phone,
        barber_id=booking.barber_id,
        service_id=booking.service_id,
        customer_id=booking.customer_id,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        status=booking.status,
        price=booking.price,
        service_price=booking.service_price,
        commission_percent=booking.commission_percent,
        commission_amount=booking.commission_amount,
        barber_earning=booking.barber_earning,
        commission_charged=booking.commission_charged,
        commission_charged_at=booking.commission_charged_at,
        duration_minutes=booking.duration_minutes,
        notes=booking.notes,
        telegram_user_id=booking.telegram_user_id,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
        barber_name=booking.barber.full_name,
        barber_photo_url=booking.barber.photo_url,
        barber_specialty=booking.barber.specialty,
        barber_address=booking.barber.address,
        barbershop_name=booking.barber.barbershop_name,
        service_note=booking.service_note,
        service_name=booking.service.name if booking.service else None,
        completed_at=booking.completed_at,
        reminder_sent_at=booking.reminder_sent_at,
    )


def query_bookings(
    db: Session,
    booking_date: date | None = None,
    status_filter: str | None = None,
    barber_id: int | None = None,
    search: str | None = None,
    current_barber_id: int | None = None,
) -> list[Booking]:
    stmt = select(Booking).join(Booking.barber).order_by(Booking.booking_date.desc(), Booking.booking_time.desc())
    if booking_date:
        stmt = stmt.where(Booking.booking_date == booking_date)
    if status_filter and status_filter != "all":
        stmt = stmt.where(Booking.status == status_filter)
    if barber_id:
        stmt = stmt.where(Booking.barber_id == barber_id)
    if current_barber_id:
        stmt = stmt.where(Booking.barber_id == current_barber_id)
    if search:
        pattern = f"%{search.strip()}%"
        clauses = [Booking.client_name.ilike(pattern), Booking.client_phone.ilike(pattern)]
        if search.strip().isdigit():
            clauses.append(Booking.id == int(search.strip()))
        stmt = stmt.where(or_(*clauses))
    return list(db.scalars(stmt).all())


def update_booking_status(db: Session, booking_id: int, new_status: str, barber_id: int | None = None) -> Booking:
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if barber_id and booking.barber_id != barber_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Booking belongs to another barber")
    booking.status = new_status
    db.commit()
    db.refresh(booking)
    if new_status in {"cancelled", "completed", "no_show"}:
        from app.services.notification_service import booking_event_notification

        event = {
            "cancelled": "booking_cancelled",
            "completed": "booking_completed",
            "no_show": "booking_no_show",
        }[new_status]
        booking_event_notification(db, booking, event)
        db.commit()
        db.refresh(booking)
    return booking


def reschedule_booking(
    db: Session,
    booking: Booking,
    booking_date: date,
    booking_time: time,
) -> Booking:
    if booking.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending bookings can be rescheduled")
    if is_past_slot(booking.booking_date, booking.booking_time):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'tib ketgan bookingni o'zgartirib bo'lmaydi")
    if booking.service_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking service is missing")
    ensure_slot_available(
        db,
        barber_id=booking.barber_id,
        service_id=booking.service_id,
        booking_date=booking_date,
        booking_time=booking_time,
        exclude_booking_id=booking.id,
    )
    booking.booking_date = booking_date
    booking.booking_time = booking_time
    booking.reminder_sent_at = None
    db.commit()
    db.refresh(booking)
    return booking


def complete_booking_for_barber(db: Session, booking_id: int, barber_id: int, note: str | None = None) -> Booking:
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.barber_id != barber_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Booking belongs to another barber")
    if booking.status == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking already completed")
    if booking.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancelled booking cannot be completed")
    if booking.status == "no_show":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No-show booking cannot be completed")
    if not is_past_slot(booking.booking_date, booking.booking_time):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Xizmat vaqti hali tugamagan")
    booking.status = "completed"
    booking.service_note = note
    booking.completed_at = tashkent_now()
    from app.services.finance_service import calculate_booking_commission

    calculate_booking_commission(booking, booking.barber)
    db.commit()
    db.refresh(booking)
    from app.services.notification_service import booking_event_notification

    booking_event_notification(db, booking, "booking_completed")
    db.commit()
    db.refresh(booking)
    return booking


def update_barber_booking_action(
    db: Session,
    booking_id: int,
    barber_id: int,
    status_name: str,
    note: str | None = None,
) -> Booking:
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.barber_id != barber_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Booking belongs to another barber")
    if booking.status == "completed" and status_name == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking already completed")
    if booking.status == "completed" and status_name != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed booking cannot be changed")
    if booking.status == "cancelled" and status_name == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancelled booking cannot be completed")
    booking.status = status_name
    booking.service_note = note
    if status_name == "completed":
        booking.completed_at = tashkent_now()
        from app.services.finance_service import calculate_booking_commission

        calculate_booking_commission(booking, booking.barber)
    db.commit()
    db.refresh(booking)
    if status_name in {"completed", "cancelled", "no_show"}:
        from app.services.notification_service import booking_event_notification

        event = {
            "completed": "booking_completed",
            "cancelled": "booking_cancelled",
            "no_show": "booking_no_show",
        }[status_name]
        booking_event_notification(db, booking, event)
        db.commit()
        db.refresh(booking)
    return booking


def today_counts_by_status(db: Session, barber_id: int | None = None) -> tuple[int, int, int]:
    today = tashkent_now().date()
    stmt = select(Booking.status, func.count(Booking.id)).where(Booking.booking_date == today).group_by(Booking.status)
    if barber_id:
        stmt = stmt.where(Booking.barber_id == barber_id)
    counts = {status_name: count for status_name, count in db.execute(stmt).all()}
    pending = counts.get("pending", 0)
    completed = counts.get("completed", 0)
    return pending + completed + counts.get("cancelled", 0), completed, pending
