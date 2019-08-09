<?php

namespace helena\db\frontend;

use minga\framework\Str;
use helena\classes\App;
use minga\framework\Profiling;

class VariableValueLabelModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'variable_value_label';
		$this->idField = 'vvl_id';
		$this->captionField = 'vvl_caption';
	}

	public function GetByVariableId($variableId)
	{
		Profiling::BeginTimer();
		$params = array($variableId);

		$sql = 'SELECT * FROM `'.$this->tableName.'` WHERE vvl_variable_id = ? ORDER BY vvl_order';

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

}

