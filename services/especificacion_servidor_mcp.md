# Especificación del servidor MCP de Poblaciones

Conector de solo lectura para que un asistente (Claude) consulte en castellano la información pública de Poblaciones.
Se apoya en los servicios existentes de `services` (ver `pautas_modulo_services.md`): agrega rutas, servicios y clases nuevas, y
hace seis cambios acotados en código existente (ver «Reutilización y reglas de negocio», sección 3).

Estado: **versión 1 implementada**, a partir del código de `services.zip` (`.gitrev` 861ba1a), el 16/11/2026. La lógica que no
depende de la base (protocolo, valores, formato, tabla por área, reglas de listado, limitador) tiene 157 pruebas que pasan. Lo
que consulta la base (`McpVisibility`, `McpCatalogService`, `McpDataService`, `TableService::GetTableMetricDataByRegions`,
`GeographyItemModel::GetNamesByIds`, `McpModel`) está escrito pero **no se ejecutó contra una base real**; lo que depende de
datos figura en la sección 11 como «a confirmar». El mapa dentro de la conversación (sección 12) está implementado, apagado por
omisión y **sin probar contra el cliente real**.

---

## 1. Alcance

**Incluye (versión 1)**

- Catálogo de indicadores y de delimitaciones públicos (los mismos que alimentan `GetFabIndicators` y `GetFabBoundaries`).
- Descripción de un indicador: series (versiones), niveles (geografías, puntos o polígonos), variables con su fórmula y sus
  categorías.
- Resumen de una región (equivalente al panel derecho del visor), datos por región y registros de un dataset, sin
  geometrías.
- Búsqueda de regiones por nombre y listado de ítems de una delimitación (por ejemplo, los departamentos de Catamarca).
- En toda respuesta, el enlace al PDF de metadatos de la cartografía de origen (o de la delimitación).

**No incluye**

- Tablas de cruce del módulo `table` (pivot entre delimitaciones y geografías) y comparación entre series: requieren cálculos
  de fórmulas cuyo resultado no puede garantizarse sin el cliente.
- Variables de brecha (`IsGap`; la opción `UseGap` del visor está desactivada por omisión).
- Tiles, geometrías, estilos, colores y leyendas.
- Listados de radios (ver 7.2) y cualquier dato privado, con enlace de acceso o no indexado.
- Escritura y autenticación de usuarios.

## 2. Protocolo

Verificado contra la documentación oficial de MCP y la de conectores de Claude el 16/11/2026.

| Aspecto | Decisión |
| --- | --- |
| Transporte | Streamable HTTP: un único endpoint, `POST /mcp` o, en un host `mcp.*` (por ejemplo `mcp.poblaciones.org`), `POST /` (la raíz); respuesta `application/json` (sin SSE). `GET` y `DELETE` responden 405. |
| Revisiones | **Doble era.** Se atiende la revisión 2026-07-28 (sin estado, sin `initialize`, con `server/discover`, encabezados `MCP-Protocol-Version`, `Mcp-Method` y `Mcp-Name`, `resultType` en los resultados, `ttlMs` y `cacheScope` en `tools/list`) y las revisiones 2025-03-26 a 2025-11-25 (con `initialize`). Los conectores alojados de Claude siguen hoy con el saludo `initialize` (a confirmar con el conector real). |
| Métodos | `initialize`, `notifications/initialized` (202 sin cuerpo), `ping`, `server/discover`, `tools/list`, `tools/call`. Con `MapAppEnabled`, además `resources/list` y `resources/read` (un único recurso `ui://`, sección 12). Capacidades declaradas: `tools` y, con `MapAppEnabled`, `resources`. |
| Sesión | Sin sesión: no se emite `Mcp-Session-Id`; si llega, se ignora. |
| Errores | De protocolo, como errores JSON-RPC (`-32700`, `-32600`, `-32601`, `-32602`; `-32022` para versión no soportada; `-32020` para encabezados inconsistentes). De herramienta, como resultado con `isError: true` y un mensaje en castellano que indica cómo corregir el pedido. |
| `Origin` | Si el encabezado llega y no figura en `McpSettings::AllowedOrigins`, 403. Si no llega, se acepta (el conector de Claude llama desde servidores de Anthropic). |
| Autenticación | Ninguna: los datos son públicos y Claude admite servidores sin autenticación. |
| Límites del cliente | Resultado de herramienta de hasta unos 150.000 caracteres y tiempo máximo de 300 s en Claude.ai y Claude Desktop. Tope propio: 100.000 caracteres por respuesta. |
| Resultado | Un único bloque `text` (Markdown compacto, ver 6). No se usa `structuredContent`, salvo con `MapAppEnabled`: entonces las herramientas con mapa devuelven en él solo los dos enlaces (`embedUrl`, `mapUrl`) para la aplicación del mapa, que el cliente no agrega al contexto del modelo. |
| Anotaciones | Todas las herramientas: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`, con `title` en castellano. |

La forma exacta de `server/discover` se verifica contra el esquema al implementar.

## 3. Arquitectura

```
Claude ──POST /mcp──► McpServer (protocolo JSON-RPC; cualquier servidor)
                         │  McpToolCatalog: definición y validación de argumentos
                         ▼
                    IMcpGateway
              ┌──────────┴───────────┐
   servidor transaccional      otro servidor (p. ej. mcp.poblaciones.org)
      McpLocalGateway             McpRemoteGateway ──HTTP──► /services/mcp/*
              │                                                    │
              └────────────► servicios McpXxxService ◄─────────────┘
                              (invocan FabService, SelectedMetricService,
                               BoundaryService, SummaryService, TableService,
                               DatasetDownloadModel, SnapshotSearchRegions)
```

- **Patrón local/remoto.** Es el mismo de `cHandle`/`cRemoteHandle` y de `WfsRemoteClient`: `McpEndpoint` elige la pasarela según
  `Settings()->Servers()->IsTransactionServerRequest()`. La remota consulta `/services/mcp/*` en el servidor transaccional
  (`GetTransactionServer()->publicUrl`) con el mismo cliente HTTP que `WfsRemoteClient::Get`.
- **Endpoints propios en lugar de reutilizar los del visor.** Las respuestas del visor traen colores, patrones, símbolos y
  estado de pantalla (por ejemplo `GetSelectedMetric`) que un asistente no necesita. Los endpoints `/services/mcp/*` devuelven
  solo lo descriptivo y llaman a los servicios existentes, sin duplicar sus reglas.
- **Estadísticas separadas.** Los servicios nuevos invocan `GetSelectedMetric` y no `PublicGetSelectedMetric`, para no
  contar las consultas del conector como selecciones de indicador en el visor (alimentan «Los más consultados»). El uso del
  conector se registra aparte (herramienta, ids, filas, milisegundos) y se muestra con `Performance::SetController('mcp', …)`.

**Reutilización y reglas de negocio.** Criterio de diseño: cada regla vive en un solo lugar, el del visor. El conector no repite
consultas ni decisiones; si una regla cambia, cambia en el servicio existente y el conector la hereda, aunque el servicio
devuelva columnas de más.

| Regla | Servicio existente que la aplica | Caché |
| --- | --- | --- |
| Catálogo de indicadores y delimitaciones | `FabService::GetFabIndicators(false)`, `GetBoundariesWithItems()` | `FabListsCache` |
| Acceso a delimitaciones (privadas) | Lo aplica `GetBoundariesWithItems()` vía `Session::IsBoundaryPublicOrAccessible` | `BoundaryVisiblityCache` |
| Acceso a cartografías (privadas o con enlace) | `Session::IsWorkPublicOrAccessible` | `WorkVisiblityCache` |
| Series, niveles, variables, fórmulas | `SelectedMetricService::GetSelectedMetric` | `SelectedMetricsMetadataCache` |
| Versiones y metadato de una delimitación | `BoundaryService::GetSelectedBoundary` | `SelectedBoundaryCache` |
| Resumen por región | `SummaryService::GetSummary` | `SummaryCache` |
| Datos por área de un nivel | `TableService::GetTableMetricData` (sin región) | `TableMetricDataCache` |
| Registros de un dataset y su filtro por región | `DatasetDownloadModel::PrepareFileQuery` | — |
| Etiquetas de valor de columnas | `DatasetDownloadModel::GetColumnLabels` (el de la descarga) | — |
| Búsqueda de regiones | `SnapshotSearchRegions::SearchClippingRegions` | — |

Cambios en código existente (todos aditivos):

1. `TableService`: se extrajo `CreateLevelTable` (cómo se lee un nivel como tabla), que ahora comparten el visor y el conector, y se
   agregó `GetTableMetricDataByRegions` (mismos datos, limitados a regiones, sin caché).
2. `GeographyItemModel`: `GetNamesByIds` (código, nombre y unidad superior de ítems de geografía).
3. Nombres de término (numerador y denominador) de cada variable: `VariableModel::GetByVersionLevelId` trae las etiquetas de las
   columnas, `Variable::GetTermCaptions` los resuelve con la lógica de la fórmula y `VariableInfo` los guarda
   (`DataCaption`, `NormalizationCaption`; se completan en `SelectedMetricService::AddVariables`). El visor los ignora.
4. `Links::GetWorkMetricUrl`: acepta varias regiones separadas por coma (antepone un bloque de encuadre vacío, ver sección 12) y los
   parámetros de inserción del visor antes del `#`. Con los argumentos anteriores devuelve lo mismo que antes.
5. `Router::ProcessPath`: `mcp` se agrega a las rutas reservadas. Sin esto, el enrutador reenvía `/mcp` como subpedido y se
   pierden el cuerpo y los encabezados del POST.
6. `SilexApp`: `RouteProxy::host()`, para registrar una ruta restringida a un host (la usa la raíz de `mcp.*`, sección 10).

La única consulta propia es `McpModel::CountSnapshotRows`, que permite rechazar un listado enorme antes de leerlo.

**Archivos nuevos**

| Ruta | Contenido |
| --- | --- |
| `routes/api/mcp.php` | `/mcp` y, solo para un host `mcp.*`, `/` (todos los métodos HTTP; el protocolo responde 405 a los que no admite). Se carga con `isAPIEnabled` y `Mcp()->Enabled`, antes que las rutas del frontend. |
| `routes/frontend/mcp.php` | `/services/mcp/*` (operaciones `catalog`, `indicator`, `boundary`, `regions`, `boundaryItems`, `summary`, `map`, `data`, `records`); se carga en el bloque del servidor transaccional de `routes/frontend.php`. |
| `src/services/mcp/McpEndpoint.php` | Une el protocolo con el framework: elige la pasarela y atiende `/services/mcp/*`. |
| `src/services/mcp/McpIndicatorTable.php` | Tabla por área con valores resueltos, orden y paginación. Sin acceso a base. |
| `src/services/mcp/McpListingRules.php` | Restricciones de listado (7.2). Sin acceso a base. |
| `src/services/mcp/McpRateLimiter.php` | Límite global de pedidos por minuto (10) y reconocimiento de las rutas y del host del conector. |
| `src/services/mcp/McpDescriptionFormatter.php` | Texto de catálogo, indicadores, delimitaciones y resumen. Sin acceso a base. |
| `src/db/frontend/McpModel.php` | `CountSnapshotRows`. |
| `src/services/mcp/McpServer.php` | Protocolo: despacho de métodos, negociación de versión, errores. |
| `src/services/mcp/McpToolCatalog.php` | Definición de las herramientas (nombre, título, descripción, esquema, anotaciones) y validación de argumentos. |
| `src/services/mcp/IMcpGateway.php`, `McpLocalGateway.php`, `McpRemoteGateway.php` | Pasarela hacia los datos. |
| `src/services/mcp/McpCatalogService.php` | Catálogo, descripción de indicadores y delimitaciones, ítems, regiones. |
| `src/services/mcp/McpDataService.php` | Resumen, datos de indicador, registros de dataset. |
| `src/services/mcp/McpVisibility.php` | Qué se expone (ver 7.1). |
| `src/services/mcp/McpMapRoute.php` | Ruta del visor (índices de serie y nivel, nivel fijo, partición, regiones) y opciones de inserción. Sin acceso a base. |
| `src/services/mcp/McpMapApp.php` | Aplicación de MCP Apps (recurso `ui://poblaciones/mapa`). Sin acceso a base. |
| `src/services/mcp/McpProtocolLog.php` | Registro opcional de los métodos recibidos (`mcp/protocol.log`, 12.5). Sin acceso a base. |
| `src/services/mcp/McpValues.php` | Cálculo de valores resueltos (ver 5). Sin acceso a base: se prueba sin entorno. |
| `src/services/mcp/McpTextFormatter.php` | Diccionario y CSV (ver 6). Sin acceso a base. |
| `src/classes/settings/McpSettings.php` | Ajustes (ver 8); se accede con `App::Settings()->Mcp()`. |
| `src/tests/mcp/` | Pruebas (ver 9). |

## 4. Herramientas

Los nombres y parámetros están en inglés; las descripciones, los títulos y los textos de respuesta, en castellano. Los
parámetros de los endpoints internos usan nombres completos (`indicatorId`, `regionIds`), no letras sueltas: es una API nueva,
sin cliente heredado. Los ids son los **públicos** (los mismos que usa el visor). Sirven solo para llamar a las herramientas: los textos
de datos (resumen, datos, registros, mapa) nombran todo por su nombre, y la guía indica al asistente no mostrar ids al usuario. Los ids
quedan en el catálogo y en las descripciones, que el asistente necesita para encadenar las llamadas.

| # | Herramienta | Parámetros | Devuelve |
| --- | --- | --- | --- |
| 1 | `get_catalog` | ninguno | Guía de conceptos, indicadores por grupo y proveedor (id, nombre, series, niveles, enlace a metadatos) y delimitaciones con sus ítems (ver 4.1). **Es la primera llamada de toda consulta.** |
| 2 | `describe_indicator` | `indicator_id` | Series; por serie: cartografía de origen, enlace al PDF de metadatos, niveles y, por nivel, variables con fórmula y categorías, particiones y extensión. |
| 3 | `describe_boundary` | `boundary_id` | Versiones, enlace al PDF de metadatos de cada una, cantidad de ítems. |
| 4 | `find_regions` | `query` | Hasta 10 regiones cuyo nombre coincide (id, nombre, tipo, ubicación), listas para usar como `region_ids`. |
| 5 | `list_boundary_items` | `boundary_id`, `parent_id`?, `query`?, `limit`?, `offset`? | Ítems de una delimitación (id, código, nombre, padre), para las delimitaciones que `get_catalog` no incluyó por tamaño. |
| 6 | `show_map` | `indicator_id`, `version_id`, `level_id`, `region_ids`?, `partition`? | Enlace al mapa del visor con la serie, el nivel, la partición y las regiones indicadas y, con `MapAppEnabled`, el mapa incrustado (sección 12). No devuelve valores. |
| 7 | `get_indicator_summary` | `indicator_id`, `version_id`, `level_id`, `region_ids`, `partition`? | Valores agregados de la región, por variable y categoría. |
| 8 | `get_indicator_data` | `indicator_id`, `version_id`, `level_id`, `region_ids`?, `partition`?, `sort_by`?, `order`?, `limit`?, `offset`? | Una fila por área con el valor de cada variable (diccionario y CSV). |
| 9 | `get_dataset_records` | `indicator_id`, `version_id`, `level_id`, `region_ids`?, `partition`?, `columns`?, `limit`?, `offset`? | Registros del dataset del nivel (por ejemplo, las escuelas de Catamarca), sin geometrías (diccionario y CSV). |

### 4.1 `get_catalog` y la inicialización del asistente

- **Disparador.** La descripción indica que se use al comenzar cualquier consulta sobre Poblaciones («quiero consultar
  información en Poblaciones», «datos de…», «indicadores de…»). El mismo texto se publica en el campo `instructions` de
  `initialize` y `server/discover`.
- **Contenido.** (a) Guía breve del modelo: *indicador* → *series* (versiones, por ejemplo años) → *niveles* (un dataset por
  geografía: puntos, radios, departamentos, provincias o polígonos) → *variables* (subindicadores con fórmula; pueden ser
  categorías). (b) Qué es un recorte por región y cómo se pide (`region_ids`). (c) Cuándo usar resumen, datos y registros.
  (d) Regla de citación: toda respuesta debe mencionar la cartografía de origen y su enlace de metadatos. (e) Mapas: ante un pedido de
  ver los datos en un mapa se llama a `show_map`, y no se responde que el mapa no se puede mostrar. (f) Los ids no se muestran al usuario.
  (g) Lo que el conector no hace. (h) Catálogo de indicadores. (i) Delimitaciones.
- **Delimitaciones.** Cada delimitación se lista con id, nombre, grupo, versiones y enlace de metadatos. Las que tienen hasta
  `InlineBoundaryItemsLimit` ítems (800 por omisión) se incluyen completas, en líneas `id|código|nombre|id_padre`, de modo que el
  asistente pueda usar esos ids como filtro sin otra consulta. Para el resto se informa la cantidad y se indica
  `list_boundary_items` o `find_regions`. El texto aclara cuáles se incluyeron completas.
- **Tamaño.** Debe quedar por debajo de `MaxResponseChars`; si el catálogo lo superara, se reduce `InlineBoundaryItemsLimit`
  (a confirmar con datos reales, sección 11).

## 5. Valores: qué se calcula en el servidor

El asistente no debe hacer aritmética de fórmulas, pero tampoco recibe un resultado que oculte las cantidades que lo componen:
en toda variable normalizada el servidor entrega el **resultado**, la **cantidad** (numerador) y la **base de cálculo**
(denominador), con el nombre de cada término. Así, ante un 5 % de NBI el asistente informa cuántos hogares son y sobre qué
total, y ante una densidad (población / km²) obtiene la población sin deducirla.

Verificado en `Variable.php` y en los snapshots: por área y variable se guardan `Value` (término de datos) y `Total`
(término de normalización). El valor final de una variable normalizada es `Value × NormalizationScale / Total`; si no está
normalizada, es `Value`. Las variables categóricas aportan `1` por registro y se separan por categoría (`LID`).

| Caso | Regla |
| --- | --- |
| Variable normalizada | `resultado = Value × escala / Total`; vacío si `Total` es 0 o nulo. Se informan además `cantidad = Value` y `base = Total`, aunque el resultado quede vacío. La unidad sale de la escala (100: porcentaje; 1.000: cada mil; 10.000; 100.000; 1.000.000; 1: razón). |
| Variable sin normalización | `valor = Value`, que es a la vez la cantidad (una matrícula, un conteo de escuelas). |
| Nombre de los términos | `Variable::GetTermCaptions` (la misma lógica que arma la fórmula): `SpecialColumnToLabel` para columnas especiales («Población total», «Hogares», «Área km²», «Conteo») y la etiqueta de la columna (`dco_label`, o su nombre técnico si no tiene) para las demás. Viaja en `VariableInfo` (`DataCaption`, `NormalizationCaption`). Si el indicador estaba cacheado antes del cambio, los campos vienen vacíos y el texto usa «base de cálculo» y el nombre de la variable hasta que la caché se renueve. |
| Formato de cantidades y bases | Nunca se redondean a enteros: mínimo dos decimales sin ceros finales (una base de 1,84 km² no pasa a 2). |
| Variable categórica (`IsCategorical`) | Una columna por categoría con el recuento; la columna de total es la suma de las categorías. |
| Resumen, variable numérica | Los grupos del resumen son rangos de clasificación: se suman `Value` y `Total` de todos los grupos y se resuelve una sola vez con la regla anterior. Se informa la cantidad de elementos (`Areas`: «Áreas», «Puntos» o «Zonas» según el tipo de nivel) y la superficie (`Km2`, solo si es mayor que 0). |
| Resumen, variable categórica | Por categoría: recuento, elementos y participación sobre el total de la variable, más una línea con el total de las categorías. |
| Tabla por área (`get_indicator_data`) | Por variable normalizada, tres columnas: resultado, `<nombre>_cantidad` y `<nombre>_base_de_calculo`; el diccionario nombra el numerador y el denominador. |
| Variable de brecha | Excluida en la versión 1; `describe_indicator` la marca como no disponible. |

**A confirmar:** la equivalencia exacta con `classes/Summary.js` del visor (cantidad, incidencia, distribución, área y
densidad), cuyo código no está en `services.zip`. Hasta confirmarla, el resumen declara en el diccionario cómo se calculó cada cifra.

## 6. Formato de los datos: diccionario más CSV en un solo texto

**Recomendación.** Cada respuesta de datos es un único texto con tres partes: encabezado, diccionario y CSV. Se descartan
dos alternativas:

- *CSV solo con nombres cortos*: pierde el significado de las columnas y el asistente tiende a interpretarlas mal.
- *JSON de objetos por fila*: repite los nombres en cada fila y consume bastante más tokens que el CSV (a medir con datos reales).

```
# Mortalidad infantil · Departamentos · 2022
Fuente: cartografía «Estadísticas vitales 2022» · Metadatos (PDF): https://…/services/metadata/GetWorkMetadataPdf?w=1234
Mapa: https://…/map/1234/#/&!r19166/l=6301!v0!a1!l1
Regiones: Catamarca
Filas 1–16 de 16 · fin del listado

## Diccionario
| columna | descripción | tipo | detalle |
| codigo | Código del departamento | texto | |
| nombre | Nombre del departamento | texto | |
| tasa_mortalidad_infantil | Tasa de mortalidad infantil | número | por mil nacidos vivos; fórmula: [Defunciones menores de 1 año] / [Nacidos vivos] (n cada mil); 1 decimal |
| tasa_mortalidad_infantil_cantidad | Cantidad de Tasa de mortalidad infantil (numerador): Defunciones menores de 1 año | número | Numerador del cociente |
| tasa_mortalidad_infantil_base_de_calculo | Base de cálculo de Tasa de mortalidad infantil (denominador): Nacidos vivos | número | Denominador del cociente |

## Datos (CSV)
codigo,nombre,tasa_mortalidad_infantil,tasa_mortalidad_infantil_cantidad,tasa_mortalidad_infantil_base_de_calculo
10007,Ambato,8.2,2,244
```

Reglas del CSV: UTF-8, coma como separador, comillas dobles con duplicación para escapar, punto decimal, vacío para valores
ausentes, sin separador de miles; los códigos se emiten como texto y las categorías, como su etiqueta (el código figura en
el diccionario). Los encabezados de columna son nombres estables en minúsculas sin tildes (derivados del nombre de la
variable, con el id como sufijo solo si hay colisión). El diccionario precede siempre a los datos.

**Tamaño y continuidad.** Cada respuesta se corta antes de superar `MaxResponseChars` (100.000) o `limit` filas (200 por
omisión, 1.000 como máximo). Si hay más, el encabezado informa `Filas 200 de 531 · continúa con offset=200`. El orden es
determinista (por nombre o por la variable indicada en `sort_by`) para que la paginación sea estable.

## 7. Reglas de exposición y restricciones

### 7.1 Qué se expone

`McpVisibility` aplica las reglas de acceso del visor (`Session`), sin reglas propias. El conector no envía credenciales ni
enlace de acceso, de modo que ve lo que vería un visitante anónimo (`/mcp` no abre sesión, ver 10):

- **Indicador:** figura en el catálogo público (`FabService::GetFabIndicators(false)`).
- **Serie:** `Session::IsWorkPublicOrAccessible` sobre su cartografía. Excluye las privadas y las que tienen enlace de acceso
  (el catálogo del visor las lista, y solo se abren con el enlace). Se aplica en el catálogo y en `describe_indicator`.
- **Delimitación:** la que entrega `FabService::GetBoundariesWithItems()`, que ya filtra las privadas.
- **Región (`region_ids`):** cada id debe pertenecer a una delimitación expuesta; se valida contra los ítems del catálogo, que
  también aportan el nombre de la región para las respuestas.
- **Regiones combinadas.** Si se pasan regiones superpuestas (una provincia y uno de sus departamentos) los valores se
  duplican, como en el visor. La guía del servidor indica usar regiones de una misma delimitación.

### 7.2 Restricciones de uso

1. **Radios.** `get_indicator_data` y `get_dataset_records` rechazan los niveles cuya geografía figure en
   `ListingRestrictedGeographyIds`, con un mensaje que indica usar el resumen o abrir el mapa (se incluye el enlace). El
   resumen sí se permite. Se necesita el id de la geografía de radios (a confirmar).
2. **Volumen sin recorte.** Si el pedido no trae `region_ids` y el nivel tiene más de `MaxListableRows` filas (20.000 por
   omisión), se rechaza y se pide una región.
3. **Sin geometrías.** Nunca se devuelven polígonos ni líneas. En niveles de puntos se devuelven latitud y longitud solo si son
   columnas del dataset.
4. **Particiones obligatorias.** Si el nivel exige partición (`Partitions->Mandatory`) y no se indica, el error lista los valores.
5. **Círculos de recorte.** No se ofrecen (no usan la caché del servidor y son costosos).

## 8. Configuración (`McpSettings`)

Todo con valor seguro por omisión, asignado en `config/settings.php` y declarado en `settings.php.sample`.

| Propiedad | Por omisión | Uso |
| --- | --- | --- |
| `Enabled` | `false` | Habilita `/mcp` y `/services/mcp/*`. |
| `AllowedOrigins` | `['https://claude.ai', 'https://claude.com']` | Validación de `Origin`. |
| `MaxResponseChars` | `100000` | Tope de caracteres por respuesta. |
| `DefaultRows` / `MaxRows` | `200` / `1000` | Filas por llamada. |
| `MaxListableRows` | `20000` | Tope de filas de un nivel sin recorte. |
| `MaxDefaultColumns` | `40` | Si un dataset tiene más columnas y no se pide `columns`, se entrega solo el diccionario. |
| `MaxCallsPerMinute` | `600` | Límite global de pedidos por minuto en cada servidor (10). |
| `MapAppEnabled` | `false` | Ofrece el visor dentro de la conversación (MCP Apps, sección 12). |
| `InlineBoundaryItemsLimit` | `800` | Ítems por debajo de los cuales una delimitación se incluye completa en el catálogo. |
| `ListingRestrictedGeographyIds` | `[]` | Geografías cuyo listado se rechaza (radios). |
| `ProtocolLogEnabled` | `false` | Registra cada método recibido en `GetStorageCaches()/mcp/protocol.log` (diagnóstico, 12.5). |

## 9. Pruebas y verificación

- **Sin base ni `Context`** (157 pruebas, se ejecutaron): despacho de métodos y errores de `McpServer`; negociación de versión
  en ambas eras; validación de argumentos; `McpValues` (normalizado, categórico, agregación del resumen, división por cero);
  `McpTextFormatter` (escape de CSV, nombres de columna, diccionario, corte por tamaño y por filas, continuidad);
  `McpIndicatorTable` (valores resueltos, orden, nulos al final, paginación, columnas por categoría); reglas de 7.2;
  `McpRateLimiter` (rutas y host `mcp.*`); `show_map`; la aplicación del mapa (`McpMapApp`: claves de `_meta`, regla `[hidden]`, tamaño inicial); el registro de protocolo (`McpProtocolLog` y el detalle que arma `McpServer`). Más `php -l` de cada archivo. Las pruebas están escritas para PHPUnit 9.6 (suite en `src/tests`).
- **Con base** (las ejecuta quien tiene el entorno; se entregan escritas): `McpVisibility`, catálogo, resumen, datos y
  registros contra datos de muestra; comparación del resumen con el panel del visor para una región conocida.
- **Manual:** MCP Inspector contra `/mcp` y alta como conector personalizado en Claude con una consulta de cada herramienta.

## 10. Operación

- **Tráfico (decidido).** El hook `before` de `routes/routes.php` registra cada pedido por IP con `Traffic::RegisterIP`, y al
  superar el límite diario bloquea con 429 hasta medianoche. Los pedidos del conector llegan desde un rango reducido de
  direcciones de Anthropic compartido por todos los usuarios, y los del servidor remoto, desde una sola IP: se bloquearían entre
  sí. Por eso los pedidos a `/mcp` y `/services/mcp/*` no se registran en `Traffic` y los acota `McpRateLimiter` (contador por
  minuto en un archivo bajo `GetStorageCaches()/mcp`, con `flock`; al superar `MaxCallsPerMinute` responde 429 con
  `Retry-After: 60`). El límite es por servidor: lo cuentan tanto el que atiende `/mcp` como el transaccional.
- **Sin sesión.** Para esas rutas `routes/routes.php` no abre la sesión PHP: sin cookie, cada llamada crearía un archivo de sesión.
- **Host `mcp.*`.** Un servidor cuyo host empieza con `mcp.` se dedica al conector, que atiende en la raíz: `routes/api/mcp.php`
  registra `/` restringida a ese host (`host('mcp.{domain}')`, `domain` = `.+`), y `routes/routes.php` carga ese archivo antes que
  `authenticate.php`, `dev.php` y `frontend.php`, que también definen `GET /` (en Symfony gana la primera ruta que coincide). Todo
  pedido a un host `mcp.*` se trata como del conector (sin sesión, fuera de `Traffic`, con el límite propio), y el pedido a su raíz
  se contabiliza con el mismo controller de estadísticas que `/mcp` (`Performance::SetController('mcp', método, true)`). Los demás
  hosts no cambian: `/` sigue siendo el frontend. El reconocimiento no distingue mayúsculas ni puerto. Quedan sin atender por esta
  vía los pedidos que no sean del protocolo, porque el servidor es el mismo de la aplicación: el nombre `mcp.*` debería apuntar a un
  servidor dedicado, o restringirse en el servidor web a la raíz.
- **Cambios en `routes/routes.php`:** detección del conector (`McpRateLimiter::IsMcpRequest`, `IsMcpRoot`), omisión de sesión y de
  `Traffic`, controller `mcp` para la raíz del host, y chequeo del límite tras `Performance::ResolveControllerFromUri()`; el
  `require_once('api/mcp.php')` pasa antes de `authenticate.php`.
- **Caché.** Las listas se apoyan en `FabListsCache` y `SelectedMetricsMetadataCache`; el resumen reutiliza `SummaryCache`.
  Los datos por región se cachean con la misma invalidación de `CacheManager` (una caché nueva se agrega también a la limpieza).
- **Despliegue.** `McpSettings::Enabled` apagado en los servidores que no atienden el conector. El servidor del conector solo
  necesita `Servers()->GetTransactionServer()` configurado.

## 11. Decisiones tomadas y puntos a confirmar

**Tomadas (con la razón)**

1. Un único texto Markdown por respuesta, con diccionario y CSV (sección 6).
2. Sin autenticación: datos públicos y soporte explícito de Claude para servidores sin autenticación.
3. Endpoints internos propios y desacoplados del visor; descriptores sin colores ni estado de pantalla.
4. Nombres de herramientas y parámetros en inglés; textos en castellano rioplatense formal.
5. Sin pivot, sin comparación entre series y sin variables de brecha en la versión 1.
6. Ranking cubierto con `sort_by`, `order` y `limit` de `get_indicator_data`, sin una herramienta aparte.
7. Reutilización antes que reimplementación: reglas de acceso, catálogos, datos por área, registros y etiquetas se obtienen de los
   servicios cacheados del visor (tabla de la sección 3). La consulta propia se limita a contar filas.
8. Tráfico: rutas del conector fuera de `Traffic`, con límite global propio y sin sesión (sección 10).
9. Las variables de brecha no se exponen; el resumen lo informa en `notes`.
10. En `get_dataset_records` los valores con etiqueta se muestran como texto, y el diccionario lista las etiquetas (hasta 12).
    Las columnas usan el nombre técnico de la variable, el mismo de las descargas y del PDF de metadatos.
11. El conector no destruye la cantidad al resolver la fórmula: toda variable normalizada entrega resultado, cantidad y base,
    con el nombre de cada término (sección 5). La guía del conector indica informar siempre los tres.
12. El enlace de mapa de las respuestas de datos reproduce la consulta: indicador, serie, nivel (fijado), partición y regiones
    (sección 12). La aplicación del mapa está apagada por omisión (`MapAppEnabled`) hasta probarla con el cliente real.
13. Los ids no se muestran a las personas: los textos de datos usan nombres, y la guía lo indica (hallazgo de una prueba con el
    conector, en la que el asistente citó «cartografía … (id 274101)»).
14. `show_map` como herramienta propia: en una prueba con el conector, ante «¿podrás mostrarme eso con un mapa?» el asistente
    respondió que no podía dibujarlo y solo dio el enlace. La guía ahora indica llamar a `show_map` y no negar el mapa.
15. Host `mcp.*` atendido en la raíz, con el mismo controller de estadísticas que `/mcp` (sección 10). El ruteo por host se verificó con
    el componente Symfony Routing 5.4 real, fuera del proyecto: `mcp.*` (sin distinguir mayúsculas ni puerto) llega al conector;
    `poblaciones.org` y `next.poblaciones.org` siguen en el frontend; `mcp.` y `mcpx.*` no coinciden.
16. El texto de `show_map` no afirma que el mapa se vea: el cliente no informa si incrustó la vista, y una segunda prueba mostró al
    asistente diciendo «arriba está el mapa» sin que se hubiera abierto nada. El texto y la guía le indican no afirmarlo ni decir «arriba»,
    y entregar siempre el enlace. Además, la página de la vista ofrece abrir el mapa cuando el cliente no permite incrustarlo (12.3).
17. Registro de protocolo opcional (12.5) y doble clave de `_meta` (12.3): tras una segunda y una tercera prueba sin que el mapa se abriera, y sin error visible
    en el servidor, se agregó un modo de diagnóstico que permite distinguir si el cliente negocia aplicaciones y pide el recurso. Apagado por omisión.

**A confirmar**

1. Id de la geografía de radios (y de otras que convenga restringir).
2. Tamaño real de las delimitaciones, para ajustar `InlineBoundaryItemsLimit`.
3. Equivalencia del resumen con `classes/Summary.js`.
4. Qué revisión del protocolo envía hoy el conector de Claude (se prevé `initialize`).
5. Hospedaje de `mcp.poblaciones.org`: qué servidor lo atiende y si hay un servidor transaccional accesible desde él.
6. Política de tráfico para las IP de Anthropic (sección 10).
7. Si los datasets de puntos exponen siempre `geography_item_id`: la descarga lo usa para filtrar por región (`DatasetDownloadModel`).
8. Que `routes.php` se incluya en el ámbito esperado por la captura `use ($isMcpRequest, $isMcpRoot)` del hook `before` (se verificó solo la sintaxis).
9. Costo en frío del catálogo: `get_catalog` llama a `BoundaryService::GetSelectedBoundary` por cada delimitación; después queda cacheado.
10. Que un usuario con sesión de lector del sitio que llame a `/mcp` desde el navegador vea también lo privado (regla de `Session`, igual que el visor).
11. Renovación de `SelectedMetricsMetadataCache` tras publicar el cambio de la sección 5, para que los nombres de término lleguen a los indicadores ya cacheados.
12. Que el cliente de Claude muestre la aplicación del mapa: el recurso y el protocolo de MCP Apps se escribieron según la
    especificación publicada y se probaron con un simulador, no con el cliente (sección 12).
13. Que el visor reconozca la ruta con varias regiones (`#/@&!r1,2/…`): se dedujo de `RestoreRoute` y los routers, sin ejecutarlo.
14. Posiciones de serie y nivel para lectores con sesión: el visor numera las series que ve el usuario (`RemovePrivateVersions`); el
    conector, las que ve un visitante anónimo. Si una serie privada precede a la consultada, la posición puede correrse.
15. Que el asistente llame a `show_map` ante pedidos de mapa y que el cliente lo muestre incrustado: lo primero depende del modelo; lo segundo, de `MapAppEnabled` (apagado por omisión), del soporte de MCP Apps del cliente y de las condiciones de 12.4 (sitios incrustados en conectores personalizados). Sin eso, `show_map` entrega el enlace.
16. Que `HTTP_HOST` llegue con el nombre `mcp.*` al servidor (por ejemplo, detrás de un proxy inverso que lo reescriba): el reconocimiento usa `HTTP_HOST`, no `X-Forwarded-Host`.
17. Qué muestra `protocol.log` con el cliente real (`apps=si` o `apps=no` en `initialize`, y si se pide `resources/read`), y si el conector estaba cacheado con una lista de herramientas anterior (12.4).

## 12. Ruta del visor y mapa dentro de la conversación

### 12.1 Ruta completa

El formato lo define `map/classes/SaveRoute.js` y lo leen `RestoreRoute` y los routers del visor. La ruta es lo que sigue al `#`, en
bloques separados por `/`:

```
#/@<lat>,<lon>,<zoom>z&l<nivel de recorte>!r<ids de región>/l=<indicador>!v<serie>!a<nivel>!l1!x<partición>
```

| Parte | Significado | Uso en el conector |
| --- | --- | --- |
| `&!r<ids>` | Recorte por región (`ClippingRouter`; ids separados por coma). Sin bloque `@`, el visor encuadra la región. | Las regiones consultadas. |
| `@&!r<ids>` | Igual, con encuadre vacío. | Cuando hay varias regiones: sin el `@`, `FrameRouter` leería el bloque `&…` como encuadre y fijaría el zoom en 14. |
| `l=<indicador>` | Indicador (`SelectedInfoRouter`). | `indicatorId`. |
| `!v<serie>` | **Posición** de la serie en la lista del indicador (no su id). | Posición en `SelectedMetricService::GetSelectedMetric`, la misma lista que carga el visor. |
| `!a<nivel>` | **Posición** del nivel en la serie. | Ídem. |
| `!l1` | Nivel fijado: el visor no lo cambia con el zoom. | Si la serie tiene más de un nivel. |
| `!x<partición>` | Valor de la partición elegida. | `partition`. |
| `!i<variable>` | Posición de la variable. | No se usa: el resumen abarca todas. |

`McpMapRoute` arma el bloque del indicador y `McpLinks::WorkMap` lo une con `Links::GetWorkMetricUrl`, de modo que la ruta se
escribe en un solo lugar. Ejemplo: `/map/3501/#/&!r19166/l=6301!v2!a1!l1`. `describe_indicator` entrega, por serie, el enlace con `!v`;
los resultados de resumen, datos y registros, el de la consulta completa.

### 12.2 Parámetros de inserción

`embedding.vue` agrega al enlace, antes del `#`: `emb=1` (modo insertado), `co=1` (compacto: sin buscador, panel derecho,
agregado de indicadores ni panel de la cartografía), `ns`, `na` y `np` (ocultar buscador, agregado y panel derecho), `ro` (estático) y
`oc` (abrir al hacer clic). El visor activa el modo insertado también por sí mismo dentro de un iframe (`inIframe` en `App.vue`).
El conector usa `emb=1&co=1` (`McpMapRoute::EMBED_OPTIONS`) y entrega el resultado como `source.embedUrl`.

### 12.3 Aplicación de MCP Apps

Con `MapAppEnabled`, el servidor implementa la extensión MCP Apps (clientes con soporte: Claude y otros):

- `tools/list`: `show_map`, `get_indicator_summary`, `get_indicator_data` y `get_dataset_records` declaran `_meta.ui.resourceUri = "ui://poblaciones/mapa"`
  y, además, la clave plana `_meta["ui/resourceUri"]` con el mismo valor. La forma plana está deprecada en la especificación y se eliminará antes de la
  versión final, pero el SDK oficial todavía la emite y hay clientes que solo leen esa; se envían ambas.
- `resources/list` y `resources/read`: un único recurso, de tipo `text/html;profile=mcp-app`, con `_meta.ui.csp.frameDomains` igual al origen
  del visor (`McpLinks::ViewerOrigin`; sin eso el cliente no permite el iframe anidado) y `prefersBorder`.
- `tools/call`: junto al texto, `structuredContent = { embedUrl, mapUrl }`. `show_map` existe para que el asistente tenga una acción
  explícita ante un pedido de mapa: valida el pedido como las demás herramientas, no calcula valores y, sin `MapAppEnabled` o con un
  cliente sin soporte, entrega igualmente el enlace «Mapa».
- La página (`McpMapApp`, JavaScript sin dependencias) hace el saludo `ui/initialize` y `ui/notifications/initialized` y lee de la
  respuesta los orígenes que el cliente permite (`hostCapabilities.sandbox.csp.frameDomains`). Al llegar `ui/notifications/tool-result`:
  si el origen del visor está cubierto (o el cliente no informó la lista), carga `embedUrl` en un iframe de 460 px de alto; si no, muestra
  «El cliente no permite mostrar el mapa dentro de la conversación» con un botón que envía `ui/open-link` (el cliente pide confirmación
  al usuario) y la dirección del mapa. Avisa su tamaño con `ui/notifications/size-changed`, también inmediatamente después del saludo, para que el cliente no deje la vista con alto cero
  (en la documentación de Claude, una vista invisible suele deberse a un iframe de alto cero o a la falta de `connect`). El elemento oculto usa
  `[hidden] { display: none !important; }`: la regla `display: block` del iframe anulaba el atributo `hidden` y dejaba visible un marco vacío.
- Los clientes sin soporte ignoran `_meta.ui`: el texto y el enlace `Mapa:` siguen siendo la respuesta completa.
- **Comprobación en el servidor:** `POST` al endpoint con `{"jsonrpc":"2.0","id":1,"method":"resources/list"}`. Si responde el error `-32601`, la aplicación está apagada
  (`MapAppEnabled` en `false`) o no se pudo calcular el origen del visor, y las herramientas no declaran `_meta.ui`; si lista `ui://poblaciones/mapa`, el servidor está bien y lo que falta es del cliente (12.4).

### 12.4 Condiciones del cliente para incrustar el visor

Según la documentación de Claude sobre sitios incrustados en MCP Apps (`claude.com/docs/connectors/building/mcp-apps/embedded-sites`, consultada el 17/11/2026):

- **Conector personalizado** (el que se agrega por URL): el sitio solo se carga si el usuario permite el origen en la conversación (en la solicitud
  de aprobación de la herramienta o en una revisión junto a la vista), y la función está disponible para un **conjunto limitado de organizaciones** y no en
  todas las conversaciones. Donde no está disponible, Claude bloquea el origen sin importar lo que se permita, y la vista se abre sin el sitio. En un
  conector de directorio, el origen debe figurar en la ficha verificada. Una vista abierta antes de permitir el origen recibe una lista vacía.
- **Cuenta:** la prueba requiere la experiencia unificada de Claude (chat y Cowork); si el cuadro de mensaje ofrece elegir entre Chat y Cowork, la cuenta no la tiene.
- **Dirección del conector:** debe tener ruta en minúsculas y sin `%`, `;` ni `//`; de lo contrario no cuenta como personalizado y el origen se bloquea.
- **Cabeceras del visor:** si el servidor web del visor restringe el enmarcado, `Content-Security-Policy: frame-ancestors` debe incluir `https://claude.ai` y el
  host de la vista (`<32 primeros caracteres hexadecimales de SHA-256 de la URL exacta del conector>.claudemcpcontent.com`), y el recurso debe declarar ese valor en
  `_meta.ui.domain`. Con `X-Frame-Options: DENY` o `SAMEORIGIN` el visor no se carga. **No se implementó `ui.domain`:** el código PHP no define cabeceras de
  enmarcado, de modo que solo hace falta si el servidor web las agrega; en ese caso se incorporará como ajuste con la URL exacta del conector.
- **Diagnóstico:** en la consola del navegador, la línea que empieza con `[mcp-ext-apps-host]` y nombra `frameDomains` informa qué hizo Claude con el origen
  declarado: `was opened without the sites its resource declares` (la función está disponible, pero el origen no se permitió o no pasó la verificación) o
  `Not among the sites that Claude allows this connector to show` (la función no está disponible para el conector). Un error de CSP que nombra `frame-src`
  indica que Claude no permitió el origen; uno que nombra `frame-ancestors` o `X-Frame-Options`, que el visor no admite ser enmarcado.
- **Reportes públicos de la plataforma** (repositorio `claude-ai-mcp`, consultado el 17/11/2026): el issue 471 describe que, en Claude Web, la vista de un conector remoto
  personalizado no se monta aunque el servidor cumpla la especificación; el 671 observa que el cliente envía ambas formas de clave de `_meta`; el 729, que `tools/list`
  se cachea por sesión del conector, de modo que `_meta.ui.resourceUri` solo se ve tras reconectar; el 1060, que `resources/read` no se llama aunque la capacidad de
  interfaz se haya negociado. Ninguno de los cuatro puede resolverse desde el servidor.
- **Caché de `tools/list`.** Si `MapAppEnabled` se activó con el conector ya agregado, hay que quitarlo y volver a agregarlo (o abrir una conversación nueva con el conector
  reconectado) antes de probar.
- **Registro de protocolo** (12.5): permite saber, desde el servidor, si el cliente anuncia soporte de aplicaciones y si llega a pedir el recurso.
- **Alternativa si el cliente no admite sitios incrustados:** dibujar el mapa dentro de la propia vista, sin iframe anidado (teselas del visor mediante
  `resourceDomains` y `connectDomains`). No se implementó: exige replicar la capa del visor y no está verificado que Claude respete esos dominios.

### 12.5 Registro de protocolo (diagnóstico)

Con `McpSettings::ProtocolLogEnabled` en `true`, cada pedido que llega al endpoint agrega una línea a `GetStorageCaches()/mcp/protocol.log`:

```
2026-11-17 10:42:07 200 initialize cliente=Anthropic/ClaudeAI/1.0.0 apps=si
2026-11-17 10:42:07 202 notifications/initialized apps=no
2026-11-17 10:42:08 200 tools/list apps=no
2026-11-17 10:42:31 200 tools/call show_map apps=no
2026-11-17 10:42:31 200 resources/read ui://poblaciones/mapa apps=no
```

- Formato: fecha y hora, estado HTTP y detalle. El detalle es el método, el nombre de la herramienta o el `uri` del recurso, y en `initialize` el nombre y la
  versión del cliente. `apps=si` indica que el pedido anuncia la extensión `io.modelcontextprotocol/ui` en `capabilities.extensions` (o en `_meta`); en los pedidos
  sin estado de la revisión moderna se informa en cada uno, y en la era con `initialize` solo en ese pedido.
- Lectura: si `initialize` trae `apps=no`, el cliente no negocia aplicaciones y la vista no se va a pedir; si trae `apps=si` y luego de `tools/call show_map` no aparece
  `resources/read`, el cliente no intenta montar la vista (issue 1060); si aparece `resources/read` y el mapa no se ve, el problema está en la etapa del cliente descrita en 12.4.
- Solo se registran valores acotados: caracteres ASCII visibles, hasta 80. No se guardan argumentos de herramientas, ids ni direcciones IP.
- El archivo se reinicia al superar 512 KiB (`McpProtocolLog::MAX_BYTES`) y se escribe con bloqueo exclusivo. Una falla de escritura interrumpe el pedido con el error
  natural de PHP, no se ignora. Debe activarse solo mientras se diagnostica.

**Verificado:** sintaxis y flujo de la página con un simulador (saludo, tamaño inicial, lista de orígenes permitidos vacía, ausente, con comodines y que no cubre el visor, botón de apertura, resultado con y sin mapa, pedidos del host, mensajes ajenos) y las pruebas
del servidor y de la ruta. **Sin verificar:** el comportamiento del cliente real (por ejemplo, si reenvía `structuredContent` a la
página, si respeta `frameDomains` y qué alto asigna), y que el servidor web del visor no envíe `X-Frame-Options` ni
`frame-ancestors` que excluyan el origen del cliente (el código PHP no los define; la función «Insertar mapa» del visor supone que se
puede enmarcar). Por eso queda apagado por omisión: se activa en desarrollo, se prueba con una consulta de cada herramienta y recién
después en producción.
