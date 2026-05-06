from datetime import time
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.barber import Barber
from app.models.barber_service import BarberService
from app.models.user import User
from app.models.working_hour import WorkingHour


DEMO_ADMIN = {
    "email": "admin@gmail.com",
    "password": "admin123",
    "full_name": "Admin",
    "role": "admin",
    "is_active": True,
}

DEMO_SERVICES = (
    {"name": "Soch olish", "description": "Klassik soch olish xizmati", "price": 50000, "duration_minutes": 30},
    {"name": "Soqol olish", "description": "Soqolni tartibga keltirish", "price": 30000, "duration_minutes": 20},
    {"name": "Soch + soqol", "description": "Soch va soqol uchun toliq xizmat", "price": 75000, "duration_minutes": 50},
    {"name": "Premium styling", "description": "Premium styling va yakuniy parvarish", "price": 120000, "duration_minutes": 60},
)

DEMO_BARBERS = (
    {
        "email": "azizbek.rasulov@example.com",
        "password": "barber123",
        "full_name": "Azizbek Rasulov",
        "specialty": "Classic cuts and beard styling",
        "barbershop_name": "Azizbek Barber Studio",
        "address": "Amir Temur Avenue 24, Tashkent",
        "latitude": 41.3123,
        "longitude": 69.2799,
        "phone": "+998 90 111 22 33",
        "years_experience": 7,
        "rating": 4.9,
        "price_from": 50000,
        "base_price": 50000,
        "photo_url": "https://placehold.co/600x600/png?text=Azizbek+Rasulov",
        "bio": "Classic haircuts, neat beard shaping, and clean daily styling.",
    },
    {
        "email": "jamshid.xasanov@example.com",
        "password": "barber123",
        "full_name": "Jamshid Xasanov",
        "specialty": "Fade, taper, and modern texture",
        "barbershop_name": "Jamshid Fade Lab",
        "address": "Yunusabad 7, Tashkent",
        "latitude": 41.3454,
        "longitude": 69.2868,
        "phone": "+998 90 222 33 44",
        "years_experience": 6,
        "rating": 4.8,
        "price_from": 50000,
        "base_price": 50000,
        "photo_url": "https://placehold.co/600x600/png?text=Jamshid+Xasanov",
        "bio": "Sharp fades, textured cuts, and detailed finishing.",
    },
    {
        "email": "sardor.tursunov@example.com",
        "password": "barber123",
        "full_name": "Sardor Tursunov",
        "specialty": "Premium styling and grooming",
        "barbershop_name": "Sardor Grooming House",
        "address": "Chilanzar C-1, Tashkent",
        "latitude": 41.2856,
        "longitude": 69.2034,
        "phone": "+998 90 333 44 55",
        "years_experience": 9,
        "rating": 5.0,
        "price_from": 50000,
        "base_price": 50000,
        "photo_url": "https://placehold.co/600x600/png?text=Sardor+Tursunov",
        "bio": "Premium grooming, styling, and appointment-focused service.",
    },
)


def upsert_user(db: Session, *, email: str, password: str, role: str, is_active: bool, full_name: str | None = None) -> tuple[User, bool]:
    user = db.scalar(select(User).where(User.email == email))
    created = user is None
    if user is None:
        user = User(email=email, password_hash=get_password_hash(password))
        db.add(user)

    user.full_name = full_name
    user.password_hash = get_password_hash(password)
    user.role = role
    user.is_active = is_active
    db.flush()
    return user, created


def upsert_barber(db: Session, user: User, data: dict[str, Any]) -> tuple[Barber, bool]:
    barber = db.scalar(select(Barber).where(Barber.user_id == user.id))
    if barber is None:
        barber = db.scalar(select(Barber).where(Barber.full_name == data["full_name"]))
    created = barber is None
    if barber is None:
        barber = Barber(user_id=user.id)
        db.add(barber)

    barber.user_id = user.id
    barber.full_name = data["full_name"]
    barber.specialty = data["specialty"]
    barber.barbershop_name = data["barbershop_name"]
    barber.address = data["address"]
    barber.latitude = data["latitude"]
    barber.longitude = data["longitude"]
    barber.phone = data["phone"]
    barber.rating = data["rating"]
    barber.years_experience = data["years_experience"]
    barber.price_from = data["price_from"]
    barber.base_price = data["base_price"]
    barber.work_start_time = time(9, 0)
    barber.work_end_time = time(18, 0)
    barber.off_days = []
    barber.is_active = True
    barber.photo_url = data["photo_url"]
    barber.bio = data["bio"]
    db.flush()
    return barber, created


def upsert_service(db: Session, barber: Barber, service: dict[str, Any]) -> bool:
    existing = db.scalar(
        select(BarberService).where(
            BarberService.barber_id == barber.id,
            BarberService.name == service["name"],
        )
    )
    created = existing is None
    if existing is None:
        existing = BarberService(barber_id=barber.id, name=service["name"])
        db.add(existing)

    existing.description = service["description"]
    existing.price = service["price"]
    existing.duration_minutes = service["duration_minutes"]
    existing.is_active = True
    db.flush()
    return created


def upsert_schedule(db: Session, barber: Barber) -> int:
    created_count = 0
    existing_by_weekday = {
        row.weekday: row
        for row in db.scalars(select(WorkingHour).where(WorkingHour.barber_id == barber.id)).all()
    }
    for weekday in range(7):
        row = existing_by_weekday.get(weekday)
        if row is None:
            row = WorkingHour(barber_id=barber.id, weekday=weekday)
            db.add(row)
            created_count += 1
        row.start_time = time(9, 0)
        row.end_time = time(18, 0)
        row.break_start_time = None
        row.break_end_time = None
        row.is_active = True
    db.flush()
    return created_count


def seed_demo_data(db: Session) -> dict[str, int]:
    # Alpha/dev helper: this is intentionally callable over HTTP for hosts without shell access.
    admin, admin_created = upsert_user(db, **DEMO_ADMIN)

    created_barbers = 0
    created_services = 0
    created_schedules = 0
    for barber_data in DEMO_BARBERS:
        user, _ = upsert_user(
            db,
            email=barber_data["email"],
            password=barber_data["password"],
            role="barber",
            is_active=True,
            full_name=barber_data["full_name"],
        )
        barber, barber_created = upsert_barber(db, user, barber_data)
        if barber_created:
            created_barbers += 1
        for service in DEMO_SERVICES:
            if upsert_service(db, barber, service):
                created_services += 1
        created_schedules += upsert_schedule(db, barber)

    db.commit()
    return {
        "admin_created": int(admin_created),
        "barbers_created": created_barbers,
        "services_created": created_services,
        "schedules_created": created_schedules,
        "admin_user_id": admin.id,
    }
