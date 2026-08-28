# Freight Pilot

## Source of truth

- Start a new session with `next_step.md` for the immediate task and its required context.
- Read `PLAN.md` before changing the project. It is the authoritative scope, architecture, decision log, and progress record.
- Update `PLAN.md` when completing work, making an architecture or scope decision, or encountering a blocker.

## Product boundary

- This is a portfolio demo for processing unstructured road-freight requests, not a commercial TMS or SaaS.
- The required flow is: LLM extraction -> deterministic validation -> human review when needed -> structured request ready for quotation.
- Do not add authentication, multi-tenancy, real channel integrations, pricing, routing, vehicle assignment, background jobs, queues, microservices, or deployment infrastructure beyond the plan.

## Implementation constraints

- Keep one FastAPI backend, one Next.js frontend, and PostgreSQL. Use the LLM provider SDK directly; do not introduce LangChain or LangGraph for the single extraction call.
- Validate LLM output with Pydantic, normalize it, and apply business rules in Python. The LLM must not set the final request status by itself.
- Preserve source text, extraction output, uncertainty, validation issues, and human corrections so the UI can show traceability.
- Use only `needs_review` and `ready_for_quote` as request states unless `PLAN.md` is deliberately revised first.

## Current repository state

- The backend entrypoint is `backend/app/main.py`; run its commands with `uv run --directory backend ...`, not `uv run --project backend ...`, so `app` is importable.
- The frontend is in `frontend/`; use `npm run <script> --prefix frontend` from the repository root.
- PostgreSQL runs through `compose.yaml` and is published on host port `55432` by default. Copy `.env.example` to `.env` before changing local values.
- Exact local start and verification commands are maintained in `README.md`.
