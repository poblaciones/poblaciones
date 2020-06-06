# Poblaciones
Esta guía detalla los pasos necesarios para descargar e instalar la aplicación. Para ejecutar requiere de MySql 5.7 (o MariaDB) y un servidor web que puede ejecutar páginas PHP. Puede ser alojado en un servidor compartido (shared hosting) que cumpla estos dos requisitos.

## 1. Instalar el software necesario

1. Instalar PHP 7.1 en Apache o IIS (Windows) (https://www.php.net/downloads.php).

2. Instalar Python 2.7 (sólo requerido para conversiones de archivos SPSS) (https://www.python.org/downloads/release/python-2716/)

3. Instalar las dependencias de Python: 

pip install savReaderWriter
pip install ijson
pip install numpy

4. Instalar MySql 5.7 (https://dev.mysql.com/downloads/mysql/).

## 2. Descargar la versión de Poblaciones

1. Ingresar a https://github.com/poblaciones/poblaciones/releases y descargar la versión más reciente.

2. Expandir ese archivo en una carpeta.

## 3. Iniciar una base de datos para Poblaciones

1. Crear una base en MySql (mysql> create database poblaciones;).

2. Descargar de https://github.com/poblaciones/poblaciones/tree/master/startup el script correspondiente a esa versión (dbscript-VERSION.sql. 

3. Ejecutar el script en la base de datos para que cree las tablas, índices y funciones de la base de datos (mysql> source <script>).

4. (opcional) Agregar los registros de un 'data-pack' desde https://github.com/poblaciones/data-packs.

5. El usuario predeterminado para acceder luego a la aplicación es 'admin', cuya contraseña es 'admin001'. Se recomienda modificarla en el primer uso.

## 4. Crear los archivos de configuración

1. Renombrar /config/settings.sample.php a /config/settings.php 
 
2. Indicar dentro de ese archivo:
  * los datos de conexión a la base de datos (Context::Settings()->Db()->SetDatabase())). 
  * la dirección en la se accederá al mapa (Context::Settings()->Servers()->RegisterServers(<url del servidor>, [opcional] <ruta a la home page institucional>)). La ruta a la homepage institucional se utiliza para redirigir a los usuarios al hacerse logoff, y para generar los links de términos y condiciones (http://<homepage>/terminos) 
  * una clave para utilizar la api de Google Maps (Context::Settings()->Keys()->GoogleMapsKey).
  
3. Opcionalmente, indicar configuraciones para el envío de notificaciones por correo electrónico, y  autenticación de OpenAuth de Google y Facebook (generando las claves necesarios para esos servicios).

4. En la carpeta /web, renombrar el archivo .htaccess.sample a .htaccess.

## 5. Crear el sitio para el servidor

1. Agregar un Site (en IIS o apache) que apunte a la carpeta /web, resolviendo con ella la navegación de la ruta que se haya indicado en settings.php (ej. http://mapa.institucional.org, http://localhost, http://mapasinterna/).

Ejemplo en apache:
```
<VirtualHost *:80>
    ServerName mapasinterna
    DocumentRoot [directorio]/web
    ...
</VirtualHost>
```

2. Si se subió en un servidor remoto (hosting), asegurarse que la carpeta pública/visible del hosting refiere a /web. 

3. Si bien los datos cargados por los usuarios se persisten en la base de datos relacional, varios cachés y otros logs que proceduce la aplicación se almacen en una carpeta. La carpeta predeterminada para ello es /storage. Revisar que haya sobre esa carpeta permisos de escritura.

## 6. Navegación e inicialización 

1. Navegar http://<ruta>/logs para consultar la parte administrativa.

2. Si se importó un data-pack, es  necesario regenerar las tablas precalculadas de la base de datos. En la consola de administración (http://<ruta>/logs), ir a Configuración > Cachés y presionar sucesivamente 'Actualizar' en los cachés de Geografías, Regiones por Geografías y Lookup de Regiones para regenerar los cachés.

3. Navegar http://<ruta>/ para acceder al mapa.
  
4. Navegar http://<ruta>/users para acceder a la creación de cartografías.
  
5. Navegar http://<ruta>/admins para acceder a la administación de usuarios y cartografías.
  
  
