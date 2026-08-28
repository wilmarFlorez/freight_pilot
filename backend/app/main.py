from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAIError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_session
from app.domain import (
    ProcessRequest,
    RequestStatus,
    TransportRequestCorrection,
    TransportRequestData,
)
from app.extraction import DEMO_REQUESTS, DEMO_SOURCE_TEXTS, extract_transport_request, normalize_extraction
from app.models import TransportRequest
from app.validation import validate_transport_request

app = FastAPI(title="Freight Pilot API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def serialize_request(request: TransportRequest) -> dict[str, Any]:
    return {
        "id": request.id,
        "source_text": request.source_text,
        "status": request.status,
        "customer_name": request.customer_name,
        "origin": request.origin,
        "destination": request.destination,
        "cargo_type": request.cargo_type,
        "weight_kg": request.weight_kg,
        "volume_m3": request.volume_m3,
        "pallet_count": request.pallet_count,
        "vehicle_type": request.vehicle_type,
        "required_date": request.required_date,
        "notes": request.notes,
        "uncertain_fields": request.uncertain_fields,
        "validation_issues": request.validation_issues,
        "extraction_snapshot": request.extraction_snapshot,
        "corrections_snapshot": request.corrections_snapshot,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }


def apply_data(request: TransportRequest, data: TransportRequestData) -> None:
    for field, value in data:
        setattr(request, field, value)


def apply_validation(request: TransportRequest, data: TransportRequestData) -> None:
    validation = validate_transport_request(data, request.uncertain_fields)
    request.status = validation.status
    request.validation_issues = [issue.model_dump(mode="json") for issue in validation.issues]


def get_request_or_404(request_id: int, session: Session) -> TransportRequest:
    request = session.get(TransportRequest, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada.")
    return request


@app.post("/requests/process", status_code=status.HTTP_201_CREATED)
def process_request(payload: ProcessRequest, session: Session = Depends(get_session)) -> dict[str, Any]:
    try:
        extraction = extract_transport_request(payload.source_text)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error
    except OpenAIError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="No se pudo extraer la solicitud.") from error

    request = TransportRequest(
        source_text=payload.source_text,
        uncertain_fields=extraction.uncertain_fields,
        extraction_snapshot=extraction.snapshot,
    )
    apply_data(request, extraction.data)
    apply_validation(request, extraction.data)
    session.add(request)
    session.commit()
    session.refresh(request)
    return serialize_request(request)


@app.post("/demo/seed", status_code=status.HTTP_201_CREATED)
def seed_demo_requests(session: Session = Depends(get_session)) -> list[dict[str, Any]]:
    """Create the documented demo cases without invoking the LLM."""
    requests: list[TransportRequest] = []
    for case, source_text in DEMO_SOURCE_TEXTS.items():
        extraction = normalize_extraction(DEMO_REQUESTS[case])
        request = session.scalar(
            select(TransportRequest).where(TransportRequest.source_text == source_text)
        )
        if request is None:
            request = TransportRequest(
                source_text=source_text,
            )
            session.add(request)
        apply_data(request, extraction.data)
        request.uncertain_fields = extraction.uncertain_fields
        request.extraction_snapshot = extraction.snapshot
        request.corrections_snapshot = None
        apply_validation(request, extraction.data)
        requests.append(request)

    session.commit()
    for request in requests:
        session.refresh(request)
    return [serialize_request(request) for request in requests]


@app.get("/requests")
def list_requests(
    request_status: RequestStatus | None = Query(default=None, alias="status"),
    session: Session = Depends(get_session),
) -> list[dict[str, Any]]:
    statement = select(TransportRequest).order_by(TransportRequest.created_at.desc())
    if request_status is not None:
        statement = statement.where(TransportRequest.status == request_status)
    return [serialize_request(request) for request in session.scalars(statement)]


@app.get("/requests/{request_id}")
def get_request(request_id: int, session: Session = Depends(get_session)) -> dict[str, Any]:
    return serialize_request(get_request_or_404(request_id, session))


@app.patch("/requests/{request_id}")
def correct_request(
    request_id: int,
    correction: TransportRequestCorrection,
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    request = get_request_or_404(request_id, session)
    corrected_fields = correction.model_fields_set
    if not corrected_fields:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="No se recibieron correcciones.")

    data = TransportRequestData.model_validate(
        {field: getattr(request, field) for field in TransportRequestData.model_fields}
    )
    merged_data = data.model_copy(update=correction.model_dump(exclude_unset=True))
    apply_data(request, merged_data)
    request.uncertain_fields = [field for field in request.uncertain_fields if field not in corrected_fields]
    request.corrections_snapshot = correction.model_dump(mode="json", exclude_unset=True)
    apply_validation(request, merged_data)
    session.commit()
    session.refresh(request)
    return serialize_request(request)
