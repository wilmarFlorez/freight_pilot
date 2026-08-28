# Siguiente paso

## Para que sirve este archivo

Este es el primer punto de entrada para una sesion nueva. Resume que debe hacerse ahora y dirige a las fuentes necesarias. No sustituye a `PLAN.md`, que sigue siendo la fuente unica de verdad.

## Hacer ahora

Completar la **fase 2: extraccion** en el backend antes de exponer endpoints de negocio o ampliar la interfaz:

- Crear un servicio de extraccion que use directamente el SDK del proveedor LLM y devuelva datos ajustados a `TransportRequestData`.
- Validar la salida del LLM con Pydantic, normalizar unidades y fechas cuando sea posible, y conservar la respuesta original para trazabilidad.
- Implementar casos simulados para desarrollo que permitan probar los textos completo, incompleto y ambiguo sin una clave LLM.
- Añadir pruebas unitarias para la normalizacion critica y los casos simulados.

## Contexto puntual

1. Leer `AGENTS.md`: restricciones tecnicas, de producto y comandos locales.
2. Leer `PLAN.md`, secciones 5, 6, 8, 9 y 10: arquitectura, modelo, reglas, entregable de fase, casos de demo y pruebas requeridas.
3. Revisar `backend/app/domain.py`, `backend/app/validation.py` y `backend/pyproject.toml`: contratos de dominio y dependencias actuales.
4. Consultar `README.md` solo para levantar y verificar el entorno local.

No crear endpoints de negocio ni pantallas nuevas hasta que la extraccion, normalizacion y sus pruebas unitarias esten terminadas. El LLM no puede decidir el estado final: la validacion determinista existente sigue siendo la autoridad.
