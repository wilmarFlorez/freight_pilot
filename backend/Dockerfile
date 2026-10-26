FROM ghcr.io/astral-sh/uv:0.8.15 AS uv

FROM python:3.12-slim

COPY --from=uv /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev

RUN addgroup --system --gid 10001 freightpilot \
    && adduser --system --uid 10001 --ingroup freightpilot freightpilot

COPY --chown=freightpilot:freightpilot . .

USER freightpilot

EXPOSE 8000

CMD ["sh", "-ec", "uv run --no-sync alembic -c alembic.ini upgrade head && exec uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port 8000"]
