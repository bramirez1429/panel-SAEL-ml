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

El punto de composición crea explícitamente el cliente HTTP, la implementación del repositorio y el query. `application` sólo conoce el contrato definido por `domain`; la implementación concreta queda en `infrastructure`.

Los componentes React no ejecutan `fetch` ni conocen dominios, headers o reglas de transporte. Esto evita exponer configuración privada al navegador, mantiene la UI desacoplada y permite probar los casos de uso con repositorios simulados.

## Límite HTTP

El cliente compartido usa `fetch` nativo y está marcado como `server-only`. `BACKEND_API_URL` aporta la URL base y `BACKEND_API_TIMEOUT_MS` permite ajustar el timeout sin modificar código.

El límite de infraestructura procesa cada respuesta así:

```text
HTTP
 ↓
unknown
 ↓
Zod
 ↓
modelo de dominio válido
```

No se aplican conversiones de tipo con `as`. Los problemas de configuración, conectividad, timeout, respuestas HTTP no exitosas y cuerpos inválidos se traducen a errores controlados derivados de `AppError`.

## Endpoint de conectividad

El backend vecino `panel-ml-api` define y prueba un endpoint real `GET /` que responde el texto exacto `Hello World!`. La integración valida ese contrato con Zod y lo utiliza únicamente para confirmar comunicación entre Next.js y NestJS.

Este endpoint no representa todavía un health check ni readiness check de producción. Si el backend incorpora uno posteriormente, su ruta y su schema deberán sustituir este contrato con base en la implementación real, no por suposición.
