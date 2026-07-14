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

> **Nota sobre el flujo de trabajo real.** En la práctica de las últimas sesiones
> se trabajó sobre un *build vivo* del módulo dentro del entorno de ejecución (se
> edita, se corre `node --check` y la batería de tests, se arma el zip de
> entrega). El filesystem del entorno se reinicia entre tareas, así que ese build
> no persiste: cada tanda parte del zip subido. Corolario práctico: **el zip que
> se sube al empezar es el estado de verdad**; si una tanda quedó a medias, la
> siguiente arranca del último zip entregado, no de un supuesto estado en memoria.

### Cómo trabajar durante la conversación

- **Distinguir lo verificado de lo asumido.** Al diagnosticar, separar el hecho
  comprobado (contra el código o los datos) de la hipótesis; decir "esto lo sé,
  esto lo asumo". Cuando una causa propuesta no cierra con lo que la otra persona
  sabe del sistema, frenar y verificar en vez de seguir adelante. Afirmar causas
  sin confirmarlas cuesta iteraciones.
- **Preguntar con opciones antes de asumir en decisiones de diseño.** Cuando una
  decisión tiene varios caminos razonables (qué va por índice y qué por Id, cómo
  desambiguar, qué criterio de orden), plantear las opciones y dejar elegir, en
  vez de tomar una y avanzar.
- **No sobre-corregir.** Ante un feedback puntual, cambiar lo pedido y no de más.
  Restaurar de más "por las dudas" o extender el alcance sin pedirlo es un
  sobrepaso; ceñirse a lo solicitado.

---

## 2. Propósito del módulo

Tablero de exploración de datos para Poblaciones. Cruza una **pivot** (tabla de
indicadores por delimitaciones geográficas) con **widgets de análisis** que se
montan sobre los mismos datos: resumen estadístico, distribución, relaciones
(correlación/regresión/dispersión) y, a futuro, agrupamientos.

Modelo mental actual: **una sola pivot** cuyos widgets de análisis son fijos y se
muestran u ocultan. No es un tablero dinámico de fuentes múltiples (eso fue una
arquitectura previa, ya desarmada).

**Origen conceptual (por qué la pivot es distinta del visor de mapa).** En el
visor de mapa el usuario está siempre en un zoom concreto, y el panel de
variables muestra automáticamente el nivel adecuado a ese zoom (provincias,
departamentos, radios). Nunca ve todos los niveles a la vez. La pivot rompe esa
premisa: ofrece indicadores, versiones y niveles juntos, fuera de un zoom
específico. Varias decisiones de diseño (la variable lógica, el cruce entre años
por nombre, la persistencia por índice) existen justamente para manejar lo que en
el visor era implícito y acá se vuelve explícito.

---

## 3. Entidades y flujo de datos

### El agregado raíz: `ActivePivot`

Es el dueño del estado de la tabla y **la clase central del módulo** (la más
grande, ~1200 líneas). Casi todo lo importante pasa por acá. Compone objetos
colaboradores con comportamiento (no helpers sueltos), cada uno responsable de
una parte:

- `pivot.MetricTuples` — las **tuplas de métrica**: cada una es la combinación
  (indicador × versión × variable × categoría|total) que define una medición a
  pedir. Es el equivalente *no visual* de las columnas. Mantiene también el orden
  y los encabezados visibles derivados. (`ActiveMetricTuples`)
- `pivot.Regions` — las delimitaciones de **filas** (semántica OR). (`ActiveBoundarySet`)
- `pivot.FilterSet` — las delimitaciones de **filtro** (semántica AND). Misma
  clase que Regions, distinta instancia. (`ActiveBoundarySet`)
- `pivot.Data` — caché de filas de datos traídas del backend, indexada por
  `(versionId, levelId)` y, dentro, por geografía. (`ActiveData`)
- `pivot.Dataset` — la **vista plana y reactiva de resultados** sobre la que se
  montan los widgets. La reconstruye la propia pivot al terminar cada
  `RefreshData`. Siempre es un objeto válido (nunca null). (`ActiveDataset`)
- `pivot.Router` — serialización del estado a la query de la ruta (deep-link) y
  su restitución. (`ActiveRoute`)

El par de colecciones del pivot es **`MetricTuples` / `Regions`** (ambas no
visuales). No se llaman `Columns`/`Rows` justamente porque la pivot no es un
objeto visual; las columnas visuales aparecen recién en el dataset.

### La clase central en dos métodos

Para ubicarse rápido, dos métodos de `ActivePivot` concentran lo esencial:

- **`Render()`** arma la grilla de filas que la UI dibuja. Recorre las regiones
  de las filas y, por cada cruce con una columna, resuelve la celda. El resultado
  es una estructura de filas que `PivotTable.vue` solo presenta (no calcula).
- **`ResolveCell(spec, region, item)`** calcula **una** celda: junta los
  registros de una geografía para una columna y devuelve la celda.

**Invariante de celda coherente.** Del servidor, `Value` y `Total` vienen
*siempre juntos* (si falta el dato, no viene la fila). Por lo tanto una celda
resuelta **o está completa o está vacía, nunca a medias**. Al agregar varias
geografías: si ninguna aportó un registro, la celda es vacía (todo `null`); si
alguna aportó, todos los campos son sumas coherentes. No contar por campo por
separado — eso fabricaba celdas con `Total` sin `Value` que rompían incidencia y
densidad aguas abajo. El área se suma **una vez por geografía**, no por registro.

**Incidencia y celdas sin valor.** Al agregar en modo incidencia (I/P/FIL,
`ResolveAllCategories`), una celda sin `Value` se saltea por completo: sumar solo
su `Total` al denominador hunde el promedio a casi cero. (Una región con dato
faltante en una categoría, si no se saltea, tira toda la categoría a ~0.)

Otros métodos que conviene conocer: `ResolveAllCategories` (agregado para los
charts de distribución), `GroupRowsByParent` (corte de control / agrupadores; los
grupos entre sí se ordenan por el mismo criterio activo, no por orden de
aparición), `applyColumnState` (restaurar una columna desde la ruta),
`RefreshData` (traer del backend y cachear en `pivot.Data`).

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
  `metric.Store.GetMetricData(...)` y se cachean en `pivot.Data`. **Cada registro
  del servidor trae `Value` y `Total` juntos** (más `AreaM2`, `VID`,
  `GeographyItemId`, `LID`); si un dato falta, no viene la fila. Esta garantía es
  la base del invariante de celda coherente (arriba).
- **Estado del tablero** (qué indicadores/filas/filtros/orden hay, qué análisis
  están visibles, proporciones de los splitters): se serializa en la **query de
  la ruta**, mediante `pivot.Router` para la parte de la pivot y un segmento
  `dash` que arma el Dashboard para la parte de layout/visibilidad.

### Flujo de un refresco

1. Se modifica el estado (se agrega un indicador, una región, se cambia el orden…).
2. `pivot.RefreshData()` trae del backend lo que falte y lo cachea en `pivot.Data`.
3. `pivot.Render()` arma la grilla de filas resolviendo cada celda.
4. Al terminar, `RebuildDataset()` reconstruye `pivot.Dataset` (con `version`
   incrementada), lo que dispara la reactividad de Vue.
5. El Dashboard pasa `pivot.Dataset` por prop a los widgets; la reactividad
   propaga y los widgets recomputan.

### La variable lógica (desambiguación #2/#3)

El nombre de una variable lo genera el servidor a partir de su columna y
normalización, así que dos variables físicas del mismo nivel pueden quedar
homónimas legítimamente (la misma columna con y sin normalización, o dos fórmulas
de prueba). Se las desambigua por **orden de aparición** en el nivel: la primera
conserva el nombre, la segunda recibe `#2`, la tercera `#3`. El cruce entre años
(versiones) se hace por ese **nombre lógico**. La invariante a proteger: **no
mergear dos variables físicas distintas en la misma (variable lógica, versión,
nivel)**. La lógica vive centralizada en `logicalVariableName.js` (módulo propio
para evitar un ciclo de imports) y se usa en todos los puntos que comparan
variables por nombre: el combo de variables, la resolución en un censo, el
reenganche al cambiar de nivel y la restauración por URL. En el caso sano (sin
homónimas) el nombre lógico es el `Name` tal cual y nada cambia.

### Relación geográfica de nivel superior

Un indicador puede publicarse a un nivel más agregado que el de las filas
activas (p. ej. Mortalidad infantil solo existe a nivel provincia, pero las
filas están a nivel localidad). `RegionSet` guarda dos diccionarios por item:
`GeographyRelations` (la relación directa con un `geographyId`) y
`UpperGeographyRelations` (la relación con el `geographyId` del nivel padre).
`GetGeographyIdsForItem(itemId, geographyId)` prueba primero la relación
directa y, si falta, cae a la de nivel superior — así una fila de localidad
puede resolver la celda de un indicador que solo existe a nivel provincia,
usando la relación con SU provincia.

Por esto `RefreshData` (antes de resolver celdas) pide
`EnsureContainsGeographyRelations` dos veces por cada `geographyId` de indicador
activo: una para el `geographyId` propio del nivel de la tupla, y otra para el
`geographyId` de su nivel padre (`tuple.version.Levels[levelIdx - 1]`). Si falta
la segunda, el fallback de `GetGeographyIdsForItem` no tiene nada que usar.

### Datos que violan una regla de negocio: arreglar en la base, no tolerar en el cliente

Si un síntoma sugiere datos inconsistentes que violan una regla de negocio (por
ejemplo, dos niveles con el mismo `geography_id` colgando de una misma versión),
**verificar en la base antes de meter heurísticas defensivas en el cliente**.
Agregar tolerancia en el código para datos que no deberían existir tapa el
problema real y siembra bugs nuevos. El caso testigo: "densidad rota" (todas las
filas en `-`, incluido el conteo) no era un bug de cálculo sino un nivel duplicado
en la base; se corrige en el dato, no en el resolvedor.

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

El Dashboard también es dueño de **su propia URL/historial**: lee el hash con un
parser propio y lo escribe con `history` (replaceState/pushState). Maneja qué
cambios son "estructurales" (pushState, permiten volver atrás) versus qué cambios
solo actualizan la ruta, con banderas (`_pendingStructural`, `_restoring`) para
no escribir historial durante el arranque o la restauración.

---

## 5. Estructura de carpetas

    table/
      views/
        Dashboard.vue            Tablero (dueño del pivot, layout, splitters, persistencia, URL/historial)
      widgets/                   Composiciones con orientación de negocio
        widgetMixin.js           Contrato común (prop dataset, config, estados de disponibilidad)
        widgetKinds.js           Catálogo de tipos de análisis
        pivot/PivotTableWidget.vue   Envuelve la tabla y la barra de análisis
        summary/SummaryWidget.vue, MetricSummary.vue
        relations/RelationsWidget.vue
        distributions/DistributionWidget.vue  (ver detalle abajo)
      components/                Controles reutilizables (sin lógica de negocio del pivot)
        MetricHeader.vue         Orquesta los sub-controles de una métrica
        VariableSelector.vue, VersionSelector.vue, CategoriesSelector.vue, CategoryPicker.vue
        floatingDropdown.js      Mixin de panel flotante (fixed + click-outside)
        indicatorSelector.vue    Selector/buscador de indicadores y delimitaciones (compartido con el visor)
        pivot/PivotTable.vue     Render de la tabla (sticky, sort por header, agrupadores, ícono de mapa)
        pivot/ColumnDragController.js  Reordenamiento de columnas por arrastre (objeto, no mixin)
        charts/ScatterPlot.vue, ScatterMulti.vue, DualHistogram.vue
        popups/AddMetricPopup.vue, WorkMetadataPopup.vue  Popups (modal propio) invocables vía window.Popups
      widgets/widgetStyles.css   Estilos compartidos por los widgets (contenedor, encabezado,
                                 jerarquía de títulos, etiquetas, recuadros, pie). Se importa con
                                 @import en el <style scoped> de cada widget; evita redefinir lo común.
                                 Acá viven los estilos TRANSVERSALES de título (ms-indicator/ms-variable),
                                 usados por Resumen y Distribución.
      widgets/distributions/      Widget de distribución (gráficos por indicador)
        DistributionWidget.vue   Orquesta: modo categorías/regiones, toggles por panel, barra global.
                                 El ALTO de los charts lo resuelve el CSS (flex); el ancho de la zona de
                                 leyenda se fija por JS (única medición necesaria; ver la pauta de CSS sobre JS en la sección 7).
        classes/                 DistributionModel/Panel (resuelve el caso: %/N, total, apilable),
                                 CategoryDistribution (agrega por categoría, ponderado),
                                 RegionDistribution (barras por región con contribución al total)
        components/              CategoryChart (barras/líneas/apilado, alto por CSS), RegionBars (horizontales)
      classes/                   Comportamiento y estado (orientado a objetos)
        ActivePivot.js           Agregado raíz; compone los colaboradores (clase central)
        ActiveMultiselectedMetric.js  Un indicador con sus censos; produce las tuplas (GetTuples)
        Selection.js             Un censo: versión + nivel + variable
        RegionSelection.js       Qué regiones van en las filas
        ActiveMetricTuples.js    Tuplas de métrica, orden, encabezados
        ActiveBoundarySet.js     Colección de delimitaciones (Regions y FilterSet)
        ActiveData.js            Caché/índice de datos por (versión, nivel) y geografía
        ActiveDataset.js         Vista plana de resultados (.Columns = AnalysisColumns)
        ActiveRoute.js           Serialización a la ruta (columnas/filas por índice; ver sección sobre URL)
        MapUrlBuilder.js         Arma la URL del visor de mapa desde una fila de la pivot
        AnalysisColumns.js       Columnas de análisis del dataset (correlación, regresión…)
        MetricStore.js           Caché/recuperación de métricas
        Context.js               Contexto global (stores, usuario, autenticación)
        RegionStore.js           Store de delimitaciones (Boundaries/Regions); dueño de los RegionSet
        RegionSet.js             Un boundary con sus items y sus relaciones geográficas
                                 (GeographyRelations directas, UpperGeographyRelations con el nivel
                                 padre — ver "relación geográfica de nivel superior" en la sección 3)
        pivotValue.js            Formato y valor de celda según el modo (N/T/I/P/FIL/K/A/D)
        logicalVariableName.js   Nombre lógico de una variable (desambiguación #2/#3; ver sección 3)
        boundaryTree.js          Resolución de delimitaciones desde el árbol
        StartTable.js            Resolución del "work" inicial
      js/                        Helpers puros (sin estado)
        pivotStats.js            Estadística ponderada (regresión lineal, logística binomial por IRLS, correlaciones)
        tableExport.js           Exportación DOM → CSV/XLSX
      writers/                   Exportadores (clases, no helpers)
        TabularWriter.js         Base: arma la grilla intermedia desde el pivot
        CsvWriter.js             Serializa la grilla a CSV (build + download)
        XlsxWriter.js            Serializa la grilla a XLSX con estilos (ExcelJS)
      tests/                     Batería propia (ver sección 8)

### Clases que viven FUERA del build

Algunas clases del modelo de selección viven en `@/map/classes/`, no en `table/`,
porque se comparten con el visor de mapa. Si una tarea toca la generación de
tuplas o la selección compartida, esos archivos se trabajan aparte (se suben
sueltos, no están en el zip del módulo). Los routers de referencia del visor
(`SaveRoute`, `SelectedInfoRouter`, `ClippingRouter`, `ZoomFeatureRouter`,
`RestoreRoute`) definen el **formato de URL del visor**, que `MapUrlBuilder`
replica; son de solo lectura para el módulo tabla.

---

## 6. Persistencia en la URL

Dos serializadores, con un criterio unificado tomado del visor de mapa:

- **`ActiveRoute`** serializa el estado de la tabla al hash y lo restaura. El
  criterio (alineado al visor): el **indicador por Id**; **versión (lista de
  índices), nivel y variable por ÍNDICE** posicional, con **omisión de defaults**
  para acortar (nivel 0, variable 0, summary `N` se omiten). Una columna queda,
  por ejemplo, como `metricId!v0,1!l1!a2!sI!c…`. La selección de categorías va
  indexada por índice de versión. **Sin compatibilidad con rutas viejas**: los
  datos publicados no cambian, así que los índices son estables y no hace falta
  arrastrar el esquema anterior.
- **`MapUrlBuilder`** arma la URL del visor de mapa desde una fila de la pivot.
  Emite el indicador **una vez por cada versión seleccionada** (no descarta las
  otras). Misma convención de índices y omisión de defaults.

El **estado del tablero** (`dash`) omite todos los defaults: una tabla vacía no
genera parámetro. Los análisis visibles van por letra (`s`/`d`/`r`), los
splitters se omiten si están en 50/50/50, y los separadores sobrantes se recortan.

**Motivo de índice sobre nombre.** El nombre de una variable se genera
automáticamente (ver sección 3, "la variable lógica") y puede cambiar si se
corrige; el índice, sobre datos publicados, es estable y produce rutas más
cortas. Es una decisión heredada del visor.

---

## 7. Convenciones de arquitectura (cómo escribir código acá)

- **Objetos con comportamiento, no helpers sueltos.** Nada de archivos de
  funciones módulo que reciben todo por parámetro. Una clase que cuelga de su
  dueño y *ya conoce su contexto*, de modo que sus métodos reciben menos
  parámetros y menos genéricos. Ejemplo: `pivot.Router.sections()` no recibe la
  pivot; la conoce. **Excepción justificada**: un helper de módulo chico y puro es
  aceptable cuando evita un ciclo de imports o cuando la lógica no tiene estado ni
  dueño natural (p. ej. `logicalVariableName`, compartido entre dos clases). La
  regla no es dogmática; es "no dispersar comportamiento en funciones sueltas
  cuando pertenece a un objeto".
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
- **Preferir referencias a re-búsquedas por nombre.** Si ya se tiene el objeto
  (un nivel, una variable), operar con esa referencia; no convertirlo a nombre y
  volver a buscarlo. La re-búsqueda por nombre es frágil ante homónimos (dos
  niveles o variables con el mismo nombre). El caso legítimo de resolver por
  nombre es cuando el origen ES un nombre (p. ej. restaurar desde la URL, donde lo
  serializado es un string).
- **CSS sobre JavaScript cuando el layout puede resolverlo.** No calcular en JS
  altos, anchos o posiciones que el navegador ajusta solo con flex/grid; hacer el
  chart un flex-item que ocupa el sobrante y dejar que el navegador lo recalcule.
  Medir en JS únicamente lo que el CSS no puede saber (p. ej. fijar el ancho de la
  zona de leyenda al ancho de los charts hermanos, que la leyenda no conoce). El
  scrollbar del chart costó varias iteraciones por calcular el alto en JS; con CSS
  se resolvió de raíz.
- **Cuidado con la reactividad al resize.** Un `ResizeObserver` que muta estado
  reactivo en cada píxel de arrastre del splitter fuerza re-render (costoso con
  muchas filas). Si algo tiene tamaño fijo por contenido, un resize del contenedor
  no debería invalidarlo: no atar su recálculo al resize, sino solo a los cambios
  de datos o de modo.
- **Ante un enfoque que falla repetidas veces, cambiar de nivel conceptual.** Si
  un mismo problema vuelve tras varios intentos incrementales, no insistir con más
  ajustes: replantear (fue el caso del scrollbar → de JS a CSS, y del conteo por
  campo → celda coherente). Simplificar conceptualmente suele resolver una familia
  de bugs de una vez.

## 8. Convenciones de estilo

- **No usar `continue`** (rompe la lectura estructurada). Reestructurar con
  `if/else` o extrayendo un método.
- **Evitar `.map`/`.filter` encadenados** donde un bucle explícito sea más claro.
- **Comentarios: solo los que agregan valor.** Reservados para el *porqué*
  (decisiones técnicas o de negocio no evidentes), advertencias sobre casos
  límite, y documentación de interfaz/API. **Prohibido** el comentario que repite
  lo que el nombre ya dice (p. ej. `// Estado multi-versión` sobre
  `isMultiVersion()` es contaminación). Al tocar un archivo, ir removiendo esos
  comentarios redundantes.
- **No poner código defensivo sobre código propio.** `try/catch` solo en la
  frontera con lo externo (servicios, entrada del usuario, estado restaurado de
  persistencia). Adentro, confiar en los invariantes propios.
- **Nombres descriptivos**: que la variable/función/clase revele su intención sin
  documentación extra. Funciones cortas que hacen una sola cosa.
- **Registro de los comentarios y textos de UI**: castellano rioplatense, formal,
  sin coloquialismos. No describir que los datos "viajan".
- **Razonar en castellano** durante el trabajo.
- **Switches sobre checkboxes** donde haya que elegir un control de dos estados.
- **No poner cursor "prohibido" (`not-allowed`) en lo deshabilitado**: algo
  disabled ya no es cliqueable; la opacidad reducida alcanza como señal.
- **Prototipar lo visual en HTML antes de codearlo** cuando el cambio de layout no
  es trivial. Ver el comportamiento en un HTML suelto evita iterar sobre el
  componente real.

## 9. Tests

Batería propia, sin framework externo. Se corre con:

    node --import ./tests/_register-alias.mjs tests/run-all.mjs

- `tests/_harness.mjs`: micro-harness. `describe/it/expect`, soporta tests async
  (cola interna; `report()` es async). La lista de matchers es **cerrada**:
  **`toBe`, `toEqual`, `toBeCloseTo`, `toBeNull`, `toBeTruthy`, `toBeFalsy`,
  `toHaveLength`**. No existe `toBeUndefined` (usar
  `expect(x === undefined).toBeTruthy()`) ni otros; antes de usar un matcher,
  verificar que esté en esa lista.
- `tests/_register-alias.mjs` + `_alias-hooks.mjs`: loader que mapea los alias
  `@/...` del proyecto a stubs mínimos en `tests/_stubs/` (arr, promises,
  RegionSelection, ActiveBoundary, pivotValue, boundaryTree), para cargar las
  clases sin el framework completo. Al agregar una clase nueva que importe por
  alias algo aún no stubeado, se agrega el stub y su registro en `_alias-hooks`.
- `tests/run-all.mjs`: registra cada suite con `await import('./X.test.mjs')`. Al
  crear una suite nueva, agregar su import acá.
- `tests/fixtures.mjs` / `fixtures-multiversion.mjs`: arman datasets y metrics que
  cumplen el contrato mínimo. Para ejercitar `ActivePivot` con dependencias
  pesadas, se simula con `Object.create(ActivePivot.prototype)` y métodos
  mockeados.
- **La cantidad de pruebas cambia seguido**; no fijar un número acá. Consultarla
  corriendo la batería (la última línea informa "N pasaron, 0 fallaron"). Al
  cerrar una tanda, la batería debe quedar **en verde con 0 fallos**.

Las clases que dependen de `window.Context` no se ejercitan directamente: se
prueban en aislamiento inyectando dependencias falsas. Si hace falta cubrirlas, la
vía es un stub de `window.Context`, no inyección al pivot.

### Verificación obligatoria antes de entregar

Antes de dar por buena una edición:
- `node --check` sobre cada `.js` tocado.
- Para `.vue`: extraer el `<script>` (regex sobre `<script>…</script>`) y
  `node --check`.
- Correr la batería completa y confirmar que sigue en verde.
- Confirmar que no quedaron referencias a nombres/archivos viejos tras un
  renombre (grep en todo el build).
- Al armar el zip de entrega, **verificar que incluye los cambios** (p. ej.
  `unzip -p … | grep`), para no entregar un zip viejo.
- **No armar zips intermedios**: entregar uno al final de la tanda, no uno por
  cada micro-cambio.

## 10. Integración con el proyecto real

- Los imports usan el alias `@/table/...` (y `@/map/...`, `@/common/...`). El `@`
  resuelve a `src/`. **Los imports ESM entre clases del módulo requieren la
  extensión `.js` explícita** (`from './Selection.js'`).
- `Context.js` va en `table/classes/` e importa `./RegionStore` y `./MetricStore`
  como vecinos.
- Estilos: el módulo asume el `index.scss` global; los componentes usan `scoped`.
- Arranque sin Vue Router: el componente raíz del módulo es `table/App.vue`
  (montado por el `main.js` del proyecto), que monta el `Dashboard`
  directamente. `App.vue` resuelve el "work" inicial con `StartTable` y, sobre una
  ruta "limpia", espera el evento `pivot-ready` (emitido por el Dashboard vía
  `window.Messages`) para aplicar `RestoreWork`. El estado de la pivot se
  serializa en el **hash** (`#/view?c=...&r=...&dash=...`): el Dashboard lo lee con
  un parser propio y lo escribe con `window.history`, sin depender de
  `$route`/`$router`. `pivot.Router` compone el objeto de query (agnóstico del
  transporte); el Dashboard lo serializa al hash.
- Popups globales: `App.vue` declara instancias de los popups con `ref` y las
  publica en `window.Popups`, para que cualquier componente los invoque con
  `.show(...)`. Los popups del módulo traen su propio overlay (no reutilizan el
  modal del visor). Para actuar sobre la pivot, `AddMetricPopup` **emite un
  evento** que App.vue delega en el Dashboard por ref — cadena explícita, sin
  globales mágicos.

