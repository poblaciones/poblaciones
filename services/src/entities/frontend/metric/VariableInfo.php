<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class VariableInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $NormalizationScale;
	public $IsDefault = false;

	public $Pattern;
	public $CustomPattern = '';
	public $ShowSummaryTotals = true;
	public $ShowDescriptions = false;
	public $ShowValues = false;
	public $ShowEmptyCategories = true;
	public $Decimals = 0;
	public $HasTotals = 0;
	public $IsSimpleCount = false;
	public $DefaultMeasure = 'N';
	public $ValueLabels = array();

	public static function GetMap()
	{
		return array (
			'mvv_id' => 'Id',
			'mvv_caption' => 'Name',
			'mvv_normalization_scale' => 'NormalizationScale',
			'mvv_is_default' => 'IsDefault',
			'mvv_default_measure' => 'DefaultMeasure',
			'dco_decimals' => 'Decimals',
			'vsy_show_values' => 'ShowValues',
			'vsy_show_labels' => 'ShowDescriptions',
			'vsy_show_empty_categories' => 'ShowEmptyCategories',
			'vsy_show_totals' => 'ShowSummaryTotals',
			'vsy_pattern' => 'Pattern');
	}

}


