<?php

namespace helena\db\frontend;

use minga\framework\QueryPart;
use minga\framework\Profiling;
use minga\framework\PublicException;
use minga\framework\Str;

class SpatialConditions
{
	private $preffix;

	public function __construct($preffix)
	{
		$this->preffix = $preffix;
	}

	public function CreateRegionQuery($clippingRegionIds)
	{
		$from = "snapshot_clipping_region_item_geography_item ";

		$where = $this->preffix . "_geography_item_id = cgv_geography_item_id AND "
			. " cgv_clipping_region_item_id IN (" . Str::JoinInts($clippingRegionIds) . ") ";

		$params = array();
		return new QueryPart($from, $where, $params);
	}

	public function CreateRegionToRegionQuery($clippingRegionIds)
	{
		$from = "";
		$params = array();
		$where = "EXISTS (
								SELECT 1 FROM snapshot_clipping_region_item_geography_item m1
								JOIN snapshot_clipping_region_item_geography_item m2
								ON m1.cgv_geography_item_id = m2.cgv_geography_item_id
								where m1.cgv_clipping_region_item_id = " . $this->preffix . "_clipping_region_item_id
								AND m2.cgv_clipping_region_item_id IN (" . Str::JoinInts($clippingRegionIds) . ")
								AND m1.cgv_level >= 1
								AND m2.cgv_level >= 1)";
		return new QueryPart($from, $where, $params);
	}

	public function CreateCircleQuery($circle, $effectiveDatasetType)
	{
		$from = "";
		$params = array();

		$envelope = $circle->GetEnvelope();
		$where = $this->EnvelopePart($envelope);

		$where .=  $this->CircleCondition($circle, $effectiveDatasetType);

		return new QueryPart($from, $where, $params);
	}

	public function CreateFeatureQuery($featureId)
	{
		$from = "";
		$params = array($featureId);
		$where = $this->preffix . "_feature_id = ?";

		return new QueryPart($from, $where, $params);
	}
	private function EnvelopePart($envelope)
	{
		return "MBRIntersects(" . $this->preffix . "_envelope, ST_PolygonFromText('" . $envelope->ToWKT() . "'))";
	}
	private function RichEnvelopePart($envelope, $metricVersionId, $geographyId)
	{
		return "MBRIntersects(" . $this->preffix . "_rich_envelope, RichEnvelope(ST_PolygonFromText('" . $envelope->ToWKT() . "'), " . $metricVersionId . ", " . $geographyId . "))";
	}
	public function CreateEnvelopeQuery($envelope)
	{
		$from = "";
		$where = $this->EnvelopePart($envelope);
		$select = "";
		$params = array();

		return new QueryPart($from, $where, $params, $select);
	}
	public static function ResolveRZoom6($zoom)
	{
		if ($zoom < 12)
			return intval($zoom / 3) + 1;
		else
			return intval($zoom / 6) + 3;
	}
	public static function ResolveRZoom3($zoom)
	{
		$z = self::ResolveRZoom6($zoom);
		return intval(($z + 1) / 2);
	}
	public function CircleCondition($circle, $effectiveDatasetType)
	{
		if ($effectiveDatasetType == 'L')
		{
			// Si es un metric de puntos, evalúa la ubicación del punto
			$sql = " AND EllipseContains(". $circle->Center->ToMysqlPoint() . ", " .
				$circle->RadiusToMysqlPoint() . ", " . $this->preffix . "_location)";
		}
		else if ($effectiveDatasetType == 'S')
		{
			// Si es un metric de formas, evalúa la ubicación del shape
			$sql = " AND EXISTS (SELECT 1 FROM snapshot_shape_dataset_item WHERE sdi_feature_id = " . $this->preffix . "_feature_id " .
				" AND EllipseContainsGeometry(". $circle->Center->ToMysqlPoint() . ", " .
				$circle->RadiusToMysqlPoint() . ", sdi_geometry))";
		}
		else if ($effectiveDatasetType == 'D')
		{
			// Si es un metric de datos, evalúa la ubicación del geography
			$sql = " AND EXISTS (SELECT 1 FROM snapshot_geography_item WHERE giw_geography_item_id = " . $this->preffix . "_geography_item_id " .
				" AND EllipseContainsGeometry(". $circle->Center->ToMysqlPoint() . ", " .
				$circle->RadiusToMysqlPoint() . ", giw_geometry_r3))";
		}
		else if ($effectiveDatasetType == 'B')
		{
			// Si es un boundary, evalúa la ubicación del elemento
			$sql = " AND EllipseContainsGeometry(". $circle->Center->ToMysqlPoint() . ", " .
				$circle->RadiusToMysqlPoint() . ", biw_geometry_r2)";
		}
		else
			throw new PublicException("El tipo de dataset no fue reconocido");
		return $sql;
	}

	public function UrbanityCondition($urbanity)
	{
		$field = $this->preffix . "_urbanity";
		if (strlen($urbanity) > 4) throw new PublicException('Valor inválido para urbanidad/ruralidad');
		if ($urbanity === null) return '';
		$sql = $field . " IN ('N'";
		foreach(['U', 'D', 'R', 'L'] as $validFilter)
		if (Str::Contains($urbanity, $validFilter))
			$sql .= ",'" . $validFilter . "'";

		return ' AND ' . $sql . ') ';
	}
}


