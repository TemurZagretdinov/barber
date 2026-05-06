from datetime import timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.booking import Booking
from app.models.notification import Notification
from app.services.booking_service import tashkent_now


def create_notification(
    db: Session,
    *,
    title: str,
    message: str,
    event_type: str,
    user_id: int | None = None,
    telegram_chat_id: int | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        telegram_chat_id=telegram_chat_id,
        title=title,
        message=message,
        type=event_type,
    )
    db.add(notification)
    if telegram_chat_id and getattr(settings, "telegram_bot_token", ""):
        _send_telegram_message(telegram_chat_id, message)
    return notification


def _send_telegram_message(chat_id: int, message: str) -> None:
    token = getattr(settings, "telegram_bot_token", "")
    if not token:
        return
    try:
        httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": message},
            timeout=5,
        )
    except Exception:
        return


def booking_event_notification(db: Session, booking: Booking, event_type: str) -> None:
    barber_name = booking.barber.full_name if booking.barber else "Barber"
    title_by_type = {
        "booking_created": "Yangi booking yaratildi",
        "booking_cancelled": "Booking bekor qilindi",
        "booking_completed": "Booking completed qilindi",
        "booking_no_show": "Mijoz kelmadi",
    }
    title = title_by_type.get(event_type, "Booking yangilandi")
    message = (
        f"{title}\n"
        f"Barber: {barber_name}\n"
        f"Sana: {booking.booking_date.isoformat()}\n"
        f"Vaqt: {booking.booking_time.strftime('%H:%M')}\n"
        f"Status: {booking.status}"
    )
    create_notification(
        db,
        title=title,
        message=message,
        event_type=event_type,
        user_id=booking.customer_id,
        telegram_chat_id=booking.telegram_user_id,
    )


def send_due_reminders(db: Session) -> int:
    now = tashkent_now()
    window_start = now + timedelta(minutes=29)
    window_end = now + timedelta(minutes=31)
    bookings = db.scalars(
        select(Booking)
        .options(selectinload(Booking.barber))
        .where(
            Booking.status == "pending",
            Booking.reminder_sent_at.is_(None),
            Booking.booking_date >= now.date(),
        )
    ).all()
    sent = 0
    for booking in bookings:
        starts_at = now.replace(
            year=booking.booking_date.year,
            month=booking.booking_date.month,
            day=booking.booking_date.day,
            hour=booking.booking_time.hour,
            minute=booking.booking_time.minute,
            second=0,
            microsecond=0,
        )
        if not (window_start <= starts_at <= window_end):
            continue
        address = booking.barber.address if booking.barber and booking.barber.address else "Manzil kiritilmagan"
        barber_name = booking.barber.full_name if booking.barber else "Barber"
        message = (
            "Eslatma: Sizning bookingingiz 30 daqiqadan keyin.\n"
            f"Barber: {barber_name}\n"
            f"Manzil: {address}"
        )
        create_notification(
            db,
            title="Booking eslatmasi",
            message=message,
            event_type="booking_reminder",
            user_id=booking.customer_id,
            telegram_chat_id=booking.telegram_user_id,
        )
        booking.reminder_sent_at = now
        sent += 1
    if sent:
        db.commit()
    return sent
