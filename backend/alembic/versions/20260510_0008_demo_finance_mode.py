"""add explicit demo finance fields and tables

Revision ID: 20260510_0008
Revises: 20260510_0007
Create Date: 2026-05-10 01:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260510_0008"
down_revision: Union[str, None] = "20260510_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("barbers", sa.Column("demo_balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("barbers", sa.Column("demo_debt", sa.Integer(), nullable=False, server_default="0"))
    op.execute("UPDATE barbers SET demo_balance = COALESCE(balance, 0), demo_debt = COALESCE(debt, 0)")

    op.create_table(
        "demo_barber_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("booking_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_before", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("debt_before", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("debt_after", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_demo_barber_transactions_id"), "demo_barber_transactions", ["id"], unique=False)
    op.create_index(
        op.f("ix_demo_barber_transactions_barber_id"), "demo_barber_transactions", ["barber_id"], unique=False
    )
    op.create_index(
        op.f("ix_demo_barber_transactions_booking_id"), "demo_barber_transactions", ["booking_id"], unique=False
    )
    op.create_index(op.f("ix_demo_barber_transactions_type"), "demo_barber_transactions", ["type"], unique=False)

    op.create_table(
        "demo_daily_settlements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("total_completed_bookings", sa.Integer(), nullable=False, server_default="0"),
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
    op.create_index(op.f("ix_demo_daily_settlements_id"), "demo_daily_settlements", ["id"], unique=False)
    op.create_index(op.f("ix_demo_daily_settlements_barber_id"), "demo_daily_settlements", ["barber_id"], unique=False)
    op.create_index(op.f("ix_demo_daily_settlements_date"), "demo_daily_settlements", ["date"], unique=False)
    op.create_index(op.f("ix_demo_daily_settlements_status"), "demo_daily_settlements", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_demo_daily_settlements_status"), table_name="demo_daily_settlements")
    op.drop_index(op.f("ix_demo_daily_settlements_date"), table_name="demo_daily_settlements")
    op.drop_index(op.f("ix_demo_daily_settlements_barber_id"), table_name="demo_daily_settlements")
    op.drop_index(op.f("ix_demo_daily_settlements_id"), table_name="demo_daily_settlements")
    op.drop_table("demo_daily_settlements")

    op.drop_index(op.f("ix_demo_barber_transactions_type"), table_name="demo_barber_transactions")
    op.drop_index(op.f("ix_demo_barber_transactions_booking_id"), table_name="demo_barber_transactions")
    op.drop_index(op.f("ix_demo_barber_transactions_barber_id"), table_name="demo_barber_transactions")
    op.drop_index(op.f("ix_demo_barber_transactions_id"), table_name="demo_barber_transactions")
    op.drop_table("demo_barber_transactions")

    op.drop_column("barbers", "demo_debt")
    op.drop_column("barbers", "demo_balance")
