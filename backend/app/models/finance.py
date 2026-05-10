from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class BarberTransaction(Base):
    __tablename__ = "barber_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), index=True)
    type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    barber: Mapped["Barber"] = relationship(back_populates="transactions")
    booking: Mapped["Booking | None"] = relationship(back_populates="transactions")


class BarberDailySettlement(Base):
    __tablename__ = "barber_daily_settlements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    total_bookings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gross_revenue: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    commission_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    barber_earning_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    balance_before: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    debt_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    barber: Mapped["Barber"] = relationship(back_populates="daily_settlements")
