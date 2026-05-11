from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.user import Base


PAYMENT_PROVIDERS = ("mock", "payme", "click", "manual")
PAYMENT_STATUSES = ("pending", "waiting_provider", "paid", "failed", "cancelled", "expired", "refunded")
PAYMENT_TRANSACTION_TYPES = (
    "top_up",
    "commission_charge",
    "debt_created",
    "debt_paid",
    "refund",
    "adjustment",
)


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


class DailySettlement(Base):
    __tablename__ = "barber_daily_settlements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    total_bookings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_completed_bookings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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


BarberDailySettlement = DailySettlement


class TopUpOrder(Base):
    __tablename__ = "top_up_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    provider: Mapped[str] = mapped_column(String(20), default="mock", index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True, nullable=False)
    external_transaction_id: Mapped[str | None] = mapped_column(String(160), index=True)
    provider_payload: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    description: Mapped[str | None] = mapped_column(Text)

    barber: Mapped["Barber"] = relationship(back_populates="top_up_orders")
    payment_transactions: Mapped[list["PaymentTransaction"]] = relationship(back_populates="top_up_order")

    @property
    def order_id(self) -> int:
        return self.id


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    top_up_order_id: Mapped[int | None] = mapped_column(ForeignKey("top_up_orders.id", ondelete="SET NULL"), index=True)
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), index=True)
    provider: Mapped[str] = mapped_column(String(20), default="mock", index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="paid", index=True, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    debt_before: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    debt_after: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    external_transaction_id: Mapped[str | None] = mapped_column(String(160), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    barber: Mapped["Barber"] = relationship(back_populates="payment_transactions")
    top_up_order: Mapped["TopUpOrder | None"] = relationship(back_populates="payment_transactions")
    booking: Mapped["Booking | None"] = relationship(back_populates="payment_transactions")


class PaymentWebhookLog(Base):
    __tablename__ = "payment_webhook_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    provider: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    event_type: Mapped[str | None] = mapped_column(String(80), index=True)
    external_transaction_id: Mapped[str | None] = mapped_column(String(160), index=True)
    payload: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(30), default="received", index=True, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DemoBarberTransaction(Base):
    __tablename__ = "demo_barber_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), index=True)
    type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    debt_before: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    debt_after: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    barber: Mapped["Barber"] = relationship(back_populates="demo_transactions")
    booking: Mapped["Booking | None"] = relationship(back_populates="demo_transactions")


class DemoDailySettlement(Base):
    __tablename__ = "demo_daily_settlements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    barber_id: Mapped[int] = mapped_column(ForeignKey("barbers.id", ondelete="CASCADE"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    total_completed_bookings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gross_revenue: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    commission_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    barber_earning_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    balance_before: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    debt_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    barber: Mapped["Barber"] = relationship(back_populates="demo_daily_settlements")
