from collections.abc import Generator
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_session
from app.extraction import ExtractionResult
from app.domain import TransportRequestData
from app.main import app
import app.main as main


def test_processes_and_persists_validated_extraction(monkeypatch) -> None:
    client, session = api_client()
    extraction = ExtractionResult(
        data=TransportRequestData(
            customer_name="Alimentos Sierra",
            origin="Madrid",
            destination="Valencia",
            required_date=date(2027, 9, 15),
        ),
        uncertain_fields=[],
        snapshot={"provider": "simulated"},
    )
    monkeypatch.setattr(main, "extract_transport_request", lambda _: extraction)

    response = client.post("/requests/process", json={"source_text": "Solicitud de prueba"})

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "ready_for_quote"
    assert body["extraction_snapshot"] == {"provider": "simulated"}
    assert body["validation_issues"]
    assert session.get(main.TransportRequest, body["id"]).source_text == "Solicitud de prueba"


def test_correction_revalidates_and_clears_corrected_uncertainty(monkeypatch) -> None:
    client, _ = api_client()
    extraction = ExtractionResult(
        data=TransportRequestData(
            customer_name="Maderas Roble",
            origin="Valladolid",
            destination=None,
            required_date=date(2027, 9, 15),
        ),
        uncertain_fields=["destination"],
        snapshot={"provider": "simulated"},
    )
    monkeypatch.setattr(main, "extract_transport_request", lambda _: extraction)

    created = client.post("/requests/process", json={"source_text": "Solicitud incompleta"}).json()
    response = client.patch(f"/requests/{created['id']}", json={"destination": "Valencia"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready_for_quote"
    assert body["uncertain_fields"] == []
    assert body["corrections_snapshot"] == {"destination": "Valencia"}


def test_extraction_error_does_not_persist_request(monkeypatch) -> None:
    client, session = api_client()
    monkeypatch.setattr(main, "extract_transport_request", lambda _: (_ for _ in ()).throw(ValueError("Extraccion invalida")))

    response = client.post("/requests/process", json={"source_text": "Solicitud no procesable"})

    assert response.status_code == 422
    assert session.query(main.TransportRequest).count() == 0


def api_client() -> tuple[TestClient, Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()

    def override_session() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_session] = override_session
    return TestClient(app), session
