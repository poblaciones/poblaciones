<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\services\backoffice\publish\PublishDataTables;
use helena\classes\VersionUpdater;

use minga\framework\Profiling;
use minga\framework\Context;
use helena\classes\Account;
use helena\classes\App;

class SnapshotLookupModel
{
	public const SMALL_LABELS_FROM = 15;
	public const SMALL_LABELS_TO = 22;

	public function ClearDataset($datasetId)
	{
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);

		Profiling::BeginTimer();
		$sqlDelete = "DELETE FROM snapshot_lookup_feature WHERE clf_dataset_id = ?";
		$rowsDeleted = App::Db()->exec($sqlDelete, array($datasetIdShardified));
		VersionUpdater::Increment('LOOKUP');

		Profiling::EndTimer();

		return $rowsDeleted;
	}

	public function RegenDataset($datasetId)
	{
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);

		Profiling::BeginTimer();

		$dataset = $this->GetDatasetInfo($datasetIdShardified);

		$sql = "INSERT INTO snapshot_lookup_feature (clf_dataset_id, clf_level, "
									. "clf_full_parent, clf_caption, clf_location, clf_min_zoom, clf_max_zoom, clf_feature_ids, clf_symbol, clf_tooltip) ";

		$sqlInsert = "SELECT ?, gei_geography_id,
								?, " . $dataset['CaptionColumn'] . ", "
								. $this->GetCentroidField($dataset) . ", " . self::SMALL_LABELS_FROM . ", " . self::SMALL_LABELS_TO . ", " .
								$dataset["dat_id"] . " * 0x100000000 +id, ?, ?
									FROM `" . $dataset["dat_table"] . "`, geography_item
								WHERE gei_id = geography_item_id
								ORDER BY id";

		$params = array($datasetIdShardified,
					$dataset["dat_caption"],
					($dataset["dmk_type"] == 'I' &&  $dataset["dmk_source"] == 'F' ? $dataset["dmk_symbol"] : null),
					$dataset["dat_caption"]);
		$r = App::Db()->exec($sql . $sqlInsert, $params);

		VersionUpdater::Increment('LOOKUP');

		Profiling::EndTimer();

		return $r;
	}


	private function GetDatasetInfo($datasetId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT dataset.*, dataset_marker.*, cli_id, cli_caption,
												(SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_longitude_column_id) as LongitudeColumn,
												(SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_latitude_column_id) as LatitudeColumn,
												 (SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_longitude_column_segment_id) as LongitudeColumnSegment,
												(SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_latitude_column_segment_id) as LatitudeColumnSegment,
												(SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_caption_column_id) as CaptionColumn
												FROM dataset
												JOIN dataset_marker ON dat_marker_id = dmk_id
												JOIN geography ON dat_geography_id = geo_id
												JOIN clipping_region_item ON geo_country_id = cli_id
												WHERE dat_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, array($datasetId));
		Profiling::EndTimer();
		return $ret;
	}


	private function GetCentroidField($dataset)
	{
		if ($dataset["dat_type"] == 'S')
		{
			return "GeometryCentroid(geometry)";
		}
		else if ($dataset["dat_type"] == 'L')
		{
			return "POINT(" . $dataset["LongitudeColumn"] . ", " .  $dataset["LatitudeColumn"] . ")";
		}
		else
			return "gei_centroid";
	}

	public function ClearClippingRegions()
	{
		Profiling::BeginTimer();

		$sqlDelete = "TRUNCATE TABLE snapshot_lookup_clipping_region_item;";
		App::Db()->exec($sqlDelete);

		VersionUpdater::Increment('LOOKUP_REGIONS');
		VersionUpdater::Increment('LOOKUP_VIEW');

		Profiling::EndTimer();
	}

	public function RegenClippingRegions()
	{
		$ver = new VersionUpdater("snapshot_lookup");

		Profiling::BeginTimer();

		$sqlInsert = "INSERT INTO snapshot_lookup_clipping_region_item (clc_clipping_region_item_id, clc_level, "
							. "clc_full_parent, clc_full_ids, clc_caption, clc_code, clc_location, clc_min_zoom, clc_max_zoom, clc_feature_ids, clc_population, clc_tooltip, clc_symbol) ";

		// En el siguiente select trae los clipping_region_item que no tengan clr_no_autocomplete en true. Al traerlos
		// les agrega información de geographyItem a los que tengan una relación de 1 a 1 con la tabla de
		// geographyItem (ej Salta => Salta). Para todos, calcula desde geography el population.
		$sql = $sqlInsert . "select cli_id, cli_parent_id, clr_caption, '0', cli_caption, (CASE WHEN
																		clr_index_code = 1 THEN cli_code ELSE NULL END), cli_centroid, " .
															"clr_labels_min_zoom, clr_labels_max_zoom, featureIds, population, clr_caption, clr_symbol " .
															"FROM clipping_region_item, clipping_region, " .
															"(SELECT	clipping_region_item_id, GROUP_CONCAT(geography_item_id SEPARATOR ',') featureIds,
																				MIN(geo_min_zoom) min_zoom, MAX(population) population " .
																"FROM (	SELECT cgi_clipping_region_item_id clipping_region_item_id,  gei_geography_id ,
																						(CASE WHEN COUNT(*) = 1 THEN min(cgi_geography_item_id) else NULL END) geography_item_id,
																						SUM(IFNULL(gei_population, 0)) population
																				FROM clipping_region_item_geography_item
																				JOIN geography_item ON gei_id = cgi_geography_item_id
																				GROUP BY cgi_clipping_region_item_id,  gei_geography_id
																				) as Geographies
																	JOIN geography ON geo_id = gei_geography_id " .
																" GROUP BY clipping_region_item_id
																			) as geographyInfo " .
															"where clr_id = cli_clipping_region_id and cli_id = clipping_region_item_id and clr_no_autocomplete = false";
		$r = App::Db()->exec($sql);

		$rowsAffected = $r;
		while ($r != 0)
		{
			$sqlParents = "UPDATE snapshot_lookup_clipping_region_item JOIN clipping_region_item ON clc_level = cli_id SET clc_level = cli_parent_id, clc_full_ids = CONCAT(cli_id, '\t', clc_full_ids), clc_full_parent = CONCAT(cli_caption, '\t', clc_full_parent) WHERE clc_level is not null";
			$r = App::Db()->exec($sqlParents);
		}

		VersionUpdater::Increment('LOOKUP_REGIONS');
		VersionUpdater::Increment('LOOKUP_VIEW');

		$ver->SetUpdated();

		Profiling::EndTimer();

		return $rowsAffected;
	}

}
