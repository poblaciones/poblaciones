<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;

class VariableModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'variable';
		$this->idField = 'mvv_id';
		$this->captionField = 'mvv_caption';

	}

	public function GetByVersionLevelId($versionLevelId)
	{
		Profiling::BeginTimer();
		$params = array($versionLevelId);

		$sql = "SELECT variable.*, symbology.*, IFNULL(dco_decimals, 0) dco_decimals,
											IFNULL(dco_variable, 'rich_variable') dco_variable
								FROM variable
								JOIN symbology ON mvv_symbology_id = vsy_id
								LEFT JOIN dataset_column ON dco_id = mvv_data_column_id
								WHERE `mvv_metric_version_level_id` = ?
							ORDER BY mvv_order";
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}


}


