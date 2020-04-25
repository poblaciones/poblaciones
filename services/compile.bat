@ECHO OFF

echo .>compile.txt

CALL "vendor\bin\phpstan" analyse -c phpstan.neon -l 5 src\ --memory-limit 1024M > compile.txt


start compile.txt


