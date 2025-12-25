"""Initial migration - create users table

Revision ID: 001
Revises: 
Create Date: 2025-12-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('status', sa.String(30), nullable=False, server_default='active'),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
    )
    
    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'])
    
    # Add check constraint for status
    op.create_check_constraint(
        'check_users_status',
        'users',
        "status IN ('active', 'inactive', 'locked')"
    )


def downgrade() -> None:
    op.drop_table('users')
