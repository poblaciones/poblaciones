<?php

namespace helena\services\wfs;

use minga\framework\PublicException;

// Dos formatos de nombres de capa (la parte local, sin prefijo de namespace):
//
// Formato amigable (métricas):  {tag}-{version}-{nivel}
//   ej. nbi-2022-radios
//       acceso_a_agua_de_red-2010-departamentos
//
// Formato numérico (boundaries):
//   b_{boundaryId}_v_{boundaryVersionId}
//
// El separador - permite split inequívoco porque Sanitize reemplaza cualquier
// otro carácter por _. El nombre debe ser un nombre de elemento XML válido, porque
// GetFeature lo emite como elemento: por eso no puede empezar con un dígito.
class WfsTypeName
{
	const TYPE_METRIC   = 'metric';
	const TYPE_BOUNDARY = 'boundary';

	public $Type;

	// Métricas (formato amigable - se resuelve a IDs en WfsLayerDescriptor)
	public $MetricTag;     // parte sanitizada del nombre/tag
	public $VersionSlug;   // versión sanitizada (ej. "2022")
	public $LevelSlug;     // nivel sanitizado (ej. "radios")

	// Boundaries (formato numérico)
	public $BoundaryId;
	public $BoundaryVersionId;

	// Parte local del nombre, tal como la publica GetCapabilities y la emite GetFeature.
	public $LocalName;

	// Nombre calificado con el prefijo del namespace, como figura en GetCapabilities.
	public static function Qualified($localName)
	{
		return WfsConfig::NAMESPACE_PREFIX . ':' . $localName;
	}

	// Interpreta el valor de TYPENAMES de una solicitud que admite una sola capa.
	public static function ParseRequested($requested)
	{
		$list = self::ParseRequestedList($requested);
		if (count($list) !== 1)
			throw new PublicException("Esta operación admite una sola capa en TYPENAMES.");
		return $list[0];
	}

	// Interpreta una lista de nombres separados por coma. Los clientes los mandan
	// calificados (pob:nombre), tal como los publica GetCapabilities; también se aceptan
	// sin prefijo.
	public static function ParseRequestedList($requested)
	{
		$ret = [];
		foreach (explode(',', $requested) as $requestedName)
		{
			$localName = trim($requestedName);
			$colon = strrpos($localName, ':');
			if ($colon !== false)
				$localName = substr($localName, $colon + 1);
			$ret[] = self::Parse($localName);
		}
		return $ret;
	}

	public static function Parse($typeName)
	{
		$ret = new self();
		$ret->LocalName = $typeName;

		// Formato boundary numérico: b_{id}_v_{vid}
		if (strpos($typeName, 'b_') === 0)
		{
			$parts = explode('_', $typeName);
			if (count($parts) === 4 && $parts[2] === 'v')
			{
				$ret->Type              = self::TYPE_BOUNDARY;
				$ret->BoundaryId        = (int)$parts[1];
				$ret->BoundaryVersionId = (int)$parts[3];
				return $ret;
			}
		}

		// Formato amigable de métrica: tag-version-nivel
		$parts = explode('-', $typeName);
		if (count($parts) === 3)
		{
			$ret->Type        = self::TYPE_METRIC;
			$ret->MetricTag   = $parts[0];
			$ret->VersionSlug = $parts[1];
			$ret->LevelSlug   = $parts[2];
			return $ret;
		}

		throw new PublicException("TYPENAMES no reconocido: " . $typeName);
	}

	// Primera parte del nombre de una métrica: sanitizada y que no empiece con dígito.
	public static function TagSlug($tagOrName)
	{
		$slug = self::Sanitize($tagOrName);
		if ($slug === '')
			return 'm';
		if (ctype_digit($slug[0]))
			return 'm_' . $slug;
		return $slug;
	}

	// Genera el typeName amigable a partir de textos libres
	public static function ForMetricFriendly($tagOrName, $versionName, $levelName)
	{
		return self::TagSlug($tagOrName)
			. '-' . self::Sanitize($versionName)
			. '-' . self::Sanitize($levelName);
	}

	// Formato numérico para boundaries
	public static function ForBoundary($boundaryId, $boundaryVersionId)
	{
		return "b_{$boundaryId}_v_{$boundaryVersionId}";
	}

	// Sanitiza un texto para usarlo como parte de un typeName.
	// Misma lógica que la función JS en la pantalla de edición de indicador.
	public static function Sanitize($text)
	{
		$text = mb_strtolower(trim($text));
		$text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
		$text = preg_replace('/[^a-z0-9_]/', '_', $text);
		$text = preg_replace('/_+/', '_', $text);
		return trim($text, '_');
	}
}
