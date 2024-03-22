<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class VariableInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $ShortName;
	public $Normalization;
	public $NormalizationScale;
	public $IsDefault = false;
	public $Legend;
	public $Perimeter;
	public $Asterisk = '';

	public $Pattern;
	public $CustomPattern = '';
	public $ShowSummaryTotals = true;
	public $ShowDescriptions = false;
	public $ShowValues = false;
	public $ShowPerimeter = 0;
	public $ShowEmptyCategories = true;
	public $Decimals = 0;
	public $Opacity = 'M';
	public $GradientOpacity = 'M';
	public $HasTotals = 0;
	public $IsArea = false;
	public $IsSimpleCount = false;
	public $RankingItems = null;
	public $DefaultMeasure = 'N';
	public $IsCategorical;
	public $IsSequence;
	public $ValueLabels = array();
	public $ValidMetrics = array();
	public $CurrentOpacity = -1;
	public $CurrentGradientOpacity = -1;

	public static function GetMap()
	{
		return array (
			'mvv_id' => 'Id',
			'mvv_caption' => 'Name',
			'mvv_normalization' => 'Normalization',
			'mvv_normalization_scale' => 'NormalizationScale',
			'mvv_legend' => 'Legend',
			'mvv_perimeter' => 'Perimeter',
			'mvv_is_default' => 'IsDefault',
			'mvv_default_measure' => 'DefaultMeasure',
			'dco_decimals' => 'Decimals',
			'dco_variable' => 'ShortName',
			'vsy_show_values' => 'ShowValues',
			'vsy_opacity' => 'Opacity',
			'vsy_gradient_opacity' => 'GradientOpacity',
			'vsy_show_labels' => 'ShowDescriptions',
			'vsy_show_empty_categories' => 'ShowEmptyCategories',
			'vsy_show_totals' => 'ShowSummaryTotals',
			'vsy_is_sequence' => 'IsSequence',
			'vsy_pattern' => 'Pattern');
	}

}


