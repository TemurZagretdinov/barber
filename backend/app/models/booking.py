from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_name: Mapped[str] = mapped_column(String(140), nullable=False)
    client_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    service_id: Mapped[int | None] = mapped_column(ForeignKey("barber_services.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    booking_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)
    price: Mapped[float | None] = mapped_column(Float)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    service_note: Mapped[str | None] = mapped_column(Text)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    telegram_user_id: Mapped[int | None] = mapped_column(nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    barber: Mapped["Barber"] = relationship(back_populates="bookings")
    service: Mapped["BarberService | None"] = relationship()
    customer: Mapped["User | None"] = relationship(back_populates="bookings")
    review: Mapped["BookingReview | None"] = relationship(back_populates="booking", cascade="all, delete-orphan")

    @property
    def booking_code(self) -> str:
        return f"BKG-{self.id:06d}"
