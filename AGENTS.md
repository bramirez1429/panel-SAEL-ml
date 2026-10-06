AGENTS.md
Regla principal
Trabajá únicamente sobre el alcance exacto pedido por el usuario.
Hacé el cambio mínimo necesario.
No aproveches una tarea para refactorizar, mejorar, reorganizar o modificar código que no sea necesario para resolverla.
Si una solución requiere tocar código fuera del alcance solicitado, no lo hagas silenciosamente: informalo al usuario.
Alcance del proyecto
- Trabajá solamente dentro del repositorio actualmente abierto.
- No inspecciones, modifiques ni compares otros proyectos o repositorios.
- Leé solamente los archivos necesarios para entender y resolver la tarea actual.
- No hagas revisiones generales del proyecto salvo que el usuario lo pida explícitamente.
- No cambies módulos, páginas, componentes o servicios ajenos al requerimiento.
- Conservá la arquitectura existente.
Cambios mínimos
Antes de editar:
1. Identificá los archivos mínimos necesarios.
2. Reutilizá código, tipos, servicios, componentes y patrones existentes.
3. Evitá crear nuevas capas o abstracciones si no son necesarias.
4. Modificá únicamente lo indispensable.
Preferí siempre un diff pequeño y fácil de revisar.
Clean Code
Todo código nuevo o modificado debe seguir Clean Code:
- nombres claros y descriptivos;
- funciones pequeñas y con una responsabilidad;
- evitar duplicación;
- evitar lógica innecesariamente compleja;
- usar early returns cuando mejoren la lectura;
- mantener componentes enfocados;
- separar presentación de lógica cuando corresponda;
- evitar comentarios que expliquen código confuso: preferir código claro;
- no agregar código muerto;
- no dejar console.log, mocks temporales, TODO innecesarios ni debugging;
- respetar el estilo existente del proyecto.
SOLID
Aplicar SOLID de forma pragmática:
- Single Responsibility: cada componente, función o servicio debe tener una responsabilidad clara.
- Open/Closed: extender comportamiento sin modificar innecesariamente código estable.
- Liskov Substitution: respetar contratos y tipos existentes.
- Interface Segregation: no crear interfaces grandes para resolver casos pequeños.
- Dependency Inversion: reutilizar las abstracciones existentes cuando ya formen parte de la arquitectura.
IMPORTANTE:
SOLID no significa crear más archivos, interfaces, factories o capas sin necesidad.
Priorizar simplicidad, KISS y YAGNI.
TypeScript / React
- Mantener TypeScript estricto.
- No usar any.
- No ocultar errores de tipos con casts innecesarios.
- No usar @ts-ignore ni @ts-expect-error salvo autorización explícita.
- Reutilizar tipos existentes.
- Mantener props pequeñas y explícitas.
- Evitar estados duplicados o derivados innecesarios.
- No introducir efectos secundarios innecesarios.
- Mantener el comportamiento existente que no forme parte del cambio.
Tests
- Crear o actualizar únicamente los tests directamente relacionados con el código modificado.
- No crear tests de otros módulos.
- No ampliar cobertura fuera del alcance solicitado.
- Los tests deben verificar el comportamiento solicitado, no detalles internos frágiles.
Prohibido ejecutar automáticamente
NO ejecutar tests.
NO ejecutar build.
NO ejecutar lint.
NO ejecutar typecheck.
NO ejecutar suites completas.
El usuario ejecutará esas verificaciones manualmente.
Git
NO hacer commit.
NO hacer push.
NO hacer merge.
NO crear ramas.
NO cambiar de rama.
NO borrar ramas.
NO hacer rebase.
NO hacer reset.
NO usar comandos Git destructivos.
Podés consultar git status o git diff únicamente si es necesario para revisar tus propios cambios.
Dependencias y configuración
NO instalar paquetes.
NO actualizar dependencias.
NO modificar package.json salvo que sea estrictamente solicitado.
NO modificar lockfiles.
NO modificar configuración de TypeScript, Next.js, NestJS, ESLint, Vitest u otras herramientas salvo pedido explícito.
NO modificar variables de entorno.
NO modificar archivos .env.
NO tocar secretos, tokens ni credenciales.
Arquitectura
NO cambiar arquitectura por iniciativa propia.
NO mover archivos sin necesidad.
NO renombrar módulos, componentes, rutas o servicios que no sean parte de la tarea.
NO reemplazar implementaciones existentes por tecnologías diferentes.
NO crear una nueva solución paralela si ya existe una abstracción apropiada.
NO hacer refactors masivos.
NO aplicar formateo global.
NO modificar archivos no relacionados solamente por estilo.
Backend / Frontend
No tocar backend si la tarea puede resolverse únicamente en frontend.
No tocar frontend si la tarea puede resolverse únicamente en backend.
Si ya existe un endpoint, action, query, repository, service o componente que cumple la necesidad, reutilizarlo antes de crear otro.
No duplicar llamadas ni lógica de negocio.
Seguridad del cambio
Preservar siempre:
- comportamiento existente fuera del requerimiento;
- contratos públicos;
- nombres de rutas;
- estructura de datos existente;
- UX no relacionada;
- estilos no relacionados;
- compatibilidad con código existente.
No borrar código existente salvo que sea estrictamente reemplazado por el cambio solicitado.
Archivos generados
NO modificar archivos generados automáticamente.
NO modificar builds, caches o carpetas de salida.
NO tocar node_modules.
NO generar archivos innecesarios.
Encoding
Usar UTF-8.
No introducir caracteres corruptos.
Mantener correctamente acentos y caracteres en español.
Forma de trabajar
Para cada tarea:
1. Entender el pedido.
2. Inspeccionar solamente el código relevante.
3. Elegir la solución mínima.
4. Implementar únicamente esa solución.
5. Crear o actualizar solamente los tests de ese cambio, si corresponde.
6. NO ejecutar tests ni build.
7. Revisar el diff de los archivos tocados.
8. Informar brevemente qué archivos fueron modificados y qué cambió.
Prioridad final
En caso de duda:
MENOS cambios.
MENOS archivos.
MENOS abstracciones.
MENOS riesgo.
No hacer trabajo adicional que el usuario no pidió.