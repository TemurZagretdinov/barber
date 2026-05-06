from datetime import time

from sqlalchemy import Boolean, ForeignKey, Integer, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


class WorkingHour(Base):
    __tablename__ = "barber_schedules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    break_start_time: Mapped[time | None] = mapped_column(Time)
    break_end_time: Mapped[time | None] = mapped_column(Time)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    barber: Mapped["Barber"] = relationship(back_populates="working_hours")

    @property
    def is_working(self) -> bool:
        return self.is_active
