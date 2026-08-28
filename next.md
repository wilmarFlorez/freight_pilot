# Siguiente paso

## Para que sirve este archivo

Este es el primer punto de entrada para una sesion nueva. Resume que debe hacerse ahora y dirige a las fuentes necesarias. No sustituye a `PLAN.md`, que sigue siendo la fuente unica de verdad.

## Hacer ahora

Completar la **fase 4: interfaz** en `frontend/` usando la API ya disponible:

- Crear una pantalla de entrada para pegar texto y enviarlo a `POST /requests/process`.
- Crear una bandeja que consulte `GET /requests`, permita filtrar por estado y abra el detalle de una solicitud.
- Crear una pantalla de detalle que muestre texto original, extraccion, incertidumbres, incidencias y correcciones humanas mediante `PATCH /requests/{id}`.
- Mantener visibles los estados `needs_review` y `ready_for_quote` y la trazabilidad que devuelve la API.
- Verificar el recorrido visual en escritorio y movil sin añadir funcionalidades fuera del alcance.

## Contexto puntual

1. Leer `AGENTS.md`: restricciones tecnicas, de producto y comandos locales.
2. Leer `PLAN.md`, secciones 5, 6, 8, 9 y 10: arquitectura, modelo, reglas, entregable de fase, casos de demo y pruebas requeridas.
3. Revisar `backend/app/main.py` y `backend/app/domain.py`: contratos, rutas y respuestas disponibles.
4. Revisar la estructura y estilos existentes en `frontend/` antes de crear componentes.
5. Consultar `README.md` solo para levantar y verificar el entorno local.

No ampliar el backend ni crear funcionalidades de TMS. El LLM no puede decidir el estado final: la validacion determinista existente sigue siendo la autoridad.
