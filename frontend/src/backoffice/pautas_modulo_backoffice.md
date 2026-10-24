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

Batería propia, sin framework externo (mismo esquema que la del módulo `map`).
Se corre desde la raíz del proyecto con:

    npm run test:backoffice

(equivale a `node --import ./src/backoffice/tests/_register-alias.mjs
src/backoffice/tests/run-all.mjs`).

- `tests/_harness.mjs`: `describe/it/expect`, soporta tests async. La lista de
  matchers es **cerrada**: **`toBe`, `toEqual`, `toBeCloseTo`, `toBeNull`,
  `toBeTruthy`, `toBeFalsy`, `toHaveLength`**. Antes de usar un matcher,
  verificar que esté en esa lista (no hay `not` ni `toContain`).
- `tests/_paths.mjs` + `_register-alias.mjs` + `_alias-hooks.mjs`: loader que
  corre los fuentes reales bajo Node sin webpack. Resuelve `@/...` y los
  imports relativos sin extensión, sirve los `.vue` con su bloque `<script>`
  únicamente y elige ESM/CommonJS según el contenido de cada archivo. Los
  paquetes y módulos que no deben ejercitarse se reemplazan por dobles de
  `tests/_stubs/` (el de `axios` es el de `common/tests/_stubs`), y las
  imágenes y hojas de estilo se resuelven a un valor vacío. **Todo reemplazo
  nuevo se declara en `_paths.mjs`**; `Layout.vue`, `@/map/js/helper` y
  `@/map/classes/Search` se reemplazan para no arrastrar el módulo `map`.
- `tests/fixtures.mjs`: `setupBackoffice(privilegios)` (arma `window.Context`,
  `window.Db` y `window.host` sobre los dobles de navegador de `common`),
  `mountLite(componente, { propsData, mocks })` y utilidades (`parseBody`,
  `installCancelToken`). `mountLite` sigue el orden de Vue (`beforeCreate`,
  props, methods, data, computed) pero **no** prueba template, DOM ni
  watchers: estos últimos se invocan a mano con `Componente.watch[nombre].call(vm)`.
  Los dobles propios de un tema viven en `*Fixtures.mjs`.
- `tests/run-all.mjs`: registra cada suite con `await import('./X.test.mjs')`.
  Al crear una suite nueva, agregar su import acá.
- Organización: una suite por clase o componente (`X.test.mjs`). Cubren la
  lógica de `classes/` (permisos, escalas, acceso a datos), la consistencia de
  la tabla de rutas y los componentes con lógica propia (listado de
  cartografías, menú lateral, grilla, diccionario, categorías, simbología,
  asistente de indicadores calculados). Quedan fuera de la batería: templates y
  estilos, `GeographyOverlay` y `Relocate.vue` (dependen de Leaflet) y
  `main.js`. Quedan sin suite los componentes de poca lógica propia (selectores
  `Pick*`, pasos de bienvenida del asistente, barras superiores, `Customize/*`,
  `MpIconFontPanel`, `IconPreview`, entre otros); conviene sumarles una suite
  cuando se les agregue lógica.
- **La cantidad de pruebas cambia seguido**; no fijar un número acá. Al cerrar
  una tanda, la batería debe quedar **en verde con 0 fallos**.
- Los tests **caracterizan el comportamiento real**, incluso donde sorprende;
  esos casos se nombran con "(comportamiento actual)". Si se decide corregir
  un defecto o cambiar un comportamiento, se cambia el test en la misma
  tanda, explícitamente.
- El estado global se prepara con `setupBackoffice`, no inyectando
  dependencias en las clases.

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
| `vue-material-overrides.css` | Tema, botones, chips, pestañas, listas, menús, `md-card`, tablas | `App.vue` de backoffice, admins y packs | Antes de `vue-material.css` |
| `fields.css` | `md-field` y etiquetas (`mp-label`, `mpLabel`, `helper`) | ídem | Antes |
| `dialogs.css` | `md-dialog`, anchos y pie de acciones | ídem | Antes |
| `layout.css` | Barra superior clara, `split`/`gutter`, separadores, utilidades | ídem | Antes |
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

**Barra superior.** Las cuatro barras comparten la clase `.topbar` de `layout.css` (fondo `--mp-topbar`, sin sombra):
la home (`components/HomeTopbar.vue`), el interior de la cartografía (`views/Layout/Topbar.vue`) y administración y
paquetes (`common/widgets/TopWelcome.vue`). Siguen siendo archivos distintos. `HomeMenu`, `TopbarWorkActions` y
`ProfileMenu` leen su color de `--topbar-icon`, `--topbar-avatar-bg` y `--topbar-avatar-text`, que define `.topbar`;
un componente nuevo dentro de una barra hace lo mismo y no fija colores propios. `TopWelcome` no lleva título:
`admin-links` recibe `current` (`admin` o `packs`) y marca ese botón con `md-primary`. El logo es `components/TopbarLogo.vue` (imagen `assets/logo-topbar.png`) y se usa en la home y en
`TopWelcome`. `common/assets/back.svg` usa `currentColor`.

**Buscador.** `BackofficeSearch.vue` emite `search` con el texto y `select` con el resultado elegido, y muestra
los `results`, `truncatedKinds`, `loading` y `failed` que recibe; sigue el patrón combobox (flechas, Enter y Esc). La
consulta se maneja en `HomeTopbar.vue` (espera de 250 ms, mínimo de 2 caracteres, descarte de respuestas atrasadas) y
en `classes/WorkSearch.js`, que convierte la respuesta de `Db.SearchUserWorks` en resultados con su ruta de destino:
cartografía (`/cartographies/:workId`), dataset (`.../datasets/:datasetId/data`) e indicador
(`.../datasets/:datasetId/metrics?level=:levelId`, una entrada por serie). `MetricsTab.vue` resalta la fila cuyo `Id`
coincide con `level`. El endpoint `GET /services/backoffice/SearchUserWorks?q=&l=` está especificado en
`especificacion_endpoint_buscador.md` y lo implementa `WorkService::SearchUserWorks`. El campo mide 380 px fijos en
la home y el panel se alinea a su izquierda con un ancho mínimo de 500 px. Cada resultado es un enlace (`href` que arma
`HomeTopbar` con `$router.resolve`): un clic común navega con `$router.push` y con Ctrl, Cmd, Shift o el botón central
el navegador lo abre aparte.

**Página 404.** Es `common/components/NotFound.vue`; los routers de backoffice, admins, packs y credentials la
importan de ahí.

**Antes de agregar una regla global,** buscar si la clase ya existe en estas hojas; las clases sin ningún uso en
plantillas ni en JavaScript se eliminan.

## 13. Página de paletas

`/users/#/paletas` muestra cada control vigente del backoffice con su código. Es una ruta oculta del router
(`hidden: true`, sin `Layout`) y, como el resto del módulo, solo responde con un usuario autenticado. Vive en
`backoffice/views/Paletas/`: `paletasCatalogo.js` (los ejemplos), `PaletaEjemplo.vue` (muestra en vivo y código)
y `Paletas.vue` (la página).

- Todo control, componente `mp-*` o clase global nueva se agrega a `paletasCatalogo.js` en el mismo cambio. El campo
  `code` de cada ejemplo es la plantilla que se compila y la que se exhibe; `codeOnly` exhibe solo el código
  (`mp-grid`, `title-bar`).
- Los componentes que no están registrados globalmente (hoy `mp-select-auto`, `mp-dropdown-button` y `backoffice-search`) se declaran en
  `components` de `PaletaEjemplo.vue` para que los ejemplos compilen.
- La página usa las mismas hojas que el resto del módulo y no define controles propios. El prefijo `pal-` de sus
  estilos es solo de disposición.
