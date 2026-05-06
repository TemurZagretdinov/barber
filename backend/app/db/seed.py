from datetime import date, time, timedelta

from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import SessionLocal
from app.models.barber import Barber
from app.models.booking import Booking
from app.models.user import User
from app.models.working_hour import WorkingHour


BARBERS = [
    {
        "full_name": "Jamshid Karimov",
        "specialty": "Fade & Line-ups",
        "barbershop_name": "Sharp Cuts Amir Temur",
        "photo_url": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80",
        "rating": 4.9,
        "years_experience": 8,
        "price_from": 45000,
        "base_price": 45000,
        "phone": "+998901110001",
        "work_start_time": time(9, 0),
        "work_end_time": time(18, 0),
        "off_days": ["sunday"],
        "latitude": 41.3111,
        "longitude": 69.2797,
        "address": "Amir Temur Avenue, Tashkent",
        "email": "jamshid@gmail.com",
        "password": "123456",
        "bio": "Precision fades, crisp line-ups, and classic shop energy.",
    },
    {
        "full_name": "Azizbek Rasulov",
        "specialty": "Classic Cuts & Beard",
        "barbershop_name": "Sharp Cuts Yunusabad",
        "photo_url": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=300&q=80",
        "rating": 4.8,
        "years_experience": 5,
        "price_from": 35000,
        "base_price": 35000,
        "phone": "+998901110002",
        "work_start_time": time(10, 0),
        "work_end_time": time(19, 0),
        "off_days": ["sunday"],
        "latitude": 41.3275,
        "longitude": 69.2817,
        "address": "Yunusabad, Tashkent",
        "email": "azizbek@gmail.com",
        "password": "123456",
        "bio": "Classic cuts, beard shaping, and clean finishing.",
    },
    {
        "full_name": "Bekzod Aliyev",
        "specialty": "Modern Styles & Texture",
        "barbershop_name": "Sharp Cuts Chilanzar",
        "photo_url": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=80",
        "rating": 4.7,
        "years_experience": 3,
        "price_from": 60000,
        "base_price": 60000,
        "phone": "+998901110003",
        "work_start_time": time(9, 30),
        "work_end_time": time(18, 30),
        "off_days": ["monday"],
        "latitude": 41.2856,
        "longitude": 69.2034,
        "address": "Chilanzar, Tashkent",
        "email": "bekzod@gmail.com",
        "password": "123456",
        "bio": "Modern texture, longer styles, and detailed consultations.",
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.email == settings.admin_email))
        if not admin:
            db.add(User(email=settings.admin_email, password_hash=get_password_hash(settings.admin_password), role="admin"))

        created_barbers: list[Barber] = []
        for item in BARBERS:
            user = db.scalar(select(User).where(User.email == item["email"]))
            if not user:
                user = User(
                    email=item["email"],
                    password_hash=get_password_hash(item["password"]),
                    role="barber",
                )
                db.add(user)
                db.flush()
            barber = db.scalar(select(Barber).where(Barber.user_id == user.id))
            if not barber:
                barber = Barber(
                    user_id=user.id,
                    full_name=item["full_name"],
                    specialty=item["specialty"],
                    barbershop_name=item["barbershop_name"],
                    photo_url=item["photo_url"],
                    phone=item["phone"],
                    rating=item["rating"],
                    years_experience=item["years_experience"],
                    price_from=item["price_from"],
                    base_price=item["base_price"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    address=item["address"],
                    work_start_time=item["work_start_time"],
                    work_end_time=item["work_end_time"],
                    off_days=item["off_days"],
                    bio=item["bio"],
                )
                db.add(barber)
                db.flush()
            else:
                barber.price_from = item["price_from"]
                barber.base_price = item["base_price"]
                barber.barbershop_name = item["barbershop_name"]
                barber.phone = item["phone"]
                barber.latitude = item["latitude"]
                barber.longitude = item["longitude"]
                barber.address = item["address"]
                barber.work_start_time = item["work_start_time"]
                barber.work_end_time = item["work_end_time"]
                barber.off_days = item["off_days"]
            created_barbers.append(barber)

            existing_hours = db.scalar(select(WorkingHour).where(WorkingHour.barber_id == barber.id))
            if not existing_hours:
                for weekday in range(7):
                    db.add(
                        WorkingHour(
                            barber_id=barber.id,
                            weekday=weekday,
                            start_time=time(9, 0),
                            end_time=time(18, 0),
                        )
                    )

        db.flush()
        existing_booking = db.scalar(select(Booking))
        if not existing_booking and created_barbers:
            today = date.today()
            sample = [
                ("John Smith", "(555) 010-1000", created_barbers[0].id, today, time(9, 0), "pending"),
                ("Amir Karimov", "+998 90 123 45 67", created_barbers[0].id, today, time(11, 30), "completed"),
                ("Diego Client", "(555) 010-2000", created_barbers[1].id, today + timedelta(days=1), time(10, 0), "pending"),
                ("Kai Client", "(555) 010-3000", created_barbers[2].id, today, time(14, 30), "cancelled"),
            ]
            for client_name, phone, barber_id, booking_date, booking_time, status in sample:
                db.add(
                    Booking(
                        client_name=client_name,
                        client_phone=phone,
                        barber_id=barber_id,
                        booking_date=booking_date,
                        booking_time=booking_time,
                        status=status,
                    )
                )
        db.commit()
        print("Seed data is ready.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
