<?php

namespace helena\db\frontend;

use helena\db\frontend\DatasetModel;
use helena\db\frontend\GeographyItemModel;
use helena\entities\frontend\metric\InfoWindowInfo;
use helena\classes\App;
use minga\framework\Str;
use minga\framework\Profiling;

use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;

class DatasetItemModel
{

	public function GetInfoById($datasetId, $itemId)
	{
		Profiling::BeginTimer();
		$ret = $this->doGetInfo($datasetId, $itemId);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetInfoByGeographyItemId($datasetId, $geographyItemId)
	{
		Profiling::BeginTimer();
		$ret = $this->doGetInfo($datasetId, null, $geographyItemId);
		Profiling::EndTimer();
		return $ret;
	}

	public function doGetInfo($datasetId, $itemId, $geographyItemId = null)
	{
		$datasetModel = new DatasetModel();
		$dataset = $datasetModel->GetDatasetById($datasetId);
		$table = $dataset['table'];
		// trae las columnas para resumen
		$columns = $datasetModel->GetDatasetColumns($datasetId, true);
		$captionColumn = null;
		$cols = $this->ResolveTitle($dataset, $itemId, $geographyItemId, $captionColumn);
		$cols .= $this->ResolveImage($dataset);
		$cols .= $this->ResolveColumns($columns, $captionColumn);

		$from = ' FROM ' . $table;
		$params = array();
		if($itemId == null)
		{
			$where = ' WHERE geography_item_id = ?';
			$params[] = $geographyItemId;
		}
		else
		{
			$where = ' WHERE id = ?';
			$params[] = $itemId;
		}

		$sql = "SELECT " . $cols . $from . $where . " LIMIT 1";
		$row = App::Db()->fetchAssoc($sql, $params);

		$info = new InfoWindowInfo();
		$info->Title = $row['Title'];
		$info->Code = $row['Code'];
		$info->Type = $row['Type'];
		$info->Image = $row['Image'];
		if ($info->Image !== null) $info->Image = trim($info->Image);

		$items = $this->FormatItems($row, $columns, $captionColumn);
		$info->Items = $items;

		return $info;
	}

	private function FormatItems($row, $columns, $captionColumn)
	{
		$items = array();
		$n = 0;
		foreach($columns as $column)
		{
			if ($captionColumn != $column['field'])
			{
				$val = $row['c' . $n];
				if (is_numeric($val) && (substr((string)$val, 0, 1) !== '0' || substr((string)$val, 0, 2) === '0.'))
				{
					$val = (float) Str::FormatNumber((float) $val, $column['decimals']);
				}
				$items[] = array('Name' => $column['caption'], 'Value' => $val, 'Caption' => $row['l' . $n]);
				$n++;
			}
		}
		return $items;
	}
	private function ResolveImage($dataset)
	{
		if ($dataset['images_column_id'])
		{
			return ", " . $dataset['images_column_field'] . " as Image";
		}
		else
		{
			return ", null as Image";
		}
	}

	private function ResolveColumns($columns, $captionColumn)
	{
		$cols = "";
		// agrega las columnas
		$n = 0;
		foreach($columns as $column)
		{
			if ($captionColumn != $column['field'])
			{
				$cols .= ', ' . $column['field'] . ' c' . $n;
				if ($column['id'] != null)
					$cols .= ', (SELECT dla_caption FROM dataset_column_value_label WHERE dla_dataset_column_id = ' . $column['id'] . ' AND dla_value = ' . $column['field'] . ') l' . $n;
				else
					$cols .= ', null l' . $n;
				$n++;
			}
		}
		return $cols;
	}
	private function ResolveTitle($dataset, $itemId, $geographyItemId, &$captionColumn)
	{
		Profiling::BeginTimer();
		if ($itemId != null)
		{
			// trae los datos de la columna de título
			$captionColumn = $dataset['caption_column_field'];
			if ($captionColumn == null)
				$title = 'null Title';
			else
			{
				$field = SnapshotByDatasetModel::ResolveDescriptionField($dataset['caption_column_id'], $captionColumn);
				$title = $field . ' Title';
			}
			$title .= ', null Code, ' . Str::CheapSqlEscape($dataset['caption']) . ' Type';
		}
		else
		{
			$geographyModel = new GeographyItemModel();
			$ret = $geographyModel->GetMetadataById($geographyItemId);
			$title = Str::CheapSqlEscape($ret['Caption']) . ' Title, ' . Str::CheapSqlEscape($ret['Code']) . ' Code, ' . Str::CheapSqlEscape($ret['Type'] . ' (' . $ret['Revision']. ')') . ' Type';
		}
		$ret = $title;
		Profiling::EndTimer();
		return $ret;
	}

}

