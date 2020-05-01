#!/bin/bash
# fileencoding=utf8
# lineends=linux

# Sube relese a servidor de producción o beta
# parámetros:
#    vendor (default false): sube directorio vendor
#

vendor=false
output=./release

# manejo de parámetros

if [ "$2" == "" ]; then
	echo "*** Para marcar el tag en git, agregarlo como parámetro ***"
else
	echo "*** Marcando el tag v$2 ***"
	git tag v$2
fi


while test $# -gt 0
do
	case "$1" in
		vendor)
			vendor=true
			echo "*** Upload incluye Vendor ***"
			;;
	esac
	shift
done

cd ../services
echo "*** Test y compilación pre release... ***"
echo "Compilando..."
if [[ `./vendor/bin/phpstan analyse -c phpstan.neon -l 5 --memory-limit 1024M -q . || echo Err` ]]; then
	echo "Error en complilación, cancelando build."
	echo
	read -n1 -r -p "Press any key to continue..." key
	exit 1
fi
echo "Compilado OK"
echo

echo "Corriendo tests..."
if [[ `./vendor/bin/phpunit --stop-on-failure 2> /dev/null || echo Err` ]]; then
	echo "Error en tests, cancelando build."
	echo
	read -n1 -r -p "Press any key to continue..." key
	exit 1
fi
echo "Tests OK"
echo

cd -

echo "*** Preparando en $output ***"

echo "*** Borra release anterior si había y/o crea el directorio"
rm -f $output.tar.bz2
rm -rf $output
mkdir -p $output

echo "*** Genera proxies de doctrine"
cd ../services
rm -rf ./doctrine_proxies
./vendor/doctrine/orm/bin/doctrine orm:generate-proxies>../build/$output-2_proxies.log
cd ../build

echo "*** 1. Copia todo lo que hay que subir"
cp -vr ../services/startup.php $output>>$output-1_copy.log
cp -vr ../services/py $output>>$output-1_copy.log
cp -vr ../services/src $output>>$output-1_copy.log
cp -vr ../services/config $output>>$output-1_copy.log
cp -vr ../services/resources $output>>$output-1_copy.log
cp -vr ../services/web $output>>$output-1_copy.log
cp -vr ../services/templates $output>>$output-1_copy.log
cp -vr ../services/routes $output>>$output-1_copy.log
cp -vr ../services/doctrine_proxies $output>>$output-1_copy.log

if [ $vendor = true ]; then
	cp -vr ../services/vendor $output>>$output-1_copy.log
fi

echo "*** 2. Borra lo que no se sube"
find $output/config ! -name 'settings.php.sample' -type f -exec rm -f {} +
rm -f $output/web/.htaccess
rm -f $output/web/IIRF.ini
rm -f $output/web/web.config

rmcache=echo
echo "*** 3. Compila frontend RELEASE"
npm run upload --prefix ../frontend/>$output-3_build.log
if [[ ! -d $output/web/static ]]; then
    echo " LA COMPILACION FALLO!!"
    read -n1 -r -p "Press any key to continue..." key
    exit 1
fi

echo "*** 4. Copia archivos adicionales"
mkdir $output/web/static/css

cp ../services/web/static/js/jquery-1.10.1.min.js $output/web/static/js/jquery-1.10.1.min.js>$output-4_copy.log
cp ../services/web/static/js/js.js $output/web/static/js/js.js>$output-4_copy.log
cp ../services/web/static/css/styles.css $output/web/static/css/styles.css>>$output-4_copy.log
cp ../services/web/static/css/authenticate.css $output/web/static/css/authenticate.css>>$output-4_copy.log
cp -r ../services/web/static/img $output/web/static/>>$output-4_copy.log
cp $output/templates/index.html.twig $output/templates/frontend/>>$output-4_copy.log
cp $output/templates/backoffice.html.twig $output/templates/frontend/>>$output-4_copy.log
cp $output/templates/admins.html.twig $output/templates/frontend/>>$output-4_copy.log

echo "*** 5. Crea release comprimido"
tar cjvf $output.tar.bz2 -C $output . >$output-5_tar.log

echo "*** Release generado con éxito"

read -n1 -r -p "Press any key to continue..." key
