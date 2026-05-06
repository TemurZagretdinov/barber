"""rename users username to email

Revision ID: 20260501_0002
Revises: 20260430_0001
Create Date: 2026-05-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260501_0002"
down_revision: Union[str, None] = "20260430_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.alter_column("users", "username", new_column_name="email", existing_type=sa.String(length=80))
    op.alter_column("users", "email", type_=sa.String(length=120), existing_type=sa.String(length=80))
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.alter_column("users", "email", type_=sa.String(length=80), existing_type=sa.String(length=120))
    op.alter_column("users", "email", new_column_name="username", existing_type=sa.String(length=80))
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
