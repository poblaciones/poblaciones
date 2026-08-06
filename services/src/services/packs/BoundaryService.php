<?php

namespace helena\services\packs;

use helena\caches\WorkPermissionsCache;
use helena\classes\App;
use helena\classes\Account;
use minga\framework\Arr;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\services\backoffice\PermissionsService;
use minga\framework\Profiling;
use helena\services\backoffice\publish\CacheManager;
use helena\classes\VersionUpdater;

class BoundaryService extends BaseService
{
	public function GetNewBoundary()
	{
		$entity = new entities\Boundary();
		// SortBy y GroupByParent son NOT NULL en la base (con default allá,
		// pero se fija acá también para no depender de eso). Tag e Icon son
		// nullable: no necesitan un valor inicial. Tag además tiene índice
		// único (identificador para WFS, ver el auto-completado en
		// BoundaryPopup.vue, que lo genera a partir del Nombre).
		$entity->setSortBy('N');
		$entity->setGroupByParent(false);
		return $entity;
	}

	public function GetBoundaries()
	{
		Profiling::BeginTimer();
		$this->EnsureAllOrdersAssigned();
		$boundaries = App::Orm()->findAll(entities\Boundary::class, array('Order' => 'ASC'));
		$this->AddContent($boundaries);
		$ret = $this->AddVersions($boundaries);
		Profiling::EndTimer();
		return $ret;
	}

	// bou_order puede haber quedado en NULL para delimitaciones creadas
	// antes de que el alta empezara a asignarlo automáticamente (ver
	// UpdateBoundary). Mientras conviven, en un mismo grupo, algunas con
	// Order asignado y otras en NULL, subir/bajar se vuelve errático: en
	// SQL, cualquier comparación contra NULL da NULL (nunca verdadero),
	// así que SwapBoundaryOrder salta por encima de las que están en
	// NULL al buscar el vecino, intercambiando con una que no es la
	// visualmente adyacente. Se normaliza acá, antes de listar, en vez
	// de dejar que la inconsistencia se acumule: si CUALQUIER
	// delimitación del sistema está en NULL, se asigna Order a TODAS las
	// de su grupo de una sola vez (no solo a la que se estaba por
	// mover), así no queda una mezcla de "algunas con valor, otras sin".
	private function EnsureAllOrdersAssigned()
	{
		$groupIds = App::Db()->fetchAll(
			"SELECT DISTINCT bou_group_id FROM boundary WHERE bou_order IS NULL");
		foreach ($groupIds as $row)
		{
			$this->NormalizeGroupOrder($row['bou_group_id']);
		}
	}

	// Los que estaban en NULL se ubican primero, ordenados por nombre
	// (mismo criterio con el que MpGridHelper.CompareByColumn ya los
	// trataba visualmente: un valor null se compara como menor que
	// cualquier otro, así que aparecían primero incluso antes de
	// normalizar); los que ya tenían Order asignado mantienen su orden
	// relativo entre sí, a continuación.
	private function NormalizeGroupOrder($groupId)
	{
		$rows = App::Db()->fetchAll(
			"SELECT bou_id FROM boundary WHERE bou_group_id = ?
			 ORDER BY (bou_order IS NULL) DESC, bou_order ASC, bou_caption ASC",
			array($groupId));
		$order = 1;
		foreach ($rows as $row)
		{
			App::Db()->execute("UPDATE boundary SET bou_order = ? WHERE bou_id = ?", array($order, $row['bou_id']));
			$order++;
		}
	}

	public function GetBoundaryGroups()
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findAll(entities\BoundaryGroup::class, array('Caption' => 'ASC'));
		Profiling::EndTimer();
		return $ret;
	}
	private function AddContent(& $boundaries)
	{
		Profiling::BeginTimer();
		$sql = "SELECT bvr_boundary_id AS Id,
					 GROUP_CONCAT(clippingRegions SEPARATOR '\n') AS clippingRegions
					 FROM (
					SELECT bvr_boundary_id, bcr_boundary_version_id VersionId,
													CONCAT(bvr_caption, ': ', GROUP_CONCAT(clr_caption SEPARATOR ', ')) AS clippingRegions
													FROM boundary_version_clipping_region JOIN clipping_region ON clr_id = bcr_clipping_region_id
													JOIN boundary_version ON bcr_boundary_version_id = bvr_id
													GROUP BY bvr_boundary_id, bvr_caption, bcr_boundary_version_id) t
					group by bvr_boundary_id";
		$counts = App::Db()->fetchAll($sql);
		foreach($boundaries as $boundary)
		{
			$id = $boundary->getId();
			$n = Arr::IndexOfByNamedValue($counts, "Id", $id);
			if ($n !== -1)
				$boundary->VersionsSummary = $counts[$n]['clippingRegions'];
		}
		Profiling::EndTimer();
		return $boundaries;
	}
	public function UpdateBoundary($boundary)
	{
		Profiling::BeginTimer();

		if ($boundary->getId() === null)
		{
			$boundary->setOrder($this->GetNextBoundaryOrder($boundary->getGroup()->getId()));
		}
		App::Orm()->Save($boundary);
		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();
		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager->CleanFabMetricsCache();

		Profiling::EndTimer();
		return self::OK;
	}

	private function GetNextBoundaryOrder($groupId)
	{
		$max = App::Db()->fetchScalarIntNullable(
			"SELECT MAX(bou_order) FROM boundary WHERE bou_group_id = ?", array($groupId));
		if ($max === null)
		{
			return 1;
		}
		return $max + 1;
	}

	// El usuario reordena las delimitaciones de un mismo grupo con estas
	// dos acciones (mismo patrón que MetricsTab.vue para variables:
	// intercambiar el Order con el vecino, no editarlo a mano), en vez de
	// permitir ordenar la grilla por nombre.
	public function MoveBoundaryUp($boundaryId)
	{
		return $this->SwapBoundaryOrder($boundaryId, true);
	}

	public function MoveBoundaryDown($boundaryId)
	{
		return $this->SwapBoundaryOrder($boundaryId, false);
	}

	private function SwapBoundaryOrder($boundaryId, $up)
	{
		Profiling::BeginTimer();
		$boundary = App::Orm()->find(entities\Boundary::class, $boundaryId);
		// Salvaguarda: normaliza el grupo también acá, no solo al listar,
		// por si este método se llegara a invocar sin haber pasado antes
		// por GetBoundaries(). NormalizeGroupOrder escribe con SQL
		// directo, así que se vuelve a pedir el boundary para no operar
		// sobre un Order desactualizado que quedó en memoria.
		$this->NormalizeGroupOrder($boundary->getGroup()->getId());
		$boundary = App::Orm()->find(entities\Boundary::class, $boundaryId);

		$comparison = '>';
		$direction = 'ASC';
		if ($up)
		{
			$comparison = '<';
			$direction = 'DESC';
		}
		$sql = "SELECT bou_id FROM boundary WHERE bou_group_id = ? AND bou_order $comparison ?
					ORDER BY bou_order $direction LIMIT 1";
		$adjacentId = App::Db()->fetchScalarIntNullable($sql,
			array($boundary->getGroup()->getId(), $boundary->getOrder()));
		if ($adjacentId === null)
		{
			// Ya está en el extremo del grupo: no hay nada para intercambiar.
			Profiling::EndTimer();
			return self::OK;
		}

		$adjacent = App::Orm()->find(entities\Boundary::class, $adjacentId);
		$currentOrder = $boundary->getOrder();
		$boundary->setOrder($adjacent->getOrder());
		$adjacent->setOrder($currentOrder);
		App::Orm()->Save($boundary);
		App::Orm()->Save($adjacent);

		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();

		Profiling::EndTimer();
		return self::OK;
	}

	public function DeleteBoundary($boundary)
	{
		Profiling::BeginTimer();

		$versions = App::Orm()->findManyByProperty(entities\BoundaryVersion::class, 'Boundary.Id', $boundary->getId());
		foreach ($versions as $version)
		{
			$this->DeleteBoundaryVersionInternal($version);
		}
		App::Orm()->delete($boundary);

		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();
		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager->CleanFabMetricsCache();

		Profiling::EndTimer();
		return self::OK;
	}

	public function GetNewBoundaryVersion()
	{
		$entity = new entities\BoundaryVersion();
		$entity->ClippingRegions = array();
		return $entity;
	}

	// La versión se guarda completa en una sola operación: el objeto ya
	// reconectado (Boundary, Geography, Metadata resueltos) y, aparte, los
	// ids de las regiones asociadas (ClippingRegions no es una asociación
	// Doctrine, es una propiedad simple: la tabla intermedia se sincroniza
	// a mano).
	// El switch de "usa metadatos propios" del formulario no es un campo
	// de la base: se infiere de si bvr_metadata_id es NULL o no. Antes
	// de guardar, se sincroniza ese estado con lo que decidió el
	// usuario, creando un metadata mínimo si se acaba de activar, o
	// liberando (borrando) el que tenía si se acaba de desactivar. Si el
	// estado no cambió, no se toca nada acá: si ya tenía metadata propia
	// y sigue activada, el objeto que llega del formulario ya trae esa
	// referencia intacta.
	public function UpdateBoundaryVersion($boundaryVersion, $clippingRegionIds, $hasOwnMetadata)
	{
		Profiling::BeginTimer();

		$this->SyncVersionMetadata($boundaryVersion, $hasOwnMetadata);

		App::Orm()->Save($boundaryVersion);
		$this->SyncClippingRegions($boundaryVersion->getId(), $clippingRegionIds);

		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();
		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager->CleanFabMetricsCache();

		$summary = App::Db()->fetchScalarNullable(
			"SELECT GROUP_CONCAT(
				CASE WHEN clr_version IS NOT NULL AND clr_version != '' THEN CONCAT(clr_caption, ', ', clr_version) ELSE clr_caption END
				SEPARATOR '; ') FROM boundary_version_clipping_region
			 JOIN clipping_region ON clr_id = bcr_clipping_region_id
			 WHERE bcr_boundary_version_id = ?", array($boundaryVersion->getId()));

		Profiling::EndTimer();
		return array('ClippingRegionsSummary' => $summary, 'MetadataId' => $this->GetMetadataId($boundaryVersion));
	}

	private function GetMetadataId($boundaryVersion)
	{
		if ($boundaryVersion->getMetadata() === null)
		{
			return null;
		}
		return $boundaryVersion->getMetadata()->getId();
	}

	private function SyncVersionMetadata($boundaryVersion, $hasOwnMetadata)
	{
		$existingMetadataId = null;
		if ($boundaryVersion->getId() !== null)
		{
			$existingMetadataId = App::Db()->fetchScalarIntNullable(
				"SELECT bvr_metadata_id FROM boundary_version WHERE bvr_id = ?", array($boundaryVersion->getId()));
		}

		if ($hasOwnMetadata && $existingMetadataId === null)
		{
			$metadataService = new MetadataService();
			$metadata = $metadataService->CreateMinimalMetadata($boundaryVersion->getCaption(), null);
			$boundaryVersion->setMetadata($metadata);
		}
		else if (!$hasOwnMetadata && $existingMetadataId !== null)
		{
			$this->DeleteMetadataAndContact($existingMetadataId);
			$boundaryVersion->setMetadata(null);
		}
	}

	// metadata_ibfk_1 (met_contact_id -> contact.con_id) tiene ON DELETE
	// CASCADE: borrar el contacto borra el metadata solo, y con él, en
	// cascada también, sus relaciones con instituciones o fuentes si las
	// tuviera. No hace falta borrar el metadata explícitamente.
	private function DeleteMetadataAndContact($metadataId)
	{
		$contactId = App::Db()->fetchScalarIntNullable(
			"SELECT met_contact_id FROM metadata WHERE met_id = ?", array($metadataId));
		if ($contactId !== null)
		{
			App::Db()->delete('contact', array('con_id' => $contactId));
		}
	}

	private function SyncClippingRegions($boundaryVersionId, $clippingRegionIds)
	{
		Profiling::BeginTimer();
		App::Db()->delete('boundary_version_clipping_region', array('bcr_boundary_version_id' => $boundaryVersionId));
		foreach ($clippingRegionIds as $regionId)
		{
			App::Db()->insert('boundary_version_clipping_region', array(
				'bcr_boundary_version_id' => $boundaryVersionId,
				'bcr_clipping_region_id' => $regionId,
			));
		}
		Profiling::EndTimer();
	}

	public function DeleteBoundaryVersion($boundaryVersion)
	{
		Profiling::BeginTimer();

		$this->DeleteBoundaryVersionInternal($boundaryVersion);

		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();
		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager->CleanFabMetricsCache();

		Profiling::EndTimer();
		return self::OK;
	}

	private function DeleteBoundaryVersionInternal($boundaryVersion)
	{
		App::Db()->delete('boundary_version_clipping_region', array('bcr_boundary_version_id' => $boundaryVersion->getId()));
		App::Orm()->delete($boundaryVersion);
	}

	// Listado plano con Level (0 delimitación, 1 versión), cada delimitación
	// seguida de inmediato por sus versiones: mismo contrato que ya usa
	// ClippingRegionService::InsertChildrenOf en el cliente.
	private function AddVersions($boundaries)
	{
		Profiling::BeginTimer();
		$versions = App::Orm()->findAll(entities\BoundaryVersion::class, array('Caption' => 'ASC'));
		$this->AddClippingRegions($versions);

		$ret = array();
		foreach ($boundaries as $boundary)
		{
			$boundary->Level = 0;
			$ret[] = $boundary;
			foreach ($versions as $version)
			{
				if ($version->getBoundary()->getId() === $boundary->getId())
				{
					$version->Level = 1;
					$ret[] = $version;
				}
			}
		}
		Profiling::EndTimer();
		return $ret;
	}

	private function AddClippingRegions(&$versions)
	{
		Profiling::BeginTimer();
		$sql = "SELECT bcr_boundary_version_id AS VersionId, clr_id AS Id, clr_caption AS Caption, clr_version AS Version,
						clr_metadata_id AS MetadataId
					FROM boundary_version_clipping_region
					JOIN clipping_region ON clr_id = bcr_clipping_region_id
					ORDER BY clr_caption";
		$rows = App::Db()->fetchAll($sql);
		foreach ($versions as $version)
		{
			$regions = array();
			$captions = array();
			foreach ($rows as $row)
			{
				if ($row['VersionId'] == $version->getId())
				{
					$regions[] = array('Id' => $row['Id'], 'Caption' => $row['Caption'], 'Version' => $row['Version'], 'MetadataId' => $row['MetadataId']);
					$caption = $row['Caption'];
					if ($row['Version'])
					{
						$caption .= ', ' . $row['Version'];
					}
					$captions[] = $caption;
				}
			}
			$version->ClippingRegions = $regions;
			$version->ClippingRegionsSummary = implode('; ', $captions);
		}
		Profiling::EndTimer();
	}
}

