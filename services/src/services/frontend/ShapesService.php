<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\classes\App;
use helena\classes\GeoJson;
use helena\classes\GlobalTimer;
use helena\caches\DatasetShapesCache;
use minga\framework\Context;
use helena\classes\Clipper;

use helena\db\frontend\SnapshotShapesModel;
use helena\db\frontend\DatasetModel;
use helena\db\frontend\GeographyModel;
use helena\entities\frontend\clipping\FeaturesInfo;
use helena\entities\frontend\geometries\Envelope;


class ShapesService extends BaseService
{
	// Los niveles de zoom se mapean con la calidad de imagen
	// de modo que CALIDAD = Max(5, ((int)((zoom + 2) / 3))),
	// es decir que z[1 a 3] = C1, z[4 a 6] = C2, z[7 a 9] = C3, z[10] = C4, z>10 = C5.
public function GetDatasetShapes($datasetId, $x, $y, $z, $b)
	{
		$data = null;
		$this->CheckNotNullNumeric($datasetId);
		$this->CheckNotNullNumeric($x);
		$this->CheckNotNullNumeric($y);
		$this->CheckNotNullNumeric($z);

		$key = DatasetShapesCache::CreateKey($x, $y, $z, $b);

		if (DatasetShapesCache::Cache()->HasData($datasetId, $key, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateDatasetShapes($datasetId, $x, $y, $z, $b);

		DatasetShapesCache::Cache()->PutData($datasetId, $key, $data);

		return $data;
	}

	private function CalculateDatasetShapes($datasetId, $x, $y, $z, $b)
	{
		$table = new SnapshotShapesModel();
		$datasetModel = new DatasetDownloadModel();
		$dataset = $datasetModel->GetById($datasetId);
		//$table->tableName	= $dataset['dat_table'];
		$zoom = $z;

		if ($b != null)
		{
			$envelope = Envelope::TextDeserialize($b);
		}
		else
		{
			$envelope = Envelope::FromXYZ($x, $y, $z);
		}

		$cartoTable = new GeographyModel();
		$geographyId = $dataset['dat_geography_id'];
		$carto = $cartoTable->GetGeographyInfo($geographyId);
		$getCentroids = ($carto['geo_min_zoom'] == null || $z >= $carto['geo_min_zoom']);

		$rows = $table->GetShapesByEnvelope($datasetId, $envelope, $zoom, $getCentroids);

		$data = FeaturesInfo::FromRows($rows, $getCentroids, false, $zoom);

		// recorta el cuadrado
		$clipper = new Clipper();
		$data->Data['features'] = $clipper->clipCollectionByEnvelope($data->Data['features'], $envelope);

		$gradientId = $carto['gradient_id'];
		if (Context::Settings()->Map()->UseGradients && $gradientId && !$b)
		{
			$controller = new GradientService();
			$gradientLimit = $carto['max_zoom_level'];
			$gradientType = $carto['gradient_type'];
			$data->Gradient = $controller->GetGradientTile($gradientId, $gradientLimit, $gradientType, $x, $y, $z);
		}

		return $data;
	}

}

