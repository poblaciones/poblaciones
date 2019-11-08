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
		$sqlDelete = "DELETE FROM snapshot_lookup WHERE clv_dataset_id = ?";
		App::Db()->exec($sqlDelete, array($datasetIdShardified));
		VersionUpdater::Increment('LOOKUP');

		Profiling::EndTimer();
	}

	public function RegenDataset($datasetId)
	{
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);

		Profiling::BeginTimer();

		$dataset = $this->GetDatasetInfo($datasetIdShardified);

		$sql = "INSERT INTO snapshot_lookup (clv_dataset_id, clv_level, "
								. "clv_full_parent, clv_full_ids, clv_caption, clv_type, clv_location, clv_min_zoom, clv_max_zoom, clv_feature_ids, clv_population, clv_symbol, clv_tooltip) ";

		$sqlInsert = "SELECT ?, gei_geography_id,
								?, '', " . $dataset['CaptionColumn'] . ", 'F', "
								. $this->GetCentroidField($dataset) . ", " . self::SMALL_LABELS_FROM . ", " . self::SMALL_LABELS_TO . ", " .
								$dataset["dat_id"] . " * 0x100000000 +id, 0 , ?, ?
									FROM `" . $dataset["dat_table"] . "`, geography_item
								WHERE gei_id = geography_item_id
								ORDER BY id";

		$params = array($datasetIdShardified,
					$dataset["dat_caption"], $dataset["dat_symbol"], $dataset["dat_caption"]);
		$r = App::Db()->exec($sql . $sqlInsert, $params);

		$rowsAffected = $r;
		while ($r != 0)
		{
			$sqlParents = "UPDATE snapshot_lookup JOIN geography_item ON clv_level = gei_id
						SET clv_level = gei_parent_id, clv_full_ids = CONCAT(gei_id, '\t', clv_full_ids), clv_full_parent = (CASE WHEN gei_caption is null THEN clv_full_parent ELSE CONCAT(gei_caption, '\t', coalesce(clv_full_parent, '')) END) WHERE clv_level is not null
							AND clv_dataset_id = ?";
			$r = App::Db()->exec($sqlParents, array($datasetIdShardified));
		}
		$sqlCountry = "UPDATE snapshot_lookup SET clv_full_ids = CONCAT(?, '\t', clv_full_ids), clv_full_parent = CONCAT(?, '\t', clv_full_parent) WHERE clv_level IS NULL AND clv_dataset_id = ?";
		$r = App::Db()->exec($sqlCountry, array($dataset['cli_id'], $dataset['cli_caption'], $datasetIdShardified));

		VersionUpdater::Increment('LOOKUP');

		Profiling::EndTimer();

		return $rowsAffected;
	}


	private function GetDatasetInfo($datasetId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT dataset.*, cli_id, cli_caption,
												(SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_longitude_column_id) as LongitudeColumn,
												(SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_latitude_column_id) as LatitudeColumn,
												(SELECT dco_field FROM dataset_column
												 WHERE dco_id = dat_caption_column_id) as CaptionColumn
												FROM dataset, geography, clipping_region_item
												WHERE dat_geography_id = geo_id AND
													geo_country_id = cli_id AND dat_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, array($datasetId));
		Profiling::EndTimer();
		return $ret;
	}


	private function GetCentroidField($dataset)
	{
		if ($dataset["dat_type"] == 'S')
		{
			return "centroid(geometry)";
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

		$sqlDelete = "DELETE FROM snapshot_lookup WHERE clv_type = 'C';";
		App::Db()->exec($sqlDelete);

		VersionUpdater::Increment('LOOKUP_REGIONS');

		Profiling::EndTimer();
	}

	public function RegenClippingRegions()
	{
		$ver = new VersionUpdater("snapshot_lookup");

		Profiling::BeginTimer();

		$sqlInsert = "INSERT INTO snapshot_lookup (clv_clipping_region_item_id, clv_level, "
							. "clv_full_parent, clv_full_ids, clv_caption, clv_type, clv_location, clv_min_zoom, clv_max_zoom, clv_feature_ids, clv_population, clv_tooltip, clv_symbol) ";

		// En el siguiente select trae los clipping_region_item que no tengan clr_no_autocomplete en true. Al traerlos
		// les agrega información de geographyItem a los que tengan una relación de 1 a 1 con la tabla de
		// geographyItem (ej Salta => Salta). Para todos, calcula desde geography el population.
		$sql = $sqlInsert . "select cli_id, cli_parent_id, clr_caption, '0', cli_caption, 'C', cli_centroid, " .
															"clr_labels_min_zoom, clr_labels_max_zoom, featureIds, population, clr_caption, clr_symbol " .
															"FROM clipping_region_item, clipping_region, " .
															"(SELECT	clipping_region_item_id, GROUP_CONCAT(geography_item_id SEPARATOR ',') featureIds, 
																				MIN(geo_min_zoom) min_zoom, max(population) population " .
																"FROM (	SELECT cgi_clipping_region_item_id clipping_region_item_id,  gei_geography_id , 
																						(CASE WHEN COUNT(*) = 1 THEN min(cgi_geography_item_id) else NULL END) geography_item_id, 
																						SUM(IFNULL(gei_population, 0)) population
																				FROM clipping_region_geography_item
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
			$sqlParents = "UPDATE snapshot_lookup JOIN clipping_region_item ON clv_level = cli_id SET clv_level = cli_parent_id, clv_full_ids = CONCAT(cli_id, '\t', clv_full_ids), clv_full_parent = CONCAT(cli_caption, '\t', clv_full_parent) WHERE clv_level is not null";
			$r = App::Db()->exec($sqlParents);
		}

		VersionUpdater::Increment('LOOKUP_REGIONS');

		$ver->SetUpdated();

		Profiling::EndTimer();

		return $rowsAffected;
	}

}
