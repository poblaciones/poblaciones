<html>
    <head>
        <title>
        Poblaciones
        </title>
        <meta lang='es' name='keywords' content='pdf, artículos, revistas, documentos, congresos, investigación, jornadas'>
        <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
	    <link href="/styles/styles.css" rel="stylesheet" type="text/css">
		<link href="/styles/inputs.css" rel="stylesheet" type="text/css">
    </head>
    <body>
<?php

use helena\classes\Session;
use minga\framework\IO;
use minga\framework\System;

date_default_timezone_set('UTC');

include_once '../startup.php';

Session::CheckIsMegaUser();

echo "<p>&nbsp;<p>&nbsp;";

phpinfo();

