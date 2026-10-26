# Despliegue en servidor doméstico

Esta guía describe la configuración preparada para Ubuntu 24.04.5 LTS con Docker instalado. La configuración de producción vive en `compose.production.yaml`; no modifica ni sustituye `compose.yaml`, que sigue siendo la configuración local de PostgreSQL.

Este documento prepara el despliegue, pero no crea el túnel ni registros DNS y no migra la base local. Esos pasos requieren aprobación y ejecución manual separadas.

## Arquitectura

- `frontend`: Next.js en el puerto de contenedor 3000.
- `backend`: FastAPI en el puerto de contenedor 8000; ejecuta `alembic upgrade head` antes de iniciar Uvicorn.
- `postgres`: PostgreSQL 16 con volumen persistente `production_postgres_data`; no publica puertos en el host.
- `cloudflared`: conector saliente al túnel Cloudflare. Solo comparte la red de aplicación con frontend y API.
- La red `database` es interna y solo conecta PostgreSQL con la API. El túnel no puede alcanzar PostgreSQL, SSH ni la interfaz de OpenCode.

No se configura ningún puerto `ports:` en los servicios: las peticiones públicas entran por Cloudflare Tunnel. El túnel saliente es compatible con CGNAT, sujeto a que el servidor y su conexión a Internet estén disponibles.

## Hostnames y configuración Cloudflare pendiente

- Interfaz: `https://freight.nuteam.ai`.
- API: `https://api.freight.nuteam.ai` es una **propuesta pendiente de aprobación**. El Compose exige que `NEXT_PUBLIC_API_URL` y `CORS_ALLOWED_ORIGINS` se configuren para los nombres finalmente aprobados.
- Al configurar el túnel, enrutar `freight.nuteam.ai` a `http://frontend:3000` y, si se aprueba el hostname propuesto, `api.freight.nuteam.ai` a `http://backend:8000`.
- Registros previstos, aún no creados:

  | Nombre | Tipo | Destino | Estado |
  | --- | --- | --- | --- |
  | `freight.nuteam.ai` | CNAME proxied de Cloudflare Tunnel | `<TUNNEL_ID>.cfargotunnel.com` | Hostname de interfaz propuesto; crear al aprobar el cambio DNS. |
  | `api.freight.nuteam.ai` | CNAME proxied de Cloudflare Tunnel | `<TUNNEL_ID>.cfargotunnel.com` | Propuesta pendiente de aprobación; no crear hasta aprobar también el hostname de API. |

- Crear el túnel y los registros DNS correspondientes requiere aprobación separada. El panel de Cloudflare Tunnel puede crear los CNAME al publicar cada hostname; sustituir `<TUNNEL_ID>` por el identificador que Cloudflare asigne. No cambiar los registros raíz (`nuteam.ai`) ni `www.nuteam.ai`: deben continuar apuntando a Vercel en modo DNS-only.

La URL de API debe ser HTTPS y no llevar barra final, porque el frontend concatena esa URL con las rutas. El origen CORS debe ser exactamente el origen del frontend, sin barra final; por ejemplo, `https://freight.nuteam.ai`.

`NEXT_PUBLIC_API_URL` se incrusta en el bundle de Next.js durante `docker compose build`. Es una URL pública, nunca un lugar para claves o secretos. Cambiarla requiere reconstruir el frontend.

## Variables y secretos de ejecución

Compose requiere estas variables en el entorno del proceso que lo ejecuta; no hay contraseñas de desarrollo ni valores secretos predeterminados:

| Variable | Uso |
| --- | --- |
| `POSTGRES_PASSWORD` | Contraseña de la base. Debe ser un valor aleatorio URL-safe (por ejemplo, hexadecimal), porque se incorpora al `DATABASE_URL` de SQLAlchemy. La misma contraseña configura PostgreSQL y el backend. |
| `OPENAI_API_KEY` | Clave que recibe únicamente el servicio backend en tiempo de ejecución. No se usa durante la construcción de imágenes. |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token de ejecución del conector; Compose lo entrega a `cloudflared` como `TUNNEL_TOKEN`. |
| `NEXT_PUBLIC_API_URL` | URL pública aprobada de API, usada como argumento de construcción del frontend. No es secreta. |
| `CORS_ALLOWED_ORIGINS` | Origen exacto aprobado para la interfaz pública; no es secreto. |
| `OPENAI_MODEL` | Modelo del backend. Si se omite, Compose usa `gpt-4o-mini`. |

Inyectar los secretos mediante el mecanismo de secretos del entorno que se elija para el servidor; no guardarlos en este repositorio, en una imagen o en argumentos de comandos que queden en el historial. No imprimir `docker compose config` ni otros valores resueltos con secretos. La configuración efectiva de Docker queda accesible a quien tenga privilegios de administración del daemon.

## Primera inicialización

La base de producción debe comenzar limpia. El volumen `production_postgres_data` es distinto del volumen de desarrollo y no se importan datos locales. Al crear un volumen nuevo, la imagen de PostgreSQL crea la base `freight_pilot`; el backend aplica la migración Alembic vigente antes de arrancar la API. No se cargan casos semilla automáticamente.

Después de aprobar el despliegue, con las variables disponibles para Compose y el túnel y sus hostnames configurados, los comandos operativos son:

```sh
docker compose -f compose.production.yaml build
docker compose -f compose.production.yaml up -d
```

Para comprobar/aplicar manualmente las migraciones en una instalación ya iniciada:

```sh
docker compose -f compose.production.yaml exec backend uv run --no-sync alembic -c alembic.ini upgrade head
docker compose -f compose.production.yaml exec backend uv run --no-sync alembic -c alembic.ini current
```

Las migraciones también se ejecutan automáticamente antes de que la API acepte tráfico al iniciar el contenedor.

### Casos ficticios y endpoint público

La carga de los tres casos de demostración es manual. Una vez autorizado y con la API disponible, se puede invocar:

```sh
curl -X POST https://api.freight.nuteam.ai/demo/seed
```

El hostname del ejemplo depende de la aprobación de `api.freight.nuteam.ai`. `POST /demo/seed` permanece público y sin autenticación, como en la aplicación actual. Crea los casos ficticios que falten y restablece los campos de semilla, extracción, validación y correcciones de esos tres registros; no borra las demás solicitudes. Cualquier visitante puede volver a invocarlo y deshacer correcciones hechas a esos casos.

## Privacidad, acceso y consumo de OpenAI

La demo es deliberadamente pública, abierta y compartida, sin inicio de sesión. Cualquier visitante puede leer y modificar solicitudes. El texto original se envía a OpenAI para extraer los datos; no introduzcas información personal o confidencial ni describas esta instalación como privada o apta para datos confidenciales.

El proyecto OpenAI dedicado admite `gpt-4o-mini`, tiene un límite de gasto de US$5 que se reinicia por período y alertas al 50 % y 80 %. Sus límites compartidos de proyecto son 5 RPM y 20.000 TPM; no son cuotas por usuario ni por dirección IP. La aplicación conserva el comportamiento existente y no añade autenticación ni límites por visitante, IP o tamaño de entrada.

## Datos de demo y recuperación

Los datos de PostgreSQL son descartables y no se respaldan ni se restauran. El volumen persiste durante reinicios normales de los contenedores, pero no forma parte de un plan de recuperación. Si falla la aplicación o se pierde el servidor, despliega la configuración en el nuevo servicio o servidor desde cero: PostgreSQL creará una base vacía, Alembic aplicará el esquema al iniciar la API y los tres casos ficticios se podrán cargar manualmente con `POST /demo/seed`. No copies ni migres la base anterior.

Para reiniciar intencionadamente la demo desde cero en el mismo host, este comando elimina también el volumen y todas las solicitudes:

```sh
docker compose -f compose.production.yaml down --volumes
docker compose -f compose.production.yaml up -d --build
```

No hace falta ejecutar `pg_dump` ni `pg_restore`.
