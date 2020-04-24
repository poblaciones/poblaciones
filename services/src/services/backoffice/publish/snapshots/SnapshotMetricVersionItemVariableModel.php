<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\services\backoffice\publish\PublishDataTables;

use minga\framework\Profiling;
use helena\entities\frontend\geometries\Envelope;
use helena\classes\SpecialColumnEnum;
use helena\classes\App;
use helena\classes\DatasetTypeEnum;
use minga\framework\ErrorException;

class SnapshotMetricVersionItemVariableModel
{
	public function ClearMetricVersion($metricVersionId)
	{
		$metricVersionIdShardified = PublishDataTables::Shardified($metricVersionId);

		Profiling::BeginTimer();

		$sqlDelete = "DELETE FROM snapshot_metric_version_item_variable WHERE miv_metric_version_id = ?";
		App::Db()->exec($sqlDelete, array($metricVersionIdShardified));

		Profiling::EndTimer();
	}

	public function RegenMetricVersion($metricVersionId)
	{
		$metricVersionIdShardified = PublishDataTables::Shardified($metricVersionId);

		Profiling::BeginTimer();

		$levels = $this->GetMetricVersionLevels($metricVersionIdShardified);
		foreach ($levels as $level)
			$this->ProcessMetricVersionLevel($level);

		Profiling::EndTimer();
	}

	private function GetMetricVersionLevels($metricVersionId)
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

							WHERE mvl_metric_version_id = ?";
		$ret = App::Db()->fetchAll($sql, array($metricVersionId));

		Profiling::EndTimer();
		return $ret;
	}
	private function ProcessMetricVersionLevel($metricVersionLevel)
	{
		$variables = Variable::GetVariables($metricVersionLevel);
		foreach ($variables as $variable)
		{
			$this->InsertRows($metricVersionLevel, $variable);
		}
		$this->UpdateExtents($metricVersionLevel);
	}

	private function UpdateExtents($metricVersionLevel)
	{
		Profiling::BeginTimer();
		// Calcula para cada level
		$sql = "SELECT ST_AsText(PolygonEnvelope(LineString(
                POINT(Min(ST_X(PointN(ExteriorRing(miv_envelope), 1))),
				MIN(ST_Y(PointN(ExteriorRing(miv_envelope), 1)))),

				POINT(Max(ST_X(PointN(ExteriorRing(miv_envelope), 3))),
				MAX(ST_Y(PointN(ExteriorRing(miv_envelope), 3))))
                              )))
				FROM  metric_version_level
                JOIN dataset ON dat_id = mvl_dataset_id
                JOIN snapshot_metric_version_item_variable ON miv_metric_version_id = mvl_metric_version_id AND miv_geography_id = dat_geography_id
				WHERE mvl_id = ?";
		$res = App::Db()->fetchAssoc($sql, array($metricVersionLevel['mvl_id']));
		$envelope = Envelope::FromDb($res);
		// Lo pone
		$id = $metricVersionLevel['mvl_id'];
		$unShardifiedId = PublishDataTables::Unshardify($id);
		$update = "UPDATE draft_metric_version_level SET mvl_extents = ST_PolygonFromText('" . $envelope->ToWKT() . "') WHERE mvl_id = ?";
		App::Db()->exec($update, array($unShardifiedId));
		$update = "UPDATE metric_version_level SET mvl_extents = ST_PolygonFromText('" . $envelope->ToWKT() . "') WHERE mvl_id = ?";
		App::Db()->exec($update, array($metricVersionLevel['mvl_id']));
		// Listo
		Profiling::EndTimer();
	}

	private function InsertRows($metricVersionLevel, $variable)
	{
		Profiling::BeginTimer();

		$sqlInsert = "INSERT INTO snapshot_metric_version_item_variable(`miv_metric_id`,`miv_metric_version_id`,
				`miv_geography_id`,`miv_geography_item_id`,`miv_urbanity`,
				`miv_metric_version_variable_id`,
				`miv_value`, `miv_version_value_label_id`, miv_description, miv_total, miv_feature_id, `miv_area_m2`,
				miv_envelope, miv_rich_envelope, miv_location) ";

		$sql = "SELECT " . $metricVersionLevel["mvr_metric_id"] . ", " . $metricVersionLevel["mvr_id"] . ",
								gei_geography_id,
								gei_id, gei_urbanity, " . $variable->Id() . ", ";
		// Calcula el valor
		$sql .= $variable->CalculateValueField() . ",";
		// Calcula la categoría
		$valueForSegmentation = $variable->CalculateSegmentationValueField();
		$valueLabel = $variable->CalculateVersionValueLabelId($valueForSegmentation);
		$sql .= $valueLabel . ",";

		// Descripción
		$sql .= $this->GetDescriptionColumn($metricVersionLevel) . ",";
		// total de normalización
		$sql .= $variable->CalculateNormalizationField() . ",";
		// featureId
		$sql .= $this->GetFeatureIdField($metricVersionLevel) . ", ";
		// area
		if ($metricVersionLevel['dat_type'] == DatasetTypeEnum::Shapes)
			$sql .= "area_m2, ";
		else
			$sql .= Variable::SpecialColumnToField(SpecialColumnEnum::AreaM2) . ",";

		$envelopeTarget = '';
		$location = '';
		if ($metricVersionLevel['dat_type'] == DatasetTypeEnum::Data)
		{
			$envelopeTarget = "gei_geometry";
			$location = "gei_centroid";
		}
		else if ($metricVersionLevel['dat_type'] == DatasetTypeEnum::Shapes)
		{
			$envelopeTarget = "geometry";
			$location = "centroid";
		}
		else if ($metricVersionLevel['dat_type'] == DatasetTypeEnum::Locations)
		{
			$point = "POINT(" . $metricVersionLevel['dat_longitude_field'] . ", " .
																$metricVersionLevel['dat_latitude_field'] . ")";
			$envelopeTarget = $point;
			$location = $point;
		}
		else
			throw new ErrorException("Invalid dataset type.");
		// Envelopes
		$sql .= "PolygonEnvelope(" . $envelopeTarget . "), ";
		$sql .= "RichEnvelope(" . $envelopeTarget . ", " . $metricVersionLevel["mvr_id"] . ", gei_geography_id), ";
		// Location
		$sql .= $location;

		// Arma el FROM
		$table = $metricVersionLevel['dat_table'];
		$sql .= " FROM `" . $table . "`, geography_item WHERE gei_id = geography_item_id";

		// Cierra el select
		$sql .= " AND gei_geometry_is_null = 0 ORDER BY id";

		$ret = App::Db()->exec($sqlInsert . $sql);
		Profiling::EndTimer();
		return $ret;
	}

	private function GetFeatureIdField($metricVersionLevel)
	{
		if ($metricVersionLevel['dat_type'] == DatasetTypeEnum::Shapes ||
			$metricVersionLevel['dat_type'] == DatasetTypeEnum::Locations)
		{
			return $metricVersionLevel["mvl_dataset_id"] . " * 0x100000000 + id";
		}
		else
			return "gei_id";
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
