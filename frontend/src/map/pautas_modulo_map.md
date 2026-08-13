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
- `ActiveAnnotations` — anotaciones del work (dibujos del editor).

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

### Nivel según zoom, clipping y encuadre

`ZoomChanged` recorre las capas: `UpdateLevel()` calcula el nivel adecuado
(`CalculateProperLevel`, respetando `MinZoom`/`MaxZoom`, el pin del usuario, el
último nivel excluido del multinivel cuando no es 'D', y el piso que impone el
clipping por `LevelValidFrom`). Si el nivel cambió, `UpdateMap()` reconstruye
el overlay. `FrameMoved` actualiza el envelope y dispara el resumen; el
clipping puede fijar el encuadre a una región (`SetClippingRegion`,
`FitCurrentRegion`) o a un círculo dibujado.

### Resumen y ranking (panel derecho)

`ActiveSelectedMetric.UpdateSummary()` pide `GetSummary` para el encuadre
actual y vuelca los valores en los `ValueLabels` de la variable
(`label.Values`); `classes/Summary` calcula los valores presentados según la
métrica activa (N cantidad, I incidencia, P distribución, FIL distribución
horizontal, K/A/D áreas y densidad, T total), incluida la comparación entre
versiones. `SegmentedMap.RefreshSummaries()` / `InvalidateSummaries()` los
coordinan ante cambios de encuadre. El panel derecho (`summaryPanel` →
`metricItem` → widgets de `widgets/summary/`) presenta esos objetos.

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
  `UseNewFabButton`, `UseGradients`, servidores estáticos, bloques).

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

`App.vue` (~1760 líneas) es el dueño del layout y de los objetos reactivos
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

---

## 7. Estructura de carpetas

    map/
      main.js                  Bootstrap Vue (registra componentes mp-*, crea window.bus)
      App.vue                  Raíz: layout, globales, configuración, StartMap, SetupMap (~1760 líneas)
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
      enums/PanelType.js
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
