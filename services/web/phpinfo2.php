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

use minga\classes\globals\Session;
use minga\framework\IO;
use minga\framework\System;

date_default_timezone_set('UTC');

phpinfo();

exit();
include_once 'startup.php';

Session::CheckSessionMegaViewer();

echo "<p>&nbsp;<p>&nbsp;";

phpinfo();
echo("-DIR ETC----<br>");
foreach(IO::GetDirectories("/etc") as $line)
	echo($line) . " ";
echo("<br>-FILES----<br>");

foreach(IO::GetFiles("/etc/httpd/conf.d") as $line)
	echo($line) . " ";
echo("-FIN----<br>");

echo (exec("/etc/httpd -M", $output, $ret) . "<br>");
print_r($output);
echo "Arquitecture: " . System::GetArchitecture() . "bits<br>";
echo "Linux: " . getLinuxDistro(). "<br>";
echo "ObList handlers: ";
echo print_r(ob_list_handlers(), true);

if(isset($_SERVER['REMOTE_ADDR']))
	echo('RemoteAddr: ' . $_SERVER['REMOTE_ADDR'] . "<br>");

function getLinuxDistro()
{
	//declare Linux distros(extensible list).
	$distros = array(
		"Arch" => "arch-release",
		"Debian" => "debian_version",
		"Fedora" => "fedora-release",
		"Ubuntu" => "lsb-release",
		'Redhat' => 'redhat-release',
		'CentOS' => 'centos-release');
	//Get everything from /etc directory.
	$etcList = scandir('/etc');

	//Loop through /etc results...
	foreach ($etcList as $entry)
	{
		//Loop through list of distros..
		foreach ($distros as $distroReleaseFile)
		{
			//Match was found.
			if ($distroReleaseFile === $entry)
			{
				//Find distros array key(i.e. Distro name) by value(i.e. distro release file)
				$OSDistro = array_search($distroReleaseFile, $distros);

				break 2;//Break inner and outer loop.
			}
		}
	}

	return $OSDistro;

}
