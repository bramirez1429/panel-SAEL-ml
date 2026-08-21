# Estrategia de testing

Elegimos el nivel de prueba que reproduce mejor el entorno de cada pieza. No todo necesita la misma herramienta ni pruebas duplicadas en todas las capas.

## Vitest

Vitest cubre código determinista que puede ejecutarse aislado:

- dominio y casos de uso de aplicación;
- errores y tipos con comportamiento;
- mappers y schemas cuando existan;
- funciones puras.

Estas pruebas deben ser rápidas y no depender de React, Next.js ni servicios externos.

## React Testing Library

React Testing Library, sobre `jsdom`, prueba componentes React renderizables en ese entorno, especialmente Client Components. Se verifican resultados observables por el usuario —contenido, accesibilidad e interacción— y se usa `user-event` para interacciones reales.

Los componentes compartidos sin dependencias externas se renderizan directamente. Sólo se agregan providers al test cuando el componente realmente los requiere.

## Playwright

Playwright prueba la aplicación ejecutándose en un navegador:

- smoke tests de rutas principales;
- integración con App Router;
- flujos críticos completos;
- contenido producido por Server Components.

Los Async Server Components se prueban mediante Playwright o pruebas de integración. No se fuerza su renderizado unitario con React Testing Library porque `jsdom` no reproduce el runtime de servidor de Next.js, sus límites ni su streaming.

## Regla práctica

```text
domain/application        → Vitest
mappers/schemas           → Vitest
Client Components         → Vitest + React Testing Library
Async Server Components   → Playwright / integración
```

Cada comportamiento se comprueba en el nivel más pequeño que conserve fidelidad. Se priorizan contratos y resultados públicos sobre detalles de implementación; la cobertura numérica no justifica tests artificiales.
