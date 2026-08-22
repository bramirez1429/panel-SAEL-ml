# Integración con el backend NestJS

## Flujo

```text
Next Server Component
        ↓
Application query
        ↓
Repository contract
        ↓
Infrastructure implementation
        ↓
Shared HTTP Client
        ↓
NestJS
```

El punto de composición crea explícitamente el cliente HTTP, la implementación
del repositorio y el query. `application` sólo conoce el contrato definido por
`domain`; la implementación concreta queda en `infrastructure`.

Los componentes React no ejecutan `fetch` ni conocen dominios, headers o reglas
de transporte. Esto mantiene la UI desacoplada y evita exponer configuración
privada al navegador.

## Límite HTTP

El cliente compartido usa `fetch` nativo y está marcado como `server-only`.
`BACKEND_API_URL` aporta la URL base y `BACKEND_API_TIMEOUT_MS` permite ajustar
el timeout sin modificar código.

Cada respuesta externa se procesa así:

```text
HTTP → unknown → Zod → DTO válido → Mapper → modelo de dominio
```

Los problemas de configuración, conectividad, timeout, respuestas HTTP no
exitosas y cuerpos inválidos se traducen a errores controlados derivados de
`AppError`.

## Listado agrupado de publicaciones

El frontend consume el endpoint activo:

```text
GET /mercadolibre/direct/publicaciones/agrupadas?limit=20&cursor={cursor}
```

La respuesta real contiene `done`, `nextCursor`, `rawItemsCount`,
`productsCount` y `products`. Cada producto es `SHARED` o una familia
`VARIANT_PRICING`; el schema y mapper del módulo validan ambas formas antes de
entregarlas al dominio.

La API no devuelve un total ni páginas numéricas. La URL conserva `cursor` y la
interfaz avanza mediante el `nextCursor` real. Los filtros `search`, `type` y
`status` siguen aplicándose únicamente sobre el lote recibido porque el
endpoint activo no los acepta.

El detalle usa el endpoint activo relacionado:

```text
GET /mercadolibre/direct/publicaciones/:itemId
```

## Requests privados y OAuth

Los repositories privados usan un adaptador HTTP server-only que lee el access
JWT desde la cookie HttpOnly y agrega `Authorization: Bearer` sin entregar el
token a componentes cliente.

Mercado Libre se inicia mediante `/api/integrations/mercado-libre/connect`.
El Route Handler conserva la cookie HttpOnly de correlación emitida por Nest y
proxyfica `/mercadolibre/callback` para que state y cookie lleguen juntos al
backend. `ML_REDIRECT_URI` debe apuntar al origen público de Next, por ejemplo
`https://panel.example.com/mercadolibre/callback`; la validación de state del
backend no se reemplaza ni se debilita.
