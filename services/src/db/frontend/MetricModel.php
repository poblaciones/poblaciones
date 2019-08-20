<?php

namespace helena\db\frontend;

use minga\framework\Str;
use minga\framework\Profiling;
use helena\db\frontend\GeographyItemModel;
use helena\classes\App;


class MetricModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'metric';
		$this->idField = 'mtr_id';
		$this->captionField = 'mtr_caption';

	}
}


