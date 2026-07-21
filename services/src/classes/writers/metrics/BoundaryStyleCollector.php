<?php

namespace helena\classes\writers\metrics;

use minga\framework\Log;
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
 */
class BoundaryStyleCollector
{
	const GEOMETRY_KIND = 'fill';
	const OUTLINE_ONLY = true;
	const TIPO_VARIABLE = 'tipo';
	const STYLE_NAME = 'Tipo';

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
					$valueLabels = self::ToValueLabels($types);
					$expr = '"' . $effectiveVariable . '"';
					$rendererXml = QmlRendererBuilder::Build(self::STYLE_NAME, 'V', $expr, true, $valueLabels,
						self::GEOMETRY_KIND, self::OUTLINE_ONLY);

					if ($rendererXml !== null)
					{
						$styles[] = array(
							'styleName'   => self::STYLE_NAME,
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
