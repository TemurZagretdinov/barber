from datetime import date
from math import asin, cos, radians, sin, sqrt
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.database import get_db
from app.models.barber import Barber
from app.models.barber_service import BarberService
from app.schemas.barber import AvailableSlot, AvailableSlotsResponse, BarberRead, BarberServiceRead
from app.services.booking_service import get_available_slots, get_available_slots_response

router = APIRouter()


def haversine_km(user_lat: float, user_lng: float, barber: Barber) -> float | None:
    if barber.latitude is None or barber.longitude is None:
        return None

    earth_radius_km = 6371.0
    lat1, lng1, lat2, lng2 = map(radians, [user_lat, user_lng, barber.latitude, barber.longitude])
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    value = sin(d_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(d_lng / 2) ** 2
    return round(2 * earth_radius_km * asin(sqrt(value)), 1)


def serialize_barber(barber: Barber, distance_km: float | None = None) -> BarberRead:
    return BarberRead(
        id=barber.id,
        user_id=barber.user_id,
        email=barber.user.email,
        full_name=barber.full_name,
        specialty=barber.specialty,
        barbershop_name=barber.barbershop_name,
        photo_url=barber.photo_url,
        phone=barber.phone,
        rating=barber.rating,
        years_experience=barber.years_experience,
        price_from=barber.price_from if barber.price_from is not None else barber.base_price,
        base_price=barber.base_price if barber.base_price is not None else barber.price_from,
        latitude=barber.latitude,
        longitude=barber.longitude,
        address=barber.address,
        work_start_time=barber.work_start_time,
        work_end_time=barber.work_end_time,
        off_days=barber.off_days or [],
        bio=barber.bio,
        is_active=barber.is_active,
        is_financially_blocked=barber.is_financially_blocked,
        created_at=barber.created_at,
        updated_at=barber.updated_at,
        distance_km=distance_km,
        experience_years=barber.years_experience,
    )


@router.get("/barbers", response_model=list[BarberRead])
def list_public_barbers(
    sort: Literal["nearest", "cheapest", "expensive"] | None = None,
    user_lat: float | None = None,
    user_lng: float | None = None,
    db: Session = Depends(get_db),
) -> list[BarberRead]:
    barbers = db.scalars(
        select(Barber)
        .options(selectinload(Barber.user))
        .where(Barber.is_active.is_(True))
    ).all()
    if settings.financial_blocking_enabled:
        barbers = [barber for barber in barbers if not barber.is_financially_blocked]

    distances: dict[int, float | None] = {}
    if user_lat is not None and user_lng is not None:
        distances = {barber.id: haversine_km(user_lat, user_lng, barber) for barber in barbers}

    if sort == "nearest":
        if user_lat is None or user_lng is None:
            raise HTTPException(status_code=400, detail="Nearest sort requires user_lat and user_lng")
        barbers = sorted(barbers, key=lambda barber: (distances[barber.id] is None, distances[barber.id] or 0, barber.full_name))
    elif sort == "cheapest":
        barbers = sorted(barbers, key=lambda barber: ((barber.price_from if barber.price_from is not None else barber.base_price) is None, barber.price_from if barber.price_from is not None else barber.base_price or 0, barber.full_name))
    elif sort == "expensive":
        barbers = sorted(barbers, key=lambda barber: ((barber.price_from if barber.price_from is not None else barber.base_price) is None, -((barber.price_from if barber.price_from is not None else barber.base_price) or 0), barber.full_name))
    else:
        barbers = sorted(barbers, key=lambda barber: barber.full_name)

    return [serialize_barber(barber, distances.get(barber.id)) for barber in barbers]


@router.get("/barbers/{barber_id}", response_model=BarberRead)
def get_public_barber(barber_id: int, db: Session = Depends(get_db)) -> BarberRead:
    barber = db.scalar(
        select(Barber)
        .options(selectinload(Barber.user))
        .where(Barber.id == barber_id, Barber.is_active.is_(True))
    )
    if not barber or (settings.financial_blocking_enabled and barber.is_financially_blocked):
        raise HTTPException(status_code=404, detail="Barber not found")
    return serialize_barber(barber)


@router.get("/barbers/{barber_id}/services", response_model=list[BarberServiceRead])
def public_barber_services(barber_id: int, db: Session = Depends(get_db)) -> list[BarberService]:
    barber = db.get(Barber, barber_id)
    if not barber or not barber.is_active or (settings.financial_blocking_enabled and barber.is_financially_blocked):
        raise HTTPException(status_code=404, detail="Barber not found")
    return list(
        db.scalars(
            select(BarberService)
            .where(BarberService.barber_id == barber_id, BarberService.is_active.is_(True))
            .order_by(BarberService.price, BarberService.name)
        ).all()
    )


@router.get("/barbers/{barber_id}/availability", response_model=list[AvailableSlot])
def available_slots(
    barber_id: int,
    date: date,
    service_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[AvailableSlot]:
    return get_available_slots(db, barber_id, date, service_id)


@router.get("/barbers/{barber_id}/available-slots", response_model=AvailableSlotsResponse)
def available_slots_v2(
    barber_id: int,
    date: date,
    service_id: int | None = None,
    db: Session = Depends(get_db),
) -> AvailableSlotsResponse:
    return get_available_slots_response(db, barber_id, date, service_id)
