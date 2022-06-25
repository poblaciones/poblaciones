<?php

namespace helena\db\frontend;

use helena\db\frontend\GeographyItemModel;
use helena\entities\frontend\metric\InfoWindowInfo;
use helena\classes\App;
use minga\framework\Str;
use minga\framework\Profiling;
use minga\framework\PublicException;

use helena\entities\frontend\geometries\Coordinate;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Geometry;

use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\backoffice\publish\snapshots\SnapshotLookupModel;

class DatasetModel
{

	public function GetDatasetById($id, $fromDraft = false)
	{
		$draftPreffix = ($fromDraft ? 'draft_' : '');

		Profiling::BeginTimer();
		$sql = 'SELECT
			d1.dat_id id,
			d1.dat_caption caption,
			d1.dat_table `table`,
			d1.dat_type `dat_type`,
			d1.dat_are_segments,
			d1.dat_geography_id,
			d1.dat_geography_segment_id,

			d1.dat_caption_column_id `caption_column_id`,
			d1.dat_images_column_id `images_column_id`,

			images_column.dco_field AS images_column_field,
			caption_column.dco_field AS caption_column_field,

			longitude.dco_field AS dat_longitude_field,
			latitude.dco_field AS dat_latitude_field,
			longitudeSegment.dco_field AS dat_longitude_field_segment,
			latitudeSegment.dco_field AS dat_latitude_field_segment,

			(SELECT dco_field FROM dataset_column
			WHERE dco_id = dat_longitude_column_id) as LongitudeColumn,
			(SELECT dco_field FROM dataset_column
			WHERE dco_id = dat_latitude_column_id) as LatitudeColumn

		FROM ' . $draftPreffix . 'dataset d1
			LEFT JOIN ' . $draftPreffix . 'dataset_column images_column ON images_column.dco_id = d1.dat_images_column_id
			LEFT JOIN ' . $draftPreffix . 'dataset_column caption_column ON caption_column.dco_id = d1.dat_caption_column_id

			LEFT JOIN ' . $draftPreffix . 'dataset_column latitude ON latitude.dco_id = d1.dat_latitude_column_id
			LEFT JOIN ' . $draftPreffix . 'dataset_column longitude ON longitude.dco_id = d1.dat_longitude_column_id
			LEFT JOIN ' . $draftPreffix . 'dataset_column latitudeSegment ON latitudeSegment.dco_id = d1.dat_latitude_column_segment_id
			LEFT JOIN ' . $draftPreffix . 'dataset_column longitudeSegment ON longitudeSegment.dco_id = d1.dat_longitude_column_segment_id
		WHERE d1.dat_id = ? LIMIT 1';
		$ret = App::Db()->fetchAssoc($sql, array((int)$id));
		if ($ret == null)
			throw new PublicException("El dataset no ha sido encontrado.");
		Profiling::EndTimer();
		return $ret;
	}


	public function GetDatasetColumns($id, $inSummary = false, $fromDraft = false)
	{
		Profiling::BeginTimer();
		$draftPreffix = ($fromDraft ? 'draft_' : '');

		$sql = 'SELECT
			dco_id id,
			dco_field field,
			dco_variable variable,
			dco_caption caption,
			dco_format format,
			dco_column_width column_width,
			dco_field_width field_width,
			dco_decimals decimals,
			dco_measure measure,
			dco_alignment align
			FROM ' . $draftPreffix . 'dataset_column
			WHERE ' . ($inSummary ? 'dco_use_in_summary = 1' : 'dco_use_in_export = 1') . '
			AND dco_dataset_id = ?
			ORDER BY dco_order';

		$rows = App::Db()->fetchAll($sql, array((int)$id));

		Profiling::EndTimer();
		return $rows;
	}


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

	private function doGetInfo($datasetId, $itemId, $geographyItemId = null)
	{
		$dataset = $this->GetDatasetById($datasetId);
		$table = $dataset['table'];
		// trae las columnas para resumen
		$columns = $this->GetDatasetColumns($datasetId, true);
		$captionColumn = null;
		$joins = "";
		$cols = $this->ResolveTitle($dataset, $itemId, $geographyItemId, $captionColumn);
		$cols .= $this->ResolveImage($dataset);
		$cols .= $this->ResolveColumns($columns, $captionColumn);
		$cols .= $this->ResolveSpatialColumns($dataset, $joins);
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

		$sql = "SELECT " . $cols . $from . $joins . $where . " LIMIT 1";

		$row = App::Db()->fetchAssoc($sql, $params);

		$info = new InfoWindowInfo();
		$info->Title = $row['Title'];
		$info->Code = $row['Code'];
		$info->Type = $row['Type'];
		$info->Image = $row['Image'];
		if ($info->Image !== null) $info->Image = trim($info->Image);

		$items = $this->FormatItems($row, $columns, $captionColumn);
		$info->Items = $items;

		$info->Centroid = Coordinate::FromDbLonLat($row['centroid'])->Trim();
		if ($row['geometry'])
			$info->Canvas = Geometry::FromDb($row['geometry']);
		if ($row['envelope'])
			$info->Envelope = Envelope::FromDb($row['envelope'])->Trim();

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

	private function ResolveSpatialColumns($dataset, &$joins)
	{
		$snap = new SnapshotLookupModel();
		if (SnapshotByDatasetModel::UseGeographyItemPolygon($dataset))
		{
			$joins .= " LEFT JOIN geography_item ON gei_id = geography_item_id ";
		}

		return ", " . $snap->GetCentroidField($dataset) . " AS centroid " .
						 ", " . $snap->GetEnvelopeField($dataset) . " AS envelope " .
							", " . $snap->GetGeometryField($dataset) . " AS geometry ";
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
			$title = Str::CheapSqlEscape($ret['Caption']) . ' Title, ' .
											Str::CheapSqlEscape($ret['Code']) . ' Code, ' .
											Str::CheapSqlEscape($dataset['caption']) . ' Type';
											// Str::CheapSqlEscape($ret['Type'] . ' (' . $ret['Revision']. ')') . ' Type';
		}
		$ret = $title;
		Profiling::EndTimer();
		return $ret;
	}

}

