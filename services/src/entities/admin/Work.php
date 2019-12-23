<?php

namespace helena\entities\admin;

use helena\entities\BaseMapModel;

class Work extends BaseMapModel
{
	public $Id;
	public $Comments;
	public $StartArgs;

	public $Metadata;
	public $MetadataId;
	public $Type;
	public $Metrics;
	public $FileUrl;
	public $Files;
	public $ImageId;
	public $ImageType = 'N';

	public $PreviousMetricVersions;
	public $PreviousDatasets;
	public $Shard = 0;

	public $MetadataChanged = 0;
	public $DatasetLabelsChanged = 0;
	public $DatasetDataChanged = 0;
	public $MetricLabelsChanged = 0;
	public $MetricDataChanged = 0;

	function __construct()
	{
		$this->Metadata = new Metadata();
	}
	public static function GetMap()
	{
		return array (
			'wrk_id' => 'Id',
			'wrk_type' => 'Type',
			'wrk_metadata_id' => 'MetadataId',
			'wrk_comments' => 'Comments',
			'wrk_image_id' => 'ImageId',
			'wrk_image_type' => 'ImageType',
			'wrk_shard' => 'Shard',
			// Solo existen en draft
			'wrk_metadata_changed' => 'MetadataChanged',
			'wrk_dataset_labels_changed' => 'DatasetLabelsChanged',
			'wrk_dataset_data_changed' => 'DatasetDataChanged',
			'wrk_metric_labels_changed' => 'MetricLabelsChanged',
			'wrk_metric_data_changed' => 'MetricDataChanged'
			);
	}
	public function FillMetadata($row)
	{
		$this->Fill($row);
		$this->Metadata->FillMetadata($row);
	}
	public function FillMetadataFromParams()
	{
		$this->FillFromParams();
		$this->Metadata->FillMetadataFromParams();
	}
	public function FillMetrics($rows)
	{
		$arr = array();
		foreach($rows as $row)
		{
			$arr[] = array('Id' => $row['Id'], 'Name' => $row['Name']);
		}
		$this->Metrics = $arr;
	}

	public function FillFiles($rows)
	{
		$arr = array();
		foreach($rows as $row)
		{
			$arr[] = array('Caption' => $row['Caption'], 'Web' => $row['Web'], 'FileId' => $row['FileId']);
		}
		$this->Files = $arr;
	}
}



