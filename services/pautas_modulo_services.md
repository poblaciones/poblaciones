# Pautas del módulo `services` (Poblaciones)

Documento de arranque para retomar el trabajo sobre la **parte servidor** de Poblaciones en una conversación nueva, sin
recorrer todo el código. Es el par de `pautas_modulo_map.md` y `pautas_modulo_backoffice.md`, que describen los módulos Vue 2
que consumen estos servicios.

Se elaboró leyendo `services.zip` completo (927 archivos; 735 PHP sin contar los 73 proxies de Doctrine; `.gitrev` 861ba1a) el 02/11/2026. Lo que no pudo
verificarse figura con la marca «a confirmar» o en la sección 21.

**Organización.** La **Parte A** (secciones 2 a 9) describe qué hace el servidor y cuáles son sus reglas de negocio: alcanza
por sí sola para discutir diseño o funcionalidad sin código. La **Parte B** (secciones 10 a 19) describe cómo está construido
y cómo se escribe código: es la que hace falta para modificar fuentes. La sección 20 reúne hallazgos y la 21, lo pendiente de
confirmar.

---

## 1. Cómo arrancar y trabajar

**Un solo documento.** Se resolvió no separar lo funcional de lo técnico en archivos distintos: el Project ya organiza sus
pautas por módulo, el contenido funcional del servidor es corto y está atado al técnico (borrador/publicado, shards,
snapshots), y toda tarea de código necesita ambas partes. La división en Parte A y Parte B permite
cargar solo la primera cuando no se va a tocar código. Si más adelante el diseño funcional crece (por ejemplo, nuevas
capacidades de la API de automatización), la Parte A puede extraerse sin reescribirla.

**Arranque**

- Para **entender o discutir diseño, reglas de negocio o funcionalidad**: alcanza con este archivo (Parte A).
- Para **escribir o modificar código**: subir además `services.zip` (o, como mínimo, los archivos involucrados y sus vecinos
  directos). Este documento da el mapa; el zip es la fuente de verdad, porque los nombres, las firmas y los detalles cambian y
  trabajar de memoria produce errores evitables. Verificar contra el código real antes de editar.
- El zip que se sube al empezar es el estado de verdad. Si una tanda quedó a medias, la siguiente parte del último zip entregado.
- **Lo que el zip no trae:** `vendor/`, `config/settings.php` (solo el `.sample`), `storage/` (datos, cachés, buckets, logs),
  `compilation_cache/`, `resources/`, los scripts SQL del esquema (por ejemplo el DDL de `user_key` y las funciones SQL propias
  de la sección 12), el código cliente (módulos Vue 2 `map`, `table`, `backoffice`, `admins`, `packs`, `credentials`) y las
  plantillas que genera la compilación del cliente (`index.html.twig`, `backoffice.html.twig`, `admins.html.twig`, que
  renderizan `cMap`, `cBackoffice` y `cAdmins`; a confirmar).
- Las rutas `/services/...` son el contrato con el cliente Vue y con terceros: ver la regla de la sección 16.

**Cómo trabajar durante la conversación**

- **Razonar en castellano.**
- **Distinguir lo verificado de lo asumido.** Al diagnosticar, separar el hecho comprobado (contra el código o los datos) de la
  hipótesis. Cuando una causa propuesta no cierra con lo que la otra persona sabe del sistema, frenar y verificar.
- **Preguntar con opciones antes de asumir** en decisiones de diseño con varios caminos razonables.
- **No sobre-corregir.** Ante un feedback puntual, cambiar lo pedido y no más.
- **Respuestas sintéticas al terminar una tarea:** el resultado, sin explicar lo ya entendido, salvo que haya algo que decidir.

**Entrega**

- Solo los archivos modificados, en un zip llamado `files.zip`, y en la conversación una tabla con **nombre de archivo y ruta**
  de cada uno.
- Tras modificaciones muy extensas (más de 12 archivos) corresponde un zip que conserve las rutas.
- Un solo zip, al final de la tanda. Antes de armarlo: `php -l` sobre cada archivo tocado, búsqueda de los nombres retirados
  (sección 16) y comprobación de que el zip contiene los cambios (`unzip -p … | grep`).
- Respetar la codificación de cada archivo (sección 17): hay 33 archivos que no están en UTF-8.

---

# PARTE A — FUNCIONAL

## 2. Propósito y alcance

Poblaciones es una plataforma abierta de datos espaciales de población (CONICET y Universidad Católica Argentina; licencia GPL
v3). Los usuarios registrados cargan datos tabulares, los georreferencian contra cartografía base, definen indicadores y los
publican en un visor de mapas público. El visor permite navegar por zoom, recortar por región o círculo, ver resumen y ranking
del encuadre, descargar datos y buscar.

El servidor PHP cumple seis funciones:

| Función | Rutas principales | Cliente |
| --- | --- | --- |
| Backoffice de carga: crear cartografías, importar, georreferenciar, definir indicadores y metadatos | `/services/backoffice/*`, `/users` | módulo `backoffice` |
| Publicación: pasar de borrador a publicado y precalcular lo que el visor consulta | `/services/backoffice/*Publish*` | módulo `backoffice` |
| Lectura pública: catálogos, datos por tile, resumen, ranking, fichas, descargas, búsqueda | `/services/frontend/*`, `/services/metrics/*`, `/map` | módulos `map` y `table` |
| Administración del sitio y cartografía base | `/services/admin/*`, `/services/packs/*`, `/admins`, `/packs`, `/logs/*` | módulos `admins` y `packs` |
| Interfaces externas: automatización con clave, WFS, API de regiones, indexación | `/services/api/*`, `/services/wfs`, `/handle`, `/ark:` | scripts y terceros |
| Operación: respaldo remoto, despliegue por API, correo remoto, estadísticas, rendimiento | `/services/api/*`, `/logs/*` | servidores y administradores |

**Nombres históricos.** «Helena» es el nombre interno original: el namespace es `helena\`, y el proyecto de Visual Studio se
llama `Helena-phptools`. El framework propio (`minga\framework`) es compartido con Acta Académica y otros proyectos.

**Datos del entorno (verificados en el código).** PHP 8.3 (`composer.json`), Doctrine ORM 2.19 y DBAL 3.10, Twig 3, componentes
Symfony 5.4, Python 3.7.11 para los scripts. El `README.md` del repositorio declara PHP 7.4, MySQL 5.7 y Python 3.4: está
desactualizado en PHP y en Python.

## 3. Modelo de dominio

Cada concepto de una cartografía existe **dos veces**: en borrador (tablas `draft_*`, clases `Draft*`) y publicado (sin
prefijo). Las columnas llevan un prefijo de tres letras por tabla (`wrk_`, `dat_`, …).

| Concepto (código) | Tablas (prefijo) | Qué es |
| --- | --- | --- |
| Cartografía (`Work`) | `work` (`wrk`) | Unidad publicable de un usuario. Tipo `R` (cartografía) o `P` (datos públicos del sitio; solo la crean editores del sitio). Atributos de visibilidad: `is_private`, `is_indexed`, `segmented_crawling`, `access_link`, `is_example`. Archivable. Banderas de cambios pendientes: `metadata_changed`, `dataset_labels_changed`, `dataset_data_changed`, `metric_labels_changed`, `metric_data_changed` |
| Metadatos | `metadata` (`met`), `contact` (`con`), `source` (`src`), `institution` (`ins`), `metadata_source` (`msc`), `metadata_institution` (`min`), `metadata_file` (`mfi`) | Ficha de la cartografía: título, resumen, autores, idioma, fuentes e instituciones (con marca de agua), archivos adjuntos, fechas de publicación, extensión y URL. Se exportan como PDF y diccionario XLS |
| Dataset | `dataset` (`dat`), `dataset_column` (`dco`), `dataset_column_value_label` (`dla`), `dataset_marker` (`dmk`) | Tabla de datos cargada. Tipos: `D` datos asociados a una geografía por código, `L` ubicaciones (puntos por latitud y longitud), `S` formas propias, `G` definido en `DatasetTypeEnum` (su uso no se verificó). `are_segments` indica pares de puntos que forman segmentos. Columnas con etiquetas de valor y columnas especiales (`SpecialColumnEnum`: personas, hogares, adultos, niños, área, conteo). Puede tener columna de partición, de imágenes y de título |
| Indicador (`Metric`) | `metric` (`mtr`), `metric_version` (`mvr`), `metric_version_level` (`mvl`), `variable` (`mvv`), `variable_value_label` (`vvl`), `symbology` (`vsy`) | Un indicador agrupa versiones (por ejemplo, años). Cada versión tiene niveles (un dataset por nivel geográfico) y cada nivel, variables con fórmula de valor y de normalización, categorías y simbología. Catálogos: `metric_group` (`lgr`) y `metric_provider` (`lpr`) |
| Configuración del visor | `work_startup` (`wst`), `work_icon` (`wic`), `work_extra_metric` (`wmt`), `onboarding` (`onb`), `onboarding_step` (`obs`), `draft_annotation` (`ann`) | Encuadre inicial, íconos, indicadores adicionales, recorrido guiado con imágenes y anotaciones |
| Cartografía base | `geography` (`geo`), `geography_item` (`gei`), `geography_tuple` (`gtu`), `clipping_region` (`clr`), `clipping_region_item` (`cli`), `boundary` (`bou`), `boundary_version` (`bvr`), `boundary_group` (`bgr`), `gradient` (`grd`) | Geografías (niveles administrativos con ítems y geometrías simplificadas por zoom), regiones de recorte (jerarquía para recortar y buscar), delimitaciones (contornos superponibles, con versiones), tuplas (relaciones calculadas entre geografías), gradientes (texturas raster). Se mantienen desde `/packs` |
| Usuarios | `user` (`usr`), `user_key`, `draft_work_permission` (`wkp`), `work_space_usage` (`wdu`), `review` (`rev`), `version` (`ver`) | Cuenta con privilegio global, claves de API (solo hash), permisos por cartografía, uso de disco, solicitudes de revisión y contadores de versión (`FAB_METRICS`, `LOOKUP_REGIONS`, `CARTO_GEO`) que señalan qué estructuras derivadas deben reconstruirse (`VersionUpdater`; el panel `/logs/caches` muestra las desactualizadas) |
| Archivos | `file` (`fil`), `file_chunk` (`chu`) | Archivos binarios (imágenes, adjuntos, marcas de agua) guardados por fragmentos en la base. Cuando pertenecen a una cartografía, los fragmentos van a una tabla propia por obra (`DbFile::GetChunksTableName`) |

**Vocabulario.** Los identificadores usan el término inglés y los textos al usuario, el castellano:

| Código | Texto al usuario |
| --- | --- |
| `Work` | cartografía (tipo `P`: «datos públicos») |
| `Metric` | indicador |
| `Boundary` | delimitación |
| `ClippingRegion` | región de recorte |
| `Geography` | geografía / nivel geográfico |
| `Draft` / publicado | borrador / publicado |

## 4. Actores, permisos y visibilidad

**Roles globales** (`user.usr_privileges`, un único valor; `Account`):

| Valor | Nombre en el código | Puede |
| --- | --- | --- |
| `A` | MegaUser | Todo: paneles `/logs`, usuarios, claves de API, `/packs` en escritura |
| `E` | SiteEditor | Editar cualquier cartografía, crear las de tipo `P`, editar metadatos del sitio, revisiones |
| `L` | SiteReader | Leer cualquier cartografía (incluso privadas y borradores) y ver listados de administración |
| vacío | usuario común | Operar sobre sus cartografías y las que le compartan |

`A` incluye `E` y `E` incluye `L` (`Account::IsSiteEditor`, `IsSiteReader`).

**Permisos por cartografía** (`draft_work_permission`): `V` lectura, `E` edición, `A` administración (además gestiona permisos).
Se verifican con `Session::CheckIsWorkReader`, `CheckIsWorkEditor` y `CheckIsDatasetEditor`/`Reader`. Particularidades
(`WorkPermissionsCache`):

- En una cartografía **indexada** (`is_indexed`), `E` y `A` quedan como lectura, salvo que el pedido autorice editar indexadas
  (lo hace la gestión de permisos) o la persona sea editor del sitio.
- En una cartografía **de ejemplo** (`is_example`), cualquier cuenta autenticada la lee.

**Visibilidad de una cartografía publicada** (`Session::IsWorkPublicOrAccessible`):

- *Privada*: solo la leen quienes tienen permiso o son SiteReader.
- *Con enlace de acceso* (`access_link`): se accede conociendo el enlace, enviado en el encabezado `Access-Link` o presente en
  el `Referer`.
- *Indexada*: figura en los catálogos de datos públicos y en los buscadores.
- *Rastreo segmentado* (`segmented_crawling`): habilita a los rastreadores a recorrer la obra por segmentos (handles y sitemap).

**Mantenimiento.** Con `readonlyForMaintenance` activo, las ediciones lanzan una `PublicException` con el aviso estándar.

**Sesión y cuentas.** Sesión PHP con cookie y «recordarme» (cookie `remember`, un token aleatorio por navegador; constantes
`ValidRenew` de 30 días y `ValidCreate` de 365 en `Remember`). Alta con activación por correo, recuperación de contraseña, ingreso con Google o Facebook
(`useOpenId*`), y «ingresar como» otra cuenta (MegaUser; la cuenta original queda en la sesión como `masteruser`).

**Acceso por API.** Un cliente envía `X-Api-Key` (o `api_key`); `AutomationAuth` busca el hash SHA-256 en `user_key` y suplanta
al usuario dueño de la clave. A partir de ahí rigen las mismas verificaciones `Session::CheckIs*`. Las claves las administra un
MegaUser (`/services/admin/*UserKey*`); el texto plano se muestra una sola vez al crearla.

**Entre servidores.** Respaldo, despliegue y correo remoto no usan sesión: se autentican con claves de `Context::Settings()->Keys()`.

## 5. Ciclo de vida de una cartografía

| Etapa | Qué ocurre | Servicio principal |
| --- | --- | --- |
| Crear | Se crean `DraftWork`, su metadata y su startup, con el shard actual. El tipo `P` exige SiteEditor | `backoffice\WorkService` |
| Importar datos | Subida por fragmentos a un bucket temporal; lectura según la extensión; creación e inserción en tablas temporales; fusión con metadatos previos; promoción de la tabla temporal | `ImportService`, `classes\readers\*`, `import\*` |
| Georreferenciar | Por códigos, por latitud y longitud, o por formas (y variante de segmentos). Las filas con error se guardan aparte y pueden omitirse | `GeoreferenceService`, `georeference\*` |
| Columnas e indicadores | Etiquetas, recodificación, columnas calculadas de área y distancia; creación de indicadores, versiones, niveles y variables; cortes de clasificación (Jenks-Fisher, ntiles) | `DatasetColumnService`, `MetricService`, `metrics\*` |
| Metadatos y visor | Fuentes, instituciones, adjuntos, íconos, indicadores adicionales, recorrido guiado, encuadre inicial | `MetadataService`, `SourceService`, `InstitutionService`, `OnboardingService` |
| Compartir | Permisos por correo, con aviso opcional | `PermissionsService` |
| Revisión | La persona solicita revisión; el equipo del sitio la atiende desde `/admins` | `WorkService::RequestReview`, `admin\ReviewService` |
| Publicar | Proceso de 9 pasos, descripto abajo | `PublishService` |
| Revocar, clonar, eliminar, probar | Procesos multi-paso equivalentes | `RevokeService`, `WorkCloneService`, `WorkDeleteService`, `WorkTestService` |

**Formatos de entrada** (`BaseReader::CreateReader`, por extensión): CSV y TXT, XLSX y XLS, SAV (SPSS), shapefile (ZIP o SHP),
GeoPackage y KML o KMZ; algunas conversiones se hacen con scripts Python. **Formatos de descarga** (`BaseDownloadManager`): SAV y ZSAV (SPSS), DTA (Stata), RData, CSV, XLSX,
SHP (zip) y GPKG. La descarga SHP incluye un proyecto QGZ con los estilos de los indicadores (QML) y la GPKG, esos estilos como
metadatos (`classes/writers/metrics`).

**Publicación** (`PublishService`, pasos numerados en la clase):

| Paso | Acción |
| --- | --- |
| 0 | Borrar las tablas de datos publicadas si cambiaron los datasets |
| 1 | Borrar los snapshots de datasets que ya no existen |
| 2 | Borrar las definiciones publicadas de la cartografía |
| 3 | Copiar las definiciones de borrador a publicado, con ids «shardificados» |
| 4 | Copiar las tablas de datos, un dataset por vez |
| 5 | Crear los snapshots de cada dataset |
| 6 | Actualizar versiones de indicadores y extensiones geográficas |
| 7 | Limpiar cachés, fechas de publicación y URL pública; apagar las banderas de cambio; notificar a administradores |
| 8 | Completado |

Las **banderas de cambio** (`WorkFlags`) deciden cuánto se recalcula: los datos se copian y los snapshots se regeneran solo si
cambiaron los datasets o los indicadores. Si todo está sin marcar, `StartPublication` entiende que se pide una publicación
completa y marca todo (ver el hallazgo 1 de la sección 20).

## 6. Lectura pública

| Área | Endpoints (prefijo `/services/`) | Servicio |
| --- | --- | --- |
| Arranque | `GetConfiguration`, `GetTransactionServer` | `frontend\ConfigurationService` |
| Cartografía | `works/GetWorkAndDefaultFrame`, `clipping/GetDefaultFrame` | `frontend\WorkService`, `ClippingService` |
| Catálogos | `metrics/GetFabIndicators`, `GetFabBoundaries`, `GetFabBoundaryVersions`, `GetUserFabIndicators` | `FabService` |
| Indicador | `metrics/GetSelectedMetric`, `GetSelectedInfos`, `GetSelectedMetricByFID` | `SelectedMetricService` |
| Datos por tile | `frontend/metrics/GetTileData`, `GetBlockTileData`, `GetMetricData` (y variantes `GetBase*`) | `TileDataService`, `MetricDataService` |
| Geometría | `frontend/geographies/GetGeography`, `frontend/shapes/GetShapesByEnvelope`, `frontend/clipping/GetLabels`, `GetBlockLabels`, `CreateClipping` | `GeographyService`, `ShapesService`, `LabelsService`, `ClippingService` |
| Análisis del encuadre | `frontend/metrics/GetSummary`, `GetRanking`, `metrics/GetMetricNavigationInfo`, `GetMetricItemInfo`, `GetLabelInfo` | `SummaryService`, `RankingService`, `InfoWindowService` |
| Delimitaciones | `routes/frontend/boundary.php` | `frontend\BoundaryService` |
| Búsqueda | `frontend/Search` | `SearchService` (regiones, indicadores, features) |
| Descargas | `download/StartDatasetDownload`, `StepDatasetDownload`, `GetDatasetFile` (y de delimitaciones) | `DownloadDatasetService`, `DatasetDownloadManager` |
| Tabla (pivot) | `frontend/processor/GetTableMetricData`, `GetRegion`, `GetRegionGeographyRelations` | `TableService` |
| Raster y vector | `frontend/raster/GetGpkgTile`, `frontend/vector/GetMvtTile` | `RasterService` (GeoPackage), `VectorService` (MBTiles) |
| Telemetría | `session/UpdateUsage`, `suggestions/*` | `NavigationService`, `suggestions\*` |
| Metadatos | `/map/{obra}/metadata`, PDF y diccionario | `common\MetadataService` |
| Indexación | `/handle/…`, `/ark:/…`, `/sitemap`, `robots.txt` | `cHandle`, `cArk`, `cSitemap` |

**Cómo se arma una respuesta de datos.** El visor pide por tile (256 px, con bloques opcionales de `s` × `s` tiles). El servicio
resuelve el indicador seleccionado (cacheado), toma el **snapshot** del dataset del nivel, arma la consulta espacial con
`SpatialConditions` y devuelve filas con `FID`, `VID`, `LID`, `Value`, `Total`, `Description`, coordenadas y, en comparación,
las columnas gap. El encuadre llega siempre como `Frame` (`Frame::FromParams()`).

**Control de acceso en lectura.** Cada endpoint de datos verifica `Session::CheckIsWorkPublicOrAccessible*`. Si la obra es
restringida (privada o con enlace), la respuesta no se cachea en el cliente (se usa `App::Json` en lugar de `JsonImmutable`).

## 7. Administración del sitio y cartografía base

- **`/admins`** (módulo `admins`; `/services/admin/*`): usuarios (alta, edición, baja, «ingresar como», claves de API),
  cartografías por tipo y período, indexación y rastreo de cada obra, uso de disco, procesamiento mensual de estadísticas,
  revisiones solicitadas y edición de fuentes e instituciones sobre cartografías publicadas (SiteEditor).
- **`/packs`** (módulo `packs`; `/services/packs/*`): lectura para SiteReader, escritura solo para MegaUser. Mantiene
  delimitaciones y sus versiones, regiones de recorte (importación desde GeoPackage con mapeo de columnas y cálculo de la
  relación con geografías), geografías y sus ítems, tuplas, gradientes, grupos y proveedores de indicadores y catálogo de
  indicadores. Las importaciones y cálculos son multi-paso.
- **`/logs/*`** (HTML con Twig; MegaUser): tráfico, plataforma (información del sistema), cachés, plugins, pruebas (ejecutor de
  PHPUnit), rendimiento y su histórico, búsquedas, actividad (espacio en disco, tablas huérfanas y temporales), errores,
  sugerencias y aprendizaje. El menú es `Menu::RegisterAdmin`.

## 8. Interfaces externas

| Interfaz | Rutas | Autenticación | Notas |
| --- | --- | --- | --- |
| Automatización | `/services/api/automation/*` (59 rutas en `routes/automation/`: `work`, `dataset`, `metric`, `metadata`, `boundary`) | `X-Api-Key` | Solo con `isAPIEnabled`. Operaciones de un paso y pares `Start*`/`Step*`. Cada archivo documenta sus endpoints en docblocks; es la referencia primaria |
| API de regiones | `/services/api/getCapabilities`, `regions/getFeature`, `regions/search` | ninguna | Parámetro `v` (versión de la API) |
| WFS 1.1.0 y 2.0.0 | `/services/wfs` | ninguna | `GetCapabilities`, `DescribeFeatureType`, `GetFeature`. Tipos `m_<indicador>_v_<versión>_l_<nivel>`; espacio de nombres `pob`; cachés SQLite en `storage/caches/wfs/sqlite` (catálogo 1 h, datos y delimitaciones 24 h). Pendientes en `services/wfs/TODOs.txt` |
| Respaldo remoto | `/services/api/startBackup`, `stepBackup`, `stepFiles` | clave `IsRemoteBackupAuthKeyValid` | Complementa `py/bcup` (backup, restore, push con `mysqldump`) |
| Despliegue | `/services/api/deploymentUpload`, `deploymentExpand`, `deploymentInstall` | clave `IsDeploymentAuthKeyValid` | Subida en tramos; extensiones `zip` y `tar.bz2` |
| Correo remoto | `/services/api/v3/mail/send` | clave `RemoteEmailKey` en `Authorization` | Formato compatible con SendGrid v3 |
| Identificadores | `/handle/…`, `/ark:/…` | ninguna | Muestran los metadatos al rastreador (`handle.html.twig`) o redirigen al mapa; ARK con NAAN configurable |

## 9. Reglas de negocio e invariantes

1. **Todo se edita en borrador.** Lo publicado solo cambia al publicar o por operaciones de administración (visibilidad,
   indexación, metadatos del sitio).
2. **Ids publicados = id de borrador × 100 + shard.** El backoffice trabaja con ids planos y la lectura pública, con ids
   «shardificados» (`PublishDataTables::Shardified`, `Unshardify`).
3. **Las banderas de cambio determinan qué se recalcula** al publicar. Toda operación que modifique datos, etiquetas o
   indicadores debe encender la bandera correspondiente (`WorkFlags`).
4. **Un cambio de visibilidad** (privada, indexada, enlace de acceso, tipo) ejecuta `PublishSnapshots::UpdateWorkVisibility`:
   reconstruye metadatos de indicadores, incrementa `FAB_METRICS` y limpia cachés.
5. **Las cartografías `P` solo las crea un SiteEditor**, y las indexadas solo las edita un SiteEditor.
6. **Con mantenimiento activo no se editan datos.**
7. **Los procesos largos son multi-paso y sobreviven al cierre de la pantalla:** el estado queda en un bucket (`state.json`).
   Los buckets se descartan a los 7 días. Las tablas `tmp_work_dataset_*` de más de una semana, las matrices y las tablas huérfanas
   se eliminan a pedido desde `/logs/caches` (`CleanTempTables`, `CleanMatrixTables`, `CleanOrphanTables`); no se verificó que
   haya un proceso automático.
8. **Las geometrías se simplifican por calidad** (tolerancias en metros) al importar cartografía base.
9. **La comparación entre versiones** usa tablas matriz (`<snapshot>_matrix_<datasetId>`) que se invalidan al regenerar el
   snapshot de cualquiera de los dos datasets.
10. **Si el tamaño de bloque de etiquetas o de datos que pide el cliente difiere de la configuración**, el servidor responde con
    un error que pide recargar el mapa.
11. **Un recorte circular no usa caché del servidor** (datos por tile y datos de indicador).
12. **Las tablas físicas de datos se nombran por convención** (`work_dataset_draft_*`, `work_dataset_shard_<n>_*`); las que no
    corresponden a ningún dataset se consideran huérfanas.
13. **Errores de negocio** se muestran con su mensaje (`PublicException`, prefijo `[PE-E]`); cualquier otro error se informa
    con un texto fijo y el código HTTP, sin causa técnica.

---

# PARTE B — TÉCNICA

## 10. Arquitectura y flujo de un pedido

**Pila.** PHP 8.3; componentes Symfony 5.4 (HttpFoundation, Routing, HttpKernel); **sin Silex**: `classes/SilexApp.php` es un
reemplazo mínimo propio (rutas, `before`/`after`/`error`, acceso tipo arreglo para `db`); Twig 3; Doctrine DBAL y ORM con
anotaciones y `longitude-one/doctrine-spatial`; JMS Serializer; mPDF; PhpSpreadsheet y OpenSpout; `php-shapefile`; proj4php;
SendGrid y PHPMailer; PHPUnit 9.6 y PHPStan.

**Flujo**

1. `web/index.php` calcula `$isPublic` por prefijo de URI, carga `startup.php` y `routes/routes.php` y ejecuta `App::$app->run()`.
2. `startup.php`: autoload de Composer, `src/app.php` (inyecta `Settings` y `Callbacks` al framework y crea `SilexApp`),
   `config/settings.php`, validación del shard, configuración de base, modo debug, zona horaria `America/Argentina/Buenos_Aires`
   y habilitación de caché de sesión para ciertos URI de lectura.
3. `routes/routes.php`: arranca sesión; hook `before` (prioridad 10000) que abre el perfilado, registra tráfico por IP, procesa
   «recordarme» y `Performance`, habilita CORS y reescribe `/map/<obra>/…` con `Router::ProcessPath` como subpedido; hook
   `error` (registra, hace rollback y responde); hook `after` (`App::AutoCommit` si el estado es 200 o 302, cierra el pedido);
   `OPTIONS`; y luego carga los archivos de rutas.
4. Cada ruta es una *closure* que **(a)** verifica permisos con `Session::CheckIs*`, **(b)** lee parámetros con `Params::*`,
   **(c)** delega en un servicio y **(d)** responde con `App::Json`, `App::OrmJson`, `App::Render`, archivo o stream.
5. Los **controladores** (`controllers/`, clases `c*` con `Show()` y `Post()`, registradas con `App::RegisterControllerGet`,
   `RegisterControllerPost` y `RegisterControllerGetPost`) atienden solo páginas HTML: ingreso, mapa y tabla, paneles `/logs`,
   handle, ark, sitemap.
6. Los **servicios** (`services/<área>/`) contienen la regla de negocio y extienden `common\BaseService`.
7. Los **modelos** (`db/`) ejecutan SQL parametrizado; `entities/backoffice` son las entidades ORM y `entities/frontend`, los
   objetos de respuesta que consume el visor.

**Qué archivo de rutas se carga cuándo**

| Archivo | Condición |
| --- | --- |
| `authenticate.php`, `common.php`, `frontend.php`, `tests.php` | siempre |
| `dev.php` | `Servers()->LoopLocalPort` definido (proxy al servidor de desarrollo del cliente) |
| `automation/*`, `api/*` | `Settings()->isAPIEnabled` |
| `logs.php`, `backoffice.php` | solo si el pedido **no** es público: `isPublicPath()` de `web/index.php` excluye los prefijos `/users`, `/table`, `/basics`, `/logs`, `/services/backoffice/`, `/services/admin/`, `/services/packs/`, `/admins`, `/packs` |
| partes de `frontend.php` y `backoffice.php` | según el tipo de servidor (sección 11) |

Consecuencia práctica: **una ruta nueva de backoffice debe quedar bajo uno de esos prefijos**, o hay que agregar el prefijo a
`isPublicPath()`; de lo contrario su archivo no se carga.

## 11. Multi-servidor y shards

**Servidores** (`ServersSettings`): `main` (sitio público), `transactions` (ejecuta los servicios de datos) y `cdns` (contenido
estático). Se declaran con `RegisterServers(app, home)` (caso simple) o con `RegisterServer`, `RegisterTransactionServer` y
`RegisterCDNServer` más `SetCurrentServer`. `GetTransactionServer()` devuelve el transaccional o, si no hay, el principal.

- Los servicios `/services/*` se registran solo en el servidor transaccional (`IsTransactionServerRequest`).
- Si el servidor principal **no** es el transaccional, `/map`, `/table`, `/handle`, `/ark:` y `/sitemap` se resuelven con
  controladores remotos (`cRemoteMap`, `cRemoteTable`, `cRemoteHandle`, `cRemoteArk`, `cRemoteSitemap`), que traen la página
  del servidor transaccional (`App::FlushRemoteFile`); si falla, muestran `serverFailed.html.twig`.
- `WfsRemoteClient` consulta al servidor transaccional salvo que sea el mismo.
- `MapSettings::RegisterMultiServer($servidores, $home)` elige el servidor por el host del pedido y, si no es el primero, agrega un
  sufijo de firma.

**Shards.** `Shard()->CurrentShard` (1 a 99) identifica la instancia de backoffice. `Inclusions` y `Exclusions` definen qué
shards ajenos se pueden leer públicamente (`IsValidPublicShard`). Publicar valida que `draft_work.wrk_shard` coincida con el
shard del entorno. El esquema operativo con varios shards queda en «a confirmar».

## 12. Persistencia y cachés

**MySQL, dos vías sobre la misma conexión**

- `App::Db()`: envoltorio `minga\framework\Db` sobre la conexión DBAL (PDO MySQL, `ATTR_EMULATE_PREPARES=false`). Ofrece
  `fetch*`, `exec`, `insert`/`update`/`delete`, `dropTable`, `execDDL`, `markTableUpdate` y transacciones
  `ensureBegin`/`ensureCommit`/`ensureRollback`.
- `App::Orm()`: `helena\classes\Orm`, un `EntityManager` de Doctrine con anotaciones sobre `src/entities/backoffice`, tipos
  espaciales y funciones `ST_*` registradas. Métodos: `find*`, `save`, `delete`, `Reconnect`, `Rebuild`, `Clone`,
  `Disconnect`, `MarkClassUpdate`.
- La transacción se abre de forma perezosa. Se confirma en el hook `after` (`App::AutoCommit`: `flush()` del ORM y
  `ensureCommit`) **solo si la respuesta es 200 o 302**; ante una excepción, `App::Rollback`.
- `markTableUpdate($tabla)` marca con un archivo (`storage/timestamps/<tabla>`) cada tabla modificada, para detectar cambios;
  solo actúa si `Db()->LogTableUpdateTime` está activo (por omisión no lo está).

**Entidades.** Anotaciones Doctrine; propiedades privadas en PascalCase (`Id`, `Type`); columnas con prefijo de tres letras. La
anotación `@ClientReadonly` marca propiedades que el cliente no puede escribir. El cliente devuelve entidades como JSON y el
servidor las reconecta con `App::ReconnectJsonParam(Mandatory)` → `Orm::Reconnect` → `DbSession::Synchronize` (busca por `Id`,
copia propiedades no readonly y asociaciones, recursivamente; sin `Id` crea la entidad). La serialización de salida es JMS con
nombres idénticos y nulos incluidos (`App::OrmSerialize`, `OrmJson`).

**Funciones SQL propias.** El código llama a `GeometryCentroid`, `GeometryAreaSphere` y `GeometryIsValid`, que no son estándar
de MySQL: deben estar instaladas en la base. Su DDL no está en el zip y se verifican con `tests/spatialdb`.

**Tablas de datos de dataset** (dinámicas, una por dataset):

| Patrón | Contenido |
| --- | --- |
| `work_dataset_draft_*` | Datos del borrador (registradas en `work_dataset_draft`) |
| `tmp_work_dataset_*` | Importación en curso |
| `work_dataset_shard_<n>_*` | Datos publicados |
| `<tabla>_snapshot` | Snapshot espacial indexado (MyISAM, índices `SPATIAL` sobre `sna_envelope` y `sna_location`). Columnas `sna_*`; por variable `sna_<id>_value`, `_total`, `_value_label_id`, `_gap`, `_sequence_order` |
| `<tabla>_snapshot_matrix_<id>` | Comparación entre datasets |
| `<tabla>_errors`, `<tabla>_retry` | Georreferenciación con filas fallidas |
| `work_file_chunk_draft_<id>`, `work_file_chunk_shard_<n>_<id>` | Fragmentos de los archivos de una cartografía (borrador y publicado) |

Otros snapshots: búsqueda (`SnapshotSearchModel`), geografías por región, ítems de formas, versiones de indicadores (firmas) y
delimitaciones, todos en `services/backoffice/publish/snapshots/`. Las consultas de lectura están en `db/frontend/Snapshot*`.

**SQLite**

- Navegación mensual: `storage/navigation/AAAA-MM.db` (`NavigationService`); sugerencias mensuales (`storage/suggestions`).
- Cachés de dos niveles del framework (SQLite o archivos, según `CacheSettings`) y cachés WFS.
- `web/migrate.php`: utilidad que comprime los valores (`gzcompress` y base64) de bases SQLite de caché (tabla `data(pID, v)`).

**Sistema de archivos (`storage/`)**: `buckets` (temporales, 7 días; nombre `<usuario>-<id>`), `caches`, `log`, `performance`,
`traffic`, `search`, `stats`, `sitemaps`, `rasters`, `gradients`, `plugins`, `data/admin/cache`, `queue`, `tokens`,
`timestamps`, `temp`, `backup`. Las rutas salen de `Context::Paths()` (framework) y de `helena\classes\Paths`.

**Cachés de aplicación** (`src/caches/`): una clase por caché, con `Cache()` estático y, si corresponde, `CreateKey()`.

| Caché | Qué guarda |
| --- | --- |
| `TileDataCache`, `SummaryCache`, `RankingCache`, `MetricDataCache`, `TableMetricDataCache` | Respuestas de datos por indicador |
| `SelectedMetricsMetadataCache`, `SelectedBoundaryCache`, `FabListsCache` | Metadatos de indicadores, delimitaciones y catálogos |
| `GeographyCache`, `LabelsCache`, `ClippingCache`, `DatasetShapesCache` | Geometría y etiquetas |
| `DownloadCache`, `BoundaryDownloadCache`, `BackofficeDownloadCache` | Archivos de descarga |
| `WorkPermissionsCache`, `WorkVisiblityCache`, `BoundaryVisiblityCache`, `WorkHandlesCache` | Permisos y visibilidad |
| `PdfMetadataCache`, `DictionaryMetadataCache`, `MetricGroupsMetadataCache`, `MetricProvidersMetadataCache`, `SuggestionLabelsCache`, `AddressesCache`, `RemoteHandlesCache` | Otros |

**Toda invalidación pasa por `CacheManager`** (`services/backoffice/publish/`). Una caché nueva se agrega también al método de
limpieza que le corresponda.

## 13. Patrones de implementación

### 13.1 Operaciones multi-paso (`StateBag`)

- `Start*` crea un `*StateBag` (hereda de `classes\StateBag`; estado JSON en un bucket) y devuelve `ReturnState(false)`.
- `Step*` recibe la clave `k`, hace `LoadFromKey`, ejecuta el paso actual (`switch ($this->state->Step())`), avanza con
  `NextStep('rótulo')` o `NextSlice()` y devuelve `ReturnState($done)`:
  `{done, key, status, step, slice, ellapsed, totalSteps, totalSlices, [visitUrl, visitCaption, stepperResult, errorsFound]}`.
- Al terminar sin error se borra el bucket; si hubo error queda `lastError.txt`. La clave se valida (sin `..`, `/`, `\` ni espacios).
- El cliente hace *polling* de los `Step*`; cada paso debe ser corto.
- Usos: publicar, revocar, clonar, eliminar, probar, importar, georreferenciar, calcular áreas y distancias, descargas y las
  importaciones y cálculos de `/packs`.

### 13.2 Respuestas HTTP

- `App::Json($valor, $dias = -1)`: `Content-Type: text/plain` a propósito (CORS y cachés), `Cache-control: private` con
  `Last-Modified` igual al inicio de sesión.
- `App::JsonImmutable($valor)`: **exige el parámetro `w`**; con `w = 0` no cachea en el cliente y con otro valor cachea 1000 días.
  El cliente cambia `w` para invalidar.
- `App::JsonCacheableImmutable($cache, $args, $calculador, $omitirCache, $omitirCacheCliente)`: guarda el JSON ya comprimido
  en gzip en la caché del servidor y responde con `Content-Encoding: gzip` si el cliente lo acepta (si no, descomprime). Más de
  25.000 filas se serializan por tramos.
- Con sesión PHP activa y caché de cliente, `Json` e `ImageImmutable` cierran la sesión, emiten los encabezados de forma manual y terminan
  el pedido (`EndRequest`): no agregar lógica posterior a esas llamadas.
- Descargas: `App::StreamFile`, `App::SendFile`, `App::FlushRemoteFile`.
- **Errores.** Una `PublicException` o `MessageException` llega al hook `error`, que responde con `getPublicMessage()`
  (`[PE-E]: …` / `[ME-E]: …`). Cualquier otra responde `<código>. Se ha producido un error en el servidor.`, se registra con
  `Log::LogException` y se hace rollback. Con debug activo se muestra la traza.
- **Permisos.** `Session::CheckIs*` devuelve `null` si hay permiso; si no, muestra un mensaje con enlace al ingreso y termina el
  pedido (con código 401 cuando faltan permisos). Patrón de las rutas:
  `if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;`

### 13.3 Parámetros

`Params::Get`, `GetMandatory`, `GetInt`, `GetIntMandatory`, `GetIntRangeMandatory`, `GetBool(Mandatory)`, `GetJson(Mandatory)`,
`GetIntArray`, `GetUploadedFile`. Lanzan `PublicException` si falta un obligatorio. **El significado de las letras depende del
endpoint** (`w` es la obra en `GetWorkAndDefaultFrame` y la firma de versión en `GetFabIndicators`): no inferirlo de otro.
El encuadre llega siempre como `Frame::FromParams()`: `e` envolvente, `z` zoom, `r` regiones, `c` círculo.

### 13.4 Modo borrador y publicado en los servicios

`BaseService::__construct($isDraft = true)`. `makeTableName($tabla)` antepone `draft_` y `ApplyDraft($clase)` quita el prefijo
`Draft` de la entidad. Los servicios que operan sobre lo publicado se construyen con `new XService(false)` (por ejemplo los
metadatos desde `/services/admin`). Un modelo de `db/` sin modo lanza «Debe indicarse el modo de trabajo».

### 13.5 Python y procesos externos

`helena\classes\Python::Execute($script, $args)` ejecuta `py/<script>` con `Servers()->Python3`. Ante un fallo registra el detalle
y lanza una `PublicException` genérica (con detalle solo en debug o pruebas).

| Script | Uso |
| --- | --- |
| `spss2json3`, `json2spss3` | Lectura y escritura de SPSS |
| `spss2r3`, `spss2stata3`, `stata2spss3`, `stata3writer` | Conversiones a R y Stata |
| `kmx2csv3` | KMX/KMZ a CSV |
| `resolve_intersections` | Intersecciones geodésicas (Shapely y pyproj) que reemplazan lógica de MySQL |
| `bcup/` | Respaldo, restauración y *push* de la base con `mysqldump` |

Dependencias en `py/install.sh` (Python **3.7.11**: con 3.8 o 3.9 hay incompatibilidades con `savReaderWriter`). También se usan
`PhpCli`, `MySqlDump` y `Gzip` de `ServersSettings`.

### 13.6 Configuración

`config/settings.php` opera sobre `Context::Settings()` (framework: servidores, claves, correo, base, rutas) y
`App::Settings()` (`LocalSettings`: `Map()`, `Shard()`, `ServiceCache()`, `Suggestions()`, `Help()`, `MapLimits()`). Un ajuste
nuevo es una propiedad con valor seguro por omisión en la clase de ajustes, se asigna en `settings.php` y se declara en
`settings.php.sample`. No se crean archivos de configuración sueltos. Opciones del visor en `MapSettings` (bloques de tiles,
pivot, gradientes, texturas, anotaciones, mapas base, límites y autocompletado de regiones).

### 13.7 Perfilado y rendimiento

Los métodos de servicios y modelos se envuelven con `Profiling::BeginTimer()` / `EndTimer()`; en retornos tempranos hay que
cerrar el temporizador. `Performance` (controlador, método, espera de base, errores, histórico diario y mensual),
`GlobalTimer` (`EllapsedMs` en las respuestas), `Traffic` (registro por IP y modo defensivo) y `Log::HandleSilentException`
completan el registro.

### 13.8 Telemetría, estadísticas y sugerencias

- `NavigationService` guarda sesiones de uso en SQLite mensual (`UpdateUsage`).
- `Statistics` registra aciertos por cartografía (ingresos, descargas, indicadores elegidos, embebidos) en `storage/stats`;
  `admin\StatisticsService` los procesa por mes. No se cuentan las visitas de administradores del sitio, salvo que tengan permiso
  sobre la obra (`ShouldSaveStats`).
- `services/suggestions/`: aprendizaje mensual de co-ocurrencias y secuencias de acciones (`MonthlyAnalyzer`, `PatternAnalyzer`)
  con decaimiento exponencial (`SuggestionsSettings`, factor por omisión 0,95), motor en línea (`SuggestionEngine`) y
  retroalimentación. Ver `DECAY_STRATEGY.md`; el `README.md` de esa carpeta está desactualizado (hallazgo 8).

## 14. Estructura de carpetas

    services/
      web/               Raíz web: index.php (entrada), static/, robots.txt, favicon; scripts auxiliares (hallazgo 3)
      startup.php        Autoload, app.php, settings, base, debug, zona horaria
      routes/            routes.php (orquestador); authenticate, common, frontend, backoffice, logs, dev, tests;
                         carpetas frontend/ backoffice/ admin/ packs/ api/ automation/
      config/            settings.php (sin secretos en el repositorio), settings.php.sample
      templates/         Twig: common (layouts, macros, mensajes), authenticate, backoffice (correos), frontend, logs
      py/                Scripts Python (SPSS, Stata, R, KMX, intersecciones) y bcup/
      doctrine_proxies/  Proxies generados de las entidades (versionados)
      src/
        app.php, debug.php
        classes/         Núcleo: App, Session, Account, Orm, Paths, Links, Router, SilexApp, StateBag, Statistics, Python,
                         geometría (GeoGeometry, GeoJson, SanitizeGeometry, SimplifyGeometry*), readers/, writers/,
                         shapefile/, spss/, settings/, enums/
        controllers/     Controladores HTML: authenticate, frontend, logs, admins, backoffice, common
        services/        backoffice (cloning, georeference, import, metrics, notifications, publish[/snapshots]),
                         frontend, admin, packs, api, common, suggestions, wfs
        db/              frontend (lectura y snapshots), backoffice (WorkModel), BaseModel
        entities/        backoffice (ORM, Draft*), frontend (objetos de respuesta), admin, BaseMapModel
        caches/          Una clase por caché
        framework/       minga\framework, compartido (sección 16)
        tests/           PHPUnit del proyecto
      phpunit.xml, phpstan.neon, psalm.xml, composer.json, *.bat (herramientas de Windows),
      Helena-phptools.phpproj (proyecto de PHP Tools; no es fuente de verdad)

**Dimensión.** 665 archivos PHP en `src/` (unas 102.600 líneas; `framework/` aporta 21.900). Las clases más grandes fuera del
framework: `App` (983), `ClippingRegionService` (951), `DatasetColumnService` (858), `MonthlyAnalyzer` (856),
`WorkService` (855), `MetricService` (791), `PublishDataTables` (782), `SanitizeGeometry` (782), `GeoGeometry` (782).

## 15. Recetas

**Agregar un endpoint**
1. Elegir el archivo de `routes/<grupo>/` (o crearlo y agregarlo al `require_once` de `routes/<grupo>.php`, respetando las
   condiciones de la sección 10).
2. Primera acción: `Session::CheckIs…`. Luego parámetros con `Params::*` y delegación en un servicio.
3. Responder con `App::Json`, `App::OrmJson` o `App::JsonImmutable` (que exige `w`).
4. Si cambia el contrato con el cliente, coordinar con el módulo Vue (sección 16).

**Agregar una operación larga:** un `*StateBag` (hereda de `StateBag`), un servicio con `Start*`/`Step*` y dos rutas. Definir los
pasos como constantes y el rótulo de cada `NextStep`.

**Agregar o cambiar una entidad ORM**
1. Clase `Draft<Nombre>` y publicada en `entities/backoffice`, con sus anotaciones y `@ClientReadonly` donde corresponda.
2. Regenerar los proxies (`generateDoctrineProxies.bat`): en producción Doctrine no los autogenera (a confirmar).
3. Revisar las matrices de `PublishDataTables::PrepareDraftTablesOperation`, el clonado (`WorkClone`, `RowDuplicator`) y el
   borrado (`WorkDelete`).
4. Revisar `WorkFlags` y `CacheManager`.

**Agregar una caché:** clase en `src/caches/` con `Cache()` y `CreateKey()`; limpieza en `CacheManager`; invalidación en
publicar, revocar y cambios de visibilidad si corresponde.

**Agregar un formato de entrada:** una clase en `classes/readers/` que hereda de `BaseReader` (`Prepare`, `WriteJson`,
`CanGeoreference`, `ReadSheetNames`) y su alta en `BaseReader::CreateReader`. Para uno de salida, `classes/writers/` desde
`BaseWriter`.

**Agregar un ajuste de configuración:** sección 13.6.

## 16. Convenciones de arquitectura (cómo escribir código acá)

- **Preservar las capas:** ruta (permiso, parámetros, respuesta) → servicio (regla de negocio) → modelo o entidad (datos). Sin SQL
  ni reglas en las rutas; sin HTML en servicios o rutas (el HTML sale de Twig por medio de los controladores).
- **Respetar dónde vive cada dato:** definiciones, datos y snapshots en MySQL; telemetría y cachés en SQLite; archivos, buckets,
  logs y estadísticas en `storage/`. No migrar un dato a otro almacenamiento sin una razón explícita y acordada.
- **Borrador y publicado:** toda funcionalidad que toque definiciones publicables revisa publicar, revocar, clonar y borrar
  (sección 15). No mezclar ids planos con «shardificados».
- **Un solo dueño de la conexión:** `App::Db()` y `App::Orm()`. No instanciar conexiones propias.
- **Parámetros, no interpolación.** Todo valor de entrada va como parámetro; los identificadores se citan con
  `QuoteTable`/`QuoteColumn`. Los nombres de tablas dinámicas salen de columnas internas (`dat_table`), nunca del pedido. Si se
  concatena un entero, se obtiene con `Params::GetInt*`.
- **Seguridad en el borde:** todo endpoint de `/services/backoffice`, `/admin` y `/packs` verifica permiso explícito como primera
  acción y comprueba la pertenencia de los ids del pedido (`CheckIsDatasetEditor`, `CheckIsWorkEditor`). Los `Step*` se protegen
  con la clave del proceso. Las claves que forman rutas de archivos se validan (sin `..`, `/`, `\`).
- **Objetos con responsabilidad acotada.** Al tocar las clases grandes (sección 14), extraer colaboradores con nombre propio
  (como `WorkFlags` o `CacheManager`) en lugar de sumar métodos. No agregar lógica de dominio a `App`, `Session`, `Str`, `Arr`
  ni `IO`: lo nuevo va en una clase con nombre propio.
- **Estáticos.** El código nuevo recibe lo que necesita por parámetro o constructor; los métodos estáticos nuevos son fábricas
  con nombre o utilidades sin estado.
- **`framework/` es compartido** con Acta Académica y otros proyectos (su `Settings` incluye ajustes de aquellos). No se cambian
  firmas ni comportamiento; sí se pueden agregar métodos y clases o ampliar la visibilidad. Cada entrega indica qué archivos de
  `framework/` difieren del recibido y confirma que la diferencia es solo aditiva. `framework/` conserva compatibilidad con
  PHP 7.4 (su `composer.json` fija `platform.php` en 7.4); la aplicación valida en 8.3.
- **Contrato público de rutas.** Las rutas `/services/...` y sus parámetros de una letra son la API del cliente Vue, de la
  automatización y de terceros (WFS, API de regiones). No se renombran ni cambia su semántica sin coordinar con el cliente. Los
  parámetros nuevos son opcionales y con valor por omisión; las propiedades de las respuestas (PascalCase) no se quitan.
- **Reemplazo de código preexistente.** Se reemplaza el código que la tarea debe tocar cuando mezcla responsabilidades, duplica
  lógica, tiene un defecto conocido o oculta errores con `try`/`catch`. No se reemplazan el modelo de persistencia (`Orm`,
  `DbSession`, `StateBag`), `framework/` ni el esquema de rutas: si bloquean una tarea, se consulta. Procedimiento: (1)
  caracterizar con pruebas el comportamiento actual (si es un defecto, la prueba lo dice y se corrige en el mismo cambio); (2)
  escribir la clase nueva y hacer pasar las pruebas; (3) migrar los usos y borrar lo viejo, sin envoltorios de compatibilidad ni
  código muerto (la búsqueda del nombre retirado queda vacía); (4) un reemplazo por entrega.
- **Reutilización antes que código suelto:** un comportamiento repetido en más de una ruta o servicio pasa a una clase común.
- **Cambios quirúrgicos y verificables.** En un código con muchos años de historia, priorizar intervenciones acotadas que se
  puedan validar antes que reescrituras amplias.

## 17. Convenciones de estilo

**Texto y nombres**

- **Registro** de comentarios, mensajes y textos al usuario: castellano rioplatense, formal, sin coloquialismos ni metáforas
  informales para describir el movimiento de los datos. La aplicación no usa traducciones (`Context::Trans` es del framework): los textos van directos en español.
- **Identificadores en inglés** (clases, métodos, propiedades, claves JSON). Comentarios en castellano.
- **Ortografía heredada:** `EllapsedMs`, `Ommit…`, `WorkVisiblityCache` y similares son contrato o están muy referenciados; no se
  corrigen salvo en una entrega de renombre específica.
- **Nombres descriptivos** que revelen la intención; funciones cortas con una sola responsabilidad. Métodos y clases en
  `PascalCase`; variables locales en `camelCase`. Nada de clases «Helper»: se extrae el grupo de funciones afín con nombre propio.
- **Conjuntos cerrados** como clases de constantes (`DatasetTypeEnum`, `SpecialColumnEnum`); interfaces nuevas con prefijo `I`.
- **Comentarios solo con valor:** el porqué, las advertencias sobre casos límite y la documentación de interfaz. No repetir lo que
  el nombre ya dice, ni escribir bloques largos. Al tocar un archivo, quitar los comentarios redundantes y el código comentado.
  Los endpoints de automatización conservan su docblock de parámetros y respuesta.

**Estructura del código**

- `if`/`else` explícito; **sin operador ternario**; **sin `continue`** (anidar `if`); **sin `match`** (`if` o `switch`).
- No usar `?? []` ni `?? 0` para ocultar datos ausentes (nota del propio repositorio en `services/wfs/TODOs.txt`): se comprueba la
  ausencia de forma explícita.
- **Excepciones.** Nunca un `catch` que descarte la excepción y siga con un valor neutro (`false`, `null`, `'-1'`) sin
  registrarla. Si algo puede no existir (un archivo, un registro), se comprueba antes (`file_exists`, `find` que devuelve `null`);
  toda otra falla interrumpe la ejecución y se muestra. Solo se silencia en tareas de registro interno que no deben cortar lo
  funcional (estadísticas, cachés), y aun así con `Log::HandleSilentException()`. Un `catch` que convierte la excepción en una
  respuesta con su mensaje es una respuesta, no un descarte.
- Una bandera que cambia qué se hace son **dos métodos con nombre**; en código nuevo, sin parámetros por referencia.
- Pocas anidaciones; salida temprana; en código nuevo, negación con `== false` (en la aplicación hoy predomina `if (!`, con 250
  usos contra 149 de `== false`; el framework usa casi siempre `== false`); sin llaves cuando el bloque ejecuta una sola
  sentencia; llaves en línea propia.
- **Tipos.** Los métodos nuevos llevan tipo en parámetros y retorno (PHP 8.3). En el código existente (222 de 4.300 funciones
  tienen retorno tipado) se tipa al tocar un método solo si coinciden el valor por omisión, el docblock y los llamadores; una
  sobrescritura no puede estrechar los parámetros del padre. No agregar `declare(strict_types=1)` a archivos que no lo tienen.
- **Código defensivo solo en la frontera** (pedido, archivos subidos, servicios externos, sistema de archivos). Adentro se
  confía en los invariantes propios.
- Cada método de servicio o modelo con trabajo relevante cierra su temporizador de `Profiling` en todos los retornos.

**Archivos**

- UTF-8 sin BOM y fin de línea LF (verificado: ningún archivo de `src/` con CRLF ni BOM). Sangría con **tabulaciones**
  (unas 43.900 líneas contra 19.800 con espacios, fuera del framework): se respeta lo dominante del archivo y no se reformatea
  en masa.
- **33 archivos no están en UTF-8** (ISO-8859-1 o Windows-1252). No se convierten sin una razón, y se editan con herramientas que
  respeten la codificación, para no dañar los acentos:

      routes/            backoffice/permission.php, logs.php
      src/classes/       ClipperRound, ExportGrid, SimplifyGeometry, SimplifyGeometryPlain, readers/CsvReader, spss/Alignment
      src/db/frontend/   DatasetDownloadModel, FileModel, SnapshotClippingRegionItemModel, SnapshotGeographyItemModel
      src/framework/src/ PerformanceItem (framework compartido: no se toca)
      src/services/      api/BackupService, common/BaseService, frontend/MetricService, frontend/NavigationService,
                         frontend/SummaryService, backoffice/CalculatedServiceBase, backoffice/FileService,
                         backoffice/UserService, backoffice/WorkCloneService, backoffice/WorkTestService,
                         backoffice/cloning/RowDuplicator, backoffice/georeference/GeoreferenceByCodes,
                         backoffice/import/DatasetTable, backoffice/metrics/JenksFisher,
                         backoffice/publish/snapshots/SnapshotGeographiesByRegionModel
      src/tests/         api/ClippingServiceTest
      raíz y web/        todo.txt, debug.txt, web/geoip.php, web/migrate.php

  Comprobación: `iconv -f UTF-8 -t UTF-8 archivo > /dev/null` falla en esos archivos.
- Hooks de Git en `framework/script/git-hooks`: `pre-commit` quita espacios finales y BOM; `pre-push` exige `pull`, compila y
  corre las pruebas si hay archivos `.php`.

## 18. Pruebas y verificación

- **PHPUnit 9.6** (`phpunit.xml`): suites `poblaciones` (`src/tests`) y `framework` (`src/framework/src/tests`), con arranque en
  `startup.php`. Las pruebas del proyecto (35 clases de prueba, unas 1.800 líneas en total) son **de integración**: requieren base de datos real
  y datos de prueba (`tests/config/defaultSettings.php` y `customSettings.php`); `classes\TestCase` los carga y desactiva la caché.
  Cubren lectores (CSV, KMX, SAV, shapefile, XLSX), funciones espaciales de la base, servicios de lectura pública, servicios de
  backoffice, conversores (R, Stata, XLSX), geometría, mapeo y serialización del ORM, Python y configuración.
- **PHPStan**: `compile.bat` ejecuta nivel 5 con `phpstan.neon` y deja el resultado en `compile.txt`. El resultado guardado
  informa 2 errores sobre `FabService::GetFabMetrics()`, pero hoy ningún fuente llama a ese método: el archivo está desactualizado
  y hay que volver a ejecutar PHPStan para tener la línea base real (no hay `vendor/` en el zip). Hay también `psalm.xml`.
- **Línea base verificada al elaborar este documento:** `php -l` sobre los 735 archivos PHP (sin `doctrine_proxies/`), con
  PHP 8.3.6: 0 errores.
- **Qué se puede verificar sin entorno completo:** `php -l`, y pruebas aisladas de lógica pura que no toquen `App` ni `Context`
  (por ejemplo `Variable`, `NtilesBreaks`, `JenksFisher`, `GeoGeometry`, `CsvParser`, `SanitizeGeometry`). El resto requiere
  base, `vendor/` y configuración reales; la entrega indica de forma explícita lo que no pudo ejecutarse.
- **Código nuevo:** clases de dominio con pruebas de comportamiento que corren sin base ni `Context`.
- Antes de entregar: `php -l` de cada archivo tocado, búsqueda de nombres retirados, revisión de `framework/` (solo cambios
  aditivos) y comprobación de la codificación de cada archivo editado.

## 19. Integración con el proyecto real

- **Composer** (`poblaciones/services`): PHP >= 8.3, `platform.php` 8.3, `apcu-autoloader`. Autoload `psr-0 ""` sobre `src/`,
  `psr-4` `helena\` → `src/` y `minga\framework\` → `src/framework/src/`. `composer-optimize.bat` regenera el autoload
  optimizado. Hay forks propios (`rodrigoq/*`).
- **Doctrine:** `generateDoctrineProxies.bat`, `clearDoctrineCaches.bat` y `cli-config.php`.
- **Desarrollo:** `composer run` levanta `php -S localhost:8888 -t web`. Con `LoopLocalPort`, `routes/dev.php` y
  `web/resolve-dev.php` redirigen al servidor de desarrollo del cliente y buscan estáticos en `../../frontend`: el repositorio
  completo tiene `services/` y `frontend/` como carpetas hermanas.
- **Producción:** puede correr en hosting compartido (README); la instalación, las fuentes y la compilación se describen en
  `startup/INSTALL.md`, `SOURCES.md` y `BUILD.md` del repositorio (no están en el zip).
- **Windows y Linux:** hay `web.config` y archivos `.bat` para Windows; rutas de Python como `C:/Python38/python.exe` en el
  `settings.php.sample`.

## 20. Hallazgos y deuda conocida

Verificados en el código el 02/11/2026. No son tareas pedidas: se registran para decidir cuáles encarar.

1. **`WorkFlags::AllAreUnset`**: el último término (`getMetricDataChanged()`) no está negado, a diferencia de los otros cuatro.
   La función devuelve `true` solo si `MetricDataChanged` es verdadero y las otras cuatro son falsas; con todo apagado devuelve
   `false`, y `StartPublication` no fuerza la republicación completa. Confirmar la intención.
2. **Depuración condicional en producción:** `PublishService::StepPublication` crea un `ConditionalDebug` con un correo personal
   fijo en el código y envuelve el paso 5 en un `try`/`catch` que delega en `HandleException` (para ese usuario imprime el error y
   corta el pedido; para el resto relanza).
3. **Rutas y scripts de diagnóstico expuestos**, si el servidor web no los bloquea: `GET /phpinfo2` (ejecuta `phpinfo()`,
   `routes/routes.php`) y `web/phpinfo2.php`; en `web/`: `b.php`, `c.php`, `d.php`, `e.php`, `f.php`, `q.php`, `alltests.php`,
   `selfCheck.php`, `simlink.php`, `geoip.php`, `migrate.php`. Además `GET /services/backoffice/GetClippings` devuelve serializado
   el dataset borrador 21 **sin control de acceso**; `GET /services/authentication/secretdata` es una demostración; y
   `routes/tests.php` registra controladores `helena\tests\cTest*` que no existen en el zip.
4. **Rutas privadas sin `Session::Check*` dentro de la ruta** (revisión automática, a verificar una por una): los `Step*` (se
   protegen con la clave del proceso), `SingleStepFileImport`, `PostImportChunk`, `VerifyDatasetsImportFile`, `StepMultiImportFile`,
   `StartTestWork`, `StepTestWork`, `GetFactories`, `Search`, `GetCurrentUserWorks` y `GetClippings` (hallazgo 3).
5. **`SilexApp::handle`** captura `\Exception` pero no `\Throwable`: un `TypeError` u otro `\Error` no pasaría por el hook `error`
   (a confirmar el efecto con el manejador de errores del framework).
6. **Excepciones descartadas:** `App::GetOrphanSet`, `GetOrphanSize` y `GetTmpSize` capturan todo y devuelven `'-1'`;
   `cRemoteMap::Show` convierte cualquier excepción en una página de error genérica. En total hay 54 `catch` en 34 archivos
   fuera del framework.
7. **`TwoLevelObjectCache::Clear($key1, $key2)`** (framework, compartido) ignora `$key2` porque lo pasa como `null`. No se modifica;
   tenerlo presente al usar claves de dos niveles.
8. **Documentación desactualizada:** `README.md` (PHP, MySQL y Python); `settings.php.sample` (valores de otro proyecto:
   `aacademica.org`, Python 2.7); `services/suggestions/README.md` (describe `DashboardService`, `ProcessingService`, rutas y SQL
   que no existen; las clases reales son `MonthlyAnalyzer`, `PatternAnalyzer`, `SqliteDbHelper`, `SuggestionEngine` y
   `SuggestionsService`).
9. **Remanentes de un servicio retirado:** `web/alltests.php` llama a `/services/metrics/GetFabMetrics`, que ya no existe en las rutas
   (`FabService` solo tiene `GetFabMetricsGrouped`, privado), y `compile.txt` conserva errores de PHPStan sobre ese método.
10. **Clases muy grandes** (sección 14) y **cobertura baja**: las pruebas del proyecto son el 1,7 % de las líneas de `src/`.

## 21. A confirmar

- Versión de MySQL y procedimiento de instalación de las funciones `GeometryCentroid`, `GeometryAreaSphere` y `GeometryIsValid`
  (el DDL no está en el zip).
- Esquema operativo de los **shards** (cuántas instancias de backoffice alimentan una base pública).
- Origen de las plantillas `index.html.twig`, `backoffice.html.twig` y `admins.html.twig` (¿las genera la compilación del cliente?).
- Uso real del tipo de dataset `G` (`GeoData`) y de las tuplas de geografías en la vista de tabla.
- Si los agentes de Poblaciones (planificador, constructor, evaluador, publicador) consumen la API de automatización.
- Tareas programadas: el zip no incluye scripts de cron; falta saber desde dónde se dispara el procesamiento de estadísticas y de
  sugerencias fuera de las pantallas de administración.
- Origen y mantenimiento de los GeoPackage y MBTiles que sirven `RasterService` y `VectorService` (`storage/rasters`).
- Si en producción Doctrine genera los proxies automáticamente o deben regenerarse al cambiar entidades.
- Uso efectivo del ingreso con Google y Facebook (`useOpenId*`) y del ingreso de Windows (`cWinLogin`).
