"""rename customer and schedule tables

Revision ID: 20260506_0006
Revises: 1e52778d5205
Create Date: 2026-05-06 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260506_0006"
down_revision: Union[str, None] = "1e52778d5205"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE_RENAMES = (
    ("working_hours", "barber_schedules"),
    ("booking_reviews", "reviews"),
    ("customer_favorite_barbers", "customer_favorites"),
)


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def rename_table_if_needed(old_name: str, new_name: str) -> None:
    if table_exists(old_name) and not table_exists(new_name):
        op.rename_table(old_name, new_name)


def upgrade() -> None:
    for old_name, new_name in TABLE_RENAMES:
        rename_table_if_needed(old_name, new_name)


def downgrade() -> None:
    for old_name, new_name in reversed(TABLE_RENAMES):
        rename_table_if_needed(new_name, old_name)
