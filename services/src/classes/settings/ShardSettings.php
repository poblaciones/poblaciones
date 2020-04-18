<?php

namespace helena\classes\settings;

use helena\classes\App;
use minga\framework\ErrorException;

class ShardSettings
{
	//Datos de la partición de la base de datos
	public $CurrentShard = 1;
	public $Inclusions = null;
	public $Exclusions = null;

	public function CheckCurrentIsSet()
	{
		if ($this->CurrentShard == null)
		{
			echo('El archivo de configuración settings.php debe establecer un número de Shard entre 1 y 99 (Context::Settings()->Shard()->CurrentShard = n).');
			exit;
		}
		if ($this->Exclusions != null && in_array($this->CurrentShard, $this->Exclusions))
		{
			echo('El Shard actual no puede estar dentro de las exclusiones.');
			exit;
		}
	}
	public function CheckPublicShard($shard)
	{
		if ($this->IsValidPublicShard($shard) == false)
			throw new ErrorException('Se ha solicitado información correspondiente a un shard no accesible.');
	}
	public function FilterItemsByPublic($list, $shardField)
	{
		$ret = array();
		foreach($list as $item)
		{
			if ($this->IsValidPublicShard($item[$shardField] % 100))
			{
				$ret[] = $item;
			}
		}
		return $ret;
	}
	public function IsValidPublicShard($shard)
	{
		$id = intval($shard);
		if ($id > 99 || $id < 1)
			return false;
		if ($this->CurrentShard != $id && $this->Inclusions != null && in_array($shard, $this->Inclusions) == false)
			return false;
		if ($this->Exclusions != null && in_array($shard, $this->Exclusions))
			return false;
		return true;
	}

	public function CheckBackofficeShard($shard)
	{
		if ($this->IsValidBackofficeShard($shard) == false)
			throw new ErrorException('Se ha solicitado información correspondiente a un shard no accesible.');
	}
	public function IsValidBackofficeShardLow($shard)
	{
		return true;
		// return $this->IsValidBackofficeShard($shard % 100);
	}
	public function IsValidBackofficeShard($shard)
	{
		$id = intval($shard);
		if ($id > 99 || $id < 1)
			return false;
		if ($this->CurrentShard != $id)
			return false;
		else
			return true;
	}
}
