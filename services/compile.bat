@ECHO OFF

del compile.txt 2>NUL

CALL "vendor\bin\phpstan" analyse -c phpstan.neon -l 5 --memory-limit 1024M . > compile.txt

start compile.txt


