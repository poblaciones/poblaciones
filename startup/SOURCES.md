# Poblaciones
Esta guía detalla los pasos necesarios para inicializar una instalación de desarrollo de Poblaciones.

## 1. Instalar el software necesario.

1) Para instalar VueJS. Descargar e instalar NodeJs https://nodejs.org/en/. Luego de instalarlo, ejecutar npm install vue

2) Instalar PHP 7.1 o posterior en Apache a IIS.

3) Instalar Python 2.7 (sólo requerido para conversiones de archivos SPSS)

4) Instalar MySql 5.6 o superior.

## 2. Descargar los fuentes del repositorio.

1) Hacer git clone de https://github.com/poblaciones/poblaciones en una carpeta local.

## 3. Iniciar una base de datos para Poblaciones

1) Utilizar [dbscript-v1.sql](dbscript-v1.sql) para crear una base vacía. 

2) Agregar los registros de un 'data-pack' desde https://github.com/poblaciones/data-packs.

3) Ejecutar en la base de datos los scripts de /startup/scripts para actualizar la estructura.

4) El usuario predeterminado para acceder luego a la aplicación es 'admin', cuya contraseña es 'admin001'. Se recomienda modificarla en el primer uso.

## 4. Actualizar las dependencias.

Los fuente se descargan sin las dependencias que utilizan. Para descargarlas ne forma automática ejecutar:

   frontend> npm install
  
   services> php composer.phar install

Eso instalará las librerías que precisan los servicios en PHP y cliente VueJS.

## 5. Crear los archivos de configuración

1) Renombrar services/config/settings.sample.php a services/config/settings.php 
 
2) Indicar dentro de ese archivo los datos de conexión a la base de datos. 

3) Indicar configuraciones para el envío de notificaciones por correo electrónico y las claves para la API de Google Maps.

4) Renombrar frontend/config/dev.env.sample.js a frontend/config/dev.env.js
 
5) Indicar dentro de ese archivo un key válido de google maps.

## 5. Crear sitios para el servidor de servicios

1) Agregar en hosts la entrada desa.poblaciones.org apuntando a 127.0.0.1.

2) Agregar un Site (en IIS o apache) que apunte a la carpeta /services/web, resolviendo con ella la navegación de http://desa.poblaciones.org (o la ruta que se haya elegido).

3) Si bien los datos cargados por los usuarios se persisten en la base de datos relacional, varios cachés y otros logs que proceduce la aplicación se almacen en filesystem. La carpeta predeterminada para ello es /services/storage. Revisar que haya sobre esa carpeta permisos de escritura.

4) Iniciar el frontend (el servidor de vuejs) ejecutando:
 
    frontend>npm run dev

## 6. Navegación e inicialización 

1) Navegar http://localhost:8000/ para el visor, http://localhost:8000/users#/ para el backoffice, y http://desa.poblaciones.org/logs para la parte administrativa.

2) Por último paso, regenerar las tablas precalculadas de la base de datos: en la consola de administración (desa.poblaciones.org/logs), ir a Configuración > Cachés y presionar sucesivamente 'Actualizar' en los cachés de Geografías, Regiones por Geografías y Lookup de Regiones para regenerar los cachés.
