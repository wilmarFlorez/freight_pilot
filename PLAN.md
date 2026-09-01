# Freight Pilot: Scope y Plan de Ejecucion

> **Fuente unica de verdad.** Este documento define el alcance, las decisiones y el progreso del proyecto. Toda decision nueva, cambio de alcance, bloqueo o tarea terminada debe actualizarse aqui. Si otro documento lo contradice, prevalece este.

**Estado:** en desarrollo (fases 0 a 4 completadas)
**Ultima actualizacion:** 2026-08-28  
**Objetivo de entrega:** demo funcional de portfolio en pocos dias

## 1. Proposito

Construir una demostracion funcional de una herramienta interna para una empresa de transporte terrestre. La herramienta convierte solicitudes de transporte no estructuradas en solicitudes estructuradas y preparadas para cotizacion.

La demostracion debe probar estas capacidades:

- Extraccion de datos con IA desde texto libre.
- Validacion determinista mediante reglas de negocio.
- Intervencion humana explicita cuando faltan datos o hay incertidumbre.
- Persistencia y consulta de la solicitud estructurada.
- Una interfaz operativa sencilla para procesar y revisar solicitudes.

El mensaje para un cliente o reclutador es: **la IA interpreta; las reglas controlan; el operador decide las excepciones.**

## 2. Usuario y flujo demostrado

**Usuario:** operador de trafico o cotizaciones que recibe una peticion de transporte.

**Flujo MVP:**

1. El operador pega una solicitud no estructurada en una pantalla.
2. El backend guarda el texto original y llama al LLM para extraer un objeto estructurado.
3. El backend normaliza los valores y aplica reglas de negocio deterministas.
4. Si la informacion obligatoria esta completa y no hay incertidumbre relevante, la solicitud queda `ready_for_quote`.
5. Si faltan datos, son invalidos o la extraccion es incierta, queda `needs_review` con motivos concretos.
6. El operador revisa y corrige los campos en la interfaz.
7. El sistema vuelve a validar y guarda el resultado final como preparado para cotizacion.

No se crea una cotizacion ni se asigna un vehiculo. El limite del proyecto es preparar informacion fiable para ese proceso posterior.

## 3. Alcance del MVP

### Incluido

- Una unica organizacion ficticia y un unico rol de operador, sin autenticacion.
- Entrada manual de texto libre que representa email, formulario o mensaje.
- Extraccion LLM de cliente, origen, destino, mercancia, peso, volumen, pallets, vehiculo, fecha requerida y observaciones.
- Modelo de salida estructurado validado con Pydantic.
- Indicador de confianza por campo o listado de campos inciertos proporcionado por el LLM.
- Normalizacion minima: unidades de peso a kg, volumen a m3, pallets a entero y fecha ISO cuando sea posible.
- Reglas para campos obligatorios, valores numericos positivos y fecha requerida no pasada.
- Bandeja de solicitudes con estados `needs_review` y `ready_for_quote`.
- Pantalla de detalle para comparar texto original, extraccion, problemas de validacion y correccion humana.
- Persistencia local en PostgreSQL.
- Datos de demostracion con al menos tres casos: completo, incompleto y ambiguo.

### Excluido explicitamente

- Autenticacion, autorizacion, usuarios, multiempresa o multitenancy.
- Recepcion real de email, WhatsApp u otros canales; el pegado de texto los simula.
- Integraciones con TMS, CRM, proveedores, mapas o calculo de rutas.
- Motor de precios, cotizacion, asignacion de vehiculos o seguimiento de envios.
- Cargas de archivos, OCR y procesamiento de adjuntos.
- Notificaciones, trabajos en segundo plano, colas, webhooks o event bus.
- Microservicios, contenedores de produccion, Kubernetes, CI/CD complejo u observabilidad enterprise.
- LangChain o LangGraph salvo que una necesidad demostrable no pueda resolverse con el SDK del proveedor LLM y Pydantic. Para este MVP no se necesitan.

### Regla de control de alcance

Una propuesta se acepta solo si mejora directamente la demostracion del flujo de la seccion 2 y puede completarse dentro del plazo. En caso contrario se registra como "fuera de alcance" y no se implementa.

La alternativa simple ante una nueva integracion es usar texto de ejemplo, datos semilla o un boton de carga de caso de demo. La alternativa simple ante automatizacion adicional es una accion manual del operador.

## 4. Criterios de exito

La entrega se considera completa cuando:

- Se pueden procesar los tres casos de demostracion de principio a fin.
- El resultado LLM nunca se usa sin pasar por validacion de esquema y reglas de negocio.
- Un caso completo termina en `ready_for_quote`.
- Los casos incompleto y ambiguo terminan en `needs_review` y muestran razones accionables.
- Tras corregir los datos faltantes, un operador puede volver a validar y cambiar el estado a `ready_for_quote`.
- La interfaz deja visible la trazabilidad: texto original, datos extraidos, problemas y datos corregidos.
- El proyecto se ejecuta localmente con instrucciones breves y no depende de infraestructura externa salvo la API LLM elegida.

## 5. Arquitectura minima

**Propuesta:** monolito local con frontend y API separados por claridad de portfolio.

| Capa | Eleccion | Responsabilidad |
| --- | --- | --- |
| Frontend | Next.js + React | Entrada, bandeja y revision operativa |
| API | FastAPI | Orquesta el flujo y expone endpoints HTTP |
| Dominio | Python + Pydantic | Esquema, normalizacion y reglas de negocio |
| Persistencia | PostgreSQL + SQLAlchemy | Solicitudes, extracciones, validaciones y correcciones |
| IA | SDK directo de un proveedor LLM | Extrae JSON ajustado a un esquema |

**Principios obligatorios:**

- Una sola aplicacion backend; no microservicios.
- Una sola base de datos PostgreSQL; no cache, cola ni almacenamiento adicional.
- Llamada LLM sin agente autonomo, memoria ni grafo. Es una extraccion puntual con salida estructurada.
- Las reglas de negocio viven en codigo Python testeable, no en el prompt.
- El LLM puede sugerir datos y declarar incertidumbre; no puede decidir por si solo el estado final.
- La clave de API vive en variables de entorno y nunca en el repositorio.

## 6. Modelo y reglas

### Entidad principal: `transport_requests`

- `id`
- `source_text`
- `status`: `needs_review` o `ready_for_quote`
- `customer_name`
- `origin`
- `destination`
- `cargo_type`
- `weight_kg`
- `volume_m3`
- `pallet_count`
- `vehicle_type`
- `required_date`
- `notes`
- `uncertain_fields` (lista)
- `validation_issues` (lista de codigos y mensajes)
- `extraction_snapshot` (JSON de respuesta LLM, para trazabilidad)
- `created_at`, `updated_at`

No hace falta normalizar clientes, ubicaciones, vehiculos o mercancias en tablas independientes: no hay una necesidad de reutilizacion ni gestion de catalogos en la demo.

### Reglas iniciales

| Regla | Resultado |
| --- | --- |
| Faltan cliente, origen, destino o fecha requerida | `needs_review` |
| Peso, volumen o pallets estan presentes y no son positivos | `needs_review` |
| Fecha requerida anterior al dia actual | `needs_review` |
| El LLM marca incierto un campo obligatorio | `needs_review` |
| No hay incidencias | `ready_for_quote` |

Peso, volumen, pallets y tipo de vehiculo son opcionales para no bloquear solicitudes plausibles de ejemplo. Si estan ausentes, se muestra una recomendacion al operador, pero no se impide preparar la solicitud para cotizacion. Esta es una simplificacion consciente del dominio, no una validacion de factibilidad de transporte.

## 7. API minima

| Metodo y ruta | Uso |
| --- | --- |
| `POST /requests/process` | Guarda texto, ejecuta extraccion, valida y devuelve la solicitud |
| `GET /requests` | Lista solicitudes, con filtro opcional por estado |
| `GET /requests/{id}` | Muestra detalle y trazabilidad |
| `PATCH /requests/{id}` | Guarda correcciones humanas, revalida y recalcula estado |
| `POST /demo/seed` | Crea los tres casos de demostracion; solo para desarrollo/demo |

## 8. Plan de ejecucion

El orden evita construir interfaz o integraciones antes de probar el flujo de valor.

| Fase | Entregable verificable | Estado |
| --- | --- | --- |
| 0. Base | Estructura de proyecto, variables de entorno, PostgreSQL local e instrucciones de arranque | Hecho |
| 1. Dominio | Esquemas Pydantic, modelo SQLAlchemy, migracion inicial y reglas unitarias | Hecho |
| 2. Extraccion | Servicio LLM con salida estructurada, normalizacion y casos simulados para desarrollo | Hecho |
| 3. API | Endpoints del flujo, persistencia y gestion de errores de LLM | Hecho |
| 4. Interfaz | Formulario de entrada, bandeja y pantalla de revision/correccion | Hecho |
| 5. Demo | Casos semilla, recorrido manual, README visual y capturas o video corto | Hecho |

### Secuencia diaria sugerida

1. Completar fases 0 y 1 antes de llamar al LLM.
2. Completar fase 2 con pruebas contra textos de ejemplo antes de construir el frontend.
3. Completar fase 3 y verificar el flujo con HTTP.
4. Completar fase 4 sin ampliar funcionalidades.
5. Completar fase 5 y pulir la narrativa de portfolio, no la infraestructura.

## 9. Casos de demostracion

| Caso | Entrada esperada | Resultado esperado |
| --- | --- | --- |
| Completo | Cliente, ruta y fecha claros; datos de carga opcionales incluidos | `ready_for_quote` |
| Incompleto | Falta destino o fecha requerida | `needs_review` con el campo faltante |
| Ambiguo | Fecha como "el proximo viernes" o peso contradictorio | `needs_review` con incertidumbre visible |

Los textos deben estar en espanol y parecer comunicaciones reales de operaciones, no formularios disfrazados.

## 10. Pruebas y verificacion

- Pruebas unitarias para cada regla de negocio y normalizacion critica.
- Pruebas de API para creacion/proceso y correccion/revalidacion, usando una respuesta LLM simulada.
- Prueba manual con API LLM real para los tres casos de demostracion.
- Verificacion visual manual en escritorio y movil para las tres pantallas del MVP.

No se busca una bateria exhaustiva ni pruebas de carga. La calidad exigida es que el recorrido presentado sea reproducible, claro y no oculte los limites de la IA.

## 11. Presentacion de portfolio y despliegue

La pieza final se presentara como una aplicacion web desplegada, no solo como codigo o una captura. Debe permitir que un cliente vea el flujo sin instalar nada.

### Entrega visible

- **Frontend desplegado:** interfaz Next.js con el formulario de solicitud, la bandeja y la pantalla de revision.
- **Backend desplegado:** API FastAPI consumida por el frontend; no se expone como producto independiente, pero puede enlazarse su documentacion OpenAPI como evidencia tecnica.
- **Base de datos persistente:** PostgreSQL para conservar las solicitudes procesadas durante la demostracion.
- **Repositorio publico:** README conciso con problema, arquitectura, flujo, decisiones de alcance, instrucciones locales y capturas.
- **Video corto (2-3 minutos):** muestra un caso completo, uno bloqueado por validacion y su correccion humana. Es el activo principal para Upwork cuando no se quiera dar acceso en vivo.

### Recorrido de demostracion

1. Abrir la URL de la aplicacion y cargar un caso de demo o pegar una solicitud realista.
2. Mostrar el texto original y la extraccion de IA estructurada.
3. Señalar las reglas aplicadas y el estado resultante.
4. Abrir un caso en `needs_review`, corregir un dato y volver a validar.
5. Mostrar que termina en `ready_for_quote` y que queda guardado en la bandeja.

### Despliegue minimo recomendado

| Componente | Opcion simple | Alternativa |
| --- | --- | --- |
| Frontend Next.js | Vercel | Render Static Site |
| API FastAPI | Render Web Service | Railway |
| PostgreSQL | Render Postgres | Neon |

Elegir un proveedor por capa y sus planes gratuitos o de bajo coste; no usar Docker, Kubernetes, Terraform, CDN, colas ni servicios cloud adicionales para este portfolio. Si se necesita reducir aun mas el tiempo, Render puede alojar API y PostgreSQL, y Vercel el frontend.

### Consideraciones de demo

- Proteger la ruta de siembra de datos o eliminarla fuera de una demo controlada.
- Limitar el endpoint de extraccion para evitar consumo no controlado de la API LLM si la URL queda publica.
- Incluir casos preprocesados como alternativa si la clave LLM no esta configurada o se alcanza un limite de coste.
- No se requiere login: la URL es una demo de una herramienta interna ficticia.

## 12. Decision log

| Fecha | Decision | Motivo |
| --- | --- | --- |
| 2026-08-28 | Usar un monolito FastAPI + Next.js + PostgreSQL | Es suficiente para demostrar backend, API, IA y herramienta interna sin infraestructura adicional. |
| 2026-08-28 | Usar SDK LLM directo en lugar de LangChain/LangGraph | La necesidad es una extraccion unica, no un workflow de agentes. Reduce dependencias y complejidad. |
| 2026-08-28 | Simular canales mediante texto pegado | Demuestra el problema sin integrar email o mensajeria. |
| 2026-08-28 | Mostrar escenarios de integracion sin implementarlos | La interfaz ilustra flujos fuente -> extraccion y validacion -> CRM, TMS o ERP, manteniendo el MVP sin integraciones reales. |
| 2026-08-28 | Limitar la salida a preparacion para cotizacion | Evita convertir la demo en un TMS o motor de precios. |
| 2026-08-28 | Presentar como aplicacion web desplegada con video corto | Permite una demo directa y una prueba reutilizable para perfiles y propuestas de Upwork. |
| 2026-08-28 | Usar `uv` para el backend y Docker Compose solo para PostgreSQL local | Define una base reproducible sin añadir herramientas de orquestacion o infraestructura de despliegue. |

## 13. Registro de progreso

Actualizar esta tabla al iniciar y terminar cada tarea. Usar estados `Pendiente`, `En curso`, `Hecho` o `Bloqueado`.

| Fecha | Tarea | Estado | Evidencia / nota |
| --- | --- | --- | --- |
| 2026-08-28 | Definir alcance y plan de ejecucion | Hecho | Este documento creado como fuente unica de verdad. |
| 2026-08-28 | Definir estrategia de presentacion y despliegue | Hecho | Aplicacion web desplegada, repositorio publico y video de demostracion. |
| 2026-08-28 | Crear instrucciones para agentes | Hecho | `AGENTS.md` recoge los limites y decisiones operativas verificadas. |
| 2026-08-28 | Completar fase 0: base del proyecto | Hecho | FastAPI, Next.js, Compose/PostgreSQL, variables de entorno y README verificados localmente. |
| 2026-08-28 | Crear punto de reentrada para nuevas sesiones | Hecho | `next_step.md` resume el trabajo inmediato y las fuentes de contexto. |
| 2026-08-28 | Completar fase 1: dominio | Hecho | Esquemas Pydantic, modelo SQLAlchemy, migracion Alembic inicial y 15 pruebas unitarias de validacion. |
| 2026-08-28 | Completar fase 2: extraccion | Hecho | Servicio OpenAI directo, normalizacion de unidades y fechas, y tres casos simulados cubiertos por pruebas unitarias. |
| 2026-08-28 | Completar fase 3: API | Hecho | Endpoints de proceso, consulta y correccion con persistencia, revalidacion determinista y 3 pruebas de API. |
| 2026-08-28 | Completar fase 4: interfaz | Hecho | Pantalla responsive de entrada, bandeja filtrable, detalle trazable y correccion parcial con revalidacion. `npm run lint --prefix frontend`, `npm run build --prefix frontend` y 25 pruebas de backend correctas. |
| 2026-08-28 | Implementar y probar `POST /demo/seed` | Hecho | Siembra idempotente de los casos completo, incompleto y ambiguo sin LLM; una prueba de API los cubre. |
| 2026-08-28 | Verificar recorrido de demo local | Hecho | PostgreSQL, API y frontend iniciados; la siembra dejo un caso listo y dos pendientes con incidencias visibles. La correccion del destino del caso incompleto lo revalido como `ready_for_quote`. |
| 2026-08-28 | Corregir persistencia y normalizacion detectadas en la demo | Hecho | El enum de SQLAlchemy persiste los valores PostgreSQL y `m3` se normaliza como volumen. 26 pruebas de backend y lint de frontend correctos. |
| 2026-08-28 | Crear capturas de portfolio y cerrar fase 5 | Hecho | Tres capturas en `docs/assets/` muestran bandeja, incidencia de destino y revalidacion; estan enlazadas desde el README. |
| 2026-08-28 | Cargar configuracion local del backend desde `.env` | Hecho | La clave de OpenAI y la URL de PostgreSQL se cargan al iniciar; README aclara que no se requiere `frontend/.env.local`. |
| 2026-08-28 | Mejorar la explicacion de la demo en la pantalla inicial | Hecho | La interfaz explica el problema, el flujo de tres pasos y permite cargar casos de ejemplo desde la propia pagina. |
| 2026-08-28 | Sustituir las acciones de la introduccion por un ejemplo copiable | Hecho | La pantalla muestra un mensaje de cliente en cursiva como caso de uso y un icono para copiarlo antes de probarlo. |
| 2026-08-28 | Aclarar el termino palets para visitantes no especializados | Hecho | El ejemplo, el placeholder y el campo usan “plataformas de carga (palets)”. |
| 2026-08-28 | Reordenar la entrada de nueva solicitud | Hecho | El formulario ahora usa una composición vertical y sitúa el caso de uso entre su explicación y el área de texto. |
| 2026-08-28 | Ilustrar integraciones habituales en Colombia | Hecho | Al final de la pantalla, la demo presenta flujos visuales desde WhatsApp Business, Gmail/Microsoft 365 y Excel/Google Sheets hacia CRM, TMS o ERP, sin ampliar el alcance funcional. |
| 2026-08-28 | Añadir version bilingue del frontend | Hecho | Selector persistente ES/EN, interfaz traducida y atributo de idioma del documento actualizado dinamicamente. |
| 2026-08-28 | Mejorar el copiado del caso de uso | Hecho | Se sustituyo el SVG defectuoso por iconos Lucide y el boton confirma visualmente el copiado durante 2.5 segundos. `npm run lint --prefix frontend` y `npm run build --prefix frontend` correctos. |
| 2026-08-28 | Reforzar la jerarquia visual con iconos operativos | Hecho | Los iconos Lucide distinguen las etapas de captura, extraccion y validacion, la bandeja, la trazabilidad y los flujos de integracion sin reemplazar texto. `npm run lint --prefix frontend` y `npm run build --prefix frontend` correctos. |
| 2026-08-28 | Adoptar paleta de despacho logistico | Hecho | El frontend usa azul noche para control, naranja de alta visibilidad para acciones y alertas, y superficies calidas de concreto. Se conservaron contraste y estados diferenciables. `npm run lint --prefix frontend` y `npm run build --prefix frontend` correctos. |
| 2026-08-28 | Refinar la paleta con referencia editorial | Hecho | Se reemplazo la paleta logistica por neutros luminosos, azul sobrio para interacciones y rojo semantico para incidencias; tambien se suavizaron bordes y sombras. `npm run lint --prefix frontend` y `npm run build --prefix frontend` correctos. |
| 2026-08-28 | Ajustar las filas activas de la bandeja | Hecho | Las solicitudes de la bandeja mantienen bordes rectos, incluido su estado activo, para separarlas de los botones de accion redondeados. |
| 2026-08-28 | Añadir favicon de Freight Pilot | Hecho | Se incorporo `frontend/src/app/icon.svg`, basado en el icono `Truck` de Lucide y en el azul de la interfaz; Next.js lo detecta automaticamente como favicon. |
| 2026-08-28 | Ajustar el encabezado de solicitudes | Hecho | Se elimino la etiqueta redundante “BANDEJA” y el filtro ocupa una fila propia para evitar recortes en columnas estrechas. |
| 2026-08-28 | Corregir acentuacion del encabezado de nueva solicitud | Hecho | El encabezado ahora muestra “Pega el mensaje tal como llegó” en la interfaz y en el diccionario bilingüe. |
| 2026-09-01 | Eliminar la numeracion de “Asi funciona” | Hecho | Los tres pasos conservan sus iconos descriptivos sin numeracion redundante. |

## 14. Proxima accion

Fases 0 a 5 completadas. La demo esta lista para presentacion local; el despliegue y un video corto quedan como mejoras opcionales de portfolio.
