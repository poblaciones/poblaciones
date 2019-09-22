[CURRENT]

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
