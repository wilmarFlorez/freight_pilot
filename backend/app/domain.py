from datetime import date
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, field_validator


class RequestStatus(StrEnum):
    NEEDS_REVIEW = "needs_review"
    READY_FOR_QUOTE = "ready_for_quote"


class IssueSeverity(StrEnum):
    ERROR = "error"
    WARNING = "warning"


class ValidationIssue(BaseModel):
    code: str
    field: str
    message: str
    severity: IssueSeverity = IssueSeverity.ERROR


class TransportRequestData(BaseModel):
    """Structured transport data, whether extracted or corrected by an operator."""

    model_config = ConfigDict(extra="forbid")

    customer_name: str | None = None
    origin: str | None = None
    destination: str | None = None
    cargo_type: str | None = None
    weight_kg: float | None = None
    volume_m3: float | None = None
    pallet_count: int | None = None
    vehicle_type: str | None = None
    required_date: date | None = None
    notes: str | None = None

    @field_validator(
        "customer_name",
        "origin",
        "destination",
        "cargo_type",
        "vehicle_type",
        "notes",
        mode="before",
    )
    @classmethod
    def blank_strings_are_missing(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class ValidationResult(BaseModel):
    status: RequestStatus
    issues: list[ValidationIssue]
