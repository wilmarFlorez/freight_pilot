from datetime import date

from app.domain import (
    IssueSeverity,
    RequestStatus,
    TransportRequestData,
    ValidationIssue,
    ValidationResult,
)

REQUIRED_FIELDS = {
    "customer_name": "cliente",
    "origin": "origen",
    "destination": "destino",
    "required_date": "fecha requerida",
}
OPTIONAL_FIELDS = {
    "weight_kg": "peso",
    "volume_m3": "volumen",
    "pallet_count": "palets",
    "vehicle_type": "tipo de vehiculo",
}


def validate_transport_request(
    request: TransportRequestData,
    uncertain_fields: list[str] | None = None,
    today: date | None = None,
) -> ValidationResult:
    """Apply business rules; only errors prevent a request from being quoted."""
    issues: list[ValidationIssue] = []
    current_date = today or date.today()

    for field, label in REQUIRED_FIELDS.items():
        if getattr(request, field) is None:
            issues.append(
                ValidationIssue(
                    code="required_field_missing",
                    field=field,
                    message=f"Falta el campo obligatorio: {label}.",
                )
            )

    for field, label in {
        "weight_kg": "peso",
        "volume_m3": "volumen",
        "pallet_count": "palets",
    }.items():
        value = getattr(request, field)
        if value is not None and value <= 0:
            issues.append(
                ValidationIssue(
                    code="value_must_be_positive",
                    field=field,
                    message=f"El {label} debe ser mayor que cero.",
                )
            )

    if request.required_date is not None and request.required_date < current_date:
        issues.append(
            ValidationIssue(
                code="required_date_in_past",
                field="required_date",
                message="La fecha requerida no puede ser anterior a hoy.",
            )
        )

    for field in uncertain_fields or []:
        if field in REQUIRED_FIELDS:
            issues.append(
                ValidationIssue(
                    code="required_field_uncertain",
                    field=field,
                    message=f"La extraccion de {REQUIRED_FIELDS[field]} es incierta.",
                )
            )

    for field, label in OPTIONAL_FIELDS.items():
        if getattr(request, field) is None:
            issues.append(
                ValidationIssue(
                    code="optional_field_missing",
                    field=field,
                    message=f"Se recomienda confirmar {label} antes de cotizar.",
                    severity=IssueSeverity.WARNING,
                )
            )

    status = (
        RequestStatus.NEEDS_REVIEW
        if any(issue.severity is IssueSeverity.ERROR for issue in issues)
        else RequestStatus.READY_FOR_QUOTE
    )
    return ValidationResult(status=status, issues=issues)
