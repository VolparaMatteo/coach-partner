"""add staff_members model

Revision ID: bd40d0f66aa8
Revises: 909ceaffcf85
Create Date: 2026-02-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'bd40d0f66aa8'
down_revision = '909ceaffcf85'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if 'staff_members' not in tables:
        op.create_table('staff_members',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('coach_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=True),
            sa.Column('role', sa.String(length=50), nullable=False, server_default='viewer'),
            sa.Column('status', sa.String(length=20), server_default='pending'),
            sa.Column('invite_token', sa.String(length=100), nullable=True),
            sa.Column('team_ids', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['coach_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('invite_token')
        )
        with op.batch_alter_table('staff_members', schema=None) as batch_op:
            batch_op.create_index(batch_op.f('ix_staff_members_coach_id'), ['coach_id'], unique=False)
            batch_op.create_index(batch_op.f('ix_staff_members_user_id'), ['user_id'], unique=False)


def downgrade():
    with op.batch_alter_table('staff_members', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_staff_members_user_id'))
        batch_op.drop_index(batch_op.f('ix_staff_members_coach_id'))

    op.drop_table('staff_members')
