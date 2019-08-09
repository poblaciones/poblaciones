<?php

function vd($var, $die=true)
{
	echo '<pre>';
	var_dump($var);
	echo '</pre>';
	if($die) die;
}
function pr($var, $die=true)
{
	echo '<pre>';
	print_r($var);
	echo '</pre>';
	if($die) die;
}
function ec($var, $die=true)
{
	echo '<pre>';
	echo $var;
	echo '</pre>';
	if($die) die;
}

