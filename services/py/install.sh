USAR PYTHON 3.7.11 (no 3.8)

./pip install tqdm
./pip install pymysql


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

# o también: CFLAGS='-std=c99' python3 -m pip install pyreadstat

# r
./pip install pyreadr

# En hosting compartido hacer antes:
#> virtualenv python
#> cd ~/mapas/bin y... ejecutar ~/mapas/bin/pip install savReaderWriter

# para ver la carpeta actual de python:
# > which python

# Desde la carpeta de python hacer:
./python -m pip install [--user] savReaderWriter
./python -m pip install ijson
./python -m pip install numpy

# kmz
./python -m pip install bs4
./python -m pip install lxml
./python -m pip install unicodecsv

# sta
./python -m pip install pandas
./python -m pip install pyreadstat