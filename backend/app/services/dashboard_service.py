from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.barber import Barber
from app.models.booking import Booking
from app.schemas.dashboard import AdminDashboard, BarberDashboard, BarberPerformance, DashboardStats
from app.schemas.dashboard import AdminDashboardV2, AdminTopBarber, BarberDashboardBooking, BarberDashboardV2
from app.services.booking_service import booking_to_with_barber, tashkent_now
from app.services.finance_service import booking_financial_preview


def get_admin_dashboard(db: Session) -> AdminDashboard:
    today = tashkent_now().date()
    total = db.scalar(select(func.count(Booking.id))) or 0
    active_barbers = db.scalar(select(func.count(Barber.id)).where(Barber.is_active.is_(True))) or 0
    completed = db.scalar(select(func.count(Booking.id)).where(Booking.status == "completed")) or 0
    pending = db.scalar(select(func.count(Booking.id)).where(Booking.status == "pending")) or 0
    today_bookings = db.scalar(select(func.count(Booking.id)).where(Booking.booking_date == today)) or 0

    barbers = list(db.scalars(select(Barber).where(Barber.is_active.is_(True)).order_by(Barber.full_name)).all())
    performance: list[BarberPerformance] = []
    for barber in barbers:
        completed_count = (
            db.scalar(
                select(func.count(Booking.id)).where(
                    Booking.barber_id == barber.id, Booking.booking_date == today, Booking.status == "completed"
                )
            )
            or 0
        )
        pending_count = (
            db.scalar(
                select(func.count(Booking.id)).where(
                    Booking.barber_id == barber.id, Booking.booking_date == today, Booking.status == "pending"
                )
            )
            or 0
        )
        performance.append(
            BarberPerformance(
                barber_id=barber.id,
                full_name=barber.full_name,
                photo_url=barber.photo_url,
                completed=completed_count,
                pending=pending_count,
                total=completed_count + pending_count,
            )
        )

    recent = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber))
            .order_by(Booking.created_at.desc())
            .limit(6)
        ).all()
    )
    return AdminDashboard(
        stats=DashboardStats(
            total_bookings=total,
            active_barbers=active_barbers,
            completed=completed,
            pending=pending,
            today_bookings=today_bookings,
        ),
        performance=performance,
        recent_bookings=[booking_to_with_barber(item) for item in recent],
    )


def get_barber_dashboard(db: Session, barber: Barber, dashboard_date: date | None = None) -> BarberDashboard:
    today = dashboard_date or tashkent_now().date()
    appointments = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber))
            .where(Booking.barber_id == barber.id, Booking.booking_date == today)
            .order_by(Booking.booking_time)
        ).all()
    )
    done = sum(1 for item in appointments if item.status == "completed")
    pending = sum(1 for item in appointments if item.status == "pending")
    return BarberDashboard(
        barber_id=barber.id,
        full_name=barber.full_name,
        photo_url=barber.photo_url,
        specialty=barber.specialty,
        today=len(appointments),
        done=done,
        pending=pending,
        appointments=[booking_to_with_barber(item) for item in appointments],
    )


def _booking_price(booking: Booking) -> int:
    service_price, _, _, _ = booking_financial_preview(booking, booking.barber)
    return service_price


def get_admin_dashboard_v2(db: Session) -> AdminDashboardV2:
    today = tashkent_now().date()
    total_barbers = db.scalar(select(func.count(Barber.id))) or 0
    active_barbers = db.scalar(select(func.count(Barber.id)).where(Barber.is_active.is_(True))) or 0
    today_bookings = db.scalar(select(func.count(Booking.id)).where(Booking.booking_date == today)) or 0
    completed_bookings = db.scalar(select(func.count(Booking.id)).where(Booking.status == "completed")) or 0

    barbers = list(db.scalars(select(Barber).where(Barber.is_active.is_(True)).order_by(Barber.full_name)).all())
    top: list[AdminTopBarber] = []
    for barber in barbers:
        bookings = list(db.scalars(select(Booking).where(Booking.barber_id == barber.id)).all())
        completed = [booking for booking in bookings if booking.status == "completed"]
        top.append(
            AdminTopBarber(
                id=barber.id,
                full_name=barber.full_name,
                bookings_count=len(bookings),
                completed_count=len(completed),
                revenue=sum(_booking_price(booking) for booking in completed),
            )
        )
    top.sort(key=lambda item: (item.bookings_count, item.completed_count, item.revenue), reverse=True)
    return AdminDashboardV2(
        total_barbers=total_barbers,
        active_barbers=active_barbers,
        today_bookings=today_bookings,
        completed_bookings=completed_bookings,
        top_barbers=top[:5],
    )


def _dashboard_booking(booking: Booking) -> BarberDashboardBooking:
    return BarberDashboardBooking(
        id=booking.id,
        code=booking.booking_code,
        customer_name=booking.client_name,
        customer_phone=booking.client_phone,
        date=booking.booking_date,
        time=booking.booking_time,
        status=booking.status,
        price=_booking_price(booking),
        service_note=booking.service_note,
    )


def get_barber_dashboard_v2(db: Session, barber: Barber, dashboard_date: date | None = None) -> BarberDashboardV2:
    today = dashboard_date or tashkent_now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    bookings = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber))
            .where(Booking.barber_id == barber.id, Booking.booking_date == today)
            .order_by(Booking.booking_time)
        ).all()
    )
    week_completed = list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber))
            .where(
                Booking.barber_id == barber.id,
                Booking.booking_date >= week_start,
                Booking.booking_date <= week_end,
                Booking.status == "completed",
            )
        ).all()
    )
    today_completed = [booking for booking in bookings if booking.status == "completed"]
    return BarberDashboardV2(
        today_bookings=len(bookings),
        pending_count=sum(1 for booking in bookings if booking.status == "pending"),
        completed_count=len(today_completed),
        cancelled_count=sum(1 for booking in bookings if booking.status == "cancelled"),
        no_show_count=sum(1 for booking in bookings if booking.status == "no_show"),
        today_revenue=sum(_booking_price(booking) for booking in today_completed),
        week_revenue=sum(_booking_price(booking) for booking in week_completed),
        week_completed=len(week_completed),
        bookings=[_dashboard_booking(booking) for booking in bookings],
    )
