"""add username to waste_items

Revision ID: 5ffc652383d0
Revises: d4eff6f41e8b
Create Date: 2025-07-12 10:36:57.683283

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5ffc652383d0'
down_revision: Union[str, None] = 'd4eff6f41e8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('waste_items', sa.Column('username', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('waste_items', 'username')
    # ### end Alembic commands ###
