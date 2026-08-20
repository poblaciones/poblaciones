<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;

class SnapshotGeographyItemModel extends BaseModel
{
	private const TILE_SIZE = 256;

	// Tope de features que se devuelven cuando el filtro de 1 pixel deja
	// el tile vacio (radios grandes y dispersos, ninguno llega al umbral).
	// Evita que un tile alejado quede completamente en blanco.
	private const FALLBACK_LIMIT = 40;

	public function __construct()
	{
		$this->tableName = 'snapshot_geography_item';
		$this->idField = 'giw_id';
	}
	public function GetGeographyByEnvelope($geographyId, $envelope, $zoom)
	{
		Profiling::BeginTimer();

		$rZoom = SpatialConditions::ResolveRZoom6($zoom);
		$field = "giw_geometry_r" . $rZoom;

		$ret = $this->QueryByEnvelope($geographyId, $envelope, $field, true);

		// Si el filtro de 1px vacio el tile (radios grandes y dispersos,
		// ninguno llega al umbral), se trae igual un subconjunto acotado
		// -los de mayor area- en lugar de no mostrar nada. En cartografias
		// densas (ej. CABA) el filtro normal casi nunca deja 0 resultados,
		// asi que este segundo query practicamente no se dispara ahi.
		if (empty($ret))
			$ret = $this->QueryByEnvelope($geographyId, $envelope, $field, false, self::FALLBACK_LIMIT);

		Profiling::EndTimer();
		return $ret;
	}

	private function QueryByEnvelope($geographyId, $envelope, $field, $applySizeFilter, $limit = null)
	{
		//$centroids = ($getCentroids ? ', ST_Y(giw_centroid) as Lat, ST_X(giw_centroid) as Lon' : '');

		// Calcula filtro de 1 pixel para filtrar
		$filterSize = $applySizeFilter ? (" AND " . $this->GetSquareFilter($envelope, $field, 1)) : "";
		// Calcula los que representan algo menor a 8 pixels x 8 pixels
		// o densidad de población mayor a 10 personas por hectárea (m2 * 100 * 100 > 10)
		$denseAttribute = "NOT " . $this->GetSquareFilter($envelope, $field, 8) .
											" OR giw_population / giw_area_m2 > 0.001"; // 1000 x km2

		// Con el filtro de tamaño normal el orden es por id (como antes);
		// en el fallback sin filtro interesa traer primero los mas grandes.
		$orderBy = $applySizeFilter ? "giw_geography_item_id" : "giw_area_m2 DESC";

		$sql = "SELECT  " . $field . " as value, " . $denseAttribute . " dense, giw_geography_item_id as FID" .
			" FROM snapshot_geography_item WHERE giw_geography_id = ? " .
			" AND (MBRIntersects(" . $field . ", ST_PolygonFromText('" . $envelope->ToWKT() . "'))
						)" . $filterSize .
			" ORDER BY " . $orderBy;
		if ($limit !== null)
			$sql .= " LIMIT " . (int)$limit;

		$params = array($geographyId);
		return App::Db()->fetchAll($sql, $params);
	}

	private function GetSquareFilter($envelope, $field, $pixels)
	{
		$ratio = self::TILE_SIZE / $pixels;
		$width = ($envelope->Max->Lon - $envelope->Min->Lon) / $ratio;
		$height = ($envelope->Max->Lat - $envelope->Min->Lat) / $ratio;
		return " geometryIsMinSize(" . $field .
											"," . $width . "," . $height . ") ";
	}
}
