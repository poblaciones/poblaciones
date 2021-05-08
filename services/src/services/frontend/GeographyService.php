<?php

namespace helena\services\frontend;

use helena\caches\GeographyCache;
use minga\framework\Context;
use helena\classes\Clipper;
use helena\classes\ClipperRound;
use helena\classes\GeoJson;

use helena\services\common\BaseService;
use helena\db\frontend\SnapshotGeographyItemModel;
use helena\db\frontend\GeographyModel;
use helena\entities\frontend\clipping\FeaturesInfo;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Coordinate;


class GeographyService extends BaseService
{
	// Los niveles de zoom se mapean con la calidad de imagen
	// de modo que CALIDAD = Max(5, ((int)((zoom + 2) / 3))),
	// es decir que z[1 a 3] = C1, z[4 a 6] = C2, máximo C5.
	private const PAGE_SIZE = 25000;

	public function GetGeography($geographyId, $x, $y, $z, $page = 0)
	{
		$data = null;
		$key = GeographyCache::CreateKey($x, $y, $z, $page);
		if (GeographyCache::Cache()->HasData($geographyId, $key, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateGeography($geographyId, $x, $y, $z, $page);

		GeographyCache::Cache()->PutData($geographyId, $key, $data);

		return $data;
	}

	private function CalculateGeography($geographyId, $x, $y, $z, $page)
	{
		// calcula los GeoData (según indicado por campo 'resumen' en el ABM)
		// para cada categoría del metric indicado en la región clipeada.
		$table = new SnapshotGeographyItemModel();

		$envelope = Envelope::FromXYZ($x, $y, $z);

		$cartoTable = new GeographyModel();
		$carto = $cartoTable->GetGeographyInfo($geographyId);
		$getCentroids = ($carto['geo_min_zoom'] == null || $z >= $carto['geo_min_zoom']);

		$rows = $table->GetGeographyByEnvelope($geographyId, $envelope, $z, $getCentroids);

		$project = true; // $z <= 17;
		$totalPages = ceil(sizeof($rows) / self::PAGE_SIZE);
		if ($totalPages > 1)
		{
			$rows = array_slice($rows, $page * self::PAGE_SIZE, self::PAGE_SIZE);
		}
		$data = FeaturesInfo::FromRows($rows, $getCentroids, $project, null, false, $envelope);

		// recorta el cuadrado
		$clipper = new Clipper();

		if ($project)
		{
			$envelope = new Envelope(new Coordinate(0,0), new Coordinate(GeoJson::TILE_PRJ_SIZE, GeoJson::TILE_PRJ_SIZE));
			$clipper = new ClipperRound();
		}
		$data->Data['features'] = $clipper->clipCollectionByEnvelope($data->Data['features'], $envelope);

		// pagina
		if ($totalPages > 0)
		{
			$data->Page = $page;
			$data->TotalPages = $totalPages;
		}

		$gradientId = $carto['gradient_id'];
		if (Context::Settings()->Map()->UseGradients && $gradientId && !$this->AllAreDense($rows))
		{
			$controller = new GradientService();
			$gradientLimit = $carto['max_zoom_level'];
			$gradientType = $carto['gradient_type'];
			$data->Gradient = $controller->GetGradientTile($gradientId, $gradientLimit, $gradientType, $x, $y, $z);
		}
		return $data;
	}

	private function AllAreDense($rows)
	{
		// Considera "todos densos" a bloques con más
		// de 750 components o menos de un 10% de
		// bloques no densos. Para ellos, omite el gradiente.
		if (sizeof($rows) > 750)
			return true;
		foreach($rows as $row)
		{
			if (!isset($row['dense']) || !$row['dense'])
				return false;
		}
		return true;
	}
}

