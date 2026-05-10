from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class Barber(Base):
    __tablename__ = "barbers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(140), nullable=False)
    specialty: Mapped[str] = mapped_column(String(180), nullable=False)
    barbershop_name: Mapped[str | None] = mapped_column(String(180))
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40))
    rating: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    years_experience: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    price_from: Mapped[float | None] = mapped_column(Float)
    base_price: Mapped[float | None] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    address: Mapped[str | None] = mapped_column(String(255))
    work_start_time: Mapped[time | None] = mapped_column(Time)
    work_end_time: Mapped[time | None] = mapped_column(Time)
    off_days: Mapped[list[str] | None] = mapped_column(JSON)
    bio: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    debt: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    demo_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    demo_debt: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    commission_percent: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    is_financially_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="barber")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    working_hours: Mapped[list["WorkingHour"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    blocked_slots: Mapped[list["BlockedSlot"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    services: Mapped[list["BarberService"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    day_offs: Mapped[list["BarberDayOff"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    vacations: Mapped[list["BarberVacation"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    favorited_by: Mapped[list["CustomerFavoriteBarber"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    transactions: Mapped[list["BarberTransaction"]] = relationship(back_populates="barber", cascade="all, delete-orphan")
    daily_settlements: Mapped[list["BarberDailySettlement"]] = relationship(
        back_populates="barber", cascade="all, delete-orphan"
    )
    demo_transactions: Mapped[list["DemoBarberTransaction"]] = relationship(
        back_populates="barber", cascade="all, delete-orphan"
    )
    demo_daily_settlements: Mapped[list["DemoDailySettlement"]] = relationship(
        back_populates="barber", cascade="all, delete-orphan"
    )
