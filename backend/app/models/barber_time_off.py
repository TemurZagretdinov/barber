from datetime import date

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class BarberDayOff(Base):
    __tablename__ = "barber_day_offs"
    __table_args__ = (UniqueConstraint("barber_id", "date", name="uq_barber_day_offs_barber_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255))

    barber: Mapped["Barber"] = relationship(back_populates="day_offs")


class BarberVacation(Base):
    __tablename__ = "barber_vacations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255))

    barber: Mapped["Barber"] = relationship(back_populates="vacations")
