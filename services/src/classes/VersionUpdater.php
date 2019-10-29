<?php

namespace helena\classes;

use helena\classes\App;

class VersionUpdater 
{
	private $key;
	public function __construct($key)
	{
		$this->key = $key;
	}
	public static function LoadCartoUpdateStates()
	{
	return App::Db()->fetchAll("select v1.ver_name, 1 from version v1, "
					. " version v2 where v1.ver_value <> v2.ver_value AND v2.ver_name='CARTO_GEO'");
	}
	public function NeedUpdate()
	{
		return (0 == App::Db()->fetchScalarInt("select count(*) from version v1, "
					. " version v2 where v1.ver_value = v2.ver_value AND v2.ver_name='CARTO_GEO' and v1.ver_name = ?", array($this->key)));
	}

	public static function Increment($key)
	{
		App::Db()->exec("update version set ver_value = ver_value + 1 where ver_name = ?", array($key));
	}

	public function SetUpdated()
	{
		$val = App::Db()->fetchScalar("select v2.ver_value from version v2 where v2.ver_name='CARTO_GEO'");

		App::Db()->exec("update version set ver_value = ? where ver_name = ?", array($val, $this->key));
	}
}