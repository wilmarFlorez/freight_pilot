# Freight Pilot

Demo de portfolio para convertir solicitudes de transporte terrestre no estructuradas en solicitudes listas para cotizacion, combinando extraccion LLM, reglas deterministas y revision humana.

El alcance y las decisiones del proyecto estan en [PLAN.md](PLAN.md).

## Requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)
- Node.js 22+
- Docker Compose

## Arranque local

1. Crear el archivo de entorno: `cp .env.example .env`.
2. Iniciar PostgreSQL: `docker compose up -d postgres`.
3. Instalar dependencias del backend: `uv sync --project backend`.
4. Instalar dependencias del frontend: `npm install --prefix frontend`.
5. Aplicar la migracion: `uv run --directory backend alembic -c alembic.ini upgrade head`.
6. Iniciar la API en una terminal: `uv run --directory backend uvicorn app.main:app --reload`.
7. Iniciar el frontend en otra terminal: `npm run dev --prefix frontend`.

La API queda disponible en `http://127.0.0.1:8000`; comprobarla con `http://127.0.0.1:8000/health`. El frontend queda disponible en `http://localhost:3000`.

## Verificacion de la base inicial

- Backend: `uv run --directory backend python -c "from app.main import app; assert app.title == 'Freight Pilot API'"`
- Dominio: `uv run --directory backend pytest`
- Frontend: `npm run build --prefix frontend`
- Base de datos: `docker compose exec postgres pg_isready -U freight_pilot -d freight_pilot`
