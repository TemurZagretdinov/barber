"""initial barber booking schema

Revision ID: 20260430_0001
Revises:
Create Date: 2026-04-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260430_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "barbers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=140), nullable=False),
        sa.Column("specialty", sa.String(length=180), nullable=False),
        sa.Column("photo_url", sa.String(length=500), nullable=False),
        sa.Column("rating", sa.Float(), nullable=False),
        sa.Column("years_experience", sa.Integer(), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_barbers_id"), "barbers", ["id"], unique=False)

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_name", sa.String(length=140), nullable=False),
        sa.Column("client_phone", sa.String(length=40), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("booking_date", sa.Date(), nullable=False),
        sa.Column("booking_time", sa.Time(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("telegram_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bookings_barber_id"), "bookings", ["barber_id"], unique=False)
    op.create_index(op.f("ix_bookings_booking_date"), "bookings", ["booking_date"], unique=False)
    op.create_index(op.f("ix_bookings_id"), "bookings", ["id"], unique=False)
    op.create_index(op.f("ix_bookings_status"), "bookings", ["status"], unique=False)
    op.create_index(op.f("ix_bookings_telegram_user_id"), "bookings", ["telegram_user_id"], unique=False)
    op.create_index(
        "uq_active_booking_slot",
        "bookings",
        ["barber_id", "booking_date", "booking_time"],
        unique=True,
        postgresql_where=sa.text("status != 'cancelled'"),
    )

    op.create_table(
        "working_hours",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_working_hours_barber_id"), "working_hours", ["barber_id"], unique=False)
    op.create_index(op.f("ix_working_hours_id"), "working_hours", ["id"], unique=False)

    op.create_table(
        "blocked_slots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("time", sa.Time(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_blocked_slots_barber_id"), "blocked_slots", ["barber_id"], unique=False)
    op.create_index(op.f("ix_blocked_slots_date"), "blocked_slots", ["date"], unique=False)
    op.create_index(op.f("ix_blocked_slots_id"), "blocked_slots", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_blocked_slots_id"), table_name="blocked_slots")
    op.drop_index(op.f("ix_blocked_slots_date"), table_name="blocked_slots")
    op.drop_index(op.f("ix_blocked_slots_barber_id"), table_name="blocked_slots")
    op.drop_table("blocked_slots")
    op.drop_index(op.f("ix_working_hours_id"), table_name="working_hours")
    op.drop_index(op.f("ix_working_hours_barber_id"), table_name="working_hours")
    op.drop_table("working_hours")
    op.drop_index("uq_active_booking_slot", table_name="bookings")
    op.drop_index(op.f("ix_bookings_telegram_user_id"), table_name="bookings")
    op.drop_index(op.f("ix_bookings_status"), table_name="bookings")
    op.drop_index(op.f("ix_bookings_id"), table_name="bookings")
    op.drop_index(op.f("ix_bookings_booking_date"), table_name="bookings")
    op.drop_index(op.f("ix_bookings_barber_id"), table_name="bookings")
    op.drop_table("bookings")
    op.drop_index(op.f("ix_barbers_id"), table_name="barbers")
    op.drop_table("barbers")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

