# Poblaciones
Esta guía detalla los pasos necesarios para inicializar una instalación de desarrollo de Poblaciones.

## 1. Instalar el software necesario

1. Para instalar VueJS. Descargar e instalar NodeJs v.13 https://nodejs.org/en/. Es necesario correr la instalación completa instalando las herramientas para compilar paquetes en C o C++. El instalador descarga e instala todas las dependencias. 

2. Luego de instalar VueJS, ejecutar > `npm install vue`.

3. Instalar PHP 7.4 o posterior. No hace falta configurar Apache o IIS porque el servidor de VueJS se ocupará de resolver localmente en desarrollo los pedidos PHP (por medio del componente https://github.com/sindresorhus/php-server) que en producción resuelve el webserver remoto.

4. Instalar Python 3.4 o superior (requerido para conversiones de archivos) (https://www.python.org/downloads/release/python-3811/)

5. Instalar las dependencias de Python: 

# spss
./pip install savReaderWriter
./pip install ijson
./pip install numpy

# kmz
./pip install bs4
./pip install lxml
./pip install unicodecsv

# sta
./pip install pandas
./pip install pyreadstat

# r
./pip install pyreadr


5. Instalar MySql 5.7 o superior (https://dev.mysql.com/downloads/mysql/).

## 2. Descargar los fuentes del repositorio

1. Hacer `git clone https://github.com/poblaciones/poblaciones` en una carpeta local.

2. Hacer `git submodule update` en el mismo directorio.

## 3. Iniciar una base de datos para Poblaciones

1. Utilizar el script de inicialización de base de datos [dbscript-v3.10.sql](dbscript-v3.10.sql) para crear una base vacía. 

2. Agregar los registros de un 'data-pack' desde https://github.com/poblaciones/data-packs.

3. Ejecutar en la base de datos los scripts de /startup/scripts para actualizar la estructura. Es importante hacer esto para no tener errores por desactualización de script. La manera adecuada de hacerlo es examinar la tabla VERSION, donde hay un registro DB que indica la versión de la base de datos. Si la versión es por ejemplo 95, se deben correr los scripts 096 en adelante de la carpeta /startup/scripts. 

4. El usuario predeterminado para acceder luego a la aplicación es 'admin', cuya contraseña es 'admin001'. Se recomienda modificarla en el primer uso.

## 4. Actualizar las dependencias

Los fuente se descargan sin las dependencias que utilizan. Para descargarlas ne forma automática ejecutar:

```
   frontend> npm install
   services> php composer.phar install
```

Eso instalará las librerías que precisan los servicios en PHP y cliente VueJS.

## 5. Crear los archivos de configuración

1. Renombrar services/config/settings.sample.php a services/config/settings.php 
 
2. Indicar dentro de ese archivo los datos de conexión a la base de datos. 

3. Indicar configuraciones para el envío de notificaciones por correo electrónico y las claves para la API de Google Maps. Opcionalmente se puede habilitar allí la autenticación de OpenAuth de Google y Facebook (generando las claves necesarios para esos servicios).

4. Renombrar frontend/config/dev.env.sample.js a frontend/config/dev.env.js
 
5. Indicar dentro de ese archivo un key válido de google maps.

## 6. Navegación e inicialización 

1. Iniciar el frontend (el servidor de vuejs) ejecutando:
 ```
    frontend>npm run dev
```

2. Configurar en el archivo /hosts de Windows o linux la entrada: 

        127.0.0.1     desa.poblaciones.org
  
3. Navegar https://desa.poblaciones.org:8000/ para utilizar el visor, https://desa.poblaciones.org:8000/users#/ para ingresar al backoffice, y https://desa.poblaciones.org:8000/logs y https://desa.poblaciones.org:8000/admins para consultar los módulos administrativos.

4. Por último, es necesario regenerar las tablas precalculadas de la base de datos. En la consola de administración (http://desa.poblaciones.org/logs), ir a Configuración > Cachés y presionar sucesivamente 'Actualizar' en los cachés de Geografías, Regiones por Geografías y Lookup de Regiones para regenerar los cachés.

5. Al navegar, debe indicarse al navegador que acepte el certificado de SSL (para la ruta desa.poblaciones.org) a pesar de no ser un certificado emitido por una entidad raíz registrada. Para consultar esto en chrome, ver: https://support.google.com/chrome/answer/99020
