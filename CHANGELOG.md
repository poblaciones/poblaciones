- Fix: los íconos personalizados no se copiaban al duplicar cartografía.
- Ofrece estadísticas históricas (por trimestre / mes).
- El listado de cartografías permite ordenar por las más recientes y archivar las antiguas.
- El listado de cartografías recuerda el orden entre sesiones.
- Fix al recibir valores para variables categoriales más grandes que el ancho soportado.
- Ampliación del ancho soportado para variables categoriales en indicadores.

v3.06 (2022-06-25)
- Al reponer una url con un elemento seleccionado en el panel izquierdo, recupera su ubicación.
- Al cliquear en los elementos en el panel izquierdo, los resalta en el mapa (con pines o regiones según el tipo de capa).
- Resalta en el mapa los elementos de tipo 'feature' seleccionados por medio del buscador.
- Fix: recuperación de og.png (vista previa desde facebook).

v3.05 (2022-05-22)
- En modo Embebido, lo indicadores y delimitaciones iniciales no se remueven.
- Embebido no muestra total de población si no hay selección.
- Embebido compacto no selecciona regiones.
- Posibilidad de excluir indicadores públicos de una cartografía pública (categoría: ninguna).
- Opción de no notificar al usuario al agregarle un permiso.

v3.04 (2022-04-20)
- Fix: Latitud norte y sur aparecían invertidas en PDF de metadatos.
- Fix a desplazamiento de paneles de (+)
- Soporte a imágenes en Google Drive.
- Estadísticas de visitas en vistas embebidas.
- Cambio para no comenzar con foco en búsqueda.
- Mejoras de acomodamiento de paneles en pantallas chicas.

v3.03 (2022-03-30)
- Special words en regiones (para NEA y NOA).
- Fix en exportación a csv y excel desde grillas admnistrativas.
- Fix advertencia de formato no coincide en exportación a excel desde grillas administrativas.
- Fix a indexación de Delimitaciones en Google.
- Departamentos y provincias 1980 en mapas base.

v3.02 (2021-11-14)
- Fix: el botón de editar no estaba apareciendo sobre el mapa incluso si el usuario tenía permisos.
- Fix: para descarga de delimitaciones, ofrecía 'shapefile sin polígono'.
- Fix: al embeber compacto no replica el panel izquierdo abierto.
- Fix: el nombre de la selección active no estaba reflejándose en el nombre de la solapa del navegador.
- Mejoras en resolución de búsquedas de texto libre.
- Ofrece "más vistos" en el botón de agregar indicadores indexados.
- Fix: menú de indicadores apareciendo mal ubicado si se selecciona rápida.
- Fix: el tipo de trama 'semáforo' ya no requiere de indicar 'mostar valores'.

v3.01 (2021-09-30)
- Leyenda opcional en cada variable de indicador.
- Fix: acceso a indicadores según permisos.
- Fix: selección de categorías para rastreo y conteo.
- Colores aleatorios de la paleta a nuevos indicadores.
- Fix: 'volver' navega hacia a trás en el historial.
- Nombres amigables en las descargas (nombre de dataset - región seleccionada).
- Calculados generan n-tiles.
- Asigna ícono circular con letra de inicio en forma predeterminada.
- Soporte para importación de shapefiles.
- Georreferenciación automática para shapefiles y kml/kmz.

v3.00 (2021-09-24)
- Se incorpora la herramienta de rastreo.
- Se incorpora la herramienta de conteo.
- Mejoras clonado de dataset y cartografía.
- Permite excluir datasets públicos de las etiquetas del mapa base.
- Los resultados del buscador se pueden seleccionar con flechas y <enter>.
- Los indicadores de cartografías a las que se tiene acceso se ofrecen en el buscador.
- Los indicadores de cartografías a las que se tiene acceso se ofrecen en las métricas externas de una cartografía.
- Se elimina el cartel modal de 'Aguarde por favor'.
- Agrupador de menú Publicación cambia a Administración.
- Fix: borrar datasets vacíos.
- Permite vincular y desvincular versiones de las series de indicadores en forma explícita.
- Posibilidad de indicar regiones de obtención explícita en el buscador (ExplicitRegionSearchResults).

v2.38 (2021-07-19)
- Permite georreferenciar coordenadas expresadas en grados, minutos y segundos.
- Sugeridos en la administración de cartografías.
- Datos de última modificación en el listado.
- Permite insertar mapas en otros sitios.

v2.37 (2021-06-14)
- Fix a ancho linestrings (por cambio de escala en svgs).
- Fix codigos postales en clipping.
- Ampliación a 200 caracteres del nombre de adjuntos.
- Georreferenciación de segmentos por código y lat/long.
- Fix de duplicación de cartel de valores en cambios de zoom.

v2.36 (2021-05-19)
- Fix: orden de superposición de los marcadores.
- Fix: cambio de etiqueta en variable no elimina categorías de simbología.
- Filtro para dataset x indicador.
- Búsqueda por código (departamento, radio).
- Fix: delimita por país la búsqueda de direcciones.
- Fix: cálculo de área en polígonos con huecos.
- Fix: orden códigos postales en georreferenciar.
- Fix: navegación de items (funcionaba bien ir al siguiente pero no al anterior).
- Fix: crawler por regiones para indicadores con múltiples niveles.
- Fix: obtención de metadatos por la ruta /map/[id]/metadata no estaba funcionando.
- Fix: si hay visible una delimitación, se priorizan los clicks y tooltips de polígonos por sobre la delimitación.
- Resaltado de polígonos al mostrar tooltips.
- Las delimitaciones ofrecen tooltips y selección si no hay otra información de polígonos activa en la zona.
- Mejoras en velocidad de carga de mapa.
- Retoma información para representar en sucesivos niveles de zoom (polígonos y puntos).
- Fix: seleccionar delimitaciones en el popup fallaba.

v2.35 (2021-04-13)
- Segmentación de delimitaciones por selección.
- Fix: click en delimitaciones en buscador no las incorporaba.
- Fix: recuperar contraseña.
- Cambio de color y ancho de borde para delimitaciones.
- Fix: gradientes tomaba mal el nivel de transparencia del indicador.
- Actualización de material-vue.
- Ampliación de cuadro de carga de resumen.
- Fix: los íconos personalizados no tomaban la transparencia en las imágenes.
- Se admiten íconos por categoría en mapas de localizaciones.

v2.34 (2021-03-21)
- Se agregan 'delimitaciones' que reúnen una o varias regiones de clipping. Tiene fuente (metadatos), descarga e inserción desde buscador y botón de 'agregar'.
- Los tiles hacen crop de los polígonos antes de salir del servidor.
- Fix: el filtro de urbanidad/ruralidad no podía ser removida en los indicadores 'compactos' (solo lista de elementos).
- Actualización de versión default de Google Maps.
- Fix a visualización de etiquetas que incluyen comillas.
- Fix a publicación de elementos no indexados entre las etiquetas del mapa.
- Panel administrativo de delimitaciones.
- Privacidad en delimitaciones.
- Las áreas en las descargas se muestran en km2.

v2.33 (2021-01-15)
- Incorporación de íconos para las etiquetas del mapa.
- Incorporación de regiones sanitarias.
- Mejoras en búsqueda por múltiples criterios.
- Datapack Manager: mejoras mensajes de error. edición de symbol.
- Fix a descarga de PDF de metadatos desde edición.
- El botón de agregar indicador muestra los indicadores disponibles sobre el mapa.
- Los indicadores públicos tienen un segundo nivel de agrupamiento que representa la fuente (censo, mapa educativo, etc.).
- Fix: el botón de agregar indicador no se encima a la ventana de agregar indicador.
- Fix: en modo satélite, las etiquetas de los valores sobre el mapa no cambiaban a blanco.
- Mejoras en usabilidad de ventana de popup de indicadores

v2.32 (2020-12-07)
- Fix exportación a shapefile de datasets con polígonos se interumpía.
- Fix a obtención de panel de información izquierda para etiquetas del mapa.
- Posibilidad de agregar indicador desde el panel de información de ítem.
- Fix a creación de archivo .prj en shapefiles.
- Optimización para evitar ajuste poblacional en tiles altamente poblados.

v2.31 (2020-11-03)
- Muesta en administración estadísticas de descargas por tipo de archivo.
- Selección de ajuste poblacional por indicador con imágenes integradas desde WorldPpop en backoffice y visualización.
- Posibilidad de ocultar etiquetes en el mapa de calles desde la barra de herramientas.
- Suavizados los comercios y centros médicos en el mapa de base.
- El editor de datos permite crear nuevas variables en los datasets.
- Identificación: Marcadores: se puede indicar el ícono a partir de una columna.
- Identificación: Marcadores: se puede indicar el tamaño del ícono.
- Identificación: Marcadores: se puede indicar el marco del ícono (pin, círculo, recuadro).
- Identificación: Marcadores: se puede indicar contenido de tipo texto, fijo o relativo a una columna.
- Secuencias: se pueden definir secuencias en datasets de puntos (desde opciones del indicador).

v2.30 (2020-09-29)
- Reporte de espacio y mejoras en administración.
- Fix a bug de pyreader, usado para exportación a R.
- Estadísticas en el panel de usuarios.
- Estadísticas administrativas.

v2.29 (2020-08-31)
- Fix: niveles duplicados en clipping por agregado de distritos escoalres (1991, 2001, 2001, 2010)
- Apartado administrativo de revisiones.
- Fix: clonación de cartografía fallaba si había adjuntos.
- Fix: al duplicar cartografías no generaba nuevos links para visibilidad de tipo link.
- Genera las rutas de acceso (por link o fija) al crear la cartografía.
- Fix: regenerar link no funcionaba correctamente.
- Soporte a indicadores por categorías para variables de tipo texto.
- Test de mapeos de ORM.
- Parametrización de transparencia predeterminada por indicador.
- Descarga en formato rdata.

v2.28 (2020-08-12)
- Para datasets de polígonos, hace downsampling al armar el caché de tiles.
- Fix: backoffice: renombrar variable producía error si el dataset mostraba los datos ordenados por esa variable.
- Fix: cambiar el order de adjuntos, variables o fuentes hacía fallar la edición posterior sin recargar antes la página.
- Fix: Kml/Kmz/Csv: la importación fallaba por saltos de línea en los contenidos.
- Cálculo esférico para área de polígono.
- Variable Área en km2.
- Fix: importación de archivos SPSS con variables con caracteres extendidos (ej. tildes).
- Se muestran mensaje de error al usuario más específicos (cuando están disponibles).
- Soporte a caracter | como delimitador de archivos CSV
- Fix: kmls/kmz sin datos extendidos.
- Kmls/kmz: opción de importar todas las carpetas.

v2.27 (2020-08-03)
- Fix: en ciertos casos, las descargas desde cartografía publicada por link.
- Nuevo tipo de ubicación de inicio: extensión (predeterminada).
- Reordenamiento por handle para permitir scroll por touch del panel de estadísticas, en dispositivos móviles.
- Fix: actualización de selección de niveles al cargar clipping desde ruta.
- Selección múltiple en el mapa.
- Selección de hoja al importar archivos Excel.
- Refactoring y tests unitarios para readers.

v2.26 (2020-07-27)
- Ruralidad: filtro de ruralidad/urbanidad al visualizar indicadores de puntos o de nivel radios (¡Gracias Force for Good!).
- Fix: la descarga respeta el criterio de 'selección por círculo' al generar los datos.
- El ranking responde al filtro por categoría y por ruralidad.
- El click en item de ranking hace pan al envelope del polígono.
- Fix: selección automática de niveles al cambiar el zoom.
- Panel derecho colapsable y mejoras para visualizar en dispositivos móviles (¡Gracias Force for Good!).
- Mejoras en salida a PNG: se incorpora el panel de referencias a la exportación. Mejora en la resolución de la imagen (calidad imprimible). Admite exportar en formato JPG.
- Salida a PDF de las visualizaciones (¡Gracias Force for Good!).
- Fix: asignación de ruralidad para radios en CABA en los datos censales de 1991.
- Permite cargar una imagen ('marca de agua') para las instituciones productoras de cartografías y la superpone en la visualización de los mapas (¡Gracias Force for Good!).
- El tutorial deja de ofrecerse (abrirse) luego de tres visualizaciones.

v2.25 (2020-07-17)
- Mejora en la detección de filas vacías (importanción de CSV y Excel).
- Adaptación para variables categoriales (UI).
- Permite descargar archivos en formato Excel (xlsx).
- Permite descargar archivos en formato Stata (sta).
- Tests para conversores y ejecución de scripts.
- Final de compatibilidad con Python 2.7.

v2.24 (2020-06-28)
- Permite indicar que no deben escalarse los íconos de un indicador (para datos dispersos).
- Mejoras uso de comas para separar decimales (grilla de datos y carga de categoría manual).
- Fix: fallaba al publicar cartografías luego de eliminárseles todos los datasets.
- Resuelve direcciones y lugares desde el buscador del visor del mapa.
- Panel lateral del visor genera links en attributos con URLs como contenido.
- Fix: actualización en datos de grilla impactaba en fila cliqueada (no en la seleccionada).

v2.24 (2020-06-16)
- Fix: overflow de texto en grilla de edición.
- Soporte para georreferenciar y visualizar línea y líneas mútiples.
- El editor de dataset permite cambiar el ancho de columnas de texto.
- Se puede indicar una columna con URLs de imágenes.
- Fix: error al dar de baja cartografías con indicadores adicionales.

v2.23 (2020-06-01)
- Permite la distribución selectiva de cartografías a servidores secundarios.
- Fix: los markers se crean en forma directa con el estilo seleccionado (evita presentar el marker rojo al redibujar).
- Fix: no quedan markers huérfanos al cambiar el zoom antes de completar el redibujado.
- Implementa registro de picos de uso de RAM.
- Mejoras en la reutilización de svgs para preview.

v2.22 (2020-05-26)
- Refactoring tabla snapshots.
- Fix: las cuentas nuevas no se activaban automáticamente al recibirse un permiso a una cartografía.
- Fix: identificación de columnas en archivos Excel (para títulos con celdas vacías)
- Fix: descarga de SAV con columnas con caracteres extendidos.

v2.21 (2020-05-19)
- Implementación de readonlyForMaintenance.
- Retry en queries del mapa (1 vez).
- Modo CDN para servers para compatibilidad con CloudFlare.
- Soporte a búsquedas para palabras especiales de menos de 3 caracteres.
- Tests automatizados: integración a interfaz y migración a PHP Unit.
- Fix: actualización de botón de Publicar cambios.
- Badge de publicar en barra lateral.
- Fix: redirect tras cambiar contraseña por link.
- Fix: link a términos y condiciones desde pantalla de ingresar.
- La grilla de datos permite editar los valores.
- Mejoras en título para los handles para crawler (google).

v2.20 (2020-05-08)
- Los tooltips en el mapa muestra un panel con el valor actual para el feature.
- Fix: Al desmarcar el 'ver etiquetas' en el modo 'satélite' remueve las etiquetas del mapa.
- Muestra la información de los items en un panel lateral
- Para los datasets de polígonos y códigos, se reduce el efecto de repintado en los cambios de zoom.
- Se permite configurar un servidor secundario para las cartografía de base (statics).
- El cálculo de resumen de clipping utiliza el nivel correspondiente al zoom activo.
- Fix: salida de foco de controles de edición.

v2.19 (2020-04-26)
- El mapa ofrece elementos en la barra de acciones superior del panel derecho para iniciar y cerrar sesión.
- Fix: detección de encoding en CSV identificaba como mac-files archivos con mayúsculas acentuadas acentos.
- La grilla de datos del dataset en backoffice hace encoding del html que pueda estar en las celdas.
- Mejoras para ofrecer crawling segmentado (se habilitaa en configuración de región y configuración administrativa de cartografía).
- Autogeneración de carpetas de storage para ambientes nuevos.
- Fix: la publicación pisaba los extents si no había modificaciones de datos.
- Administración muestra listado de regiones.
- Fix: Al seleccionar una región o círculo de buffer se perdía el fijado de nivel.
- Fix: 'zoom al indicador' cuando había un clipping pequeño (< 90% de la cobertura del indicador) no liberaba la selección.

v2.18 (2020-04-15)
- Posibilidad de agregar indicadores externos en una cartografía a la lista de indicadores del panel superior.
- Se puede indicar qué indicadores aparecen activos en el mapa al ingresarse por las rutas de cartografía.
- Se pueden importar datos en formato excel (xls y xlsx).
- Se pueden importar archivos sin crear previamente un dataset.

v2.17 (2020-03-21)
- Fix a colocación de panel de cartografía en la vista de mapa (hasta cambiar el tamaño de la ventana, se veía mal en chrome y en firefox).
- Posibilidad de georreferenciar por distrito escolar para datos de 2001.
- Al cambiar el nivel por una modificación en el zoom (ej. de provincia a departamento), si existe una variable con igual nombre se mantiene como seleccionada.
- El bloqueo de nivel (ej. fijar departamento) se guarda y recupera de la ruta.
- Fix: al moverse sin una región seleccionada, no se actualizan los resúmenes de los indicadores.
- Mejoras en compatibilidad para MySql 5.7 y 8.0.

v2.16 (2020-02-16)
- Optimización de tiles por bloques.
- Fix: los tooltips de las capas capturaban el mouse de las etiquetas.
- Fix: los clicks en etiquetas no se propagan a las métricas.
- Ofrece ránkings para los elementos de los indicadores.
- Ofrece zoom a la extensión del indicador.
- Fix: al restaurar una ruta con indicadores, no removia los previos del visor.

v2.15 (2020-01-21)
- Deduplicación de entradas en índice fulltext.
- Separación de regiones y features en la tablas de búsqueda.
- Revisión de Urbanity en las funciones servidor.

v2.14 (2020-01-18)
- Fix a tooltips emergentes de ayuda de backoffice.
- Mejora en el listado administrativo de usuarios (permite actualizar emails y contraseña).
- Soporte mejorado para MySql 5.7.
- Build incluye ejemplos de settings.php y htaccess.
- Configuración simplificada.

v2.13 (2020-01-14)
- Opciones de inicio para la obra (dinámico, región o punto).
- Cálculo de extensión (extents) por indicador y por obra en la publicación.
- Fix a puesta en nulo de columnas de latitud y longitud al modificarse la columna de descripción.
- Fix a ruteo de metadatos.
- Homologación de título de página entre /handle y /map

v2.12 (2019-12-22)
- Fix: Los popups del visor perdían su ubicación al ser arrastrados.
- Copyright, link a comentarios, términos y condiciones e información de copyright agregada al pie del visor.
- Adaptación del onboarding al link de contacto.
- Mejora en reubicación de barra de búsqueda al reducirse la ventana.
- Mejora estética en PDF de metadatos.
- Fix: bug en eliminación de adjunto al eliminar cartografías.
- Fix: los tooltips en modo satélite no tomaban la tipografía correcta.
- Permite deshabilitar el popup de resumen en la definición del dataset (Dataset > Identificación).
- Fix: ofrece la selección de ícono solamente en los dataset de ubicaciones.
- Fix: mejoras en manejo de transacciones para evitar inconsistencias por comandos DDL.
- Agrega el nivel de visibilidad 'Enlace'.
- Hace caché de PDF de metadatos.
- Fix: cita APA de cartografía sin autor aparece formateada correctamente.

v2.11 (2019-12-02)
- El PDF de metadatos corta adecuadamente las urls largas para presentarlas.
- El PDF de medatados incluye los indicadores en la información del dataset.
- Tecla ESC funciona para cerrar popups del visor y FAB.
- Fix: Si una variable estaba en un indicador, daba error al guardar las categorías.
- Fix: Cuando el panel de indicadores en el visor se volvía angosto, se mezclaban las etiquetas con las cifras.
- Soporte a metadatos de OpenGraph para links desde facebook u otras fuentes externas.

v2.10 (2019-11-25)
- click en elementos abre infowindow.
- click en el mapa cierra los infowindow.
- el modo de + información active un hover.
- Fix: dato de posición en infowindow se superponía.
- se generan tooltips contextuales a partir de la descripción de markers y zonas.
- sitemap y metadatos para Google.

v2.9 (2019-11-16)
- El buscador permite indicar coordenadas por lat/lon.
- Se agregan botones de acceso al mapa y a publicar al editarse una cartografía.
- Si el indicador muestra conteo, no se repiten los valores de N en zonas y valores.
- Ofrece Cita (APA) en fuente de cartografía y de región activa.

v2.8 (2019-11-11)
- Fix: CloneDataset no estaba generando versiones nuevas para los indicadores.
- Mejoras en generación de nombres nuevos por clonado.
- Fix: vinculación de etiquetas y valores.
- CABA pasa a ser distrito en el clipping regions (sale de aglomerado).
- Fix: al importar archivos, si se reutilizaba el popup para subir dos archivos, anexaba el segundo al primero.
- Soporta la importación de archivos CSV con encoding MAC-ROMAN (macintosh previos a UTF-8).
- Soporta la importación de archivos CSV con delimitador de línea LF, CR, CRLF o LFCR.

v2.7 (2019-11-07)
- Fix en la detección de encoding de CSV.
- Fix en la detección de decimales en CSV.
- Fix a exportación de shapefile de puntos.
- El encoding de los shapefile que descargan es ahora UTF-8.
- Fix: columnas con decimales o negativos en shapefile daban overflow.
- Fix: shapefile tiene límite de cantidad de columnas (255). Se ignoran las siguientes en lugar de dar error.

v2.6 (2019-10-28)
- Habilitación de caching entre sesiones del navegador.
- Filtro de entidades inferiores a un pixel (< 1/300 tile) (hasta x20 en tiempos para indicadores a nivel radio)
- Mejora en uso de RAM en el browser (baja a menos de un tercio en mapas con muchas entidades).
- Permite descargar en format shapefile.

v2.5 (2019-10-18)
- Fix: al publicarse obras con cambios solamente en los metadatos, dejaban de quedar visibles sus indicadores.
- Leyendas a pie de mapa (condiciones de Google Maps) pasadas a castellano.
- Botones superiores de marco de cartografía mejorados.
- Fix: mejoras en la limpieza de caché al publicarse versiones (impacta en bug 'cambio en colores')
- Descarga de datos en format Shapefile desde el visor del mapa.
- Los 'Valores' de columna pasan a llamarse 'Categorías'.
- El agrupamiento por 'Variable' pasa a llamarse 'Categorías'.
- Fix: baja de categorías tomaba los elementos en el orden equivocado.
- Filtra geometrías de menos de 1/300 tile
- Fix: la restauración por ruta no se completaba bien si el centro se encontraba en alguna ubicación fuera del territorio nacional.

v2.4 (2019-10-10)
- Las etiquetas en modo satélite se colorean en blanco en lugar de negro.
- Mejora de rendimiento en consulta de etiquetas.
- Fix: no da error de vuejs de elementos con misma clave en el buscador.
- Fix: no deja markers huérfanos tras cambio de zoom.
- La descarga muestra % de progreso.

v2.3 (2019-09-22)
- Buscador: expresiones con textos de menos de 3 caracteres no entrecomillados volvían nula la búsqueda (ej. <riesgo inseguridad> traía <riesgo de inseguridad> pero <riesgo de inseguridad> no traía nada).
- Buscador: se incorporan los nombres de autores y la institución en la búsqueda de texto libre
- Se nombra como 'autores' a los creadores tanto en datos públicos como en cartografías.
- Al eliminar un indicador no se estaba removiendo adecuadamente del índice para búsquedas.
- La series en el resumen del buscador no aparecían ordenadas en forma ascedenente.
- El marco superior para cartografías incluye institución, autores y link a metadatos.

v2.2 (2019-08-27)
- Soporte mejorados para valores nulos en csv.
- Copiar y pegar simbologías soporta apropiadamente los atributos para nulos.
- El valor de simbología para nulos permite modificar su etiqueta.

v2.1 (2019-08-24)
- Zona administrativa en /admins.
- La zona /admin pasa a /logs.
- Administración de indexado/no indexado para cartografías y datos públicos.
- Administración de privado/público para cartografías y datos públicos en solapa de visiblidad.
- Botón de solicitar revisión en Visiblidad.
- Integración opcional de login con Google y Facebook.

v2.0 (2019-08-17)
- El 'Detalle' pasa a llamarse 'Resumen', con límite de 5 mil caracteres.
- El 'Resumen' pasa a llamarse 'Descripción'.
- Los indicadores no visible estaban solicitando información al servidor como si estuvieran visibles.
- Al omitir filas en la georreferenciación, no se deshabilitaban los botones por falta de selección.
- La descarga desde el backoffice muestra progress.
- Se validan los nombres de variable respecto a las exigencia de SPSS para nombres de variables (https://www.ibm.com/support/knowledgecenter/ko/SSLVMB_24.0.0/spss/base/syn_variables_variable_names.html).
- Fix: si una etiqueta de valores se correspondía con el valor 0, la descarga se cortaba.
- Fix: click en items de datasets de ubicaciones no está trayendo el infowindow.
- Fix: el cambio del nombre de un indicador no se reflejaba en el mapa al re-publicar.
- Al impersonar adminitrativamente se ve el nombre de ambos usuarios en la barra.
- Fix: no clonaba bien contacto de la cartografía.
- Fix: La baja de cartografía no estaba revocando antes de eliminar.
- Fix: el clonado de datasets dejaba la symbología con referencias cruzadas.
- Fix: el clonado de datasets no replica los archivos y fuentes secundarias.

v1.9 (2019-07-23)
- La identificación de indicadores es 'full text' (se pueden poner palabras sueltas y funciona. ej.: acceso gas resuelve bien el indicador "acceso a gas")
- Abre el tutorial solamente en el mapa principal, pero lo evita si está viendo el mapa enmarcando en una cartografía.
- Registra al mapa en google analytics para tener conteo de aperturas del mapa.
- La información se suporpone correctamente en la vista en 3d (ej. http://mapa.poblaciones.org/map/#/@-34.4592515,-58.5673600,18z,hd&!r15421/l=3401!v1!a2!r0)
- Las etiquetas de lugares (ej. escuelas) vuelven a ser cliqueables y abren la ventanita con información.
- Fix: symbology: al pegar una simbología con categorías manualmente definidas, si ya está manual no actualizaba bien los valores en pantalla.
- Fix: La búsqueda no enviaba correctamente a ítems (ej. nombre de asentamiento en buscador).- Fix: La revocación no eliminaba los indicadores correctamente (seguían viéndose en las búsquedas indicadores que ya no existían o no estaban visibles).
- Fix: el resumen no limitada la cantidad de caracteres.

v1.8 (2019-07-09)
- Ventana de nuevo indicador no re-tomaba la categoría del indicador para datos públicos.
- Mejoras en revocación de datos publicados.
- Fix: Al agregarse un indicador al mapa desde los indicadores de una cartografía no se seleccionaba la versión correcta.
- Fix: Al editar etiqueta de columna no se modificaban las variable_caption de los indicadores.
- Se recuperó la posibilidad de visualizar dinámicamente capas en múltiples niveles (radio, departamento, provincia). Con datos: NBI.
- Fix: si había una región de clipping y luego se trazaba un círculo, traía los datos de la intersección de ambas en lugar de darle prioridad al círculo.
- Moverse entre ediciones (2001 2010) no pierde la variable seleccionada (por posición).
- Permite indicar qué categorías están activadas al cargar un indicador.
- Datos nbi 2001 corregidos.
- Datos de elecciones segunda vuelta 1995, corregidos.
- A los indicadores de personas de censo 1991 le faltaban dos variables de asistencia por edades.
- La búsqueda funciona más rápido (de 2.5 segundos promedio a 25 milisegundos) y es 'full text' (se pueden usar varias palabras sin que sea necesario que coincidan como frase).
- La visualización de mapas funciona más rápido (de 4 segundos a 40 milisegundos en tiles grandes) por cambios en la estructura de índices.
- Fix a guardar como PNG.
- Para 2010 hay datos multinivel en las variables de hogares (ej. zoom out en nbi, bienes, tenencia, etc. muestra por departamento / provincia).

v1.7 (2019-06-19)
- Si el usuario cierra la sesión, o la sesión expira, y la ventana queda abierta, al hacer una acción pone un cartel explicando la situación y redirige a la ventana de registración.
- Cuando el sitio exportaba a CSV, no hacía el encoding del texto en UTF8. Ahora sí lo hace.
- Al importar csv, cuando el encoding no estaba en UTF8, en lugar de ignorar los caracteres no reconocidos, se cortaba con error.
- Al importar csv, cuando los números venían como 02, no los tomaba como texto (que es más conveniente).
- Al importar csv, cuando los números venían con decimales en 0 (0,00000) no omitiía esos ceros.
- El visor acepta ponerle en la ruta lat long sin zoom (pone 14 como predeterminado).
- Ventana de login en medea
- Alerta de baja y de publicación
- Se registra estadística de consulta por cartografía para futura presentación a los usuarios de la obra (de descarga de metadatos, de dataset y de consulta de indicador).
- Mejoras estéticas a los formularios de login, registración y pérdida de password.
- La activación de usuario permite realizarse por código numérico.
- Logoff redirige a la home principal.
- Fix error al editar usuario.
- Fix registración de usuario existente pero no activado.
- La administración de usuarios permite modificar el nivel de acceso.
- Correcciones para que al acceder con permiso de escritura las pantallas de indicadores no ofrezcan opciones de modificar que luego fallan por no tener permisos.

v1.6 (2019-06-11)
- En importación csv, si la última línea no terminaba en enter, la ignoraba.
- Fix a anexar datos (columnas o filas) importando archivos en datasets con valores.
- Los valores en el resumen del mapa se muestran con los decimales indicados en el dataset.
- Genera url estable al publicar y la muestra en forma coherente en backoffice, visor y PDF de metadatos.

v1.5 (2019-06-07)
- Order de versions en el popup de fabmetric para que se muestren en forma creciente (2001, 2010) incluso si fueron cargadas en otro orden.
- Las opciones del botón de indicadores públicos queda por debajo del cuadrado de feedback.
- Hacer que oculte etiquetas vacias cuando se indica eso en la configuración del indicador.
- Hacer que los indicadores de conteo (con una sola categoría) no agreguen en el visor una fila de totales
- Guardar log de uso por usuario (cantidad de visitas por mes y para el día actual y previo)
- Los metadatos de las cartografías y las regiones de clipping no tenían fuentes secundarias.
- Arreglos varios de errores derivados de cambios o acumulados (crear cartografía, logoff, indicadores sin variables de corte se ocultaban)

v1.4 (2019-05-27)
- mover posición de variable en indicador no funciona
- ofrecer al usuario download de pdf de metadata.
- incluso cuando no hay nivel departamento deja de mostrar los datos a nivel radio cuando se aleja en el zoom
- permisos de la institución o fuente que acabás de crear no permite editar
- tener un listado de usuarios para administradores
- poder ingresar al sitio 'como otro usuario' para fines administrativos
- permiter copy paste de simbología
- permitir copy paste de colores
- falla descargar desde backoffice
- hacer se que se pueda elegir la variable con que inicia un indicador al agregarse cuando tiene varias variables

v1.3 (2019-05-20)
- reescribir la cola de pedidos http
- agregar mapicons
- download tienen que ser dos caches, no uno
- que no genere < 0 ni franjas encimadas
- arreglar creación de escalas... que no se superpongan
- mail a diseñador
- arreglar publicación de osm
- arreglar upload de adjunto en techo 2013 (deshabilitar botón)

v1.2 (2019-05-13)
- la obra se ve horrible
- click en los labels en el mapa (dehsabilitar)
- editar mas datos de las variables columnas
- password se resetea
- rango automático se pisa... validar en el SAVE menor que 0 no existe.
- falta validar rango manual en valuepopup
- situación del upload
- revisar permisos de usuario pichi
- ponerle scroll al popup de fabmetrics
- agregar un edited, igual que ommited
- BUG rename de obra no renombra el listado
- El case está en en insert de snpashot
- BUG poner y grabar un value default con color para que publique de una.
- cambiar icono de editar en mapa
- BUG cateogíras es válido con conteo
- BUG los errores, como 'no hay valores para', no los muestra al usuario.
- terminar valuepopup
- Fix: fabmetrics no se actualiza bien.
- Se crea archivo changelog para controlar las versiones.
