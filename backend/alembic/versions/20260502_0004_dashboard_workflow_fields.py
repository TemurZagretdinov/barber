"""add dashboard workflow fields

Revision ID: 20260502_0004
Revises: 20260502_0003
Create Date: 2026-05-02 23:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260502_0004"
down_revision: Union[str, None] = "20260502_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("barbers", sa.Column("barbershop_name", sa.String(length=180), nullable=True))
    op.add_column("barbers", sa.Column("phone", sa.String(length=40), nullable=True))
    op.add_column("barbers", sa.Column("base_price", sa.Float(), nullable=True))
    op.add_column("barbers", sa.Column("work_start_time", sa.Time(), nullable=True))
    op.add_column("barbers", sa.Column("work_end_time", sa.Time(), nullable=True))
    op.add_column("barbers", sa.Column("off_days", sa.JSON(), nullable=True))
    op.execute("UPDATE barbers SET base_price = price_from WHERE base_price IS NULL")
    op.execute("UPDATE barbers SET work_start_time = TIME '09:00', work_end_time = TIME '18:00' WHERE work_start_time IS NULL")
    op.execute("UPDATE barbers SET off_days = '[\"sunday\"]'::json WHERE off_days IS NULL")

    op.add_column("bookings", sa.Column("service_note", sa.Text(), nullable=True))
    op.add_column("bookings", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("bookings", "completed_at")
    op.drop_column("bookings", "service_note")
    op.drop_column("barbers", "off_days")
    op.drop_column("barbers", "work_end_time")
    op.drop_column("barbers", "work_start_time")
    op.drop_column("barbers", "base_price")
    op.drop_column("barbers", "phone")
    op.drop_column("barbers", "barbershop_name")
