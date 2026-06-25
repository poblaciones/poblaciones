# Pautas del módulo `table` (Poblaciones)

Documento de arranque para retomar el trabajo sobre este módulo en una
conversación nueva sin tener que recorrer todo el código. Resume el propósito,
las entidades, de dónde salen los datos, la estructura y las pautas de trabajo
acordadas.

---

## 1. Cómo arrancar una conversación nueva

**Para entender o discutir el diseño** (decidir un cambio, evaluar un enfoque):
alcanza con subir este archivo. Describe entidades, flujo y convenciones.

**Para escribir o modificar código**: subir además el **zip con la estructura de
clases y componentes** (la carpeta `table/` completa). Este documento da el mapa,
pero el zip es la fuente de verdad: los nombres, las firmas y los detalles de
implementación cambian, y trabajar de memoria sobre ellos produce errores
evitables. La regla práctica: si la tarea va a tocar archivos, pedir/subir el zip
y trabajar sobre él; verificar contra el código real antes de editar.

Si en una conversación nueva hace falta editar y no está el zip, conviene pedirlo
antes de empezar en lugar de reconstruir de memoria.

---

## 2. Propósito del módulo

Tablero de exploración de datos para Poblaciones. Cruza una **pivot** (tabla de
indicadores por delimitaciones geográficas) con **widgets de análisis** que se
montan sobre los mismos datos: resumen estadístico, distribución, relaciones
(correlación/regresión/dispersión) y, a futuro, agrupamientos.

Modelo mental actual: **una sola pivot** cuyos widgets de análisis son fijos y se
muestran u ocultan. No es un tablero dinámico de fuentes múltiples (eso fue una
arquitectura previa, ya desarmada).

---

## 3. Entidades y flujo de datos

### El agregado raíz: `ActivePivot`

Es el dueño del estado de la tabla. Compone objetos colaboradores con
comportamiento (no helpers sueltos), cada uno responsable de una parte:

- `pivot.MetricTuples` — las **tuplas de métrica**: cada una es la combinación
  (indicador × versión × variable × categoría|total) que define una medición a
  pedir. Es el equivalente *no visual* de las columnas. Mantiene también el orden
  y los encabezados visibles derivados. (`ActiveMetricTuples`)
- `pivot.Regions` — las delimitaciones de **filas** (semántica OR). (`ActiveBoundarySet`)
- `pivot.FilterSet` — las delimitaciones de **filtro** (semántica AND). Misma
  clase que Regions, distinta instancia. (`ActiveBoundarySet`)
- `pivot.Data` — caché de filas de datos traídas del backend, indexada por
  `(versionId : levelId)`. (`ActiveData`)
- `pivot.Dataset` — la **vista plana y reactiva de resultados** sobre la que se
  montan los widgets. La reconstruye la propia pivot al terminar cada
  `RefreshData`. Siempre es un objeto válido (nunca null). (`ActiveDataset`)
- `pivot.Router` — serialización del estado a la query de la ruta (deep-link) y
  su restitución. (`ActiveRoute`)

El par de colecciones del pivot es **`MetricTuples` / `Regions`** (ambas no
visuales). No se llaman `Columns`/`Rows` justamente porque la pivot no es un
objeto visual; las columnas visuales aparecen recién en el dataset.

### La vista plana: `ActiveDataset`

`pivot.Dataset` proyecta el estado de la pivot a una estructura tabular:
`columns`, `rows`, `regionTypes`, `filters`. Acá **sí** se llaman `columns`,
porque son las columnas reales del dataset. Cada fila trae `values[]` y
`weights[]` alineados a `columns[]`.

Sobre el dataset se monta `pivot.Dataset.Columns` (instancia de
`AnalysisColumns`): la vista de columnas de análisis que consumen los widgets
(correlaciones, regresión, etc.). Los widgets usan `this.dataset.Columns`, no
instancian nada.

### De dónde salen los datos

- **Catálogos** (indicadores y delimitaciones disponibles): los mantiene el
  **contexto global**, `window.Context` (`window.Context.MetricStore`,
  `window.Context.RegionStore`, `window.Context.Metrics`,
  `window.Context.Boundaries`). El pivot **consulta** estos stores pero no es su
  dueño, así que se accede por `window.Context` y no se inyectan ni se guardan
  copias en el pivot. Criterio: si el `get` de una entidad lo hace el contexto
  (es su catálogo), vive en el contexto; si lo hiciera el pivot como dueño, ahí
  se guardaría.
- **Datos de medición** (los valores de cada celda): se piden al backend vía
  `metric.Store.GetMetricData(...)` y se cachean en `pivot.Data`.
- **Estado del tablero** (qué indicadores/filas/filtros/orden hay, qué análisis
  están visibles, proporciones de los splitters): se serializa en la **query de
  la ruta**, mediante `pivot.Router` para la parte de la pivot y un segmento
  `dash` que arma el Dashboard para la parte de layout/visibilidad.

### Flujo de un refresco

1. Se modifica el estado (se agrega un indicador, una región, se cambia el orden…).
2. `pivot.RefreshData()` arma las filas (`pivot.Rows`) resolviendo cada celda.
3. Al terminar, llama `RebuildDataset()`, que reconstruye `pivot.Dataset` (con
   `version` incrementada).
4. El Dashboard pasa `pivot.Dataset` por prop a los widgets; la reactividad de
   Vue propaga y los widgets recomputan.

---

## 4. El Dashboard como dueño

`views/Dashboard.vue` instancia el `ActivePivot` y es su dueño. Reparte por props:
le pasa el `pivot` a la tabla (que lo edita) y `pivot.Dataset` a cada widget de
análisis. La visibilidad de cada análisis es un booleano (`showSummary`,
`showDistribution`, `showRelations`) y las cuatro instancias son **fijas y
explícitas** en el template, con sus `ref`. No hay lista dinámica de widgets ni
resolución genérica por tipo: se evita el patrón "genérico por las dudas".

Los widgets emiten eventos hacia arriba (`toggle-analysis`, `close`,
`config-changed`, `data-refreshed`); el Dashboard, dueño del estado, decide.

---

## 5. Estructura de carpetas

    table/
      views/
        Dashboard.vue            Tablero (dueño del pivot, layout, splitters, persistencia)
      widgets/                   Composiciones con orientación de negocio
        widgetMixin.js           Contrato común (prop dataset, config, estados de disponibilidad)
        widgetKinds.js           Catálogo de tipos de análisis
        DatasetInspectorWidget.vue
        pivot/PivotTableWidget.vue   Envuelve la tabla y la barra de análisis
        summary/SummaryWidget.vue, MetricSummary.vue
        relations/RelationsWidget.vue
      components/                Controles reutilizables (sin lógica de negocio del pivot)
        MetricHeader.vue         Orquesta los sub-controles de una métrica
        MetricModeSelector.vue, VariableSelector.vue, VersionSelector.vue, CategoriesSelector.vue
        floatingDropdown.js      Mixin de panel flotante (fixed + click-outside)
        indicatorSelector.vue    Selector/buscador de indicadores y delimitaciones
        pivot/PivotTable.vue     Render de la tabla (sticky, sort por header)
        pivot/ColumnDragController.js  Reordenamiento de columnas por arrastre (objeto, no mixin)
        charts/ScatterPlot.vue, ScatterMulti.vue, DualHistogram.vue
        popups/AddMetricPopup.vue, WorkMetadataPopup.vue  Popups (modal propio) invocables vía window.Popups
      widgets/widgetStyles.css   Estilos compartidos por los widgets (contenedor, encabezado,
                                 jerarquía de títulos, etiquetas, recuadros, pie). Se importa con
                                 @import en el <style scoped> de cada widget; evita redefinir lo común.
      widgets/distributions/      Widget de distribución (gráficos por indicador)
        DistributionWidget.vue   Orquesta: modo categorías/regiones, toggles por panel, barra global
        classes/                 DistributionModel (agrupa por indicador×versión), DistributionPanel
                                 (resuelve el caso: %/N, total, apilable), CategoryDistribution
                                 (agrega por categoría, ponderado), RegionDistribution (barras por
                                 región con contribución al total)
        components/              CategoryChart (barras/líneas/apilado), RegionBars (horizontales)
      classes/                   Comportamiento y estado (orientado a objetos)
        ActivePivot.js           Agregado raíz; compone los colaboradores
        ActiveMetricTuples.js    Tuplas de métrica, orden, encabezados
        ActiveBoundarySet.js     Colección de delimitaciones (Regions y FilterSet)
        ActiveData.js            Caché de datos por (versión, nivel)
        ActiveDataset.js         Vista plana de resultados (.Columns = AnalysisColumns)
        ActiveRoute.js           Serialización a la ruta
        AnalysisColumns.js       Columnas de análisis del dataset (correlación, regresión…)
        MetricStore.js           Caché/recuperación de métricas
        Context.js               Contexto global (stores, usuario, autenticación)
        pivotValue.js            Formato y encabezados de valor
      js/                        Helpers puros (sin estado)
        pivotStats.js            Estadística ponderada (regresión lineal, logística binomial por IRLS, correlaciones)
        tableExport.js           Exportación DOM → CSV/XLSX
      writers/                   Exportadores (clases, no helpers)
        TabularWriter.js         Base: arma la grilla intermedia desde el pivot
        CsvWriter.js             Serializa la grilla a CSV (build + download)
        XlsxWriter.js            Serializa la grilla a XLSX con estilos (ExcelJS)
      tests/                     Batería propia (ver sección 8)

### Clases que viven FUERA del build

`ActiveMetric` y `ActiveSelectedMetric` están en `@/map/classes/`, no en `table/`.
`ActiveSelectedMetric` es la que produce las tuplas: expone `GetTuples()` (antes
`GetColumnSpecs`), con sus privados `_makeTuple` y `_makeEmptyTuple`. Si una tarea
toca la generación de tuplas, ese archivo se trabaja aparte (se sube suelto, no
está en el zip del módulo). El consumidor dentro del build es
`ActiveMetricTuples.rebuild()`, que llama `metric.GetTuples()`.

---

## 6. Convenciones de arquitectura (cómo escribir código acá)

- **Objetos con comportamiento, no helpers sueltos.** Nada de archivos de
  funciones módulo que reciben todo por parámetro. Una clase que cuelga de su
  dueño y *ya conoce su contexto*, de modo que sus métodos reciben menos
  parámetros y menos genéricos. Ejemplo: `pivot.Router.sections()` no recibe la
  pivot; la conoce. `pivot.MetricTuples.GetById(id)` es la forma natural de pedir.
- **Propiedades declaradas en el constructor**, con nombres que revelen qué son.
  Nunca armar propiedades "en el aire" con `Object.defineProperty`.
- **Interacción por propiedades, no por canales globales.** El dueño del estado
  reparte por props y los hijos emiten eventos. Nada de event bus / hub global /
  `$root`. (Hubo un `pivotHub`; fue eliminado por esto.)
- **Sub-controles visuales**: levantan eventos, no mutan el objeto activo. Pero sí
  contienen la lógica de *presentar* objetos de negocio (reciben objetos de
  negocio, no datos aplanados genéricos). El dueño aplica las mutaciones.
- **Nada "genérico por las dudas".** Si van a existir 4 instancias concretas, se
  las nombra y referencia explícitamente. La generalización prematura resta
  legibilidad.
- **No hacer concesiones por compatibilidad.** Es todo código nuevo; no hay
  consumidores externos fuera de este build (salvo las clases de `@/map/classes/`,
  que se tratan explícitamente). No dejar alias ni fachadas "por si acaso".
- **Dueñez clara**: la mutación de la pivot vive en la pivot
  (`RestoreFromSections`, `applyColumnState`); el Router solo serializa.

## 7. Convenciones de estilo

- **No usar `continue`** (rompe la lectura estructurada). Reestructurar con
  `if/else` o extrayendo un método.
- **Evitar `.map`/`.filter` encadenados** donde un bucle explícito sea más claro.
- **Comentarios: solo los que agregan valor.** Reservados para el *porqué*
  (decisiones técnicas o de negocio no evidentes), advertencias sobre casos
  límite, y documentación de interfaz/API. **Prohibido** el comentario que repite
  lo que el nombre ya dice (p. ej. `// Estado multi-versión` sobre
  `isMultiVersion()` es contaminación). Al tocar un archivo, ir removiendo esos
  comentarios redundantes.
- **Nombres descriptivos**: que la variable/función/clase revele su intención sin
  documentación extra. Funciones cortas que hacen una sola cosa.
- **Registro de los comentarios y textos de UI**: castellano rioplatense, formal,
  sin coloquialismos. No describir que los datos "viajan".
- **Razonar en castellano** durante el trabajo.

## 8. Tests

Batería propia, sin framework externo. Se corre con:

    node --import ./tests/_register-alias.mjs tests/run-all.mjs

- `tests/_harness.mjs`: micro-harness. `describe/it/expect`, soporta tests async
  (cola interna; `report()` es async). Matchers disponibles: **`toBe`, `toEqual`,
  `toBeCloseTo`, `toBeNull`, `toBeTruthy`, `toBeFalsy`, `toHaveLength`**. (No
  existe `toBeUndefined`: para eso, `expect(x === undefined).toBeTruthy()`.)
- `tests/_register-alias.mjs` + `_alias-hooks.mjs`: loader que mapea los alias
  `@/...` del proyecto a stubs mínimos en `tests/_stubs/` (arr, promises,
  RegionSelection, ActiveBoundary, pivotValue, boundaryTree), para cargar las
  clases sin el framework completo.
- `tests/fixtures.mjs`: `makeDataset()` arma un dataset que cumple el contrato
  mínimo (`columns`, `regionTypes`, `dataRows()`).
- Suites actuales: `pivotStats`, `ActiveRoute`, `AnalysisColumns`,
  `ActiveDataset`, `ActivePivot`, `ActiveBoundarySet`. Total ~74 pruebas.

Las clases que dependen de `window.Context` (p. ej. la construcción de
delimitaciones desde el árbol, o `AddMetricById`) no se ejercitan directamente:
se prueban en aislamiento inyectando dependencias falsas (así está hecho
`ActiveBoundarySet`). Si hace falta cubrirlas, la vía es un stub de
`window.Context`, no inyección al pivot.

### Verificación obligatoria antes de entregar

Antes de dar por buena una edición:
- `node --check` sobre cada `.js` tocado.
- Para `.vue`: extraer el `<script>` y `node --check`.
- Correr la batería completa y confirmar que sigue en verde.
- Confirmar que no quedaron referencias a nombres/archivos viejos tras un
  renombre (grep en todo el build).

## 9. Integración con el proyecto real

- Los imports usan el alias `@/table/...` (y `@/map/...`, `@/common/...`). El `@`
  resuelve a `src/`.
- `Context.js` va en `table/classes/` e importa `./RegionStore` y `./MetricStore`
  como vecinos. `RegionStore` vivía en una carpeta `processing/` que se eliminó;
  si falta, hay que ubicarlo junto a `MetricStore.js`.
- Estilos: el módulo asume el `index.scss` global; los componentes usan `scoped`.
- Arranque sin Vue Router: el componente raíz del módulo es `table/App.vue`
  (montado por el `main.js` del proyecto), que monta el `Dashboard`
  directamente (no hay `table/router/` ni `Layout.vue`). `App.vue` resuelve el
  "work" inicial con `StartTable` (en `table/classes/`) y, sobre una ruta
  "limpia", espera el
  evento `pivot-ready` (emitido por el Dashboard vía `window.Messages`) para
  aplicar `RestoreWork`. Puede mostrar un `WorkPanel` (zócalo informativo) si hay
  un work por defecto. El estado de la pivot se serializa en el **hash**
  (`#/view?c=...&r=...&dash=...`): el Dashboard lo lee con un parser propio y lo
  escribe con `window.history.replaceState`, sin depender de `$route`/`$router`.
  `pivot.Router` sigue componiendo el objeto de query (es agnóstico del
  transporte); el Dashboard lo serializa al hash.
- Popups globales: `App.vue` declara instancias de los popups con `ref` y las
  publica en `window.Popups` (p. ej. `window.Popups.AddMetric`,
  `window.Popups.WorkMetadata`), para que cualquier componente —como el
  `workPanel` de la barra superior— los invoque con `.show(...)` sin depender del
  z-order del control que los dispara. Los popups del módulo no reutilizan el
  modal del visor (evitan arrastrar libs de estilo/controles del mapa): traen su
  propio overlay. Para actuar sobre la pivot, `AddMetricPopup` **emite un evento**
  (`add-metric`) que App.vue escucha y delega en el Dashboard (dueño de la pivot)
  por ref — cadena explícita y rastreable, sin globales mágicos.

## 10. Pendientes a verificar

- **Ponderación en correlaciones (Pearson/Spearman).** La regresión lineal y la
  logística se corrigieron para que los ponderadores (población) modulen la
  influencia relativa de cada unidad pero NO inflen el n efectivo (se normalizan a
  sumar n; sin esto, con pesos = población todo daba significativo). Falta
  verificar si la correlación y su p-valor (weightedPearson/weightedSpearman +
  correlationPValue, en pivotStats.js) tienen el mismo problema de escala: el p de
  la correlación depende de n; revisar qué n usa y si con pesos grandes infla la
  significación igual que pasaba en la regresión. En la práctica no se observaron
  correlaciones exageradamente altas, pero la significación puede estar afectada
  aunque el coeficiente r en sí no lo esté.

- **Rendimiento del Camino 1 (distribución, solo-total en categorías).**
  `ActivePivot.ResolveAllCategories` resuelve cada categoría con
  `ResolveCategoryAggregate`, que recorre TODAS las regiones de la tabla por
  categoría (el agregado sobre el universo lo requiere). Con muchas regiones ×
  categorías puede acumular costo. El modo regiones NO tiene este problema: ya
  recorta el render a `maxRegions` (25). Si aparece lentitud real (medir antes),
  cachear el agregado por (metricId, versionId) mientras no cambie el dataset.

- **Colapso de cortes de control de la pivot (CollapseState).**
  `classes/CollapseState.js` encapsula el estado de colapso de los grupos
  (cortes de control) de la tabla, indexado por la clave del grupo (nombre del
  padre). Codifica a una cadena compacta para la URL: bits de a 6 en base64url,
  con un carácter de polaridad que invierte el bitmap si la mayoría está
  colapsada (así "casi todo colapsado" también queda corto). Cadena vacía = todo
  expandido. Cadena de prueba cubierta en CollapseState.test.mjs.
  Flujo de persistencia: PivotTable emite 'collapse-changed' (string compacto) →
  PivotTableWidget lo reemite → Dashboard lo guarda como 5º segmento del 'dash'
  ("...;<distribución>;<colapso-pivot>"). Al restaurar, el Dashboard pasa
  :initial-collapse y PivotTable lo aplica una vez, cuando ya hay grupos
  (watcher de groupKeys con bandera _collapseApplied).
