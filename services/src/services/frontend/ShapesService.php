<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\classes\App;
use helena\classes\GeoJson;
use helena\classes\GlobalTimer;
use helena\caches\DatasetShapesCache;
use minga\framework\Context;
use helena\classes\Clipper;
use helena\classes\ClipperRound;

use helena\db\frontend\SnapshotShapesModel;
use helena\db\frontend\DatasetDownloadModel;
use helena\db\frontend\GeographyModel;
use helena\entities\frontend\clipping\FeaturesInfo;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Coordinate;


class ShapesService extends BaseService
{
	private $project = true;

	// Los niveles de zoom se mapean con la calidad de imagen
	// de modo que CALIDAD = Max(5, ((int)((zoom + 2) / 3))),
	// es decir que z[1 a 3] = C1, z[4 a 6] = C2, z[7 a 9] = C3, z[10] = C4, z>10 = C5.
public function GetDatasetShapes($datasetId, $x, $y, $z)
	{
		$data = null;
		$this->CheckNotNullNumeric($datasetId);
		$this->CheckNotNullNumeric($x);
		$this->CheckNotNullNumeric($y);
		$this->CheckNotNullNumeric($z);

		$key = DatasetShapesCache::CreateKey($x, $y, $z);

		if (DatasetShapesCache::Cache()->HasData($datasetId, $key, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateDatasetShapes($datasetId, $x, $y, $z);

		DatasetShapesCache::Cache()->PutData($datasetId, $key, $data);

		return $data;
	}

	private function CalculateDatasetShapes($datasetId, $x, $y, $z)
	{
		$table = new SnapshotShapesModel();
		$datasetModel = new DatasetDownloadModel();
		$dataset = $datasetModel->GetById($datasetId);
		//$table->tableName	= $dataset['dat_table'];
		$zoom = $z;

		$envelope = Envelope::FromXYZ($x, $y, $z);

		$cartoTable = new GeographyModel();
		$geographyId = $dataset['dat_geography_id'];
		$carto = $cartoTable->GetGeographyInfo($geographyId);

		$rows = $table->GetShapesByEnvelope($datasetId, $envelope);

		$data = FeaturesInfo::FromRows($rows, false, $this->project, $zoom, false, $envelope);

		// recorta el cuadrado
		$clipper = new Clipper();
		if ($this->project)
		{
			$envelope = new Envelope(new Coordinate(0,0), new Coordinate(GeoJson::TILE_PRJ_SIZE, GeoJson::TILE_PRJ_SIZE));
			$clipper = new ClipperRound();
		}

		$data->Data['features'] = $clipper->clipCollectionByEnvelope($data->Data['features'], $envelope);

		$gradientId = $carto['gradient_id'];
		if (App::Settings()->Map()->UseGradients && $gradientId)
		{
			$controller = new GradientService();
			$gradientLimit = $carto['max_zoom_level'];
			$gradientType = $carto['gradient_type'];
			$data->Gradient = $controller->GetGradientTile($gradientId, $gradientLimit, $gradientType, $x, $y, $z);
		}

		return $data;
	}

}

