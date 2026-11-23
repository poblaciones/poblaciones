# Pautas del módulo `map` (Poblaciones)

Documento de arranque para retomar el trabajo sobre este módulo en una
conversación nueva sin tener que recorrer todo el código. Resume el propósito,
las entidades, de dónde salen los datos, la estructura y las pautas de trabajo.
Es el par del documento de pautas del módulo `table`; donde una convención es
común a ambos, acá se enuncia igual.

---

## 1. Cómo arrancar una conversación nueva

**Para entender o discutir el diseño** (decidir un cambio, evaluar un enfoque):
alcanza con subir este archivo. Describe entidades, flujo y convenciones.

**Para escribir o modificar código**: subir además el **zip con la carpeta
`map/` completa**. Este documento da el mapa, pero el zip es la fuente de
verdad: los nombres, las firmas y los detalles de implementación cambian, y
trabajar de memoria sobre ellos produce errores evitables. La regla práctica:
si la tarea va a tocar archivos, pedir/subir el zip y trabajar sobre él;
verificar contra el código real antes de editar.

> **Nota sobre el flujo de trabajo real.** En la práctica se trabaja sobre un
> *build vivo* del módulo dentro del entorno de ejecución (se edita, se corre
> `node --check` y la batería de tests, se arma el zip de entrega). El
> filesystem del entorno se reinicia entre tareas, así que ese build no
> persiste: cada tanda parte del zip subido. **El zip que se sube al empezar
> es el estado de verdad**; si una tanda quedó a medias, la siguiente arranca
> del último zip entregado, no de un supuesto estado en memoria.

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

## 2. Propósito del módulo

Visor de datos espaciales de Poblaciones sobre Leaflet. El usuario navega un
mapa (centro + zoom), agrega **indicadores** (métricas con versiones, niveles y
variables) y **delimitaciones** (boundaries), puede **recortar** la vista a una
región o círculo (clipping), consultar estadísticas de resumen y ranking sobre
el encuadre actual, abrir fichas de elementos (info window / panel izquierdo),
anotar el mapa y compartir todo por URL.

Premisa central que lo distingue de la pivot del módulo `table`: **el usuario
está siempre en un zoom concreto**, y el nivel de cada indicador se resuelve
automáticamente según ese zoom (provincias → departamentos → radios). El nivel
"correcto" es implícito; nunca se ven todos los niveles a la vez. Casi todo el
render es **por tiles**: el mapa pide datos y cartografía por baldosa de 256px
y compone SVG (o markers) por baldosa.

Es el módulo históricamente más viejo de la aplicación: convive código heredado
(globales, event bus, herencia por prototipos) con piezas nuevas (el panel
lateral `sideToolbar` y su `indicatorSelector`, compartido con la pivot). Las
pautas de escritura de la sección 8 aplican al **código nuevo**; el heredado se
mejora oportunísticamente al tocarlo, sin refactorizaciones no pedidas.

---

## 3. Entidades y flujo de datos

### El agregado raíz: `SegmentedMap`

Vive en `window.SegMap` y es el dueño del estado del visor. Lo instancia
`App.vue` en `SetupMap()` y compone colaboradores:

- `SegMap.MapsApi` — la fachada sobre Leaflet (`LeafletApi`). Todo lo que toca
  el mapa físico (centro, zoom, capas base, overlays, markers, dibujo de
  círculos, pegman) pasa por acá. El resto del módulo no importa Leaflet.
- `SegMap.Metrics` — la lista de capas activas (`MetricsList`), con el modelo
  de **segmentos de apilamiento** (ver abajo). Es la colección central.
- `SegMap.Clipping` — el recorte activo (región, círculo o canvas) y su
  interacción con el encuadre.
- `SegMap.SaveRoute` / `SegMap.RestoreRoute` — persistencia del estado en el
  hash de la URL (ver sección 6).
- `SegMap.InfoWindow` — fichas de elementos y su navegación anterior/siguiente.
- `SegMap.Session` — telemetría de uso (`Session` + `ContentActions` +
  `UIActions` + `session/Summary`): registra acciones y las envía por pulsos a
  `UpdateUsage`. No confundir con `classes/Summary` (estadísticas del panel).
- `SegMap.Queue` / `SegMap.StaticQueue` — colas de requests con tope de
  concurrencia; la estática apunta a servidores de contenido estático cuando
  la configuración lo habilita.
- `SegMap.frame` — el encuadre reactivo (Envelope, Center, Zoom); el objeto es
  de `App.vue` (data de Vue) y `SegmentedMap` lo referencia.
- `SegMap.Labels` (`ActiveLabels`), `SegMap.Annotations`
  (`ActiveAnnotations[]`), `SegMap.Suggestions`, `SegMap.Catalog`,
  `SegMap.Tutorial`, `SegMap.OverlapRectangles` (deduplicación de etiquetas).
- `SegMap.Get` / `SegMap.Post` — wrappers de axios con sesión, Access-Link,
  reintento único y extracción del mensaje de error del backend. Todo pedido
  del módulo debería pasar por acá, no por axios directo.

### La jerarquía de capas activas

Todo lo que se dibuja en el mapa es una "capa activa" con un contrato común
(definido informalmente por `AbstractActiveMetric`): `ResolveSegment()`,
`CreateComposer()`, `useTiles()`, `Visible()`, `GetCartographyService()`,
`GetDataService()`, `UpdateMap()`.

- `ActiveMetric` — base con comportamiento real: selección de versión / nivel /
  variable (`SelectedVersion()`, `SelectedLevel()`, `SelectedVariable()`),
  cálculo del nivel según zoom (`CalculateProperLevel`, `UpdateLevel`,
  `SelectedAutomaticLevelIndex`, `Pinned`), patrones y estilos (`GetPattern`,
  `ResolveStyle`, `GetStyleColorDictionary`), métricas de resumen válidas
  (`getValidMetrics`: N/I/P/FIL/K/A/D/T), opacidades por zoom.
- `ActiveSelectedMetric` — el indicador estándar del usuario: agrega Summary y
  Ranking (con cancelación axios), filtros de urbanidad, secuencias
  (`ActiveSequenceStep`), la resolución del servicio de datos y cartografía por
  tipo de dataset, y el soporte de comparación entre versiones (`Compare`).
- `ActiveBaseMetric` — capa de fondo (basemap metric): sin tiles de datos, con
  color/ancho de línea propios; se activa desde el selector de mapa base.
- `ActiveBoundary` / `ActiveBaseBoundary` — delimitaciones (contornos), con
  color, grosor y descripciones.
- `ActiveLabels` — etiquetas del mapa base propio.
- `ActiveAnnotations` — anotaciones del work (dibujos del editor). **En reactivación**: ver
  «Anotaciones» más abajo.

**El estado de selección vive en `properties`** (el JSON del servidor
enriquecido con índices `SelectedVersionIndex`, `SelectedLevelIndex`,
`SelectedVariableIndex`, visibilidades por ValueLabel, etc.). Los objetos no
reactivos van en `this.objs` (Segment, composer): `MetricsList.doInsert` hace
`delete activeMetric.objs` antes de insertar en el array reactivo y lo repone
después, **a propósito**, para que Vue no observe esas estructuras (observarlas
degrada el render de tiles). No "arreglar" ese delete.

### `MetricsList` y los segmentos de apilamiento

`SegMap.Metrics.metrics` es la lista visible en el panel derecho (ordenable por
arrastre). Aparte, la clase mantiene **segmentos**: arrays por franja de
z-order (`LabelsSegment`, `BaseGeoShapesSegment`, `BaseLocationsSegment`,
`GeoShapesSegment`, `PatternsSegment`, `AnnotationsShapesSegment`,
`LocationsSegment`, `AnnotationsLocationsSegment`, `ClippingSegment`). Cada
capa resuelve a qué segmento pertenece (`ResolveSegment`, según
`Dataset.Type`: 'L' locations, 'D' geografías, 'S' shapes de dataset) y
`MetricsList` calcula la posición absoluta del overlay en el mapa sumando los
largos de los segmentos previos (`CalculateMapPosition`). Alta/baja/movimiento
de capas pasa siempre por `MetricsList` (`AddStandardMetric`,
`AppendNonStandardMetric`, `Remove`, `Move`), nunca tocando los arrays a mano.

### Composers: de datos a píxeles

Cada capa crea su composer en `CreateComposer()` según el dataset:

- `Dataset.AreSegments` → **`SegmentsComposer`** (ver sección 4).
- `Dataset.Type === 'L'` → `LocationsComposer`: markers (vía `MarkerFactory` de
  Leaflet o deck.gl), textos, perímetros, secuencias (`SequenceHandler`).
- resto ('D'/'S') → `DataShapeComposer`: polígonos SVG por tile, con patrones
  (`PatternMaker`), gradientes y texturas.

Jerarquía: `AbstractTextComposer` (textos, perímetros, `FormatValue`,
`inTile`) → `AbstractSvgComposer` (creación del SVG del tile con
`viewBox 0 0 8192 8192` proyectado a 256px, estilos por clase
`e<tileUniqueId>_<labelId>`, patrones, máscaras de gradiente,
`ReplaceMinimizingFlickering`, reescalado de estilos al reutilizar previews) →
`DataShapeComposer` → `SegmentsComposer`.

El render por tile separa **dos pasadas**: `renderPolygons` (el SVG del cuerpo)
y `renderLabels` (textos, perímetros y markers superpuestos, con deduplicación
por `OverlapRectangles`). La visibilidad por categoría se resuelve por
`labelValueIsVisible` con caché por composer (`labelsVisibility`), que
`TileOverlay.refresh()` invalida.

### El ciclo de tiles

`LeafletApi.InsertSelectedMetricOverlay` crea un `LeafletTileOverlay` (o una
capa deck.gl para puntos cuando `IsDeckGLLayer()`), que delega en `TileOverlay`:

1. `getTile(coord, zoom)` crea el div del tile. Si el tile queda fuera del
   clipping, se devuelve vacío. Si `PreviewHandler` tiene datos de un zoom
   anterior, arma una **preview** (recorte o mosaico del SVG previo) para
   minimizar el parpadeo mientras llega el dato real.
2. `TileRequest` pide en paralelo **datos** (`GetTileData` /
   `GetBlockTileData`, con deduplicación de pedidos idénticos por suscripción
   en la Queue) y **cartografía** (`GetGeography` o `GetDatasetShapes`,
   paginada). Los pedidos son cancelables al liberar el tile.
3. Con ambos resultados, `TileOverlay.process` invoca al composer:
   `renderLabels` + `renderPolygons`, y cachea (`SaveTileData`) para previews.
4. `refresh()` re-renderiza los tiles activos sin repedir lo que ya está.

Los datos de tile traen por registro `FID`, `VID` (variable), `LID`
(ValueLabel), `Value`, `Total`, `Description`, coordenadas del centroide y,
para comparación, `ValueCompare`/`TotalCompare` (+ variantes Gap). El
`DataShapeComposer` cruza datos y cartografía por `FID` (merge ordenado).

**Comparación de ubicaciones.** Los puntos siguen por deck.gl (`IsDeckGLLayer`) y no pasan al camino por tiles. Con la comparación
activa, `ActiveMetric.GetMetricDataService` pide `GetMetricDataCompare` en lugar de `GetMetricData`, con el nivel de la otra serie en
`p` (`CompareLevelForData()`); el servidor trae en `LID` la categoría de variación y el coloreo usa `ComparableValueLabels`
(rojos y azules) con las mismas funciones que los polígonos. El pedido comparado tiene su propia clave en `GetLevelData`, así que
no reutiliza la caché del simple. `Compare.LevelsMatch` empareja los niveles estándar por nombre y las ubicaciones y zonas por
tipo (se vinculan por código, no por geografía). El nivel de ubicaciones aparte se puede comparar solo si alguna de sus variables
es comparable (`LevelHasComparableVariables`); el bloque de ubicaciones oculta las no comparables recién entonces.

### Nivel según zoom, clipping y encuadre

`ZoomChanged` recorre las capas: `UpdateLevel()` calcula el nivel adecuado
(`CalculateProperLevel`, respetando `MinZoom`/`MaxZoom`, el pin del usuario, el
último nivel excluido del multinivel cuando no es 'D', y el piso que impone el
clipping por `LevelValidFrom`). Si el nivel cambió, `UpdateMap()` reconstruye
el overlay. `FrameMoved` actualiza el envelope y dispara el resumen; el
clipping puede fijar el encuadre a una región (`SetClippingRegion`,
`FitCurrentRegion`) o a un círculo dibujado.

**Nivel de ubicaciones aparte.** Cuando un indicador con varios niveles termina
en un nivel que no es 'D' (puntos, ejemplo: establecimientos penitenciarios con
Provincias, Departamentos y Ubicaciones), `HasSeparateBottomLevel()` es
verdadero. Ese último nivel no sigue al zoom ni se elige o fija desde el selector
de nivel (`MultilevelCount()` cuenta solo los demás). El panel derecho lo
presenta en dos bloques de `metricVariables`: primero las variables de las
ubicaciones (`fixedLevel`, con fila siempre visible, aunque sea una única
variable sin nombre) y debajo las variables de los niveles agregados, que se
resuelven por zoom o por pin. Si ese bloque tiene una única variable, sin nombre o
llamada «Total», la fila se rotula «Ubicaciones» (o «Zonas» si el dataset es 'S'). Entre los dos bloques, `metric.vue` solo apila las filas (margen negativo) cuando el detalle de las ubicaciones está cerrado; desplegado, los separa para que la fila de niveles agregados no se lea como la unidad de la tabla. Elegir una variable de un bloque cambia
`SelectedLevelIndex` al nivel de ese bloque y deja intacto `AutomaticLevelIndex`.
Invariante: `AutomaticLevelIndex` es siempre menor que `MultilevelCount()`; si
no, los dos bloques quedarían activos a la vez. Por eso `LevelValidFrom`,
`ApplyPinnedLevel` y la restauración de la ruta (`q`) recorren solo los niveles
que siguen al zoom: un recorte cuya geografía coincide solo con las ubicaciones
no debe volverlas el nivel automático.

### Resumen y ranking (panel derecho)

`ActiveSelectedMetric.UpdateSummary()` pide `GetSummary` para el encuadre
actual y vuelca los valores en los `ValueLabels` de la variable
(`label.Values`); `classes/Summary` calcula los valores presentados según la
métrica activa (N cantidad, I incidencia, P distribución, FIL distribución
horizontal, K/A/D áreas y densidad, T total), incluida la comparación entre
versiones. `SegmentedMap.RefreshSummaries()` / `InvalidateSummaries()` los
coordinan ante cambios de encuadre. El panel derecho (`summaryPanel` →
`metricItem` → widgets de `widgets/summary/`) presenta esos objetos.

El ranking se muestra dentro del detalle de la variable activa: `metric.vue` lo pasa por la ranura de
`metricVariables.vue`, que lo ubica al final de `.variableDetail`, debajo de los valores. `.variableDetail`
tiene 10px de relleno a cada lado, de modo que gráfico, valores y ranking comparten el mismo margen. Con el
detalle de categorías colapsado el ranking sigue visible, porque el colapso solo alcanza al gráfico y a los
valores. La ranura (`.detailSlot`) deja 12px debajo solo si se ve la fila de otra variable más abajo
(`isFollowedByVariable`); si el ranking es lo último, no agrega espacio. En los
indicadores simples de un solo nivel, que no usan `metricVariables`, el ranking queda al
final de la cabecera.

### De dónde salen los datos

- **Catálogos del panel lateral**: `GetFabIndicators` / `GetFabBoundaries`
  (los carga `App.vue` en `loadFabData` y los pasa por props al `SideToolbar`;
  los enriquece con `selectorSubtitles` y `selectorTooltips`).
- **Un indicador seleccionado**: `GetSelectedMetric` (`AddMetricById` y
  variantes); delimitaciones por `GetSelectedBoundary` (`AddBoundaryById`).
- **Tiles**: datos por `Get[Base]TileData` / `Get[Base]BlockTileData` (modo en
  bloque según `Configuration.Blocks`); cartografía por `GetGeography`
  (niveles 'D') o `GetDatasetShapes` ('S'); los segmentos y los puntos no piden
  cartografía (la geometría viene con el dato o alcanza el lat/lon).
- **Resumen/ranking/ficha**: `GetSummary`, `GetRanking`,
  `GetMetricNavigationInfo`, servicios de info window.
- **Works**: `GetWorkAndDefaultFrame` (arranque con work),
  `GetDefaultFrame[AndClipping]` (arranque limpio).
- **Configuración**: la trae `App.vue` al montar (`GetConfiguration`) y
  `SegmentedMap` la vuelca en `window.Use` (flags como `UseDeckgl`,
  `UseGradients`, servidores estáticos, bloques).

### Arranque

`main.js` monta `App.vue` (sin Vue Router). `App.vue` crea los globales
(`window.Popups`, `window.Panels`, `window.Use`, `window.Embedded`), obtiene la
configuración y delega en **`StartMap`** la decisión de arranque: work en el
path → `RestoreWork`; hash con ubicación → `StartByUrl`; si no → frame default
del servidor. Luego carga anotaciones y los indicadores iniciales (de la ruta,
del startup del work, o abriendo el popup de selección). `SetupMap` instancia
`LeafletApi` + `SegmentedMap` una única vez.

---

## 4. Datos de tipo "segmentos" (pares de puntos)

Un nivel cuyo dataset tiene **`Dataset.AreSegments`** contiene segmentos:
geometrías de línea que unen pares de puntos. Particularidades a conocer antes
de tocar esta forma de presentación:

- **La geometría viene con el dato**: `GetCartographyService()` devuelve
  `{ url: null }` y `SegmentsComposer.processFeature` toma
  `dataElement.Geometry` directamente. No hay merge dato/cartografía por FID.
- **Siempre usa tiles** (`useTiles()` devuelve true incluso para lo que en otro
  caso sería deck.gl).
- `SegmentsComposer` hereda de `DataShapeComposer` y redefine
  `renderPolygons`/`processFeature`. Todas las features llevan la clase
  `ls` (line string) y `patternValue` fijo en 1 (contorno).
- El estilo del trazo se engrosa con `strokeWidthScaling = 2` y los extremos
  se marcan con **markers SVG circulares** (`useSvgMarkers = true` →
  `appendSegmentMarkers` crea un `<marker>` por categoría vía
  `SvgMarkerMaker.CreateCircleMarker`, y `appendStyles` agrega
  `marker-start`/`marker-end` a la clase de cada categoría). Existe también un
  `ArrowMarker` en `SvgMarkerMaker`, hoy sin uso.
- Los previews de zoom **no** recortan SVG para segmentos
  (`PreviewHandler.AreSegments()` los excluye del recorte parcial).
- Quedan excluidos de las métricas de área (K/A/D) en `getValidMetrics` y del
  servicio de cartografía en las descargas.
- La visibilidad por categoría y la comparación entre versiones funcionan igual
  que en shapes (`labelValueIsVisible`, `Compare.CalculateDelta`).

Cualquier cambio en cómo se muestran los segmentos toca típicamente:
`SegmentsComposer`, `AbstractSvgComposer` (`appendSegmentMarkers`,
`appendStyles`, `resolveStrokeWidth`), `SvgMarkerMaker` y, si cambia el dato
pedido, `ActiveSelectedMetric.GetDataService*`.

---

## 5. `App.vue` como dueño y los globales

`App.vue` (~710 líneas, sin estilos globales) es el dueño del layout y de los objetos reactivos
raíz: `frame`, `clipping`, `metrics` (el array que `MetricsList` envuelve),
`toolbarStates`, `work`, `config`, y los árboles del panel lateral
(`sideIndicators`, `sideBoundaries`). Reparte por props a los paneles
(`SummaryPanel`, `SideToolbar`, `LeftPanel`, `MapPanel`, `WorkPanel`…) y recibe
eventos (`selectedItem`, `deselectedItem`, `selectedGroup`, `placeSelected`).

Convive con un conjunto de **globales heredados** que el código nuevo debe
conocer (y no ampliar):

- `window.SegMap` — el agregado raíz; se accede desde cualquier lado.
- `window.Popups` — instancias de popups registradas por ref, invocables con
  `window.Popups.X.show(...)`.
- `window.Panels` — panel izquierdo y estado de la ficha
  (`Content.FeatureInfoKey`, `FeatureNavigation`).
- `window.Use` — flags de configuración del servidor.
- `window.Embedded` — modo embebido (readonly, compact, qué UI se oculta).
- `window.bus` — event bus de Vue (heredado; el código nuevo comunica por
  props/eventos, no por bus).

El modo **embebido** condiciona mucha UI: cualquier control nuevo visible debe
considerar `Embedded.Readonly` / `Compact` / los `Hide*`.

### El panel lateral (`sideToolbar`)

Es la parte más nueva. `sideButtons` (botonera) + dos instancias de
**`indicatorSelector`** (indicadores, y delimitaciones en modo filtro) +
`searchPanel`. `indicatorSelector.vue` es un componente genérico de exploración
de árboles de catálogo: breadcrumb, grilla de tarjetas o listado, búsqueda con
límite de render y "Ver más", selección simple o múltiple con chips, cortes de
control colapsables, tooltips data-driven (`item.Info`), toggle de "explorar
las delimitaciones al seleccionar". Se configura por props (documentadas en el
propio archivo) y **se comparte con el módulo `table`**: cualquier cambio debe
mantener el contrato de props/eventos (`select`, `deselect`, `select-group`,
`close`, `update:multiSelect`) o coordinarse con la otra punta. Los helpers
`selectorSubtitles.js` y `selectorTooltips.js` preprocesan el árbol (subtítulos
e Info) antes de pasarlo por props.

**Desplazamiento con el panel izquierdo.** La barra de botones (`left: 20px`) y los
paneles que se abren junto a ella (`indicatorSelector` y `searchPanel`, `left: 92px`)
se corren hacia la derecha cuando se abre el panel izquierdo. `leftPanel.vue` fija
`--mp-side-offset` en `:root` (el ancho del panel en escritorio; `0px` si está
colapsado o en móvil) y cada posición se escribe como
`calc(<posición> + var(--mp-side-offset, 0px))`. Un elemento nuevo anclado al borde
izquierdo suma la misma variable; no se resuelve con una clase ni con un margen.
`$isMobile` es una función (`this.$isMobile()`): sin paréntesis es siempre verdadera.

---

## 6. Persistencia en la URL

El estado del visor se serializa en el **hash**, con formato:

    #/@<lat>,<lon>,<zoom>z&l<nivel>!r<región>!f<feature>!c<círculo>/l=<métricas>/b<basemap>/p=<panel>/f=<ficha>

`SaveRoute` mantiene una lista de **suscriptores** (un router por bloque:
`FrameRouter` `@`, `BasemapRouter` `b`, `ClippingRouter`, `SelectedInfoRouter`
`l=`, `LeftPanelRouter` `p=`, `FeatureInfoRouter` `f=`, `ZoomFeatureRouter`
`j=`). Cada router declara su formato en `GetSettings()` (firma de bloque,
separadores, key-value) y expone `ToRoute()` / `FromRoute()`. `SaveRoute`
compone los bloques y hace `pushState`; `RestoreRoute` parsea genéricamente y
delega la restauración en cada router. La escritura se puede suspender
(`Disabled`, `DisableOnce`) durante restauraciones para no ensuciar historial.

`SelectedInfoRouter` es el de mayor peso: serializa cada capa (indicador o
boundary) con **omisión de defaults** (`v` versión/es —dos índices si hay
comparación—, `a` nivel, `q` multinivel, `i` variable, `k` ranking, `m` métrica
de resumen, `u` urbanidad, `x` partición, `p` patrón, `w` visibilidades de
variables/categorías comprimidas con deflate cuando conviene, `a` pasos de
secuencia…), y en la restauración (`LoadInfos` + `RestoreMetricState`) repone
todo ese estado sobre la capa recién cargada. El criterio general es el mismo
del módulo tabla (que lo heredó de acá): **indicador por Id; versión, nivel y
variable por índice posicional; defaults omitidos**. Estos routers son la
definición canónica del formato de URL del visor; el `MapUrlBuilder` de la
tabla los replica y para aquel módulo son de solo lectura.

La variable (`i`) guarda la posición de la serie activa, pero el estado en memoria la lleva a todas las
series **por nombre**: elegirla en el panel (`metricVariables.selectVariable`) y restaurarla desde la ruta
(`RestoreMetricState`) usan el mismo `ActiveMetric.SelectVariableInAllVersions(level, index, onlyBottomLevel)`.
Así, al moverse por la serie la variable elegida se conserva aunque cada serie ordene distinto sus variables.
Si la restauración la fijara solo en la serie activa, al moverse por la serie parecería perderse. Con el nivel
de ubicaciones aparte solo se toca ese nivel; si no, los niveles que siguen al zoom. Una serie o un nivel sin
una variable con ese nombre queda como estaba, y deseleccionar (-1) deselecciona en todas.

### Anotaciones (en reactivación)

Dibujar sobre el mapa (puntos, líneas, polígonos y comentarios). Hoy solo está reactivada la interfaz; la
persistencia y las listas de elementos están **pendientes de diseño** y el código heredado sigue a medio
camino.

- **Barra superior derecha** (`widgets/summary/toolbar.vue`): un único botón «Anotaciones» (lápiz) con un menú
  desplegable de texto e ícono: Punto, Línea, Polígono y Comentario. Con una herramienta activa, el botón figura
  seleccionado (`mpDropdownMenu` prop `selected`) y el menú suma «Dejar de anotar». Se muestra con
  `Use.UseAnnotations` (`MapSettings->UseAnnotations`, desactivado por defecto), sin depender de las listas del work.
- **«Pregunta» (`Q`) ya no se ofrece.** Queda en el modelo de datos (`ann_allowed_types`) y en `ActiveAnnotations`
  hasta cerrar el diseño de las listas.
- **Sin sesión**: elegir una herramienta abre `popups/annotationsLogin.vue` («Para hacer anotaciones en el mapa
  tenés que iniciar sesión…», con Ingresar, Registrarse y Cancelar) y no activa el dibujo. Las anotaciones se
  guardan en la cuenta de quien las hace.
- **Heredado y sin terminar**: el visor llama a `CreateAnnotationForType`, `AnnotationUpdateItem`,
  `AnnotationDeleteItem` y `GetAnnotationItems`, que **no existen en servicios**; `LeafletApi` tiene un error
  (`window.SegMap.Annotations` es un arreglo, no un objeto con `UpdateItem`) y `CreateAnnotationForType` no
  devuelve la promesa. En servicios existen `draft_annotation` (lista por cartografía: título, acceso de
  invitados, tipos permitidos) y `draft_annotation_item`, más `AnnotationsModel` (solo lecturas, sin endpoints).

### Deshacer y rehacer

Dos botones, a la izquierda del resto de la barra superior derecha (`widgets/summary/toolbar.vue`, junto a
guardar, compartir y ayuda), recorren el historial de acciones del usuario. Leen su estado de
`toolbarStates.history`, que publica `UndoHistory`. Están grisados mientras no haya nada para deshacer o
rehacer; el tooltip dice qué se va a deshacer o rehacer («Deshacer: Quitar «Pobreza» (Ctrl+Z)»). Una acción
nueva borra lo que se podía rehacer. El historial guarda hasta 50 acciones y no se persiste: se pierde al
recargar.

**Qué es deshacible.** Todo cambio de estado que se serializa en la ruta (sección 6) y resulta de una
decisión del usuario, más la baja de recientes:

| Grupo | Acciones | Rótulo del tooltip |
|---|---|---|
| Capas | Agregar un indicador o una delimitación (desde el selector, el popup, la búsqueda, las sugerencias, los recientes o la ficha de un elemento) | Agregar «X» |
| | Quitar una capa | Quitar «X» |
| | Cambiar el orden de las capas | Reordenar las capas |
| | Mostrar u ocultar una delimitación | Ocultar «X» / Mostrar «X» |
| | Cambiar de serie; activar, cambiar o dejar la comparación entre series | Cambiar la serie de «X», Comparar series de «X», Cambiar las series comparadas de «X», Salir de la comparación de «X» |
| | Elegir otra variable, otro nivel (incluida la alternancia entre ubicaciones y niveles agregados) o fijar/liberar el nivel | Cambiar la variable de «X», Cambiar el nivel de «X» |
| | Cambiar la medida del resumen, la partición o el filtro de urbanidad | Cambiar la medida de «X», … la partición de «X», … el filtro de urbanidad de «X» |
| | Ocultar o mostrar categorías (clic en una categoría, deseleccionar o seleccionar todas) | Cambiar las categorías visibles de «X», Seleccionar todas las categorías de «X» |
| | Abrir el ranking, cambiar su tamaño o sentido, o cerrarlo | Abrir el ranking de «X», Cambiar el ranking de «X», Cerrar el ranking de «X» |
| | Opciones de la capa: descripciones, valores, perímetro, trama de fondo, opacidad, gradiente, pasos de una secuencia, gráfico | Cambiar las opciones de «X» |
| Recorte | Seleccionar, cambiar o quitar las regiones del recorte | Seleccionar un recorte, Cambiar el recorte, Quitar el recorte |
| | Dibujar, mover o quitar el círculo | Seleccionar un círculo, Cambiar el círculo, Quitar el círculo |
| Elemento | Clic en un elemento del mapa, de una lista, de la búsqueda o de los recientes: abre su panel y puede mover el encuadre y el zoom; cerrar ese panel | Seleccionar un elemento, Cerrar el panel del elemento |
| Mapa base | Cambiar el tipo de mapa, las capas activas del mapa base (relieve, indicadores y delimitaciones de fondo) o mostrar/ocultar las etiquetas | Cambiar el mapa base, Cambiar las capas del mapa base, Ocultar/Mostrar las etiquetas del mapa |
| Paneles | Cerrar o abrir el panel de estadísticas de la derecha | Cerrar el panel de estadísticas, Abrir el panel de estadísticas |
| | Cerrar el panel de una lista de elementos, y ocultar o mostrar el panel de información de la izquierda | Cerrar el panel de «X», Cerrar el panel de información, Abrir el panel de información |
| Recientes | Eliminar un ítem de «Visto recientemente» | Quitar «X» de recientes |

Varias capas cambiadas a la vez se resumen («Cambiar las capas», «Agregar 2 capas»).

**Qué no es deshacible.**

- Mover el mapa (arrastre, teclado) y cambiar el zoom (rueda, botones, doble clic). El encuadre solo se
  restaura junto con las acciones de recorte y de elemento seleccionado, que lo pueden mover.
- Cerrar ventanas y paneles de la barra lateral: buscar, filtrar, agregar indicador, mapa base y los popups.
  Son paneles que se reabren con su botón y no guardan información del usuario.
- Colapsar o expandir secciones dentro de un panel (categorías de una variable).
- El nivel que sigue al zoom: cuando el nivel elegido coincide con el automático antes y después, el
  cambio no es una acción, y tampoco lo que depende del nivel visible (variables, categorías, tramas).
- El nivel del recorte, que lo resuelve el zoom.
- Cargar la ruta (arranque, enlace compartido, botón atrás del navegador) y las respuestas tardías del servidor.
- Abrir popups informativos (metadatos, descargas, tutorial), buscar, exportar, mover la barra lateral
  y las preferencias guardadas en el navegador.
- Lo que se registra por efecto de otra acción, como los recientes que se agregan al sumar una capa.

**Cómo funciona.**

- `UndoHistory` (pilas, tooltips, límite) no conoce el visor: usa un *driver* con `Capture()`, `Pick()` y
  `Apply()`. `RouteStateDriver` lo implementa con los routers de `SaveRoute` (`subscribersByName`).
- Cada `SaveRoute.UpdateRoute()` que cambia la ruta llama a `History.OnRouteChanged()`: se captura el
  estado (capas con su estado por clave, mapa base, recorte, elemento, encuadre) y `UndoClassifier`
  decide, comparando con el anterior, si es una acción y cómo se llama. Es lógica pura. Una acción nueva
  no requiere tocar la interfaz: basta que actualice la ruta. Para que sea deshacible hay que revisar la
  tabla de arriba; para excluir una clave de una capa, agregarla a `IGNORED_LAYER_KEYS`.
- Solo cuenta si llega dentro de los 30 s de una interacción del usuario (`pointerdown` o `keydown`): así
  no se registran las cargas ni los cambios automáticos. `Rebase()` toma el estado actual sin registrarlo
  y reinicia esa ventana; lo llaman `RestoreRoute.LoadRoute` y `LoadInfos`.
- Cada entrada guarda la ruta anterior y los bloques afectados. Deshacer restaura solo esos bloques y
  deja en rehacer lo que había; rehacer hace lo inverso. Los bloques se restauran por `FromRoute` de cada
  router; donde la ruta no puede expresar «ninguno» se usan las operaciones de la interfaz
  (`ResetClippingCircle`, `ResetClippingRegion`, `FeatureInfoRouter.Clear`, mapa base predeterminado).
  Mientras se aplica no se registra nada y los botones quedan deshabilitados.
- `History.NoteFrame()` guarda el encuadre antes de una acción que puede moverlo
  (`InfoRequestedInteractive`, `SetClippingRegion`, `SetClippingCircle`); vale 10 s.
- Paneles con contenido: se deshace el cierre del panel de estadísticas de la derecha (`App.doToggle`) y
  el de los paneles de información de la izquierda: el de un elemento por la ruta (`FeatureInfoRouter`),
  y el de una lista y el ocultar/mostrar del panel (`leftPanel.vue`) con `RecordCustom`. Si el panel de un
  elemento se cierra junto con otra acción (quitar la capa a la que pertenecía), se restaura con ella.
  `RecordCustom` se ignora mientras se aplica otra entrada, para que lo que dispare un deshacer no se
  registre como una acción nueva.
- Atajos: Ctrl/Cmd+Z deshace; Ctrl/Cmd+Y o Ctrl/Cmd+Shift+Z rehacen (`UndoHistory.HandleKeyDown`, enlazado
  en `SegmentedMap.BindUserInputToHistory`). En campos de texto se deja el deshacer del navegador. Los
  tooltips de los botones indican el atajo.
- Una acción que no pasa por la ruta se registra con `History.RecordCustom(rótulo, deshacer, rehacer)`.
- Los cambios de capas se restauran volviendo a pedir las capas al servidor (`GetSelectedInfos`) y
  recreándolas, igual que el botón atrás del navegador.

---

## 7. Estructura de carpetas

    map/
      main.js                  Bootstrap Vue (registra componentes mp-*, crea window.bus)
      App.vue                  Raíz: layout, globales, configuración, StartMap, SetupMap (~710 líneas)
      classes/                 Comportamiento y estado (function + prototype)
        SegmentedMap.js        Agregado raíz (window.SegMap)
        StartMap.js            Decisión de arranque (work / URL / frame default)
        AbstractActiveMetric.js  Contrato informal de capa activa
        ActiveMetric.js        Base de indicadores (selección, niveles por zoom, estilos, métricas)
        ActiveSelectedMetric.js  Indicador estándar (summary, ranking, servicios, urbanidad)
        ActiveBaseMetric.js    Capa de fondo
        ActiveBoundary.js / ActiveBaseBoundary.js  Delimitaciones
        ActiveLabels.js / ActiveAnnotations.js     Etiquetas / anotaciones
        MetricsList.js         Lista de capas + segmentos de apilamiento (z-order)
        TileOverlay.js         Ciclo de vida de tiles de una capa
        TileRequest.js         Pedido dato+cartografía de un tile (cancelable, en bloque, paginado)
        Queue.js               Cola de requests con tope de concurrencia
        Clipping.js            Recorte por región / círculo / canvas
        UndoHistory.js / UndoClassifier.js / RouteStateDriver.js  Deshacer y rehacer (ver sección 6)
        Compare.js             Comparación entre versiones (deltas, labels comparables)
        Summary.js             Cálculo de valores del panel de resumen (N/I/P/K/A/D/T)
        InfoWindow.js          Fichas de elementos y navegación
        SaveRoute.js / RestoreRoute.js  Orquestación de la URL (ver sección 6)
        MapExport.js           Exportación del mapa a imagen (preview de works)
        Search.js / ParseCoordinate.js  Búsqueda de lugares y coordenadas
        MarkerCreator.js       Base de fábricas de markers
        ChartCookie.js, Tutorial.js, ActiveCatalog.js, ActiveSuggestions.js,
        OverlapRectangles.js   (solapamiento de etiquetas)
      composers/               De datos de tile a SVG/markers
        AbstractTextComposer.js, AbstractSvgComposer.js
        DataShapeComposer.js   Polígonos ('D'/'S')
        SegmentsComposer.js    Segmentos (ver sección 4)
        LocationsComposer.js   Puntos ('L')
        BoundariesComposer.js, LabelsComposer.js
        PatternMaker.js        Patrones de relleno (cañerías, líneas, puntos)
        SvgMarkerMaker.js      Markers SVG (círculo, flecha) para extremos de segmentos
        SvgMake.js             GeoJSON → path SVG (proyección 8192)
        PreviewHandler.js      Previews entre zooms (recorte/mosaico del SVG previo)
        SequenceHandler.js     Pasos de secuencia en locations
      router/                  Un router por bloque de la URL (ver sección 6)
      session/                 Telemetría de uso (Session, ContentActions, UIActions, Summary)
      leaflet/                 Integración Leaflet: LeafletApi (fachada), LeafletTileOverlay,
                               FeatureSelector (selección por click sobre tiles),
                               LeafletAnnotator, ContextMenuTools, MarkerFactory,
                               deck-gl/ (capa de puntos), pegman/ (street view)
                               BasemapLayers (mapa base raster o vectorial según la URL; también lo usa
                               `Relocate.vue` del backoffice, sin ocultar los nombres de lugares)
      overlays/                Overlays genéricos (TextOverlay, IconOverlay, PolygonOverlay)
      annotations/             MapAnnotator (alta/edición de anotaciones)
      js/                      Helpers puros: helper.js (params de servicios, formatos),
                               Mercator.js (tiles/bounds), svg.js, coordinate-parser/
      components/
        panels/                summaryPanel (derecho), leftPanel (fichas), workPanel,
                               mapPanel, popupsPanel, metricItem
        widgets/summary/       Widgets del panel derecho (metric, metricChart, ranking, clipping…)
        widgets/map/           Controles sobre el mapa (search, mapType, fullscreen, watermarks…)
        widgets/features/      featureInfo / featureList (panel izquierdo)
        widgets/sideToolbar/   sideToolbar, sideButtons, indicatorSelector (compartido con table),
                               searchPanel, selectorSubtitles.js, selectorTooltips.js
        popups/                Popups (addMetric, metricCustomize, download, embedding, tour…)
        controls/              Controles chicos reutilizables (mp-*)
        paletas/               Página interna de ejemplos de controles (/map/paletas); ver sección 9
      enums/PanelType.js
      styles/                  Hojas globales del visor y sus dos cargadores (ver sección 9, "Estilos globales")
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
- **`window.SegMap` es el punto de acceso legítimo** al agregado raíz desde
  clases y componentes; no inyectarlo ni cachearlo. En cambio, no crear
  globales nuevos ni usar `window.bus` en código nuevo: los componentes nuevos
  comunican por props/eventos (como todo `sideToolbar`).
- **Reactividad**: lo que la UI observa vive en objetos de `App.vue`
  (`frame`, `clipping`, `metrics`, `toolbarStates`) o en `properties` de las
  capas. Lo no reactivo (composer, overlay, Segment) vive en `this.objs` y se
  protege del observer (ver el `delete objs` de `MetricsList.doInsert`).
  No pasar `MapsApi` ni `SegmentedMap` por `data` de Vue.
- **Cancelación y colas**: todo pedido repetible (summary, ranking, tiles,
  navegación) usa CancelToken y, si es por tile, entra por `Queue`/
  `StaticQueue` con deduplicación. Un pedido nuevo del mismo recurso cancela el
  anterior.
- **Dueñez clara**: la mutación de una capa vive en la capa (`SelectVersion`,
  `ChangeAutomaticMultiLevelIndex`); los routers solo serializan/restauran; los
  sub-controles visuales levantan eventos y el dueño aplica.
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
- **Embedded primero**: toda UI nueva contempla `window.Embedded`
  (Readonly/Compact/Hide*) desde el diseño, no como parche.
- **`indicatorSelector` es compartido con la tabla**: cambios de contrato se
  coordinan; cambios internos deben quedar neutros para el otro consumidor.

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

### Botones (paleta `mp-`)

Los botones del visor salen de `common/styles/buttons.css`; los colores, radios
y tamaños que comparten están en `common/styles/tokens.css`. Un botón nuevo se
arma con estas clases: no se definen botones en estilos locales ni se usan
`btn`, `btn-default`, `btn-group`, `close` o `lightButton`.

| Necesidad | Clases |
|---|---|
| Botón con texto o ícono (versiones, ranking, patrones) | `mp-btn`, dentro de `mp-btn-group` |
| Ícono de 32 px en un grupo (fuente) | `mp-btn mp-btn--icon` |
| Ícono de 40 px sobre el mapa (toolbar derecha) | `mp-btn mp-btn--float` |
| Acción con borde visible (descargas) | `mp-btn mp-btn--solid` |
| Acción con borde visible en barras densas (`table`) | `mp-btn mp-btn--solid mp-btn--sm` |
| Sobre fondo de color (panel superior) | `mp-btn mp-btn--on-dark` |
| Selector con texto y caret (partición) | `mp-btn mp-btn--soft` |
| Glifo circular sin borde | `mp-icon-btn` (32 px); tamaños `--sm` 24 y `--lg` 40 |
| Tono del glifo en reposo | `--muted`, `--faint` |
| Glifo de cabecera de panel, flotado a la derecha | `mp-icon-btn mp-icon-btn--sm mp-icon-btn--ghost` |
| Cierre o limpieza "×" | `mp-icon-btn mp-icon-btn--dismiss` (`--sm` dentro de campos); para cierres de paneles, `<mp-close-button>` |
| Botón principal de la barra lateral | `mp-icon-btn--accent` |
| Cruz dentro de un chip | `mp-chip-remove` |

- `table` usa la misma paleta: sus botones de texto son `mp-btn--solid mp-btn--sm` y
  sus glifos `mp-icon-btn--sm`; no define botones propios.
- **Estado seleccionado: `is-selected`** (o `aria-pressed="true"`), nunca
  `active`. `MapExport` oculta los `exp-serie-item` que no lo tengan.
- **Accesibilidad.** Todo botón de solo ícono lleva `aria-label` (con el mismo
  texto que su `title`). Los botones de dos estados agregan
  `:aria-pressed="$ariaPressed(condicion)"`, que entrega la cadena `"true"` o
  `"false"` (Vue quita el atributo si recibe el booleano `false`); la condición
  se extrae a un método `is...Selected()` y la clase `is-selected` se deriva de
  él. El foco de teclado se dibuja con `:focus-visible`: el clic no deja el
  botón marcado, por lo que no hace falta `blur()`.
- **Contraste.** Los grises de la paleta cumplen 4,5:1 para texto
  (`--mp-text-faint`) y 3:1 para glifos (`--mp-text-ghost`); no agregar grises
  más claros para íconos o texto.
- La paleta define la apariencia; la ubicación (posición, márgenes, `float`)
  la resuelve el contenedor o el CSS local del componente.
- Los disparadores de menú son `mp-dropdown-menu` con su prop `variant`
  (`ghost`, `icon`, `float`, `pill`).
- Las clases que solo sirven de gancho para JS llevan prefijo `js-` y no
  tienen estilos (ejemplo: `js-remove-recent`).

### Estilos globales

Los estilos globales del visor están en archivos propios, repartidos por
responsabilidad; `App.vue` no tiene bloque de estilos. `index.html` no carga
Bootstrap ni Paper Dashboard, por lo que sus clases (`card`, `btn`, `modal`,
`dropdown-menu`, `badge`, `form-group`, etc.) no tienen efecto.

| Hoja | Contenido |
|---|---|
| `common/styles/tokens.css` | Variables `--mp-*` |
| `common/styles/base.css` | Reset y tipografía de los elementos sin clase (`body`, `h1`–`h6`, `a`, `label`, controles de formulario) y reglas de impresión |
| `common/styles/utilities.css` | `mp-float-right`, `mp-dimmed` y `mp-text-small` (también las carga `table`) |
| `common/styles/surfaces.css` | Tarjeta base `mp-surface` y `mp-surface--padded` (también las carga `table`) |
| `common/styles/animations.css` | `animated`, `zoomIn`, `zoomOut`, `fadeInDown`, `fadeInUp`, `fadeOutDown`, `fadeOutUp` |
| `common/styles/buttons.css` | Paleta de botones |
| `common/styles/list-items.css` | `mp-list-item` (renglón en pastilla: selector de indicadores, resultados de búsqueda) y `mp-list-row` (renglón compacto: capas, sugerencias) |
| `common/styles/chips.css` | `mp-chip` (selección), `mp-chip-filter` (etiqueta de filtro con cruz), `mp-chip-tag` (etiqueta sobre fondo oscuro) |
| `common/styles/switch.css` | `mp-switch` |
| `common/styles/search.css` | `mp-search-input`, `mp-search-icon`, `mp-search-clear`, `mp-search-spinner` |
| `common/styles/popovers.css`, `transition.css` | Popovers de v-tooltip y transiciones comunes (también las carga `table`) |
| `map/styles/tooltips.css` | Base de `.tooltip` y tooltip oscuro de los botones flotantes |
| `map/styles/icons.css` | Ancho de los íconos `.fa` |
| `map/styles/surfaces.css` | Textos internos de `mp-surface` (`.title`, `.stats`, `label`), `mp-modal*` y títulos de diálogo |
| `map/styles/menus.css` | `mp-menu` (menú de `mp-dropdown-menu`) |
| `map/styles/fields.css` | `mp-radio-inline`, `mp-field-group` y bloque `fld*` |
| `map/styles/lists.css` | `mp-badge`, filas de variables (`variableRow`) |
| `map/styles/layout.css`, `panels.css`, `map-content.css`, `export.css`, `helpers.css`, `transitions.css` | Disposición general, paneles, etiquetas y marcadores del mapa, exportación a imagen, clases auxiliares sueltas y transiciones del visor |
| `map/styles/vendor-overrides.css`, `vendor-overrides-late.css` | Ajustes sobre Leaflet y Google |

- **Orden de carga.** `map/main.js` importa `map/styles/foundation.js` antes
  que cualquier componente (tokens, base, utilidades, íconos, animaciones,
  tooltips, superficies y menús: queda en el lugar más bajo de la cascada) y
  `map/styles/index.js` después de ellos. El orden de `index.js` es
  significativo: `vendor-overrides.css` va antes de `leaflet.css` y
  `nprogress.css`, y `vendor-overrides-late.css` después, porque varias reglas
  sin `!important` dependen de ganarles o de perder contra ellas. Una hoja
  nueva se agrega en `index.js`, no con un `import` suelto.
- **Dónde va un estilo nuevo.** Se elige la hoja por su responsabilidad; si
  ninguna corresponde, se crea una y se la registra en `index.js`. `App.vue` no
  lleva estilos globales.
- Los componentes compartidos con `table` (`topPanel`, `indicatorSelector`)
  solo pueden apoyarse en hojas de `common/styles/`, porque `table` no carga
  `map/styles/`. `table/main.js` importa `tokens`, `utilities`, `surfaces`,
  `buttons`, `list-items`, `chips`, `switch` y `search`.
- `scoped` se reserva para la disposición propia del componente. Un control
  reutilizable (botón, ítem de lista, chip, campo) no define su apariencia
  localmente.
- **Hover y pantallas táctiles.** Los `:hover` de listas, tarjetas y filas
  (`mp-list-item`, `mp-list-row`, `variableRow`, tarjetas y separadores del
  selector de indicadores) van dentro de `@media (hover: hover)`: en táctil el
  hover queda aplicado al elemento donde se apoyó el dedo y, al desplazar la
  lista, parece una selección. `tests/touchHover.test.mjs` lo verifica.
- **Mostrar y ocultar bloques de alto variable.** Se envuelven en
  `<mp-collapse><div v-show="…">…</div></mp-collapse>` (también con `v-if`),
  como el detalle de cada variable (`metricVariables.vue`), el de
  «Cantidad de regiones» (`boundary.vue`) y el ranking (`metric.vue`).
  `components/controls/mpCollapse.js` anima alto, relleno vertical y opacidad
  en 250 ms con Web Animations y respeta `prefers-reduced-motion`. No agregar
  `transition: height` ni `max-height` a mano. El elemento hijo debe contener
  sus márgenes (`display: flow-root`); sus márgenes y bordes no se animan. Si
  algo debe ocurrir al terminar la apertura (p. ej. desplazar el panel hasta el
  bloque), esperar `DURACION_COLAPSO_MS`, que exporta el mismo módulo.
- No agregar `!important` fuera de `vendor-overrides*.css`; los existentes se
  retiran al tocar la regla.
- Los selectores `.title`, `.stats` y `label` dentro de `mp-surface` ya traen
  su tipografía en el visor (`map/styles/surfaces.css`); no replicarla en
  componentes.

### Página de paletas

`/map/paletas` (o `/map/#/paletas`) muestra cada control vigente con su
código. `map/main.js` la carga con `import()` dinámico, de modo que no suma al
paquete del arranque. Vive en `map/components/paletas/`: `paletasCatalogo.js`
(los ejemplos), `paletaEjemplo.vue` (muestra en vivo y código) y `paletas.vue`
(la página).

- Todo control, clase o modificador nuevo de `common/styles/` o `map/styles/`
  se agrega a `paletasCatalogo.js` en el mismo cambio. El campo `code` de cada
  ejemplo es la plantilla que se compila y la que se exhibe.
- Al retirar una clase se la quita también de sus ejemplos.
- La página usa las mismas hojas y tokens que el visor: no define controles
  propios. El prefijo `pal-` de sus estilos es solo de disposición.

## 10. Tests

Batería propia, sin framework externo, análoga a la del módulo tabla. Se corre
desde la raíz del módulo con:

    node --import ./tests/_register-alias.mjs tests/run-all.mjs

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
     como default. Las librerías vendidas en CommonJS puro con require()
     relativos reales (`js/coordinate-parser/`, lista `realRequirePrefixes`
     en `_alias-hooks.mjs`) se envuelven con un require real acotado a su
     archivo (createRequire), para testearlas con su código de verdad.
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
  - `bottomLevelApart.test.mjs` — indicadores con nivel de ubicaciones aparte:
    `HasSeparateBottomLevel`/`MultilevelCount`, opciones y selector de nivel sin
    las ubicaciones, filas de variables de ambos bloques (incluida la variable
    única sin nombre y el modo solo lectura), alternancia entre bloques e
    invariante del nivel automático ante recortes y niveles fijados.
  - `comparePoints.test.mjs` — comparación de ubicaciones: emparejamiento de
    niveles por tipo, habilitación del nivel aparte, filas visibles del bloque
    de ubicaciones, URL y parámetros de `GetMetricDataCompare` y filtrado por
    las categorías de variación.
  - `panelsHistory.test.mjs` — cierre y ocultamiento del panel izquierdo (listas, disposición, rótulos) y
    registro del cierre del panel de estadísticas. El arnés stubea `split.js`.
  - `annotationsMenu.test.mjs` — menú «Anotaciones» de la barra superior (ítems sin «Pregunta», aviso de
    inicio de sesión, estado activo) y popup `annotationsLogin`.
  - `toolbarHistory.test.mjs` — botones de deshacer y rehacer de la barra superior derecha (estado,
    tooltips con atajo, delegación en el historial). El arnés stubea `MapExport` y `authentication`.
  - `undoHistory.test.mjs` — deshacer y rehacer: clasificación de las acciones (capas,
    mapa base, recorte, elemento; lo que no es acción), pilas, tooltips, ventana de
    interacción del usuario, acciones propias, atajos de teclado, y captura y restauración
    por bloques del driver con routers falsos.
  - `segmentsComposer.test.mjs` — caracterización de la presentación de
    segmentos previa al desarrollo: geometría tomada del dato, clase `ls`,
    filtro por categoría con caché, escape de descripciones, formato del valor
    (normalizado y en comparación), `renderPolygons` (filtrado y
    parentAttributes) con `CreateSVGOverlay` espiado.
  - `routes.test.mjs` — deflate/inflate de visibilidades (ida y vuelta),
    ParseRanking, serialización de una métrica con omisión de defaults (nota:
    el bloque `w` de variables se emite aun en defaults), GetVersions con
    comparación, parsing genérico por bloques de `RestoreRoute`, frame legacy.
  - `indicatorSelector.test.mjs` — caracterización previa a la modularización:
    clasificación del árbol (`contentOf` en sus cuatro formas), delimitación
    vs agrupador, conteos, búsqueda (tildes, código exacto, dedupe por Id,
    ámbito por rama), `renderRows` (ramas antes que hojas, límite con "Ver
    más", cortes de control y colapso), selección (simple, múltiple,
    `leavesSelectionState`, `select-group` según `drillIntoElements`, modo
    filtro).
  - `helperQueue.test.mjs` — cálculo y formato de valores de `helper.js`
    (contrato de `FormatValue`), claves de tile, y `Queue` (tope de
    concurrencia, deduplicación por info, notificación de idle).
  - `mapLegend.test.mjs` — caracterización de la leyenda flotante: qué
    indicadores entran (excluye boundaries, capas base y métricas apagadas),
    la condición para omitir el nombre de variable, el filtrado de
    categorías visibles (incluida la variante con comparación activa), y
    `minimized` como computed get/set sobre `toolbarStates.legendMinimized`
    (estado compartido con `clippingLegend.vue`).
  - `clippingLegend.test.mjs` — caracterización del resumen flotante de
    clipping: coordinación con `toolbarStates.collapsed` **y**
    `toolbarStates.legendMinimized`, `regions` defensivo ante `Summary`
    ausente, `removeRegion` (réplica de `clipping.vue`, con y sin círculo de
    recorte activo) y los tres datos numéricos (población, hogares, área).
  - `segmentedMap.test.mjs` — `RefreshSummaries` contra el prototipo
    (sin instanciar la clase completa, por el peso de su constructor): se
    salta la actualización únicamente cuando `toolbarStates.collapsed` y
    `toolbarStates.legendMinimized` están ambos activos a la vez.
  - `mpCollapse.test.mjs` — hooks de entrada y salida con un elemento y una
    animación simulados: keyframes (alto, relleno vertical y opacidad), recorte
    mientras dura, orden entre aviso a Vue y `cancel()`, movimiento reducido,
    ausencia de Web Animations e interrupciones.
  - `touchHover.test.mjs` — los `:hover` de listas, tarjetas y filas están
    dentro de `@media (hover: hover)` (lectura de las hojas, sin navegador).
  - `helperUtils.test.mjs` — utilidades puras de `helper.js` no cubiertas por
    `helperQueue`: comparaciones entre períodos (`calculateCompareValue`),
    deltas con flechas (`formatDeltaValue`), encabezados de columna
    (`getColumnHeader`), formatos sueltos (`formatKm`, `formatNumOverall`,
    `formatPercent`, `quickFormat`, `ensureFinalDot/Bar`), parseo de rutas
    (`parseSingleLetterArgs`, `getSafeValue*`), urls multi-server
    (`resolveMultiUrl`, `selectMultiUrl` por seed), envelope/círculo
    (`getFrameParams`, `scaleEnvelope`, `hasCircle`) y lookups por Id.
  - `sessionActions.test.mjs` — registro de acciones para telemetría:
    `ActionManagerBase` (dedupe por valor, flag `isRegisterEnabled`,
    `RemoveIfLastIs` por nombre+tipo), `UIActions` (colapso de bounds
    consecutivos, on/off de labels), `ContentActions` (AddMetric/SelectSerie/
    SelectFeature/SelectRegions, segunda definición de `SelectBoundarySerie`
    caracterizada) y `Session` por prototipo, sin instanciar (FillStartup,
    GetTimeMs, escalera de intervalos de KeepTimer y Pulse con `setTimeout`
    reemplazado: no guarda sin actividad, limpia acciones al confirmar y
    envía `i` solo en el primer guardado).
  - `panelRouters.test.mjs` — routers no cubiertos por `routes.test.mjs`:
    `FrameRouter.ToRoute`/`calculateCenterAsCoordinate`, `BasemapRouter`
    (acumulación de n/e/tags al mapType, default no serializado, marca de
    métricas visibles), `FeatureInfoRouter` (f/l/v/x, fid viejo `[@..@]`),
    `ZoomFeatureRouter`, `LeftPanelRouter` y `ClippingRouter` (parseo de
    regiones/círculo/nivel, `clippingChanged` con su TODO Bugfix
    caracterizado, ToRoute con niveles intermedios).
  - `overlapRectangles.test.mjs` — cache de overlays por nivel de zoom: la
    primera llamada fija el zoom y descarta lo previo, solapes (incluido el
    borde compartido) y limpieza al cambiar de zoom.
  - `chartCookie.test.mjs` — preferencia del gráfico del resumen en la cookie
    `chartState` (default activado, persistencia 1/0).
  - `tileRequest.test.mjs` — ensamblado de respuestas del tile: completitud
    (data + geografía), subset, páginas concatenadas de geografía con
    gradiente, cancelación propia y delegada al bloque compartido, y reparto
    a suscriptos del bloque.
  - `coordinateParser.test.mjs` — la librería vendida `js/coordinate-parser`
    con su código real (Validator, Coordinates, CoordinateNumber): decimales,
    coma española, S/W negativos, DMS y formatos compactos. Nota: el wrapper
    `ParseCoordinate.js` del módulo no se testea (asigna globals sin
    declarar y bajo ESM/strict lanza siempre).
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

- Imports por alias `@/map/...` y `@/common/...` (`@` resuelve a `src/`). El
  framework común (`str`, `arr`, `err`, `session`, `promises`, `dom`, `web`,
  `color`, `iconManager`) vive en `@/common/framework` y `@/common/js`.
- Vue 2 con plugins: v-tooltip, v-clipboard, v-hotkey, vue-clickaway,
  vuedraggable, vue-fullscreen, vue2-touch-events, vue-mobile-detection.
  Mapa: Leaflet (+ leaflet-draw, deck.gl para puntos); SVG: svg.js +
  parse-svg; export: html2canvas/canvg.
- Arranque sin Vue Router: la URL se maneja a mano (sección 6); el work llega
  por el path (`/<workId>[/<link>]/map`).
- Los errores de servicio se reportan con `err.errDialog(código, gerundio del
  intento, error)`; los textos siguen el registro de la sección 9.
