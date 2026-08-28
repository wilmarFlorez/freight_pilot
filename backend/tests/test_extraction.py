from datetime import date

import pytest

from app.domain import RequestStatus
from app.extraction import LLMExtraction, RawTransportRequestData, normalize_extraction, simulated_extraction
from app.validation import validate_transport_request


def test_normalizes_weight_volume_pallets_and_iso_date() -> None:
    result = normalize_extraction(
        LLMExtraction(
            data=RawTransportRequestData(
                weight_kg="2 t",
                volume_m3="500 l",
                pallet_count="4 palets",
                required_date="2027-09-15",
            )
        )
    )

    assert result.data.weight_kg == 2000
    assert result.data.volume_m3 == 0.5
    assert result.data.pallet_count == 4
    assert result.data.required_date == date(2027, 9, 15)
    assert result.snapshot["data"]["weight_kg"] == "2 t"


@pytest.mark.parametrize("value", ["sin determinar", "25 stones"])
def test_unknown_measure_is_not_normalized(value: str) -> None:
    result = normalize_extraction(LLMExtraction(data=RawTransportRequestData(weight_kg=value)))

    assert result.data.weight_kg is None


def test_complete_simulated_case_is_ready_for_quote() -> None:
    result = simulated_extraction("Caso completo para desarrollo")
    validation = validate_transport_request(result.data, result.uncertain_fields, today=date(2026, 8, 28))

    assert validation.status is RequestStatus.READY_FOR_QUOTE
    assert result.data.weight_kg == 1200


def test_incomplete_simulated_case_requires_review() -> None:
    result = simulated_extraction("Caso incompleto para desarrollo")
    validation = validate_transport_request(result.data, result.uncertain_fields, today=date(2026, 8, 28))

    assert validation.status is RequestStatus.NEEDS_REVIEW
    assert any(issue.field == "destination" for issue in validation.issues)


def test_ambiguous_simulated_case_preserves_uncertainty() -> None:
    result = simulated_extraction("Caso ambiguo para desarrollo")
    validation = validate_transport_request(result.data, result.uncertain_fields, today=date(2026, 8, 28))

    assert result.uncertain_fields == ["required_date", "weight_kg"]
    assert validation.status is RequestStatus.NEEDS_REVIEW
    assert any(issue.code == "required_field_uncertain" and issue.field == "required_date" for issue in validation.issues)


def test_unknown_simulated_case_is_rejected() -> None:
    with pytest.raises(ValueError, match="No hay un caso simulado"):
        simulated_extraction("Texto que no pertenece a una demostracion")
