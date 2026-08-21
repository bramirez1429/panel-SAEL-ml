# Arquitectura del frontend

## Objetivo

El frontend debe poder crecer por funcionalidades sin mezclar reglas de negocio, detalles de integración y componentes visuales. La arquitectura es **feature/domain oriented**, aplica SOLID cuando aporta claridad y evita abstracciones sin un caso de uso real.

## Server Components first

Los componentes son Server Components por defecto. Se agrega `"use client"` únicamente en el límite más bajo que necesite interacción, estado, efectos o APIs del navegador.

Los providers que deban ejecutarse en el cliente se mantienen pequeños y reciben `children` desde un layout de servidor:

```text
Server Component
        ↓
Client Provider mínimo
        ↓
children
```

El `RootLayout` permanece como Server Component.

## Responsabilidades principales

```text
src/
├── app/
├── modules/
├── shared/
└── providers/
```

- `app`: rutas, layouts, metadata y composición con App Router. No contiene reglas de negocio.
- `modules`: funcionalidades del producto. Cada módulo encapsula su dominio, casos de uso, adaptadores y presentación.
- `shared`: piezas pequeñas, estables y realmente reutilizables, sin conocimiento de una funcionalidad concreta. Incluye utilidades de infraestructura transversal, configuración, errores, tipos puros y UI compartida cuando existan casos reales.
- `providers`: integraciones globales mínimas requeridas por React o librerías, como el soporte SSR de Ant Design. No es una capa de negocio.

Un módulo futuro podrá adoptar esta estructura cuando exista la funcionalidad:

```text
modules/
└── publications/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

No se crean módulos ni carpetas vacías por anticipado. Cada archivo debe responder a una responsabilidad actual.

## Encapsulación por módulo

No usamos directorios globales gigantes como `components/`, `services/`, `utils/` o `hooks/` para acumular piezas de todas las funcionalidades. Esa organización diluye los límites, aumenta el acoplamiento y vuelve difícil saber qué código cambia junto.

Cada módulo conservará cerca su modelo, casos de uso, infraestructura y UI. Sólo se mueve algo a `shared` cuando es independiente del negocio y existe reutilización real.

Mercado Libre y Tiendanube podrán incorporarse más adelante mediante adaptadores de infraestructura que implementen contratos definidos hacia el interior. El dominio y los casos de uso no conocerán SDKs, DTOs ni APIs de esos proveedores. No se implementan esas integraciones hasta que exista el caso de uso.

## Estado y validación

La prioridad para representar estado es:

1. Server Components.
2. URL y `searchParams`.
3. Props.
4. Estado local de React.
5. Zustand, sólo ante estado global real.

No se crean stores preventivos ni se incorpora Redux. Zod se utilizará para validar datos en límites reales, por ejemplo respuestas del backend, sin crear schemas artificiales.

## Convenciones de nombres

Los nombres describen la responsabilidad y, cuando corresponde, el contexto:

```text
publication.model.ts
publication.mapper.ts
publication.schema.ts
publication.repository.ts

get-publications.query.ts
update-publication.command.ts

publications-table.client.tsx
publications-view.tsx
```

El sufijo `.client.tsx` identifica un límite de cliente explícito. Se evitan nombres ambiguos como `utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`, `functions.ts`, `types2.ts` o `service2.ts`.
