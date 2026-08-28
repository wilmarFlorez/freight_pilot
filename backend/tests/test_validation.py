from datetime import date

import pytest

from app.domain import IssueSeverity, RequestStatus, TransportRequestData
from app.validation import validate_transport_request

TODAY = date(2026, 8, 28)


def complete_request(**overrides: object) -> TransportRequestData:
    values: dict[str, object] = {
        "customer_name": "Transportes Norte",
        "origin": "Madrid",
        "destination": "Valencia",
        "required_date": TODAY,
        "weight_kg": 1200,
        "volume_m3": 8.5,
        "pallet_count": 4,
        "vehicle_type": "Lona",
    }
    values.update(overrides)
    return TransportRequestData(**values)


@pytest.mark.parametrize("field", ["customer_name", "origin", "destination", "required_date"])
def test_missing_required_field_needs_review(field: str) -> None:
    result = validate_transport_request(complete_request(**{field: None}), today=TODAY)

    assert result.status is RequestStatus.NEEDS_REVIEW
    assert any(issue.code == "required_field_missing" and issue.field == field for issue in result.issues)


@pytest.mark.parametrize("field", ["weight_kg", "volume_m3", "pallet_count"])
@pytest.mark.parametrize("value", [0, -1])
def test_present_numeric_values_must_be_positive(field: str, value: int) -> None:
    result = validate_transport_request(complete_request(**{field: value}), today=TODAY)

    assert result.status is RequestStatus.NEEDS_REVIEW
    assert any(issue.code == "value_must_be_positive" and issue.field == field for issue in result.issues)


def test_past_required_date_needs_review() -> None:
    result = validate_transport_request(complete_request(required_date=date(2026, 8, 27)), today=TODAY)

    assert result.status is RequestStatus.NEEDS_REVIEW
    assert any(issue.code == "required_date_in_past" for issue in result.issues)


def test_uncertain_required_field_needs_review() -> None:
    result = validate_transport_request(complete_request(), uncertain_fields=["origin"], today=TODAY)

    assert result.status is RequestStatus.NEEDS_REVIEW
    assert any(issue.code == "required_field_uncertain" and issue.field == "origin" for issue in result.issues)


def test_complete_request_is_ready_for_quote() -> None:
    result = validate_transport_request(complete_request(), today=TODAY)

    assert result.status is RequestStatus.READY_FOR_QUOTE
    assert result.issues == []


def test_missing_optional_fields_are_warnings_and_do_not_block() -> None:
    result = validate_transport_request(
        complete_request(weight_kg=None, volume_m3=None, pallet_count=None, vehicle_type=None), today=TODAY
    )

    assert result.status is RequestStatus.READY_FOR_QUOTE
    assert len(result.issues) == 4
    assert {issue.severity for issue in result.issues} == {IssueSeverity.WARNING}


def test_blank_required_text_is_treated_as_missing() -> None:
    result = validate_transport_request(complete_request(origin="  "), today=TODAY)

    assert result.status is RequestStatus.NEEDS_REVIEW
    assert any(issue.field == "origin" for issue in result.issues)
