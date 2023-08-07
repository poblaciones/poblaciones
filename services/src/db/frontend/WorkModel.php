<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\classes\Session;

use minga\framework\Date;
use minga\framework\Profiling;

class WorkModel extends BaseModel
{
	public static $posibleStatus = array('C' => 'Completo', 'P' => 'Parcial', 'B' => 'Borrador');

	public function __construct()
	{
		$this->tableName = 'work';
		$this->idField = 'wrk_id';
		$this->captionField = '';

	}
	public function GetWorkByMetricVersion($metricVersionId)
	{
		Profiling::BeginTimer();
		$params = array($metricVersionId);

		$sql = "SELECT * FROM metric_version
							JOIN metric_version_level ON mvl_metric_version_id = mvr_id
							JOIN dataset ON dat_id = mvl_dataset_id
							JOIN work ON dat_work_id =  wrk_id "
						. $this->MetadataJoins() . " WHERE mvr_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
	private function MetadataJoins()
	{
		return " JOIN metadata ON wrk_metadata_id = met_id
							LEFT JOIN institution ON ins_id = met_institution_id";
	}
	public function GetWorkFileByFileId($workId, $fileId)
	{
		Profiling::BeginTimer();
		$params = array($workId, $fileId);

		$sql = "SELECT * FROM work_file WHERE wfi_work_id = ? AND wfi_file_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetWork($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT work.*, met_id, met_publication_date, met_title, met_authors, met_license, met_url, met_abstract,
							met_coverage_caption, met_online_since, ST_AsText(PolygonEnvelope(met_extents)) met_extents,
							ins_caption, wst_type, ST_X(wst_center) wst_center_lon, ST_Y(wst_center) wst_center_lat, wst_zoom,
								wst_clipping_region_item_id, wst_clipping_region_item_selected, wst_active_metrics, ins_watermark_id, ins_web, ins_color FROM work " . $this->MetadataJoins() . " JOIN work_startup ON wrk_startup_id = wst_id "
							. " WHERE wrk_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetWorkMetricsInfo($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId, $workId, $workId);

		$sql = "SELECT mtr_id Id, mtr_caption Name,
								GROUP_CONCAT(DISTINCT mvr_caption ORDER BY mvr_caption ASC SEPARATOR '\t')
								Versions,
                GROUP_CONCAT(DISTINCT (CASE WHEN mvr_work_id = ? THEN mvr_caption ELSE '' END) ORDER BY mvr_caption DESC SEPARATOR '\t')
								LocalVersions
								FROM
								(SELECT wmt_metric_id metricId FROM work_extra_metric WHERE wmt_work_id = ?
								UNION
								SELECT DISTINCT mvr_metric_id metricId FROM dataset
								JOIN metric_version_level ON mvl_dataset_id = dat_id
								JOIN metric_version ON mvl_metric_version_id = mvr_id
								WHERE dat_work_id = ?) wMetrics
								JOIN metric_version ON mvr_metric_id = metricId
								JOIN metric_version_level ON mvl_metric_version_id = mvr_id
								JOIN metric ON mtr_id = metricId
								GROUP BY mtr_id, mtr_caption ORDER BY mtr_caption";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

}
