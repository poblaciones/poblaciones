# Poblaciones
Aplicación web para la publicación colaborativa de datos espaciales de población

# Introducción

Poblaciones es una aplicación web que permite visualizar y cargar datos georreferenciados de población.

Funciona como un servidor autónomo de información geoespacial para navegadores web, apoyado en PHP 7.1 y MySql 5.6. Utiliza Google Maps como provedor del mapa de base, dando en forma permanente acceso a los servicios asociados de StreetView.

Permite subir datos y metadatos de información espacial mediante una interfaz moderna y simple, permitiendo a los usuarios administrar sus producciones dentro del sitio. 

# Características

* La aplicación permite a los usuarios registrarse y crear cartografías. La información subida por los usuarios puede ser georreferenciada a partir de cartografía de base disponible en el sitio (ej. polígonos de provincias, departamentos, radios censales) o por sus coordenadas (latitud/longitud).

* La subida de archivos se realiza por medio de archivos CSV o SPSS (.sav).

* La plataforma permite a múltiples usuarios administrar y anexar su información, pudiendo luego los usuarios que visitan el mapa poder ver esta información en forma simultánea (colocar información provista por diferentes personas en una sola vista). 

* Los administradores del sitio pueden marcar conjuntos de datos como 'datos públicos', los cuales son destacados a los usuarios para facilitar la consulta.

* El sitio realiza indexación full-text sobre las regiones en el mapa, las entidades y los indicadores publicados, permitiendo a los usuarios acceder desde un buscador a cualquiera de estos elementos. 

* La información disponible puede ser visualizada por segmentos espaciales, tales que provincias, municipios, barrios, localidades. La plataforma permite agregar múltiples niveles de segmentación, los cuales agrupan luego a los datos subidos por los usuarios (ej. listado de establecimientos educativos).

* Permite capturar las visualizaciones en archivos PNG y descargar los datos en formato CSV o SPSS (.sav).

* La plataforma produce estadísticas propias de rendimiento y de acceso al sitio, además de integrarse con Google Analytics y AddThis.

# Requerimientos

La aplicación puede ser alojada en un servidor compartido (ej. hostgator), dado que no requiere de la ejecución de instalaciones con permisos de administrador en el servidor. Son sus requisitos de software:

- MySql 5.6 ó superior.
- PHP 7.1 ó superior.
- Python 2.7 (requisito para permitir subir y descargar información en formato SPSS [.sav])
- SO: indistinto.

# Demo

El sitio se encuentra operativo con datos demográficos, sociales y políticos de la Argentina en https://poblaciones.org.

# Créditos

Agustín Salvia y Pablo De Grande establecieron en 2016 el alcance inicial, proyectada como una herramienta para la publicación y visualización de información espacial de datos sociales de población. 
El diseño de la arquitectura y el modelo de datos dependieron de Pablo De Grande y Rodrigo Queipo, quienes desarrollar el primer prototipo funcional del visor durante 2017. 

La participación de Gimena del Río, a partir de 2018, permitió enmarcar al proyecto como plataforma colaborativa académica de ciencia abierta y situar sus características dentro del espacio de discusión de las Humanidades Digitales. 

Entre 2018 y 2019 se completó la segunda versión del visor y la interfaz web de administración de datos espaciales, etapa de desarrollo que estuvo a cargo de Gonzalo Méndez y Pablo De Grande. Juan Bonfiglio fue responsable de la evaluación de uso y comentarios de dicha etapa.

Las cartografías publicadas del Observatorio de la Deuda Social en la versión 2019 fueron puestas online por Juan Bonfiglio. Los datos públicos de la versión 2019 fueron procesados por Pablo De Grande, en colaboración con Agustín Salvia para los indicadores censales 2010-2001-1991.

Nidia Herández y Romina De León trabajaron en la comunicación de contenidos, elaborando videos, tutoriales y estructurando el contenido de la página institucional, bajo la supervisión de Gimena del Río. Ezequiel Soto trabajó en el diseño gráfico de la página institucional.

# Licencia

