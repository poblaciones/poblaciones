<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;

class SnapshotMetricModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'snapshot_metric';
		$this->idField = 'myv_id';
		$this->captionField = 'myv_caption';
	}

	public function GetByMetricId($id)
	{
		Profiling::BeginTimer();
		$params = array((int)$id);

		$sql = 'SELECT * FROM `'.$this->tableName.'` WHERE `myv_metric_id` = ? LIMIT 1';

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
	public function GetFabMetricSnapshot()
	{
		Profiling::BeginTimer();

		$sql = "SELECT myv_id, myv_metric_id, myv_caption, myv_work_ids, myv_work_captions, myv_has_public_data,
							myv_version_ids, myv_version_captions, myv_version_levels, myv_version_partial_coverages,
							 myv_variable_captions, myv_metric_group_id
					 FROM snapshot_metric JOIN metric_group ON myv_metric_group_id = lgr_id
			 WHERE lgr_visible = 1 AND myv_has_public_data ORDER BY lgr_id, myv_caption";
		$ret = App::Db()->fetchAll($sql);

		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetricSnapshotByFrame($frame)
	{
		Profiling::BeginTimer();
		$params = array();

		$joins = "";
		$where = "";
		// ESTE METODO NO SE USA. PODRIA EXISTIR ALGO SIMILAR SI
		// myv_coverage_geometry volviera a existir, generándose dinámicamente como
		// los BOUNDS de los datos de todos los metric_version_level del metric.

		// POR AHORA, myv_coverage_geometry y mtr_coverage están siendo DROPEADOS.
		if ($frame->ClippingCircle != null)
		{
			$where .= " AND ST_Intersects(myv_coverage_geometry, PolygonFromText('" .
				$frame->ClippingCircle->GetEnvelope()->ToWKT() . "')) ";
		}
		else if ($frame->ClippingRegionId != null)
		{
			$joins .= " JOIN clipping_region_item ON cli_id = ? AND ST_Intersects(myv_coverage_geometry, cli_geometry) ";
			$params[] = $frame->ClippingRegionId;
		}
		else if ($frame->ClippingCircle == null)
		{
			$where .= " AND ST_Intersects(myv_coverage_geometry, PolygonFromText('" . $frame->Envelope->ToWKT() . "')) ";
		}

		$sql = "SELECT snapshot_metric.* FROM snapshot_metric "
			. $joins . " WHERE 1 " . $where;

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function Search($originalQuery)
	{
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		Profiling::BeginTimer();
		 $sql = "SELECT myv_metric_id id,
			myv_caption caption,
			myv_version_captions extra,
			'L' type,
		 	MATCH (myv_caption, myv_version_captions, myv_variable_captions, myv_variable_value_captions,
			myv_work_captions) AGAINST (?) relevance
		 	FROM snapshot_metric
		 	WHERE MATCH (myv_caption, myv_version_captions, myv_variable_captions,
			myv_variable_value_captions, myv_work_captions) AGAINST (? IN BOOLEAN MODE)
		 	ORDER BY relevance DESC
		 	LIMIT 0, 10";

		$ret = App::Db()->fetchAll($sql, array($query, $query));
		Profiling::EndTimer();
		return $ret;
	}

}


