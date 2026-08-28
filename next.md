# Siguiente paso

## Para que sirve este archivo

Este es el primer punto de entrada para una sesion nueva. Resume que debe hacerse ahora y dirige a las fuentes necesarias. No sustituye a `PLAN.md`, que sigue siendo la fuente unica de verdad.

## Hacer ahora

Resolver el prerrequisito de la **fase 5: demo** y completar el cierre de portfolio:

- Implementar `POST /demo/seed`: la ruta esta definida en `PLAN.md`, pero no existe aun en `backend/app/main.py`. Debe crear datos reproducibles para los casos completo, incompleto y ambiguo, sin llamar al LLM.
- Cubrir la siembra con pruebas de API y actualizar el registro de progreso en `PLAN.md`.
- Levantar PostgreSQL, API y frontend segun `README.md` y ejecutar `POST /demo/seed`.
- Confirmar que el caso completo queda `ready_for_quote`, y que los casos incompleto y ambiguo quedan `needs_review` con motivos visibles.
- Corregir un caso pendiente desde la interfaz y confirmar su revalidacion a `ready_for_quote`.
- Añadir al README capturas o un video corto que muestre el flujo, sin ampliar el producto ni la infraestructura.

## Contexto puntual

1. Leer `AGENTS.md`: restricciones tecnicas, de producto y comandos locales.
2. Leer `PLAN.md`, secciones 8, 9, 10 y 11: entregable, casos, verificaciones y presentacion final.
3. Consultar `README.md` para levantar y verificar el entorno local.
4. Revisar `frontend/src/app/page.tsx`: la interfaz ya consume `POST /requests/process`, `GET /requests` y `PATCH /requests/{id}`; la URL de API se configura con `NEXT_PUBLIC_API_URL` (por defecto `http://127.0.0.1:8000`).

No ampliar el backend fuera de la ruta semilla ya planificada ni crear funcionalidades de TMS. El LLM no puede decidir el estado final: la validacion determinista existente sigue siendo la autoridad. La fase 4 esta completada: lint, build y 25 pruebas de backend correctas; queda la verificacion manual visual con los servicios levantados.
