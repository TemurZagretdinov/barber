from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.booking import Booking
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingRead
from app.services.booking_service import create_booking

router = APIRouter()


@router.post("/bookings", response_model=BookingRead, status_code=201)
def create_public_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    customer_id = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        token_payload = decode_access_token(token)
        user_id = token_payload.get("sub") if token_payload else None
        if user_id:
            user = db.get(User, int(user_id))
            if user and user.role == "customer" and user.is_active:
                customer_id = user.id
    return create_booking(db, payload, customer_id=customer_id)


@router.get("/bookings/{booking_code}", response_model=BookingRead)
def get_public_booking(booking_code: str, db: Session = Depends(get_db)) -> Booking:
    normalized_code = booking_code.strip().upper()
    code = normalized_code.removeprefix("BKG-").lstrip("0") or normalized_code
    if not code.isdigit():
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = db.get(Booking, int(code))
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
