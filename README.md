# Poblaciones
Aplicación web para la publicación colaborativa de datos espaciales de población

## Introducción

Poblaciones es una aplicación web que permite visualizar y cargar datos georreferenciados de población.

Funciona como un servidor autónomo de información geoespacial para navegadores web, apoyado en PHP 7.4 y MySql 5.7. Utiliza Google Maps como provedor del mapa de base, dando en forma permanente acceso a los servicios asociados de StreetView.

Permite subir datos y metadatos de información espacial mediante una interfaz moderna y simple, permitiendo a los usuarios administrar sus producciones dentro del sitio. 

## Características

* La aplicación permite a los usuarios registrarse y crear cartografías. La información subida por los usuarios puede ser georreferenciada a partir de cartografía de base disponible en el sitio (ej. polígonos de provincias, departamentos, radios censales) o por sus coordenadas (latitud/longitud).

* La subida de archivos se realiza por medio de archivos CSV o SPSS (.sav).

* La plataforma permite a múltiples usuarios administrar y anexar su información, pudiendo luego los usuarios que visitan el mapa poder ver esta información en forma simultánea (colocar información provista por diferentes personas en una sola vista). 

* Los administradores del sitio pueden marcar conjuntos de datos como 'datos públicos', los cuales son destacados a los usuarios para facilitar la consulta.

* El sitio realiza indexación full-text sobre las regiones en el mapa, las entidades y los indicadores publicados, permitiendo a los usuarios acceder desde un buscador a cualquiera de estos elementos. 

* La información disponible puede ser visualizada por segmentos espaciales, tales que provincias, municipios, barrios, localidades. La plataforma permite agregar múltiples niveles de segmentación, los cuales agrupan luego a los datos subidos por los usuarios (ej. listado de establecimientos educativos).

* Permite capturar las visualizaciones en archivos PNG y descargar los datos en formato CSV o SPSS (.sav).

* La plataforma produce estadísticas propias de rendimiento y de acceso al sitio, además de integrarse con Google Analytics y AddThis.

## Requerimientos

La aplicación puede ser alojada en un servidor compartido (ej. hostgator), dado que no requiere de la ejecución de instalaciones con permisos de administrador en el servidor. Son sus requisitos de software:

- MySql 5.7. 
- PHP 7.4.
- Python 3.4 (requisito para permitir subir y descargar información en formato SPSS [.sav])
- SO: indistinto.

## Demo

El sitio se encuentra operativo con datos demográficos, sociales y políticos de la Argentina en https://poblaciones.org.

## Tutoriales técnicos

En youtube pueden encontrar tutoriales técnicos para mantener, extender y mejorar el código en https://bit.ly/2x0PXFm.
## Instalación

Para instalar un ambiente productivo: [guía de instalación](startup/INSTALL.md)

Para armar un ambiente de desarrollo: [guía para desarrollo](startup/SOURCES.md)

Para generar una versión para instalar: [guía de compilación](startup/BUILD.md)

## Licencia
Poblaciones - Plataforma abierta de datos espaciales de población.

Copyright (C) 2018-2021. Consejo Nacional de Investigaciones Científicas y Técnicas (CONICET) y Universidad Católica Argentina (UCA). 

El código fuente se encuentra bajo licencia GNU GPL version 3 o posterior.

### Reconocimientos
Poblaciones cuenta con el apoyo del [Observatorio de la Deuda Social Argentina](http://uca.edu.ar/es/observatorio-de-la-deuda-social-argentina) y del [Consejo Nacional de Investigaciones Científicas y Técnicas](https://www.conicet.gov.ar/).

Poblaciones hace uso de los siguientes proyectos de código abierto: [ver lista completa](ACKNOWLEDGEMENTS.md)
