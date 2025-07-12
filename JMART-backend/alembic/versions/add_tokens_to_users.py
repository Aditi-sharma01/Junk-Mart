"""Add tokens column to users table

Revision ID: add_tokens_to_users
Revises: 57785e7b78ad
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_tokens_to_users'
down_revision = '57785e7b78ad'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add tokens column to users table
    op.add_column('users', sa.Column('tokens', sa.Integer(), nullable=True, default=0))


def downgrade() -> None:
    # Remove tokens column from users table
    op.drop_column('users', 'tokens') 