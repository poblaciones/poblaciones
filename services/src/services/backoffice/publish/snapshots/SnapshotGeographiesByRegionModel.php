<?php

namespace helena\services\backoffice\publish\snapshots;

use minga\framework\Profiling;
use helena\caches\ClippingCache;
use helena\classes\App;
use helena\classes\VersionUpdater;

class SnapshotGeographiesByRegionModel
{
	private static $validPhases = array('init', 'down', 'up');

	public function Clean()
	{
		Profiling::BeginTimer();

		App::Db()->truncate("snapshot_clipping_region_item_geography_item");
		VersionUpdater::Increment('CARTOGRAPHY_REGION_VIEW');

		ClippingCache::Cache()->Clear();

		Profiling::EndTimer();
	}

	public function RegenStart()
	{
		VersionUpdater::Increment('CARTOGRAPHY_REGION_VIEW');

		$revisions = App::Db()->fetchAllColumn(
			"SELECT DISTINCT geo_revision FROM geography ORDER BY geo_revision"
		);
		$revisions = array_map('intval', $revisions);

		return array(
			'phase' => 'init',
			'level' => 1,
			'revisionIndex' => 0,
			'revisions' => $revisions,
			'rowsAffected' => 0,
			'levelRowsAffected' => 0,
			'done' => count($revisions) == 0,
		);
	}

	// Ejecuta un único INSERT (fase, nivel, revision) y devuelve el estado siguiente.
	// phase, level, revisionIndex, revisions vienen del cliente: se validan antes de usarse en SQL.
	public function RegenStep($phase, $level, $revisionIndex, array $revisions, $rowsAffected, $levelRowsAffected)
	{
		if (!in_array($phase, self::$validPhases, true))
			throw new \Exception("Fase de regeneración inválida: " . $phase);

		$level = (int)$level;
		$revisionIndex = (int)$revisionIndex;
		$rowsAffected = (int)$rowsAffected;
		$levelRowsAffected = (int)$levelRowsAffected;
		$revisions = array_map('intval', $revisions);

		if ($phase == 'up')
		{
			if ($level < -100 || $level > 1)
				throw new \Exception("Nivel de regeneración fuera de rango: " . $level);
		}
		else
		{
			if ($level < 1 || $level > 100)
				throw new \Exception("Nivel de regeneración fuera de rango: " . $level);
		}
		if ($revisionIndex < 0 || $revisionIndex >= count($revisions))
			throw new \Exception("Índice de revisión fuera de rango: " . $revisionIndex);

		$revision = $revisions[$revisionIndex];

		Profiling::BeginTimer();

		$sqlInsert = "INSERT INTO snapshot_clipping_region_item_geography_item (cgv_clipping_region_id, "
			. "cgv_clipping_region_item_id, cgv_clipping_region_priority, cgv_geography_item_id, cgv_urbanity, cgv_area_m2, cgv_population, cgv_households, "
			. "cgv_children, cgv_geography_id, cgv_level) ";

		if ($phase == 'init')
		{
			$sql = $sqlInsert . "SELECT cli_clipping_region_id, cli_id, clr_priority, gei_id, gei_urbanity, gei_area_m2, " .
				"gei_population, gei_households, gei_children, gei_geography_id, " .
				"1 FROM clipping_region_item, " .
						"clipping_region_item_geography_item, " .
						"clipping_region, " .
						"geography_item, " .
						"geography " .
						"WHERE gei_id = cgi_geography_item_id ".
						"AND clr_id = cli_clipping_region_id " .
						"AND cli_id = cgi_clipping_region_item_id " .
						"AND geo_id = gei_geography_id " .
						"AND geo_revision = " . $revision;
			$r = App::Db()->exec($sql);
			App::Db()->markTableUpdate('snapshot_clipping_region_item_geography_item');
			$rowsAffected += $r;
			$levelRowsAffected += $r;
		}
		else if ($phase == 'down')
		{
			$sql = $sqlInsert . "SELECT cgv_clipping_region_id, cgv_clipping_region_item_id, clr_priority, gei_id, gei_urbanity, gei_area_m2, " .
				"gei_population, gei_households, gei_children, gei_geography_id, " . $level
				. " FROM snapshot_clipping_region_item_geography_item, " .
							"geography_item, " .
							"clipping_region, " .
							"geography " .
							"WHERE clr_id = cgv_clipping_region_id AND gei_parent_id = cgv_geography_item_id and cgv_level = " . ($level - 1)
							. " AND geo_id = gei_geography_id AND geo_revision = " . $revision;
			$r = App::Db()->exec($sql);
			$rowsAffected += $r;
			$levelRowsAffected += $r;
		}
		else // 'up'
		{
			// Preciso una temporal para quedarme después solo con los parents mayoritarios
			$dropTempSql = "DROP TEMPORARY TABLE IF EXISTS tmp_total_children;";
			$createTempSql = "CREATE TEMPORARY TABLE tmp_total_children (
									tmp_clipping_region_item_id INT PRIMARY KEY,
									total_children INT
								) ENGINE=MEMORY
							SELECT cgv_clipping_region_item_id AS tmp_clipping_region_item_id, COUNT(*) AS total_children
								FROM snapshot_clipping_region_item_geography_item s
								JOIN geography_item geography_item_children ON geography_item_children.gei_id = s.cgv_geography_item_id
								JOIN geography_item cai1 ON cai1.gei_id = geography_item_children.gei_parent_id
								JOIN geography ON geo_id = cai1.gei_geography_id
								WHERE geography_item_children.gei_parent_id IS NOT NULL
									AND cgv_level = " . ($level + 1) . "
									AND geo_revision = " . $revision . "
								GROUP BY cgv_clipping_region_item_id;";
			App::Db()->exec($dropTempSql);
			App::Db()->exec($createTempSql);
			$sql = $sqlInsert . "SELECT cgv_clipping_region_id, cgv_clipping_region_item_id, clr_priority, cai1.gei_id, cai1.gei_urbanity, cai1.gei_area_m2, " .
				"cai1.gei_population, cai1.gei_households, cai1.gei_children, cai1.gei_geography_id, " . $level
				. " FROM snapshot_clipping_region_item_geography_item s " .
							"JOIN geography_item geography_item_children ON geography_item_children.gei_id = cgv_geography_item_id " .
							"JOIN geography_item cai1 ON cai1.gei_id = geography_item_children.gei_parent_id " .
							"JOIN clipping_region ON clr_id = cgv_clipping_region_id " .
							"JOIN geography ON geo_id = cai1.gei_geography_id " .
							"WHERE geography_item_children.gei_parent_id IS NOT NULL AND cgv_level = " . ($level + 1)
							. " AND geo_revision = " . $revision . "
								 GROUP BY cgv_clipping_region_id, cgv_clipping_region_item_id, clr_priority, cai1.gei_id, cai1.gei_urbanity, cai1.gei_area_m2,
	cai1.gei_population, cai1.gei_households, cai1.gei_children, cai1.gei_geography_id
								HAVING COUNT(*) >  (SELECT total_children / 2 FROM tmp_total_children WHERE tmp_clipping_region_item_id = cgv_clipping_region_item_id )";
			$r = App::Db()->exec($sql);
			$rowsAffected += $r;
			$levelRowsAffected += $r;
			App::Db()->exec($dropTempSql);
		}

		$revisionIndex++;

		if ($revisionIndex < count($revisions))
		{
			// Quedan revisions por procesar en este mismo nivel/fase.
			Profiling::EndTimer();
			return array(
				'phase' => $phase,
				'level' => $level,
				'revisionIndex' => $revisionIndex,
				'revisions' => $revisions,
				'rowsAffected' => $rowsAffected,
				'levelRowsAffected' => $levelRowsAffected,
				'done' => false,
			);
		}

		// Nivel/fase completo: decidir transición según levelRowsAffected acumulado.
		$revisionIndex = 0;

		if ($phase == 'init')
		{
			if ($levelRowsAffected != 0)
			{
				$phase = 'down';
				$level = 2;
			}
			else
			{
				$phase = 'up';
				$level = 1;
			}
		}
		else if ($phase == 'down')
		{
			if ($levelRowsAffected != 0)
				$level++;
			else
			{
				$phase = 'up';
				$level = 1;
			}
		}
		else // 'up'
		{
			if ($levelRowsAffected == 0)
				$phase = 'done';
			else
				$level--;
		}

		$levelRowsAffected = 0;
		$done = ($phase == 'done');

		if ($done)
		{
			VersionUpdater::Increment('CARTOGRAPHY_REGION_VIEW');
			$ver = new VersionUpdater("SNAPSHOT_CARTOGRAPHY_REGION");
			$ver->SetUpdated();
		}

		Profiling::EndTimer();

		return array(
			'phase' => $phase,
			'level' => $level,
			'revisionIndex' => $revisionIndex,
			'revisions' => $revisions,
			'rowsAffected' => $rowsAffected,
			'levelRowsAffected' => $levelRowsAffected,
			'done' => $done,
		);
	}
}