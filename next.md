# Siguiente paso

## Para que sirve este archivo

Este es el primer punto de entrada para una sesion nueva. Resume que debe hacerse ahora y dirige a las fuentes necesarias. No sustituye a `PLAN.md`, que sigue siendo la fuente unica de verdad.

## Hacer ahora

Cerrar la **fase 5: demo** con un activo visual de portfolio:

- Ejecutar `POST /demo/seed` con PostgreSQL, API y frontend iniciados segun `README.md`.
- En navegador, grabar o capturar el recorrido: caso completo listo, caso incompleto con incidencia, correccion del destino y revalidacion a `ready_for_quote`.
- Enlazar la captura o video corto desde `README.md` y marcar la fase 5 como hecha en `PLAN.md`.

## Contexto puntual

1. Leer `AGENTS.md`: restricciones tecnicas, de producto y comandos locales.
2. Leer `PLAN.md`, secciones 8, 9, 10 y 11: entregable, casos, verificaciones y presentacion final.
3. Consultar `README.md` para levantar y verificar el entorno local.
4. Revisar `frontend/src/app/page.tsx`: la interfaz ya consume `POST /requests/process`, `GET /requests` y `PATCH /requests/{id}`; la URL de API se configura con `NEXT_PUBLIC_API_URL` (por defecto `http://127.0.0.1:8000`).

`POST /demo/seed` ya esta implementado, no llama al LLM y restablece los tres casos documentados. La verificacion local de API fue correcta, incluida la correccion y revalidacion; solo falta el activo visual manual. No ampliar el producto ni la infraestructura. La validacion determinista sigue siendo la autoridad del estado.
