"""add barber location and price fields

Revision ID: 20260502_0003
Revises: 20260501_0002
Create Date: 2026-05-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260502_0003"
down_revision: Union[str, None] = "20260501_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("barbers", sa.Column("price_from", sa.Float(), nullable=True))
    op.add_column("barbers", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("barbers", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("barbers", sa.Column("address", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("barbers", "address")
    op.drop_column("barbers", "longitude")
    op.drop_column("barbers", "latitude")
    op.drop_column("barbers", "price_from")
