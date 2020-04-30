<?php

if(function_exists('vd') == false)
{
	function vd($var, $die=true)
	{
		echo '<pre>';
		var_dump($var);
		echo '</pre>';
		if($die) die;
	}
}
if(function_exists('pr') == false)
{
	function pr($var, $die=true)
	{
		echo '<pre>';
		print_r($var);
		echo '</pre>';
		if($die) die;
	}
}
if(function_exists('ec') == false)
{
	function ec($var, $die=true)
	{
		echo '<pre>';
		echo $var;
		echo '</pre>';
		if($die) die;
	}
}

