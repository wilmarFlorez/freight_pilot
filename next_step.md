# Siguiente paso

## Para que sirve este archivo

Este es el primer punto de entrada para una sesion nueva. Resume que debe hacerse ahora y dirige a las fuentes necesarias. No sustituye a `PLAN.md`, que sigue siendo la fuente unica de verdad.

## Hacer ahora

Completar la **fase 1: dominio** en el backend antes de integrar el LLM o ampliar la interfaz:

- Definir esquemas Pydantic de solicitud, incidencias y estados.
- Crear el modelo SQLAlchemy y la migracion inicial para `transport_requests`.
- Implementar y probar las reglas deterministas de validacion.

## Contexto puntual

1. Leer `AGENTS.md`: restricciones tecnicas, de producto y comandos locales.
2. Leer `PLAN.md`, secciones 5, 6, 8 y 10: arquitectura, modelo, reglas, entregable de fase y pruebas requeridas.
3. Revisar `backend/app/main.py` y `backend/pyproject.toml`: punto de entrada y dependencias actuales.
4. Consultar `README.md` solo para levantar y verificar el entorno local.

No crear la integracion LLM, endpoints de negocio ni pantallas nuevas hasta que las reglas de dominio tengan pruebas unitarias.
