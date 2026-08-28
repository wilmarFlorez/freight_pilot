# Siguiente paso

## Para que sirve este archivo

Este es el primer punto de entrada para una sesion nueva. Resume que debe hacerse ahora y dirige a las fuentes necesarias. No sustituye a `PLAN.md`, que sigue siendo la fuente unica de verdad.

## Estado actual

Las fases 0 a 5 estan completadas. Las capturas del recorrido estan en `docs/assets/` y enlazadas desde `README.md`:

- `demo-inbox.png`: bandeja con un caso listo y dos para revisar.
- `demo-review-before.png`: destino obligatorio ausente en Maderas Roble.
- `demo-review-after.png`: correccion persistida y estado `ready_for_quote`.

## Contexto puntual

1. Leer `AGENTS.md`: restricciones tecnicas, de producto y comandos locales.
2. Leer `PLAN.md`: alcance, decisiones y registro de progreso.
3. Consultar `README.md` para levantar la demo y ver las capturas.

`POST /demo/seed` no llama al LLM y restablece los tres casos documentados. La correccion de destino de Maderas Roble se verifico localmente: quedo persistida y fue revalidada como `ready_for_quote`. No ampliar el producto ni la infraestructura. La validacion determinista sigue siendo la autoridad del estado.
