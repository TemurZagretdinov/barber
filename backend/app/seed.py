from sqlalchemy import select

from app.core.security import get_password_hash
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.barber import Barber
from app.models.blocked_slot import BlockedSlot  # noqa: F401
from app.models.booking import Booking  # noqa: F401
from app.models.user import User
from app.models.working_hour import WorkingHour  # noqa: F401


DEFAULT_ADMIN = {
    "email": settings.admin_email,
    "password": settings.admin_password,
    "role": "admin",
    "is_active": True,
}

DEFAULT_BARBERS = [
    {
        "email": "jamshid@gmail.com",
        "password": "123456",
        "role": "barber",
        "is_active": True,
        "full_name": "Jamshid Karimov",
        "specialty": "Fade & Line-ups",
        "barbershop_name": "Sharp Cuts Amir Temur",
        "photo_url": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80",
        "rating": 4.9,
        "years_experience": 8,
        "price_from": 45000,
        "base_price": 45000,
        "phone": "+998901110001",
        "work_start_time": "09:00",
        "work_end_time": "18:00",
        "off_days": ["sunday"],
        "latitude": 41.3111,
        "longitude": 69.2797,
        "address": "Amir Temur Avenue, Tashkent",
        "bio": "Precision fades, crisp line-ups, and classic shop energy.",
    },
    {
        "email": "azizbek@gmail.com",
        "password": "123456",
        "role": "barber",
        "is_active": True,
        "full_name": "Azizbek Rasulov",
        "specialty": "Classic Cuts & Beard",
        "barbershop_name": "Sharp Cuts Yunusabad",
        "photo_url": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=300&q=80",
        "rating": 4.8,
        "years_experience": 5,
        "price_from": 35000,
        "base_price": 35000,
        "phone": "+998901110002",
        "work_start_time": "10:00",
        "work_end_time": "19:00",
        "off_days": ["sunday"],
        "latitude": 41.3275,
        "longitude": 69.2817,
        "address": "Yunusabad, Tashkent",
        "bio": "Classic cuts, beard shaping, and clean finishing.",
    },
    {
        "email": "bekzod@gmail.com",
        "password": "123456",
        "role": "barber",
        "is_active": True,
        "full_name": "Bekzod Aliyev",
        "specialty": "Modern Styles & Texture",
        "barbershop_name": "Sharp Cuts Chilanzar",
        "photo_url": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=80",
        "rating": 4.7,
        "years_experience": 3,
        "price_from": 60000,
        "base_price": 60000,
        "phone": "+998901110003",
        "work_start_time": "09:30",
        "work_end_time": "18:30",
        "off_days": ["monday"],
        "latitude": 41.2856,
        "longitude": 69.2034,
        "address": "Chilanzar, Tashkent",
        "bio": "Modern texture, longer styles, and detailed consultations.",
    },
]


def upsert_user(session, email: str, password: str, role: str, is_active: bool) -> User:
    user = session.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            role=role,
            is_active=is_active,
        )
        session.add(user)
        session.flush()
        return user

    user.password_hash = get_password_hash(password)
    user.role = role
    user.is_active = is_active
    session.flush()
    return user


def upsert_barber(session, user: User, barber_data: dict[str, object]) -> Barber:
    barber = session.scalar(select(Barber).where(Barber.user_id == user.id))
    if barber is None:
        barber = Barber(user_id=user.id)
        session.add(barber)

    barber.full_name = str(barber_data["full_name"])
    barber.specialty = str(barber_data["specialty"])
    barber.barbershop_name = str(barber_data["barbershop_name"])
    barber.photo_url = str(barber_data["photo_url"])
    barber.phone = str(barber_data["phone"])
    barber.rating = float(barber_data["rating"])
    barber.years_experience = int(barber_data["years_experience"])
    barber.price_from = float(barber_data["price_from"])
    barber.base_price = float(barber_data["base_price"])
    barber.latitude = float(barber_data["latitude"])
    barber.longitude = float(barber_data["longitude"])
    barber.address = str(barber_data["address"])
    from datetime import time
    barber.work_start_time = time.fromisoformat(str(barber_data["work_start_time"]))
    barber.work_end_time = time.fromisoformat(str(barber_data["work_end_time"]))
    barber.off_days = list(barber_data["off_days"])
    barber.bio = str(barber_data["bio"])
    barber.is_active = bool(barber_data["is_active"])
    session.flush()
    return barber


def seed() -> None:
    session = SessionLocal()
    try:
        upsert_user(
            session,
            email=DEFAULT_ADMIN["email"],
            password=DEFAULT_ADMIN["password"],
            role=DEFAULT_ADMIN["role"],
            is_active=DEFAULT_ADMIN["is_active"],
        )

        for barber_data in DEFAULT_BARBERS:
            user = upsert_user(
                session,
                email=str(barber_data["email"]),
                password=str(barber_data["password"]),
                role=str(barber_data["role"]),
                is_active=bool(barber_data["is_active"]),
            )
            upsert_barber(session, user, barber_data)

        session.commit()
        print("Seed completed")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
