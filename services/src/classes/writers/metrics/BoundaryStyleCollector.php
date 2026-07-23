<?php

namespace helena\classes\writers\metrics;

use minga\framework\Log;
use helena\classes\App;
use helena\db\frontend\BoundaryModel;

/**
 * Arma el estilo QGIS para el export de límites (boundaries): una capa categorizada por el
 * campo "tipo" de cada límite (el Caption de su ClippingRegion), coloreada con el color que ese
 * ClippingRegion ya tiene definido (clr_color) — el mismo con el que se ve en el mapa.
 *
 * A diferencia de VariableStyleCollector (indicadores), acá no hay cortes ni fórmulas que
 * calcular: el color por tipo ya está fijo en clipping_region, así que sólo hace falta traerlo y
 * armar una regla por categoría. Reusa BoundaryModel::GetValuesByBoundaryVersionId, la misma
 * consulta con la que el mapa arma su leyenda, para no correr el riesgo de que ambos diverjan.
 *
 * Se exporta siempre como polígono sin relleno (outlineOnly): en el visor los límites se ven
 * como polígonos sin relleno, sólo con el contorno de color.
 *
 * El nombre de capa es el del boundary descargado (p. ej. "Gobiernos locales (2023)"), la misma
 * consulta que ya arma BoundaryDownloadManager::GetFileName para el nombre del archivo — no
 * "Tipo", ya que "tipo" es el campo dentro de esa capa, no la capa en sí. Por eso, además, las
 * etiquetas de cada categoría no llevan ese nombre antepuesto (a diferencia de las variables de
 * indicadores, acá hay un solo campo a mostrar y repetirlo en cada ítem sería redundante).
 */
class BoundaryStyleCollector
{
	const GEOMETRY_KIND = 'fill';
	const OUTLINE_ONLY = true;
	const TIPO_VARIABLE = 'tipo';
	const DEFAULT_STYLE_NAME = 'Límites';

	/**
	 * @return array{styles: array<int, array{styleName: string, rendererXml: string, description: string, isDefault: bool}>, bbox: null}
	 */
	public static function Collect(int $boundaryVersionId, array $cols): array
	{
		$styles = array();
		try
		{
			$effectiveVariable = self::FindEffectiveVariable($cols, self::TIPO_VARIABLE);
			if ($effectiveVariable !== null)
			{
				$model = new BoundaryModel();
				$types = $model->GetValuesByBoundaryVersionId($boundaryVersionId);

				if (count($types) > 0)
				{
					$layerName = self::ResolveLayerName($boundaryVersionId);
					$valueLabels = self::ToValueLabels($types);
					$expr = '"' . $effectiveVariable . '"';
					$rendererXml = QmlRendererBuilder::Build($layerName, 'V', $expr, true, $valueLabels,
						self::GEOMETRY_KIND, self::OUTLINE_ONLY, false);

					if ($rendererXml !== null)
					{
						$styles[] = array(
							'styleName'   => $layerName,
							'rendererXml' => $rendererXml,
							'description' => '',
							'isDefault'   => true,
						);
					}
				}
			}
		}
		catch (\Exception $e)
		{
			Log::LogException($e, true);
		}
		// Sin bbox propio (a diferencia de VariableStyleCollector, no hay un extent precalculado
		// por versión de boundary): QgzProjectBuilder cae a la extensión mundial.
		return array('styles' => $styles, 'bbox' => null);
	}

	/**
	 * Mismo nombre "bou_caption (bvr_caption)" que ya usa BoundaryDownloadManager::GetFileName
	 * para el archivo descargado, para que el nombre de la capa coincida con el del archivo.
	 */
	private static function ResolveLayerName(int $boundaryVersionId): string
	{
		$name = App::Db()->fetchScalar(
			"SELECT CONCAT(bou_caption, ' (', bvr_caption, ')') FROM boundary INNER JOIN boundary_version ON bvr_boundary_id = bou_id WHERE bvr_id = ?",
			array($boundaryVersionId));
		return $name !== null && $name !== '' ? $name : self::DEFAULT_STYLE_NAME;
	}

	private static function FindEffectiveVariable(array $cols, string $variable): ?string
	{
		foreach ($cols as $col)
		{
			if (($col['variable'] ?? null) === $variable && isset($col['effectiveVariable']))
				return $col['effectiveVariable'];
		}
		return null;
	}

	/**
	 * Adapta el resultado de BoundaryModel::GetValuesByBoundaryVersionId (vvl_value siempre null)
	 * al contrato de QmlRendererBuilder::BuildCategoryRules, que interpreta vvl_value === null
	 * como la categoría "sin datos". Acá no aplica ese caso: todo límite tiene su ClippingRegion,
	 * así que se usa clr_id (vvl_id) como value —aunque la comparación real la hace por caption,
	 * ya que isTextComparison = true—.
	 */
	private static function ToValueLabels(array $types): array
	{
		$labels = array();
		foreach ($types as $type)
		{
			$labels[] = array(
				'vvl_value'      => (int)$type['vvl_id'],
				'vvl_caption'    => $type['vvl_caption'],
				'vvl_fill_color' => $type['vvl_fill_color'],
				'vvl_line_color' => $type['vvl_line_color'],
			);
		}
		return $labels;
	}
}
