# Reglas de dependencias

## Dirección

Las dependencias apuntan hacia las reglas del negocio:

```text
APP ROUTER
    ↓
PRESENTATION
    ↓
APPLICATION
    ↓
DOMAIN

INFRASTRUCTURE
    ↑ implementa contratos requeridos por application/domain
```

`domain` y `application` definen las necesidades; `infrastructure` aporta implementaciones concretas. La composición selecciona esas implementaciones desde el límite exterior.

## Importaciones permitidas

| Origen | Puede depender de | Responsabilidad |
| --- | --- | --- |
| `domain` | tipos puros de `shared` cuando sean realmente transversales | Modelos, invariantes y contratos del negocio |
| `application` | `domain` y piezas puras de `shared` | Casos de uso, commands, queries y orquestación |
| `infrastructure` | `application`, `domain` y recursos transversales de `shared` | Implementar contratos y traducir sistemas externos |
| `presentation` | `application`, `domain` y UI compartida | Presentar datos y capturar interacción |
| `app` | `presentation`, `providers` y dependencias necesarias para composición | Rutas y composition root |
| `shared` | otras piezas de `shared` de nivel igual o más bajo | Capacidades transversales sin conocimiento de módulos |

Ejemplos permitidos:

```text
domain         → shared/types (puros)
application    → domain
infrastructure → domain/application
presentation   → application/domain
app            → composition
```

Un contrato vive en la capa interior que lo necesita. Una implementación concreta vive en `infrastructure`; no se importa desde `domain` ni `application`.

## Importaciones prohibidas

El dominio no depende de frameworks, UI, transporte ni proveedores externos:

```text
domain → React
domain → next
domain → antd
domain → fetch
domain → APIs externas
domain → Mercado Libre
domain → Tiendanube
```

También se prohíbe:

```text
application  → presentation
application  → infrastructure
presentation → infrastructure
shared       → modules
shared       → app
```

`app` puede ensamblar una implementación de infraestructura con su caso de uso, pero no debe contener reglas de negocio. La presentación consume casos de uso o datos ya preparados; no elige adaptadores concretos.

## Límites entre módulos

Un módulo no importa detalles internos de otro módulo. Cuando dos funcionalidades deban colaborar, se expone un contrato o caso de uso explícito y estable, sin acceder mediante rutas profundas a su infraestructura o presentación. No se crea una abstracción hasta que esa colaboración exista.

## Nombres que hacen visibles los límites

Se usan nombres específicos como `publication.model.ts`, `publication.mapper.ts`, `publication.schema.ts`, `publication.repository.ts`, `get-publications.query.ts`, `update-publication.command.ts`, `publications-table.client.tsx` y `publications-view.tsx`.

No se aceptan contenedores ambiguos como `utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`, `functions.ts`, `types2.ts` o `service2.ts`. Si una pieza no puede nombrarse por su responsabilidad, debe revisarse su alcance.
