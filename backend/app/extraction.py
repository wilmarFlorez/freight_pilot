import os
import re
from datetime import date
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, ConfigDict

from app.domain import TransportRequestData


class RawTransportRequestData(BaseModel):
    """LLM output before values are converted to the domain's canonical units."""

    model_config = ConfigDict(extra="forbid")

    customer_name: str | None = None
    origin: str | None = None
    destination: str | None = None
    cargo_type: str | None = None
    weight_kg: float | str | None = None
    volume_m3: float | str | None = None
    pallet_count: int | str | None = None
    vehicle_type: str | None = None
    required_date: date | str | None = None
    notes: str | None = None


class LLMExtraction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    data: RawTransportRequestData
    uncertain_fields: list[str] = []


class ExtractionResult(BaseModel):
    data: TransportRequestData
    uncertain_fields: list[str]
    snapshot: dict[str, Any]


DEMO_REQUESTS: dict[str, LLMExtraction] = {
    "completo": LLMExtraction(
        data=RawTransportRequestData(
            customer_name="Alimentos Sierra",
            origin="Mercamadrid, Madrid",
            destination="Poligono Fuente del Jarro, Paterna",
            cargo_type="Conservas en palets",
            weight_kg="1,200 kg",
            volume_m3="8,5 m3",
            pallet_count="4 palets",
            vehicle_type="Lona",
            required_date="2027-09-15",
            notes="Descarga entre las 09:00 y las 12:00.",
        )
    ),
    "incompleto": LLMExtraction(
        data=RawTransportRequestData(
            customer_name="Maderas Roble",
            origin="Valladolid",
            cargo_type="Tableros de madera",
            weight_kg="2 t",
            required_date="2027-09-18",
            notes="Confirmar destino con el cliente.",
        )
    ),
    "ambiguo": LLMExtraction(
        data=RawTransportRequestData(
            customer_name="Bodegas del Norte",
            origin="Logrono",
            destination="Barcelona",
            cargo_type="Vino embotellado",
            weight_kg="1.200 kg",
            pallet_count="6",
            notes="Entrega el proximo viernes; el cliente tambien menciona 900 kg.",
        ),
        uncertain_fields=["required_date", "weight_kg"],
    ),
}


def normalize_extraction(extraction: LLMExtraction) -> ExtractionResult:
    raw_data = extraction.data
    data = TransportRequestData(
        customer_name=raw_data.customer_name,
        origin=raw_data.origin,
        destination=raw_data.destination,
        cargo_type=raw_data.cargo_type,
        weight_kg=_normalize_measure(raw_data.weight_kg, {"kg": 1, "g": 0.001, "t": 1000, "lb": 0.45359237}),
        volume_m3=_normalize_measure(raw_data.volume_m3, {"m3": 1, "l": 0.001}),
        pallet_count=_normalize_pallet_count(raw_data.pallet_count),
        vehicle_type=raw_data.vehicle_type,
        required_date=_normalize_date(raw_data.required_date),
        notes=raw_data.notes,
    )
    return ExtractionResult(
        data=data,
        uncertain_fields=extraction.uncertain_fields,
        snapshot=extraction.model_dump(mode="json"),
    )


def extract_transport_request(source_text: str, client: OpenAI | None = None) -> ExtractionResult:
    """Extract structured data, using deterministic examples when no API key is configured."""
    if not os.getenv("OPENAI_API_KEY"):
        return simulated_extraction(source_text)

    completion = (client or OpenAI()).beta.chat.completions.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {
                "role": "system",
                "content": (
                    "Extrae solicitudes de transporte terrestre en espanol. "
                    "No infieras datos ausentes. Usa kg para peso y m3 para volumen cuando sea posible; "
                    "si conservas otra unidad, incluyela en el valor. Marca en uncertain_fields los campos "
                    "ambiguos, contradictorios o relativos que no puedan convertirse a una fecha ISO exacta."
                ),
            },
            {"role": "user", "content": source_text},
        ],
        response_format=LLMExtraction,
    )
    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("El LLM no devolvio una extraccion estructurada.")
    return normalize_extraction(parsed)


def simulated_extraction(source_text: str) -> ExtractionResult:
    """Return a development extraction for one of the three documented demo cases."""
    normalized_text = source_text.casefold()
    for case in ("incompleto", "ambiguo", "completo"):
        if case in normalized_text:
            return normalize_extraction(DEMO_REQUESTS[case])
    raise ValueError("No hay un caso simulado para este texto.")


def _normalize_measure(value: float | str | None, units: dict[str, float]) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)

    match = re.fullmatch(r"\s*([0-9][0-9.,]*)\s*([a-zA-Z³]+)?\s*", value.casefold())
    if not match:
        return None
    number = _parse_number(match.group(1))
    if number is None:
        return None
    unit = (match.group(2) or "").replace("³", "3")
    unit = {"kilo": "kg", "kilos": "kg", "kilogramo": "kg", "kilogramos": "kg", "tonelada": "t", "toneladas": "t", "litro": "l", "litros": "l", "m³": "m3"}.get(unit, unit)
    return number * units[unit] if unit in units else None


def _normalize_pallet_count(value: int | str | None) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    match = re.match(r"\s*(-?\d+)", value)
    return int(match.group(1)) if match else None


def _normalize_date(value: date | str | None) -> date | None:
    if value is None or isinstance(value, date):
        return value
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        return None


def _parse_number(value: str) -> float | None:
    if value.count(",") == 1 and value.count(".") == 0:
        integer, decimal = value.split(",")
        value = f"{integer}.{decimal}" if len(decimal) != 3 else f"{integer}{decimal}"
    elif value.count(",") == 1 and value.count(".") == 1:
        value = value.replace(".", "").replace(",", ".")
    elif value.count(".") == 1 and len(value.rsplit(".", 1)[1]) == 3:
        value = value.replace(".", "")
    try:
        return float(value)
    except ValueError:
        return None
