<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\services\backoffice\publish\PublishDataTables;

use minga\framework\Profiling;
use helena\entities\frontend\geometries\Envelope;
use helena\classes\SpecialColumnEnum;
use helena\classes\App;
use helena\classes\DatasetTypeEnum;
use minga\framework\ErrorException;
use helena\db\admin\WorkModel;

class SnapshotByDatasetModel
{
	public function RegenDatasetLevels($datasetId)
	{
		Profiling::BeginTimer();
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);

		$workModel = new WorkModel(false);
		$dataset = $workModel->GetDataset($datasetIdShardified);

		if (sizeof($dataset) == 0 || $dataset == null)
			throw new ErrorException("Dataset no encontrado");

		$columns = $this->BuildHeaders($dataset);

		$levels = $this->GetDatasetLevels($dataset['dat_id']);
		foreach ($levels as $level)
		{
			$this->ProcessDatasetLevel($level, $columns);
		}
		if (App::Db()->tableExists($dataset['dat_table']))
		{
			$this->CreateTable($dataset, $columns);
			$this->InsertValues($dataset, $columns);

			foreach ($levels as $level)
			{
				$this->UpdateExtents($dataset, $level);
			}
		}

		Profiling::EndTimer();
	}

	public static function SnapshotTable($table)
	{
		return $table . "_snapshot";
	}

	private function CreateTable($dataset, $columns)
	{
		Profiling::BeginTimer();

		// Hace el drop preventivo
		$table = self::SnapshotTable($dataset['dat_table']);
		App::Db()->dropTable($table);

		// Hace el create
		$sqlCols = '';
		foreach($columns as $column)
			$sqlCols .= "," . $column[0] . ' ' . $column[1];
		$sql = "CREATE TABLE " . $table . " (" . substr($sqlCols, 1) . ",
								 INDEX (sna_geography_item_id), SPATIAL INDEX(sna_envelope), SPATIAL INDEX(sna_location)) ENGINE=MyISAM;";
		App::Db()->execDDL($sql);
		// Listo
		Profiling::EndTimer();
	}
	private function InsertValues($dataset, $columns)
	{
		Profiling::BeginTimer();

		$sqlCols = '';
		foreach($columns as $column)
			$sqlCols .= "," . $column[0];
		$sqlValues = '';
		foreach($columns as $column)
			$sqlValues .= "," . ($column[2] === null ? "null" :  $column[2]);

		// Arma el FROM
		$table = $dataset['dat_table'];
		$sql = "INSERT INTO " . self::SnapshotTable($table) . " (" . substr($sqlCols, 1) . ")
						SELECT " . substr($sqlValues, 1);
		// Pne valores
		$sql .= " FROM " . $table . ", geography_item WHERE gei_id = geography_item_id";
		// Cierra el select
		$sql .= " AND gei_geometry_is_null = 0 ORDER BY id";
		// Ejecuta
		App::Db()->exec($sql);
		Profiling::EndTimer();
	}

	private function GetDatasetLevels($datasetId)
	{
		Profiling::BeginTimer();

		$sql = "SELECT metric_version.*, metric_version_level.*, dataset.*, geo_id,
							geo_caption, geo_field_caption_name,
							caption.dco_field AS dat_caption_field,
							longitude.dco_field AS dat_longitude_field,
							latitude.dco_field AS dat_latitude_field

							FROM metric_version
							JOIN metric_version_level ON mvl_metric_version_id = mvr_id
						  JOIN dataset ON dat_id = mvl_dataset_id
							JOIN geography ON geo_id = dat_geography_id

							LEFT JOIN dataset_column latitude ON latitude.dco_id = dat_latitude_column_id
							LEFT JOIN dataset_column longitude ON longitude.dco_id = dat_longitude_column_id

							LEFT JOIN dataset_column caption ON caption.dco_id = dat_caption_column_id

							WHERE dat_id = ?";

		$ret = App::Db()->fetchAll($sql, array($datasetId));
		foreach($ret as &$metricVersionLevel)
		{
			$variables = Variable::GetVariables($metricVersionLevel);
			$metricVersionLevel['variables'] = $variables;
		}
		Profiling::EndTimer();
		return $ret;
	}

	private function ProcessDatasetLevel($metricVersionLevel, &$columns)
	{
		$variables = $metricVersionLevel['variables'];
		foreach ($variables as $variable)
		{
			$this->BuildVariableColumns($metricVersionLevel, $variable, $columns);
		}
		return $variables;
	}


	private function UpdateExtents($dataset, $metricVersionLevel)
	{
		Profiling::BeginTimer();

		// Calcula la condición que muestra que tiene valores en esas
		// filas cuando son categoriales
		$variables = $metricVersionLevel['variables'];
		$notNullCondition = "";
		foreach ($variables as $variable)
		{
			if ($variable->attributes['vsy_cut_mode'] === 'V')
			{
				$col = 'sna_' . $variable->Id() . '_value_label_id';
				$notNullCondition .= " AND " . $col . " <> 0 AND " . $col . " IS NOT NULL ";
			}
		}
		// Calcula para cada level
		$sql = "SELECT ST_AsText(PolygonEnvelope(LineString(
                POINT(Min(ST_X(PointN(ExteriorRing(sna_envelope), 1))),
				MIN(ST_Y(PointN(ExteriorRing(sna_envelope), 1)))),

				POINT(Max(ST_X(PointN(ExteriorRing(sna_envelope), 3))),
				MAX(ST_Y(PointN(ExteriorRing(sna_envelope), 3))))
                              ))) extents
				FROM  " . self::SnapshotTable($dataset['dat_table']);
		if ($notNullCondition !== '')
			$sql .= " WHERE " . substr($notNullCondition, 4);

		$res = App::Db()->fetchAssoc($sql);

		if ($res['extents'] !== null)
		{
			$envelope = Envelope::FromDb($res['extents']);
			$rect = "ST_PolygonFromText('" . $envelope->ToWKT() . "')";
		}
		else
		{
			$rect = 'null';
		}
		// Lo pone
		$metricVersionLevelId = $metricVersionLevel['mvl_id'];
		$unShardifiedId = PublishDataTables::Unshardify($metricVersionLevelId);
		$update = "UPDATE draft_metric_version_level SET mvl_extents = " . $rect . " WHERE mvl_id = ?";
		App::Db()->exec($update, array($unShardifiedId));
		// Listo
		Profiling::EndTimer();
	}


	private function BuildHeaders($dataset)
	{
		// $dataset = recibe $dataset + geography
		$columns = [];
		$columns[] = ['sna_id', 'int(11) PRIMARY KEY', 'id'];
		$columns[] = ['sna_geography_item_id', 'int(11) NOT NULL', 'gei_id'];
		$columns[] = ['sna_urbanity', "char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N'", 'gei_urbanity'];
		$description = $this->GetDescriptionColumn($dataset);
		if ($description !== 'null')
		 $description = 'LEFT(' . $description . ', 250)';
		$columns[] = ['sna_description', 'varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL', $description];

		$columns[] = ['sna_feature_id', 'bigint(11) NOT NULL', $this->GetFeatureIdField($dataset)];
		$columns[] = ['sna_area_m2', 'double NOT NULL', $this->GetArea($dataset)];

		$envelopeTarget = '';
		$location = '';
		if ($dataset['dat_type'] == DatasetTypeEnum::Data)
		{
			$envelopeTarget = "gei_geometry";
			$location = "gei_centroid";
		}
		else if ($dataset['dat_type'] == DatasetTypeEnum::Shapes)
		{
			$envelopeTarget = "geometry";
			$location = "centroid";
		}
		else if ($dataset['dat_type'] == DatasetTypeEnum::Locations)
		{
			$point = "POINT(CAST(" . $dataset['dat_longitude_field'] . " AS DECIMAL(14,8)), CAST(" .
																$dataset['dat_latitude_field'] . " AS DECIMAL(14,8)) )";
			$envelopeTarget = $point;
			$location = $point;
		}
		else
			throw new ErrorException("Invalid dataset type.");

		$columns[] = ['sna_envelope', 'polygon NOT NULL', "PolygonEnvelope(" . $envelopeTarget . ")"];
		$columns[] = ['sna_location', 'point NOT NULL', $location];

		return $columns;
	}

	private function BuildVariableColumns($metricVersionLevel, $variable, &$columns)
	{
		// Calcula el valor
		$columns[] = ['sna_' . $variable->Id() . '_value', 'double NULL', $variable->CalculateValueField()];

		// Calcula la categoría
		$valueForSegmentation = $variable->CalculateSegmentationValueField();
		$valueLabel = $variable->CalculateVersionValueLabelId($valueForSegmentation);
		$columns[] = ['sna_' . $variable->Id() . '_value_label_id', 'int(11) NOT NULL', $valueLabel];

		// total de normalización
		$columns[] = ['sna_' . $variable->Id() . '_total', "double NOT NULL DEFAULT '0'", $variable->CalculateNormalizationField()];
	}

	private function GetFeatureIdField($dataset)
	{
		if ($dataset['dat_type'] == DatasetTypeEnum::Shapes ||
			$dataset['dat_type'] == DatasetTypeEnum::Locations)
		{
			return $dataset["dat_id"] . " * 0x100000000 + id";
		}
		else
			return "gei_id";
	}

	private function GetArea($dataset)
	{
		if ($dataset['dat_type'] == DatasetTypeEnum::Shapes)
			return "area_m2";
		else
			return Variable::SpecialColumnToField(SpecialColumnEnum::AreaM2);
	}
	private function GetDescriptionColumn($metricVersionLevel)
	{
		if ($metricVersionLevel['dat_caption_field'] == null)
		{
			if ($metricVersionLevel['geo_field_caption_name'] == "")
				return "null";
			else
				return "gei_caption";
		}
		else
			return $metricVersionLevel['dat_caption_field'];
	}
}
