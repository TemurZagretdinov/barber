"""add customer services schedule notifications

Revision ID: 20260504_0005
Revises: 20260502_0004
Create Date: 2026-05-04 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260504_0005"
down_revision: Union[str, None] = "20260502_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("working_hours", sa.Column("break_start_time", sa.Time(), nullable=True))
    op.add_column("working_hours", sa.Column("break_end_time", sa.Time(), nullable=True))

    op.create_table(
        "barber_services",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("barber_id", "name", name="uq_barber_services_barber_name"),
    )
    op.create_index(op.f("ix_barber_services_id"), "barber_services", ["id"], unique=False)
    op.create_index(op.f("ix_barber_services_barber_id"), "barber_services", ["barber_id"], unique=False)

    op.execute(
        """
        INSERT INTO barber_services (barber_id, name, description, price, duration_minutes, is_active)
        SELECT id, 'Soch olish', 'Standart soch olish xizmati', COALESCE(base_price, price_from, 50000), 30, true
        FROM barbers
        ON CONFLICT DO NOTHING
        """
    )

    op.create_table(
        "barber_day_offs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("barber_id", "date", name="uq_barber_day_offs_barber_date"),
    )
    op.create_index(op.f("ix_barber_day_offs_id"), "barber_day_offs", ["id"], unique=False)
    op.create_index(op.f("ix_barber_day_offs_barber_id"), "barber_day_offs", ["barber_id"], unique=False)
    op.create_index(op.f("ix_barber_day_offs_date"), "barber_day_offs", ["date"], unique=False)

    op.create_table(
        "barber_vacations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_barber_vacations_id"), "barber_vacations", ["id"], unique=False)
    op.create_index(op.f("ix_barber_vacations_barber_id"), "barber_vacations", ["barber_id"], unique=False)
    op.create_index(op.f("ix_barber_vacations_start_date"), "barber_vacations", ["start_date"], unique=False)
    op.create_index(op.f("ix_barber_vacations_end_date"), "barber_vacations", ["end_date"], unique=False)

    op.add_column("bookings", sa.Column("service_id", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("customer_id", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("price", sa.Float(), nullable=True))
    op.add_column("bookings", sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="30"))
    op.add_column("bookings", sa.Column("reminder_sent_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_bookings_service_id"), "bookings", ["service_id"], unique=False)
    op.create_index(op.f("ix_bookings_customer_id"), "bookings", ["customer_id"], unique=False)
    op.create_foreign_key("fk_bookings_service_id_barber_services", "bookings", "barber_services", ["service_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_bookings_customer_id_users", "bookings", "users", ["customer_id"], ["id"], ondelete="SET NULL")
    op.execute(
        """
        UPDATE bookings
        SET service_id = service.id,
            price = service.price,
            duration_minutes = service.duration_minutes
        FROM (
            SELECT DISTINCT ON (barber_id) id, barber_id, price, duration_minutes
            FROM barber_services
            WHERE is_active = true
            ORDER BY barber_id, id
        ) AS service
        WHERE bookings.barber_id = service.barber_id
        """
    )

    op.create_table(
        "booking_reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_id", name="uq_booking_reviews_booking_id"),
    )
    op.create_index(op.f("ix_booking_reviews_id"), "booking_reviews", ["id"], unique=False)
    op.create_index(op.f("ix_booking_reviews_booking_id"), "booking_reviews", ["booking_id"], unique=False)
    op.create_index(op.f("ix_booking_reviews_customer_id"), "booking_reviews", ["customer_id"], unique=False)
    op.create_index(op.f("ix_booking_reviews_barber_id"), "booking_reviews", ["barber_id"], unique=False)

    op.create_table(
        "customer_favorite_barbers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("customer_id", "barber_id", name="uq_customer_favorite_barber"),
    )
    op.create_index(op.f("ix_customer_favorite_barbers_id"), "customer_favorite_barbers", ["id"], unique=False)
    op.create_index(op.f("ix_customer_favorite_barbers_customer_id"), "customer_favorite_barbers", ["customer_id"], unique=False)
    op.create_index(op.f("ix_customer_favorite_barbers_barber_id"), "customer_favorite_barbers", ["barber_id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("telegram_chat_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)
    op.create_index(op.f("ix_notifications_telegram_chat_id"), "notifications", ["telegram_chat_id"], unique=False)
    op.create_index(op.f("ix_notifications_type"), "notifications", ["type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notifications_type"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_telegram_chat_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")

    op.drop_index(op.f("ix_customer_favorite_barbers_barber_id"), table_name="customer_favorite_barbers")
    op.drop_index(op.f("ix_customer_favorite_barbers_customer_id"), table_name="customer_favorite_barbers")
    op.drop_index(op.f("ix_customer_favorite_barbers_id"), table_name="customer_favorite_barbers")
    op.drop_table("customer_favorite_barbers")

    op.drop_index(op.f("ix_booking_reviews_barber_id"), table_name="booking_reviews")
    op.drop_index(op.f("ix_booking_reviews_customer_id"), table_name="booking_reviews")
    op.drop_index(op.f("ix_booking_reviews_booking_id"), table_name="booking_reviews")
    op.drop_index(op.f("ix_booking_reviews_id"), table_name="booking_reviews")
    op.drop_table("booking_reviews")

    op.drop_constraint("fk_bookings_customer_id_users", "bookings", type_="foreignkey")
    op.drop_constraint("fk_bookings_service_id_barber_services", "bookings", type_="foreignkey")
    op.drop_index(op.f("ix_bookings_customer_id"), table_name="bookings")
    op.drop_index(op.f("ix_bookings_service_id"), table_name="bookings")
    op.drop_column("bookings", "reminder_sent_at")
    op.drop_column("bookings", "duration_minutes")
    op.drop_column("bookings", "price")
    op.drop_column("bookings", "customer_id")
    op.drop_column("bookings", "service_id")

    op.drop_index(op.f("ix_barber_vacations_end_date"), table_name="barber_vacations")
    op.drop_index(op.f("ix_barber_vacations_start_date"), table_name="barber_vacations")
    op.drop_index(op.f("ix_barber_vacations_barber_id"), table_name="barber_vacations")
    op.drop_index(op.f("ix_barber_vacations_id"), table_name="barber_vacations")
    op.drop_table("barber_vacations")

    op.drop_index(op.f("ix_barber_day_offs_date"), table_name="barber_day_offs")
    op.drop_index(op.f("ix_barber_day_offs_barber_id"), table_name="barber_day_offs")
    op.drop_index(op.f("ix_barber_day_offs_id"), table_name="barber_day_offs")
    op.drop_table("barber_day_offs")

    op.drop_index(op.f("ix_barber_services_barber_id"), table_name="barber_services")
    op.drop_index(op.f("ix_barber_services_id"), table_name="barber_services")
    op.drop_table("barber_services")

    op.drop_column("working_hours", "break_end_time")
    op.drop_column("working_hours", "break_start_time")
