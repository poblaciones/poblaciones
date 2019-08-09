<?php

namespace helena\db\admin;

use minga\framework\Str;
use minga\framework\Profiling;
use helena\db\frontend\GeographyItemModel;
use helena\classes\App;

class MetadataModel extends BaseModel
{
	public function  __construct($fromDraft = true)
	{
		$this->tableName = $this->makeTableName('metadata', $fromDraft);
		$this->idField = 'met_id';
		$this->captionField = '';

	}
}


