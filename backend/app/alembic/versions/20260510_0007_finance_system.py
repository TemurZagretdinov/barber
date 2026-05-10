"""add barber finance balance and settlement system

Revision ID: 20260510_0007
Revises: 1e52778d5205
Create Date: 2026-05-10 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260510_0007"
down_revision: Union[str, None] = "1e52778d5205"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("barbers", sa.Column("balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("barbers", sa.Column("debt", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("barbers", sa.Column("commission_percent", sa.Integer(), nullable=False, server_default="10"))
    op.add_column("barbers", sa.Column("is_financially_blocked", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.add_column("bookings", sa.Column("service_price", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("bookings", sa.Column("commission_percent", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("bookings", sa.Column("commission_amount", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("bookings", sa.Column("barber_earning", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("bookings", sa.Column("commission_charged", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("bookings", sa.Column("commission_charged_at", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        UPDATE bookings
        SET service_price = ROUND(COALESCE(
            bookings.price,
            (SELECT services.price FROM barber_services AS services WHERE services.id = bookings.service_id),
            (SELECT barbers.base_price FROM barbers WHERE barbers.id = bookings.barber_id),
            (SELECT barbers.price_from FROM barbers WHERE barbers.id = bookings.barber_id),
            0
        ))::integer
        """
    )
    op.execute(
        """
        UPDATE bookings
        SET commission_percent = barbers.commission_percent,
            commission_amount = (service_price * barbers.commission_percent) / 100,
            barber_earning = service_price - ((service_price * barbers.commission_percent) / 100)
        FROM barbers
        WHERE bookings.barber_id = barbers.id
          AND bookings.status = 'completed'
        """
    )

    op.create_table(
        "barber_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("booking_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_before", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_barber_transactions_id"), "barber_transactions", ["id"], unique=False)
    op.create_index(op.f("ix_barber_transactions_barber_id"), "barber_transactions", ["barber_id"], unique=False)
    op.create_index(op.f("ix_barber_transactions_booking_id"), "barber_transactions", ["booking_id"], unique=False)
    op.create_index(op.f("ix_barber_transactions_type"), "barber_transactions", ["type"], unique=False)

    op.create_table(
        "barber_daily_settlements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("total_bookings", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gross_revenue", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("commission_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("barber_earning_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("balance_before", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("balance_after", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("debt_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_barber_daily_settlements_id"), "barber_daily_settlements", ["id"], unique=False)
    op.create_index(
        op.f("ix_barber_daily_settlements_barber_id"), "barber_daily_settlements", ["barber_id"], unique=False
    )
    op.create_index(op.f("ix_barber_daily_settlements_date"), "barber_daily_settlements", ["date"], unique=False)
    op.create_index(op.f("ix_barber_daily_settlements_status"), "barber_daily_settlements", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_barber_daily_settlements_status"), table_name="barber_daily_settlements")
    op.drop_index(op.f("ix_barber_daily_settlements_date"), table_name="barber_daily_settlements")
    op.drop_index(op.f("ix_barber_daily_settlements_barber_id"), table_name="barber_daily_settlements")
    op.drop_index(op.f("ix_barber_daily_settlements_id"), table_name="barber_daily_settlements")
    op.drop_table("barber_daily_settlements")

    op.drop_index(op.f("ix_barber_transactions_type"), table_name="barber_transactions")
    op.drop_index(op.f("ix_barber_transactions_booking_id"), table_name="barber_transactions")
    op.drop_index(op.f("ix_barber_transactions_barber_id"), table_name="barber_transactions")
    op.drop_index(op.f("ix_barber_transactions_id"), table_name="barber_transactions")
    op.drop_table("barber_transactions")

    op.drop_column("bookings", "commission_charged_at")
    op.drop_column("bookings", "commission_charged")
    op.drop_column("bookings", "barber_earning")
    op.drop_column("bookings", "commission_amount")
    op.drop_column("bookings", "commission_percent")
    op.drop_column("bookings", "service_price")

    op.drop_column("barbers", "is_financially_blocked")
    op.drop_column("barbers", "commission_percent")
    op.drop_column("barbers", "debt")
    op.drop_column("barbers", "balance")
