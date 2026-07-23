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
		// Icon es NOT NULL en la base pero solo se completa si se marca
		// 'Recomendado' (queda deshabilitado en el popup si no): sin este
		// default, el alta de cualquier delimitación no recomendada
		// fallaría por restricción de la base.
		$entity->setIcon('');
		// Tag también es NOT NULL. No until ningún lugar (ni el formulario
		// del WinForms, ni su constructor C#) que lo complete: es posible
		// que la base tenga un DEFAULT propio que el ORM no refleja, o que
		// el campo ya no se use activamente. Con un valor vacío el alta no
		// falla, pero si Tag tiene un propósito real (p. ej. algún tipo de
		// identificador estable, como el mismo campo en Metric/DraftMetric),
		// convendría confirmarlo y ajustar esto.
		$entity->setTag('');
		return $entity;
	}

	public function GetBoundaries()
	{
		Profiling::BeginTimer();
		$boundaries = App::Orm()->findAll(entities\Boundary::class, array('Caption' => 'ASC'));
		$this->AddContent($boundaries);
		$ret = $this->AddVersions($boundaries);
		Profiling::EndTimer();
		return $ret;
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

		App::Orm()->Save($boundary);
		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();
		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager->CleanFabMetricsCache();

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
	public function UpdateBoundaryVersion($boundaryVersion, $clippingRegionIds)
	{
		Profiling::BeginTimer();

		App::Orm()->Save($boundaryVersion);
		$this->SyncClippingRegions($boundaryVersion->getId(), $clippingRegionIds);

		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();
		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager->CleanFabMetricsCache();

		Profiling::EndTimer();
		return self::OK;
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
		$sql = "SELECT bcr_boundary_version_id AS VersionId, clr_id AS Id, clr_caption AS Caption
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
					$regions[] = array('Id' => $row['Id'], 'Caption' => $row['Caption']);
					$captions[] = $row['Caption'];
				}
			}
			$version->ClippingRegions = $regions;
			$version->ClippingRegionsSummary = implode(', ', $captions);
		}
		Profiling::EndTimer();
	}
}

