from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_customer
from app.api.routes.barbers import serialize_barber
from app.db.database import get_db
from app.models.barber import Barber
from app.models.booking import Booking
from app.models.customer import BookingReview, CustomerFavoriteBarber
from app.models.user import User
from app.schemas.barber import BarberRead
from app.schemas.booking import BookingClaim, BookingReschedule, BookingReviewCreate, BookingReviewRead, BookingWithBarber
from app.services.booking_service import APP_TIMEZONE, booking_to_with_barber, reschedule_booking, tashkent_now

router = APIRouter()


def _customer_booking(db: Session, customer: User, booking_id: int) -> Booking:
    booking = db.scalar(
        select(Booking)
        .options(selectinload(Booking.barber), selectinload(Booking.service))
        .where(Booking.id == booking_id, Booking.customer_id == customer.id)
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


def _booking_start(booking: Booking) -> datetime:
    return datetime.combine(booking.booking_date, booking.booking_time, tzinfo=APP_TIMEZONE)


def _normalize_phone(value: str | None) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


def _phones_match(left: str | None, right: str | None) -> bool:
    left_digits = _normalize_phone(left)
    right_digits = _normalize_phone(right)
    if not left_digits or not right_digits:
        return True
    return (
        left_digits == right_digits
        or (len(left_digits) >= 7 and right_digits.endswith(left_digits))
        or (len(right_digits) >= 7 and left_digits.endswith(right_digits))
    )


def _customer_bookings(db: Session, customer: User) -> list[Booking]:
    return list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.barber), selectinload(Booking.service))
            .where(Booking.customer_id == customer.id)
        ).all()
    )


@router.post("/customer/bookings/claim", response_model=BookingWithBarber)
def claim_booking(
    payload: BookingClaim,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingWithBarber:
    normalized_code = payload.booking_code.strip().upper()
    code = normalized_code.removeprefix("BKG-").lstrip("0") or normalized_code
    if not code.isdigit():
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = db.scalar(
        select(Booking)
        .options(selectinload(Booking.barber), selectinload(Booking.service))
        .where(Booking.id == int(code))
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.customer_id == customer.id:
        return booking_to_with_barber(booking)
    
    if booking.customer_id is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking is already linked to another customer")

    if not _phones_match(booking.client_phone, customer.phone):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Booking phone does not match this customer")

    booking.customer_id = customer.id
    db.commit()
    db.refresh(booking)
    return booking_to_with_barber(booking)


@router.get("/customer/bookings", response_model=list[BookingWithBarber])
def my_bookings(customer: User = Depends(require_customer), db: Session = Depends(get_db)) -> list[BookingWithBarber]:
    now = tashkent_now()
    bookings = [
        booking
        for booking in _customer_bookings(db, customer)
        if booking.status == "pending" and _booking_start(booking) >= now
    ]
    bookings.sort(key=lambda item: (item.booking_date, item.booking_time))
    return [booking_to_with_barber(item) for item in bookings]


@router.get("/customer/bookings/history", response_model=list[BookingWithBarber])
def booking_history(customer: User = Depends(require_customer), db: Session = Depends(get_db)) -> list[BookingWithBarber]:
    now = tashkent_now()
    history_statuses = {"completed", "cancelled", "no_show"}
    bookings = [
        booking
        for booking in _customer_bookings(db, customer)
        if booking.status in history_statuses or _booking_start(booking) < now
    ]
    bookings.sort(key=lambda item: (item.booking_date, item.booking_time), reverse=True)
    return [booking_to_with_barber(item) for item in bookings]


@router.patch("/customer/bookings/{booking_id}/cancel", response_model=BookingWithBarber)
def cancel_customer_booking(
    booking_id: int,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingWithBarber:
    booking = _customer_booking(db, customer, booking_id)
    if booking.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending bookings can be cancelled")
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    from app.services.notification_service import booking_event_notification

    booking_event_notification(db, booking, "booking_cancelled")
    db.commit()
    db.refresh(booking)
    return booking_to_with_barber(booking)


@router.patch("/customer/bookings/{booking_id}/reschedule", response_model=BookingWithBarber)
def reschedule_customer_booking(
    booking_id: int,
    payload: BookingReschedule,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingWithBarber:
    booking = _customer_booking(db, customer, booking_id)
    booking = reschedule_booking(db, booking, payload.appointment_date, payload.appointment_time)
    return booking_to_with_barber(booking)


@router.post("/customer/bookings/{booking_id}/review", response_model=BookingReviewRead, status_code=201)
def review_booking(
    booking_id: int,
    payload: BookingReviewCreate,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingReview:
    booking = _customer_booking(db, customer, booking_id)
    if booking.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed bookingdan keyin review yozish mumkin")
    existing = db.scalar(select(BookingReview).where(BookingReview.booking_id == booking.id))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This booking already has a review")
    review = BookingReview(
        booking_id=booking.id,
        customer_id=customer.id,
        barber_id=booking.barber_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    ratings = db.scalars(select(BookingReview.rating).where(BookingReview.barber_id == booking.barber_id)).all()
    if ratings:
        booking.barber.rating = round(sum(ratings) / len(ratings), 1)
        db.commit()
    return review


@router.get("/customer/favorites", response_model=list[BarberRead])
def favorites(customer: User = Depends(require_customer), db: Session = Depends(get_db)) -> list[BarberRead]:
    rows = db.scalars(
        select(CustomerFavoriteBarber)
        .options(selectinload(CustomerFavoriteBarber.barber).selectinload(Barber.user))
        .where(CustomerFavoriteBarber.customer_id == customer.id)
        .order_by(CustomerFavoriteBarber.created_at.desc())
    ).all()
    return [serialize_barber(row.barber) for row in rows if row.barber and row.barber.is_active]


@router.post("/customer/favorites/{barber_id}", response_model=BarberRead, status_code=201)
def add_favorite(
    barber_id: int,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BarberRead:
    barber = db.scalar(select(Barber).options(selectinload(Barber.user)).where(Barber.id == barber_id, Barber.is_active.is_(True)))
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    existing = db.scalar(
        select(CustomerFavoriteBarber).where(
            CustomerFavoriteBarber.customer_id == customer.id,
            CustomerFavoriteBarber.barber_id == barber_id,
        )
    )
    if not existing:
        db.add(CustomerFavoriteBarber(customer_id=customer.id, barber_id=barber_id))
        db.commit()
    return serialize_barber(barber)


@router.delete("/customer/favorites/{barber_id}", status_code=204)
def remove_favorite(
    barber_id: int,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> Response:
    existing = db.scalar(
        select(CustomerFavoriteBarber).where(
            CustomerFavoriteBarber.customer_id == customer.id,
            CustomerFavoriteBarber.barber_id == barber_id,
        )
    )
    if existing:
        db.delete(existing)
        db.commit()
    return Response(status_code=204)
