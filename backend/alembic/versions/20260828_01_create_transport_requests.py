"""create transport requests

Revision ID: 20260828_01
Revises:
Create Date: 2026-08-28
"""

from alembic import op
import sqlalchemy as sa


revision = "20260828_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    request_status = sa.Enum("needs_review", "ready_for_quote", name="request_status")
    op.create_table(
        "transport_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("status", request_status, nullable=False),
        sa.Column("customer_name", sa.String(length=255)),
        sa.Column("origin", sa.String(length=255)),
        sa.Column("destination", sa.String(length=255)),
        sa.Column("cargo_type", sa.String(length=255)),
        sa.Column("weight_kg", sa.Float()),
        sa.Column("volume_m3", sa.Float()),
        sa.Column("pallet_count", sa.Integer()),
        sa.Column("vehicle_type", sa.String(length=255)),
        sa.Column("required_date", sa.Date()),
        sa.Column("notes", sa.Text()),
        sa.Column("uncertain_fields", sa.JSON(), nullable=False),
        sa.Column("validation_issues", sa.JSON(), nullable=False),
        sa.Column("extraction_snapshot", sa.JSON()),
        sa.Column("corrections_snapshot", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("transport_requests")
    sa.Enum(name="request_status").drop(op.get_bind(), checkfirst=True)
