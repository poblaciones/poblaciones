# Pautas del módulo `backoffice` (Poblaciones)
### Cómo trabajar durante la conversación

- **Distinguir lo verificado de lo asumido.** Al diagnosticar, separar el hecho
  comprobado (contra el código o los datos) de la hipótesis; decir "esto lo sé,
  esto lo asumo". Cuando una causa propuesta no cierra con lo que la otra
  persona sabe del sistema, frenar y verificar en vez de seguir adelante.
- **Preguntar con opciones antes de asumir en decisiones de diseño.** Cuando una
  decisión tiene varios caminos razonables, plantear las opciones y dejar
  elegir, en vez de tomar una y avanzar.
- **No sobre-corregir.** Ante un feedback puntual, cambiar lo pedido y no de
  más. Restaurar de más "por las dudas" o extender el alcance sin pedirlo es un
  sobrepaso; ceñirse a lo solicitado.

---

## 7. Estructura de carpetas

    map/
      main.js                  Bootstrap Vue (registra componentes mp-*, crea window.bus)
      App.vue                  Raíz
      classes/                 Comportamiento y estado (function + prototype)
      components/
      tests/                   Batería propia (ver sección 10)

---

## 8. Convenciones de arquitectura (cómo escribir código acá)

Estado real del módulo y regla para lo nuevo:

- **Objetos con comportamiento, no helpers sueltos.** Igual que en la tabla.
  El estilo dominante acá es `function Nombre() {}` + `Nombre.prototype.X`;
  al agregar métodos a una clase existente, seguir su estilo. La herencia usa
  el patrón `Hija.prototype = new Padre()` (por eso los constructores base
  toleran ser llamados sin argumentos); no cambiarlo en un archivo puntual sin
  decidirlo explícitamente.
- **Nada "genérico por las dudas"** y **sin concesiones por compatibilidad**,
  con una excepción real: los routers de la URL sí mantienen soporte de rutas
  viejas publicadas (formato legacy del FrameRouter, `[@…@]` en features),
  porque hay URLs compartidas en circulación. No remover ese soporte.
- **Preferir referencias a re-búsquedas por nombre**; resolver por nombre solo
  cuando el origen es un nombre (restauración desde URL, matching de variable
  al cambiar de nivel por `Name`).
- **CSS sobre JavaScript cuando el layout puede resolverlo**, y cuidado con la
  reactividad al resize (misma pauta que en la tabla; en este módulo el costo
  es el re-render de tiles).

## 9. Convenciones de estilo

Idénticas a las del módulo tabla; se repiten las operativas:

- **No usar `continue`**; reestructurar con `if/else` o extrayendo un método.
- **Evitar `.map`/`.filter` encadenados** donde un bucle explícito sea más claro.
- **Comentarios: solo los que agregan valor** (el porqué, casos límite,
  interfaz). Al tocar un archivo, remover los redundantes y el código muerto
  comentado que se encuentre alrededor de lo editado.
- **No poner código defensivo sobre código propio**; `try/catch` solo en la
  frontera (servicios, entrada del usuario, restauración de URL).
- **Nombres descriptivos**; funciones cortas que hacen una sola cosa.
- **Registro de comentarios y textos de UI**: castellano rioplatense, formal,
  sin coloquialismos. No describir que los datos "viajan".
- **Razonar en castellano** durante el trabajo.
- **Switches sobre checkboxes**; **sin cursor `not-allowed`** en deshabilitados.
- **Prototipar lo visual en HTML** antes de codearlo cuando el cambio de layout
  no es trivial.
- Detalle propio de este módulo: hay archivos con finales de línea mezclados
  (CRLF/LF) e indentación con tab. Al editar, respetar lo dominante en el
  archivo y no reformatear en masa (ensucia los diffs).

## 10. Tests

Batería propia, sin framework externo, análoga a la del módulo tabla. Se corre
desde la raíz del módulo con:

    node --import ./tests/_register-alias.mjs tests/run-all.mjs

por ahora no hay tests hechos, pero en otro lado, que es /map en lugar de /BackOffice, está como:

- `tests/_harness.mjs`: micro-harness. `describe/it/expect`, soporta tests
  async (cola interna; `report()` es async). `describe` admite usarse como
  separador, sin callback. La lista de matchers es **cerrada**: **`toBe`,
  `toEqual`, `toBeCloseTo`, `toBeNull`, `toBeTruthy`, `toBeFalsy`,
  `toHaveLength`**. Antes de usar un matcher, verificar que esté en esa lista.
- `tests/_register-alias.mjs` + `_alias-hooks.mjs`: loader que permite correr
  los fuentes reales bajo Node sin webpack. Hace cuatro cosas:
  1. Resuelve los alias `@/map/...` a los archivos reales del módulo y los
     imports relativos sin extensión (estilo webpack) probando `.js` y `.vue`.
  2. Mapea `@/common/...` y los paquetes npm de UI (vue, axios, svg.js,
     html2canvas, canvg, leaflet, vue-clickaway, @tweenjs/tween.js,
     js-cookie) a stubs en `tests/_stubs/`. Cualquier import bajo
     `vue-material-design-icons/` resuelve a un único stub genérico
     (`mdi-icon.mjs`), sin registrar cada ícono por separado. Los stubs de
     `str`/`arr`/`color` tienen **implementaciones reales mínimas** (la
     lógica testeada depende de que funcionen); `err` registra las llamadas
     en `err.calls` sin lanzar ni mostrar diálogos.
  3. Sirve los `.vue` extrayendo solo su bloque `<script>` (permite testear la
     lógica de componentes como `indicatorSelector`), fuerza los `.js` del
     módulo a formato ESM, reescribe los `require()` inline a
     `globalThis.__stubRequire` (multigeojson, parse-svg, querystring,
     form-data) y envuelve los módulos CommonJS (`helper.js`) para exportarlos
     como default.
  4. Define un `window` global mínimo **en import time**: el patrón de
     herencia `X.prototype = new Y()` ejecuta constructores base que consultan
     `window.SegMap` al cargarse el módulo. `setupWindow()` (fixtures) lo
     reemplaza luego por el mock completo en cada test.
- `tests/fixtures.mjs`:
  - `setupWindow()` arma `window` con el mock de SegMap (frame, Clipping,
    SaveRoute, Session, Configuration) y lo devuelve para ajustarlo por test.
  - `makeMetricProperties` / `makeVersion` / `makeLevel` / `makeVariable` /
    `makeValueLabel`: el JSON de un indicador con la forma mínima que el
    cliente espera del servidor. `makeCatalogTree`: árbol como el de
    `GetFabIndicators`/`GetFabBoundaries` (incluye el formato diccionario
    anterior y un nodo con `VersionId` y agrupadores).
  - `mountLite(componente, opciones)` "instancia" el objeto de opciones de un
    componente Vue sin Vue: defaults de props, `data()`, methods bindeados,
    computed como getters sin caché, `$emit` registrado en `$emitted`. Alcanza
    para ejercitar la lógica pura del componente; **no** prueba template, DOM
    ni watchers.
- `tests/run-all.mjs`: registra cada suite con `await import('./X.test.mjs')`.
  Al crear una suite nueva, agregar su import acá.
- Suites actuales y qué protegen:
  - `mercator.test.mjs` — bounds de tiles (documenta la convención Min=NO /
    Max=SE con latitud invertida), normalización e intersecciones.
  - `metricsList.test.mjs` — segmentos de apilamiento: inserción tras las
    capas bloqueadas, posición absoluta en el mapa (z-order), movimiento,
    búsqueda por Id.
  - `activeMetric.test.mjs` — nivel según zoom (rango, extremos, pin,
    exclusión del último nivel no-D, conservación de la variable por nombre),
    métricas de resumen válidas (N/I/P/FIL/K/A/D/T y la exclusión de área en
    segmentos), patrones, estilos, visibilidad de categorías, homónimas entre
    niveles.
- **La cantidad de pruebas cambia seguido**; no fijar un número acá.
  Consultarla corriendo la batería (la última línea informa "N pasaron, 0
  fallaron"). Al cerrar una tanda, la batería debe quedar **en verde con 0
  fallos**.
- Los tests **caracterizan el comportamiento real**, incluso donde sorprende
  (la convención de latitud de `getTileBounds`, el bloque `w` de la ruta). Si
  un comportamiento caracterizado se decide cambiar, se cambia el test en la
  misma tanda, explícitamente.
- Las clases que dependen de `window.SegMap` se prueban ajustando el mock de
  `setupWindow()`, no inyectando dependencias a las clases.

### Verificación obligatoria antes de entregar

Antes de dar por buena una edición:
- `node --check` sobre cada `.js` y `.mjs` tocado.
- Para `.vue`: extraer el `<script>` (regex sobre `<script>…</script>`) y
  `node --check`.
- Correr la batería completa y confirmar que sigue en verde.
- Confirmar que no quedaron referencias a nombres/archivos viejos tras un
  renombre (grep en todo el build).
- Al armar el zip de entrega, verificar que incluye los cambios
  (`unzip -p … | grep`). No armar zips intermedios; uno al final de la tanda.

## 11. Integración con el proyecto real

- Imports por alias `@/backoffice/...` y `@/common/...` (`@` resuelve a `src/`). El
  framework común (`str`, `arr`, `err`, `session`, `promises`, `dom`, `web`,
  `color`, `iconManager`) vive en `@/common/framework` y `@/common/js`.
- Los errores de servicio se reportan con `err.errDialog(código, gerundio del
  intento, error)`; los textos siguen el registro de la sección 9.

## 12. Estilos globales (módulos con Vue Material)

`backoffice`, `admins` y `packs` comparten las hojas de `src/common/styles/admin/`; `credentials` y `table`
cargan solo las que se indican. Los componentes no repiten overrides de Vue Material: si una regla vale para
más de una vista, va en la hoja que corresponde.

| Hoja | Contenido | La carga | Posición |
|---|---|---|---|
| `vue-material-overrides.css` | Tema, botones, pestañas, listas, menús, `md-card`, tablas | `App.vue` de backoffice, admins y packs | Antes de `vue-material.css` |
| `fields.css` | `md-field` y etiquetas (`mp-label`, `mpLabel`, `helper`) | ídem | Antes |
| `dialogs.css` | `md-dialog`, anchos y pie de acciones | ídem | Antes |
| `layout.css` | Barra superior, `split`/`gutter`, separadores, utilidades | ídem | Antes |
| `third-party.css` | v-tooltip, vue-sidebar-menu, vue-color, jqWidgets, CKEditor, Google Maps | ídem | Antes |
| `feedback.css` | `md-snackbar` y `md-tooltip` | `App.vue` de los cinco módulos, tras `popovers.css` | Antes |
| `base.css`, `vue-material-late.css` | Reset de `html`/`body`/`a`, `.app-container`, ajustes que deben ganarle al tema | `CommonBootstrap` | Después |
| `averta/typography.css` | Fuentes Averta, base de `html` y `body`, encabezados y `md-title` | `App.vue` de credentials y table | Antes |
| `averta/fields.css` | `md-field` y etiquetas (`label`, `mp-label`, `mp-area`, `helper`, `customField`) | ídem | Antes |
| `averta/theme.css` | Color primario, botones de 40 px, diálogos y listas desplegables | ídem | Antes |
| `averta/utilities.css` | `formRow`, `hand`, `normalTextLink`, `right`, `center` | ídem | Antes |
| `credentials/styles/credentials.css` | Pantallas de ingreso, registro, activación y recuperación | `App.vue` de credentials | Antes |

**Editor de texto enriquecido.** `mp-text` (el único componente que carga CKEditor) no lo registra
`CommonBootstrap`: lo registra `RichTextBootstrap.Register(Vue)`, que llaman los `main.js` de `backoffice`,
`admins` y `packs`. `credentials` y `table` no lo llaman, de modo que su paquete no incluye CKEditor. Un módulo
nuevo que use `<mp-text>` debe llamar a `RichTextBootstrap.Register(Vue)` después de `CommonBootstrap.Init`.

**Orden de carga.** Las hojas que van antes de `vue-material.css` pierden contra ella en todo lo que no lleva
`!important`; las de `vue-material-late.css` le ganan por orden. Esa diferencia es intencional: no mover una regla
de un grupo al otro ni reordenar los `<style src>` de `App.vue` sin comprobar el resultado.

**Diálogos.** El tope global es `min(700px, 90%)` y lleva `!important`; un `max-width` sin `!important` dentro
de un popup nunca se aplica. El tamaño se elige con una clase en el `<md-dialog>`:

| Clase | Efecto |
|---|---|
| `mp-dialog-md`, `-lg`, `-xl` | Tope de 720, 900 o 1100 px |
| `mp-dialog-fit` | Sin tope; el diálogo toma el ancho del contenido |
| `mp-dialog-fixed-sm`, `-md` | Ancho fijo de 420 o 600 px |
| `mp-dialog-fixed-lg` | Ancho completo, limitado por el tope global |
| `mp-dialog-wide-content` | Contenido de `90vw` hasta 1100 px |

El pie (`<md-dialog-actions>`) lo define `dialogs.css` para todos los diálogos: 8 px arriba y abajo, 24 a la
izquierda y 20 a la derecha. Los componentes no lo redefinen.

**Estilos `scoped`.** Una regla `scoped` solo alcanza los elementos de la plantilla del propio componente y la
raíz de sus hijos: un `.md-dialog-actions` en una vista cuyo diálogo vive en otro componente no tiene efecto.
Cuando una regla deba llegar a un diálogo, va en `dialogs.css` con una clase del diálogo.

**Página 404.** Es `common/components/NotFound.vue`; los routers de backoffice, admins, packs y credentials la
importan de ahí.

**Antes de agregar una regla global,** buscar si la clase ya existe en estas hojas; las clases sin ningún uso en
plantillas ni en JavaScript se eliminan.
