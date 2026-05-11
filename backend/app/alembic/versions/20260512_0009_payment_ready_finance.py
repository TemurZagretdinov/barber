"""add payment ready finance tables

Revision ID: 20260512_0009
Revises: 20260510_0008
Create Date: 2026-05-12 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260512_0009"
down_revision: Union[str, None] = "20260510_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE barbers
        SET balance = GREATEST(COALESCE(balance, 0), COALESCE(demo_balance, 0)),
            debt = GREATEST(COALESCE(debt, 0), COALESCE(demo_debt, 0))
        """
    )
    op.execute("UPDATE barbers SET demo_balance = COALESCE(balance, 0), demo_debt = COALESCE(debt, 0)")

    op.add_column(
        "barber_daily_settlements",
        sa.Column("total_completed_bookings", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute("UPDATE barber_daily_settlements SET total_completed_bookings = COALESCE(total_bookings, 0)")

    op.create_table(
        "top_up_orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False, server_default="mock"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("external_transaction_id", sa.String(length=160), nullable=True),
        sa.Column("provider_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_top_up_orders_id"), "top_up_orders", ["id"], unique=False)
    op.create_index(op.f("ix_top_up_orders_barber_id"), "top_up_orders", ["barber_id"], unique=False)
    op.create_index(op.f("ix_top_up_orders_provider"), "top_up_orders", ["provider"], unique=False)
    op.create_index(op.f("ix_top_up_orders_status"), "top_up_orders", ["status"], unique=False)
    op.create_index(
        op.f("ix_top_up_orders_external_transaction_id"),
        "top_up_orders",
        ["external_transaction_id"],
        unique=False,
    )

    op.create_table(
        "payment_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("barber_id", sa.Integer(), nullable=False),
        sa.Column("top_up_order_id", sa.Integer(), nullable=True),
        sa.Column("booking_id", sa.Integer(), nullable=True),
        sa.Column("provider", sa.String(length=20), nullable=False, server_default="manual"),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="paid"),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_before", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("debt_before", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("debt_after", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("external_transaction_id", sa.String(length=160), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["barber_id"], ["barbers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["top_up_order_id"], ["top_up_orders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("top_up_order_id", "type", name="uq_payment_transactions_top_up_order_type"),
    )
    op.create_index(op.f("ix_payment_transactions_id"), "payment_transactions", ["id"], unique=False)
    op.create_index(op.f("ix_payment_transactions_barber_id"), "payment_transactions", ["barber_id"], unique=False)
    op.create_index(op.f("ix_payment_transactions_top_up_order_id"), "payment_transactions", ["top_up_order_id"], unique=False)
    op.create_index(op.f("ix_payment_transactions_booking_id"), "payment_transactions", ["booking_id"], unique=False)
    op.create_index(op.f("ix_payment_transactions_provider"), "payment_transactions", ["provider"], unique=False)
    op.create_index(op.f("ix_payment_transactions_type"), "payment_transactions", ["type"], unique=False)
    op.create_index(op.f("ix_payment_transactions_status"), "payment_transactions", ["status"], unique=False)
    op.create_index(
        op.f("ix_payment_transactions_external_transaction_id"),
        "payment_transactions",
        ["external_transaction_id"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO payment_transactions (
            barber_id, booking_id, provider, type, status, amount,
            balance_before, balance_after, debt_before, debt_after, description, created_at
        )
        SELECT barber_id, booking_id, 'manual', type, 'paid', amount,
               balance_before, balance_after, 0, 0, description, created_at
        FROM barber_transactions
        """
    )
    op.execute(
        """
        INSERT INTO payment_transactions (
            barber_id, booking_id, provider, type, status, amount,
            balance_before, balance_after, debt_before, debt_after, description, created_at
        )
        SELECT barber_id, booking_id, 'mock', regexp_replace(type, '^demo_', ''), 'paid', amount,
               balance_before, balance_after, debt_before, debt_after, description, created_at
        FROM demo_barber_transactions
        """
    )

    op.create_table(
        "payment_webhook_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=True),
        sa.Column("external_transaction_id", sa.String(length=160), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="received"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payment_webhook_logs_id"), "payment_webhook_logs", ["id"], unique=False)
    op.create_index(op.f("ix_payment_webhook_logs_provider"), "payment_webhook_logs", ["provider"], unique=False)
    op.create_index(op.f("ix_payment_webhook_logs_event_type"), "payment_webhook_logs", ["event_type"], unique=False)
    op.create_index(
        op.f("ix_payment_webhook_logs_external_transaction_id"),
        "payment_webhook_logs",
        ["external_transaction_id"],
        unique=False,
    )
    op.create_index(op.f("ix_payment_webhook_logs_status"), "payment_webhook_logs", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_payment_webhook_logs_status"), table_name="payment_webhook_logs")
    op.drop_index(op.f("ix_payment_webhook_logs_external_transaction_id"), table_name="payment_webhook_logs")
    op.drop_index(op.f("ix_payment_webhook_logs_event_type"), table_name="payment_webhook_logs")
    op.drop_index(op.f("ix_payment_webhook_logs_provider"), table_name="payment_webhook_logs")
    op.drop_index(op.f("ix_payment_webhook_logs_id"), table_name="payment_webhook_logs")
    op.drop_table("payment_webhook_logs")

    op.drop_index(op.f("ix_payment_transactions_external_transaction_id"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_status"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_type"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_provider"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_booking_id"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_top_up_order_id"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_barber_id"), table_name="payment_transactions")
    op.drop_index(op.f("ix_payment_transactions_id"), table_name="payment_transactions")
    op.drop_table("payment_transactions")

    op.drop_index(op.f("ix_top_up_orders_external_transaction_id"), table_name="top_up_orders")
    op.drop_index(op.f("ix_top_up_orders_status"), table_name="top_up_orders")
    op.drop_index(op.f("ix_top_up_orders_provider"), table_name="top_up_orders")
    op.drop_index(op.f("ix_top_up_orders_barber_id"), table_name="top_up_orders")
    op.drop_index(op.f("ix_top_up_orders_id"), table_name="top_up_orders")
    op.drop_table("top_up_orders")

    op.drop_column("barber_daily_settlements", "total_completed_bookings")
