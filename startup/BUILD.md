# Poblaciones
Esta guía detalla cómo generar a partir de los fuentes un entorno instalable. 

## 1. Armar el entorno de fuentes

Seguir los pasos indicados para obtener los fuentes para el entorno de desarrollo: https://github.com/poblaciones/poblaciones/blob/master/startup/SOURCES.md.

## 2. Compilar la versión 

Desde una consola de bash, ejecutar el script build.sh que se encuentra en /build indicando el parámetro vendor:

poblaciones/build> ./build.sh vendor

Esto generará en la subcarpeta /build/release una versión compilada del visor del mapa (javascript a partir de vuejs) junto con los archivos de PHP que resuelven los servicios del servidor. Ambos deben subirse a un servidor web para su utilización.

## 3. Instalar la versión

Para instalar la versión generada, seguir los pasos indicados para la instalación de un release: https://github.com/poblaciones/poblaciones/blob/master/startup/INSTALL.md.
