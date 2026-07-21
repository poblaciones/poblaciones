<?php

namespace helena\classes\writers\metrics;

use minga\framework\Str;
use helena\classes\spss\Format;

/**
 * Arma el QML (estilo de capa de QGIS) de una variable a partir de sus categorías o puntos de
 * corte (variable_value_label). Usa siempre un renderer basado en reglas (RuleRenderer): a
 * diferencia de los renderers nativos "categorized"/"graduated", permite reproducir con
 * exactitud la clase "sin datos" —con su propio color— junto con el resto de las clases.
 */
class QmlRendererBuilder
{
	const DEFAULT_FILL = '200,200,200,255';
	const DEFAULT_OUTLINE = '35,35,35,255';

	/**
	 * @param string      $variableCaption   nombre de la variable (indicador), antepuesto a cada etiqueta
	 * @param string      $cutMode           'S' único, 'V' categorías, 'J'/'T'/'M' rangos
	 * @param string|null $classificationExpr expresión QGIS (columna o fórmula) a clasificar; null para 'S'
	 * @param bool        $isTextComparison  para 'V': comparar por texto (Caption) en vez de por número (Value)
	 * @param array       $valueLabels       filas de VariableSymbologyRepository::GetValueLabels, ordenadas
	 * @param string      $geometryKind      'fill' | 'marker' | 'line'
	 * @param bool        $outlineOnly       para 'fill': sin relleno, solo el contorno (ver BuildSymbol)
	 * @return string|null XML del <renderer-v2>, o null si no se pudo construir una clasificación válida
	 */
	public static function Build(string $variableCaption, string $cutMode, ?string $classificationExpr,
		bool $isTextComparison, array $valueLabels, string $geometryKind, bool $outlineOnly = false): ?string
	{
		if ($cutMode === 'S')
			return self::BuildSingleSymbol($valueLabels, $geometryKind, $outlineOnly);

		if ($classificationExpr === null || count($valueLabels) === 0)
			return null;

		if ($cutMode === 'V')
			$rules = self::BuildCategoryRules($classificationExpr, $isTextComparison, $valueLabels);
		else if ($cutMode === 'J' || $cutMode === 'T' || $cutMode === 'M')
			$rules = self::BuildRangeRules($classificationExpr, $valueLabels);
		else
			return null; // CutMode no reconocido: fuera de alcance

		if (count($rules) === 0)
			return null;

		return self::BuildRuleBasedRenderer($variableCaption, $rules, $geometryKind, $outlineOnly);
	}

	public static function WrapQml(string $rendererXml): string
	{
		return "<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>"
			. '<qgis version="3.34" styleCategories="Symbology">'
			. $rendererXml
			. '</qgis>';
	}

	// ── Categorías (CutMode 'V') ─────────────────────────────────────────────

	private static function BuildCategoryRules(string $expr, bool $isText, array $labels): array
	{
		$rules = array();
		foreach ($labels as $label)
		{
			if ($label['vvl_value'] === null)
				$filter = $isText ? "($expr IS NULL OR $expr = '')" : "$expr IS NULL";
			else if ($isText)
				$filter = $expr . ' = ' . self::QuoteString($label['vvl_caption']);
			else
				$filter = $expr . ' = ' . self::FormatNumber($label['vvl_value']);
			$rules[] = array('filter' => $filter, 'label' => $label);
		}
		return $rules;
	}

	// ── Rangos (CutMode 'J' / 'T' / 'M') ─────────────────────────────────────
	// Replica Variable::CalculateVersionValueLabelId(): el ítem "sin datos" (value NULL), si
	// existe, va primero y no cuenta como el primer peldaño de la escala numérica.

	private static function BuildRangeRules(string $expr, array $labels): array
	{
		$rules = array();
		$count = count($labels);
		$first = true;
		for ($i = 0; $i < $count; $i++)
		{
			$item = $labels[$i];
			if ($item['vvl_value'] === null)
			{
				if ($i !== 0)
					return array(); // dato inconsistente: el ítem sin valor debe ser el primero
				$filter = "$expr IS NULL";
			}
			else if ($first)
			{
				$filter = "$expr < " . self::FormatNumber($item['vvl_value']);
				$first = false;
			}
			else if ($i === $count - 1)
			{
				$prev = $labels[$i - 1];
				$filter = "$expr >= " . self::FormatNumber($prev['vvl_value']);
			}
			else
			{
				$prev = $labels[$i - 1];
				$filter = "$expr >= " . self::FormatNumber($prev['vvl_value'])
					. " AND $expr < " . self::FormatNumber($item['vvl_value']);
			}
			$rules[] = array('filter' => $filter, 'label' => $item);
		}
		return $rules;
	}

	// ── Ensamblado XML ────────────────────────────────────────────────────────

	private static function BuildRuleBasedRenderer(string $variableCaption, array $rules, string $geometryKind, bool $outlineOnly = false): string
	{
		$rulesXml = '';
		$symbolsXml = '';
		$i = 0;
		foreach ($rules as $rule)
		{
			$name = (string)$i;
			$label = self::EscapeAttr($variableCaption . ' - ' . $rule['label']['vvl_caption']);
			$filter = self::EscapeAttr($rule['filter']);
			$key = self::GenerateKey($i);
			$rulesXml .= '<rule key="' . $key . '" filter="' . $filter . '" label="' . $label . '" symbol="' . $name . '"/>';
			$symbolsXml .= self::BuildSymbol($name, $geometryKind, $rule['label']['vvl_fill_color'], $rule['label']['vvl_line_color'], $outlineOnly);
			$i++;
		}
		return '<renderer-v2 type="RuleRenderer" symbollevels="0" forceraster="0" enableorderby="0" referencescale="-1">'
			. '<rules key="{root}">' . $rulesXml . '</rules>'
			. '<symbols>' . $symbolsXml . '</symbols>'
			. '</renderer-v2>';
	}

	private static function BuildSingleSymbol(array $valueLabels, string $geometryKind, bool $outlineOnly = false): string
	{
		$fill = $valueLabels[0]['vvl_fill_color'] ?? null;
		$line = $valueLabels[0]['vvl_line_color'] ?? null;
		$symbolXml = self::BuildSymbol('0', $geometryKind, $fill, $line, $outlineOnly);
		return '<renderer-v2 type="singleSymbol"><symbols>' . $symbolXml . '</symbols></renderer-v2>';
	}

	/**
	 * @param bool $outlineOnly sólo aplica a $geometryKind === 'fill': arma un polígono sin
	 *                          relleno (color transparente + style="no"), mostrando únicamente
	 *                          el contorno con $lineHex. Se usa para límites (boundaries), que se
	 *                          exportan como polígono (misma geometría que en la base) pero se ven
	 *                          en el visor sin relleno.
	 */
	private static function BuildSymbol(string $name, string $geometryKind, ?string $fillHex, ?string $lineHex, bool $outlineOnly = false): string
	{
		$fill = self::HexToRgba($fillHex, self::DEFAULT_FILL);
		$outline = self::HexToRgba($lineHex, self::DEFAULT_OUTLINE);

		if ($geometryKind === 'line')
		{
			// Para líneas no hay relleno: se usa el color de línea definido y, si falta, el de
			// relleno como color de trazo antes de caer al valor por defecto.
			$strokeHex = $lineHex ?? $fillHex;
			$stroke = self::HexToRgba($strokeHex, self::DEFAULT_OUTLINE);
			return '<symbol type="line" name="' . $name . '" alpha="1" clip_to_extent="1">'
				. '<layer class="SimpleLine" enabled="1" locked="0" pass="0">'
				. '<Option type="Map">'
				. '<Option type="QString" name="line_color" value="' . $stroke . '"/>'
				. '<Option type="QString" name="line_width" value="0.6"/>'
				. '<Option type="QString" name="line_width_unit" value="MM"/>'
				. '<Option type="QString" name="line_style" value="solid"/>'
				. '<Option type="QString" name="capstyle" value="square"/>'
				. '<Option type="QString" name="joinstyle" value="bevel"/>'
				. '</Option>'
				. '</layer>'
				. '</symbol>';
		}
		else if ($geometryKind === 'marker')
		{
			return '<symbol type="marker" name="' . $name . '" alpha="1" clip_to_extent="1">'
				. '<layer class="SimpleMarker" enabled="1" locked="0" pass="0">'
				. '<Option type="Map">'
				. '<Option type="QString" name="name" value="circle"/>'
				. '<Option type="QString" name="color" value="' . $fill . '"/>'
				. '<Option type="QString" name="outline_color" value="' . $outline . '"/>'
				. '<Option type="QString" name="outline_style" value="solid"/>'
				. '<Option type="QString" name="outline_width" value="0.3"/>'
				. '<Option type="QString" name="outline_width_unit" value="MM"/>'
				. '<Option type="QString" name="size" value="3"/>'
				. '<Option type="QString" name="size_unit" value="MM"/>'
				. '</Option>'
				. '</layer>'
				. '</symbol>';
		}
		else if ($outlineOnly) // fill sin relleno: sólo el contorno, con el color de línea
		{
			$strokeHex = $lineHex ?? $fillHex;
			$stroke = self::HexToRgba($strokeHex, self::DEFAULT_OUTLINE);
			return '<symbol type="fill" name="' . $name . '" alpha="1" clip_to_extent="1" force_rhr="0">'
				. '<layer class="SimpleFill" enabled="1" locked="0" pass="0">'
				. '<Option type="Map">'
				. '<Option type="QString" name="color" value="0,0,0,0"/>'
				. '<Option type="QString" name="style" value="no"/>'
				. '<Option type="QString" name="outline_color" value="' . $stroke . '"/>'
				. '<Option type="QString" name="outline_style" value="solid"/>'
				. '<Option type="QString" name="outline_width" value="0.6"/>'
				. '<Option type="QString" name="outline_width_unit" value="MM"/>'
				. '<Option type="QString" name="joinstyle" value="bevel"/>'
				. '</Option>'
				. '</layer>'
				. '</symbol>';
		}
		else // fill (polígono)
		{
			return '<symbol type="fill" name="' . $name . '" alpha="1" clip_to_extent="1" force_rhr="0">'
				. '<layer class="SimpleFill" enabled="1" locked="0" pass="0">'
				. '<Option type="Map">'
				. '<Option type="QString" name="color" value="' . $fill . '"/>'
				. '<Option type="QString" name="outline_color" value="' . $outline . '"/>'
				. '<Option type="QString" name="outline_style" value="solid"/>'
				. '<Option type="QString" name="outline_width" value="0.26"/>'
				. '<Option type="QString" name="outline_width_unit" value="MM"/>'
				. '<Option type="QString" name="style" value="solid"/>'
				. '<Option type="QString" name="joinstyle" value="bevel"/>'
				. '</Option>'
				. '</layer>'
				. '</symbol>';
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	private static function HexToRgba(?string $hex, string $default): string
	{
		if ($hex === null)
			return $default;
		$hex = ltrim($hex, '#');
		if (strlen($hex) !== 6 || !ctype_xdigit($hex))
			return $default;
		$r = hexdec(substr($hex, 0, 2));
		$g = hexdec(substr($hex, 2, 2));
		$b = hexdec(substr($hex, 4, 2));
		return "$r,$g,$b,255";
	}

	private static function FormatNumber($value): string
	{
		$value = (float)str_replace(',', '.', (string)$value);
		if ($value == (int)$value)
			return (string)(int)$value;
		return rtrim(rtrim(sprintf('%.6F', $value), '0'), '.');
	}

	private static function QuoteString(?string $value): string
	{
		return "'" . str_replace("'", "''", (string)$value) . "'";
	}

	private static function EscapeAttr(string $value): string
	{
		return Str::CleanXmlString($value);
	}

	private static function GenerateKey(int $i): string
	{
		return '{' . str_pad(dechex($i), 8, '0', STR_PAD_LEFT) . '-0000-0000-0000-000000000000}';
	}

	public static function ResolveIsTextComparison($cutColumnFormat): bool
	{
		return $cutColumnFormat !== null && (int)$cutColumnFormat === Format::A;
	}
}
