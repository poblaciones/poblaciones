<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class LevelInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $LevelType;
	public $Revision;

	public $GeographyId;
	public $Dataset;
	public $SummaryCaption;
	public $HasUrbanity;
	public $HasSummary = false;
	public $HasTotals = false;

	public $Pinned = false;

	public $Source;
	public $Wiki;
	public $MaxZoom;
	public $MinZoom;
	public $HasArea;
	public $HasDescriptions;
	public $CanSetUrbanity;
	public $SelectedVariableIndex;


	public $Variables = array();

	public static function GetMap()
	{
		return array (
			'mvl_id' => 'Id',

			'geo_id' => 'GeographyId',
			'geo_caption' => 'Name',
			'geo_revision' => 'Revision',
			'geo_max_zoom' => 'MaxZoom',
			'geo_min_zoom' => 'MinZoom',

			'met_wiki' => 'Wiki');
	}

}


