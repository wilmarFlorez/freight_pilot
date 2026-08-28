from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, Enum, Float, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.domain import RequestStatus


class TransportRequest(Base):
    __tablename__ = "transport_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_text: Mapped[str] = mapped_column(Text)
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status"), nullable=False
    )
    customer_name: Mapped[str | None] = mapped_column(String(255))
    origin: Mapped[str | None] = mapped_column(String(255))
    destination: Mapped[str | None] = mapped_column(String(255))
    cargo_type: Mapped[str | None] = mapped_column(String(255))
    weight_kg: Mapped[float | None] = mapped_column(Float)
    volume_m3: Mapped[float | None] = mapped_column(Float)
    pallet_count: Mapped[int | None] = mapped_column(Integer)
    vehicle_type: Mapped[str | None] = mapped_column(String(255))
    required_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    uncertain_fields: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    validation_issues: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False, default=list
    )
    extraction_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    corrections_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
