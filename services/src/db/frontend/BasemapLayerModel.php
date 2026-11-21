<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use helena\classes\App;

class BasemapLayerModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'basemap_layer';
		$this->idField = 'bml_id';
		$this->captionField = 'bml_caption';
	}

	public function GetLayers()
	{
		Profiling::BeginTimer();
		$sql = "SELECT * FROM basemap_layer ORDER BY bml_order, bml_id";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}

	// Última versión de la delimitación (mayor bvr_id), con el metadata propio de la
	// versión o, si no tiene, el de la región de recorte más reciente que la compone
	// (mismo criterio que BoundaryModel::GetSelectedBoundaryVersions).
	public function GetLatestBoundaryVersion($boundaryId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT bvr_id AS VersionId,
						IFNULL(bvr_metadata_id,
							(SELECT MAX(clr_metadata_id) FROM clipping_region
								JOIN boundary_version_clipping_region ON bcr_clipping_region_id = clr_id
								WHERE bcr_boundary_version_id = bvr_id)) AS MetadataId
					FROM boundary_version
					WHERE bvr_id = (SELECT MAX(bvr_id) FROM boundary_version WHERE bvr_boundary_id = ?)";
		$ret = App::Db()->fetchAssoc($sql, array($boundaryId));
		Profiling::EndTimer();
		return $ret;
	}

	public function IsLabelsMetadata($metadataId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT COUNT(*) FROM basemap_layer WHERE bml_type = 'L' AND bml_metadata_id = ?";
		$ret = App::Db()->fetchScalarInt($sql, array($metadataId)) > 0;
		Profiling::EndTimer();
		return $ret;
	}

	// Niveles de región que etiquetan el mapa, con el rango de zoom en que se muestran
	// (mismo criterio que RegenClippingRegions) y los datos de su metadata como fuente.
	public function GetLabelRegionLevels()
	{
		Profiling::BeginTimer();
		$sql = "SELECT clr_caption AS Caption, clr_labels_min_zoom AS MinZoom, clr_labels_max_zoom AS MaxZoom,
						met_title, met_authors, met_url, NULL AS wrk_id
					FROM clipping_region
					LEFT JOIN metadata ON met_id = clr_metadata_id
					WHERE clr_no_autocomplete = 0 AND clr_labels_min_zoom <= clr_labels_max_zoom
						AND EXISTS (SELECT 1 FROM clipping_region_item WHERE cli_clipping_region_id = clr_id)
					ORDER BY clr_labels_min_zoom, clr_caption";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}

	// Conjuntos de elementos (datasets) cuyos nombres etiquetan el mapa, con la cartografía que los publica.
	public function GetLabelDatasets()
	{
		Profiling::BeginTimer();
		$sql = "SELECT dat_caption AS Caption, MIN(clf_min_zoom) AS MinZoom, MAX(clf_max_zoom) AS MaxZoom,
						met_title, met_authors, met_url, wrk_id
					FROM snapshot_lookup_feature
					JOIN dataset ON dat_id = clf_dataset_id
					JOIN work ON wrk_id = dat_work_id
					JOIN metadata ON met_id = wrk_metadata_id
					WHERE wrk_is_private = 0
					GROUP BY dat_id, dat_caption, met_title, met_authors, met_url, wrk_id
					ORDER BY MIN(clf_min_zoom), dat_caption";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}

	// Cartografía que publica el indicador: se usa su metadata cuando la capa no tiene uno propio.
	public function GetMetricWork($metricId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT wrk_id AS WorkId, wrk_metadata_id AS MetadataId
					FROM metric_version JOIN work ON wrk_id = mvr_work_id
					WHERE mvr_metric_id = ? ORDER BY mvr_id DESC LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, array($metricId));
		Profiling::EndTimer();
		return $ret;
	}
}
