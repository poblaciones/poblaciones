<?php

namespace helena\services\mcp;

use helena\classes\settings\McpSettings;

/**
 * Definición de las herramientas del conector (nombre, descripción, esquema de
 * parámetros) y validación de los argumentos recibidos. El esquema que se publica y
 * la validación salen de una única descripción de parámetros.
 */
class McpToolCatalog
{
	const MAX_REGION_IDS = 50;

	private McpSettings $settings;

	public function __construct(McpSettings $settings)
	{
		$this->settings = $settings;
	}

	public static function GetGuide(): string
	{
		return "Poblaciones es una plataforma de datos espaciales de población. Este conector consulta sus datos públicos, solo en lectura.\n\n"
			. "Conceptos\n"
			. "- Indicador: tema medido (por ejemplo, mortalidad infantil). Tiene series (ediciones, por ejemplo un año); cada serie proviene de una cartografía con su PDF de metadatos.\n"
			. "- Nivel: cada serie se publica en uno o más niveles, cada uno asociado a una geografía: puntos (ubicaciones, como escuelas), zonas (polígonos propios) o áreas estándar (radios, departamentos, provincias).\n"
			. "- Variable: cada nivel tiene variables (subindicadores) con su fórmula; pueden ser numéricas o categóricas.\n"
			. "- Delimitación: división territorial (provincias, departamentos, etc.) formada por ítems. Responde preguntas como cuántos departamentos tiene una provincia.\n"
			. "- Región: ítem de una delimitación. Su id sirve para recortar los datos (parámetro region_ids). Si se combinan regiones, deben ser de una misma delimitación: si se superponen (por ejemplo, una provincia y uno de sus departamentos), los valores se duplican.\n\n"
			. "Cómo consultar\n"
			. "1. get_catalog es la primera llamada de toda consulta: trae los indicadores y las delimitaciones. Los ids de las delimitaciones incluidas completas se usan directamente como región; para las demás, usar find_regions o list_boundary_items.\n"
			. "2. describe_indicator muestra series, niveles, variables y fórmulas, con los ids que piden las otras herramientas.\n"
			. "3. get_indicator_summary resume una región y suele ser lo más útil en una conversación. get_indicator_data lista valores por área (por ejemplo, por departamento). get_dataset_records lista registros (por ejemplo, las escuelas de una provincia).\n"
			. "4. Los valores se entregan ya calculados: no recalcular fórmulas. Cada variable normalizada (porcentaje, tasa, densidad) trae su resultado, su cantidad (numerador) y su base de cálculo (denominador), con el nombre de cada término. Informar siempre la cantidad y la base junto al resultado (por ejemplo, cuántos hogares son el 5 % y sobre qué total); un total como la población sale de la cantidad o de la base según corresponda, sin multiplicar ni dividir.\n\n"
			. "Reglas\n"
			. "- Citar siempre la cartografía de origen y el enlace a sus metadatos, que acompañan cada resultado.\n"
			. "- Mapas: cuando el usuario pida ver los datos en un mapa, llamar show_map. El mapa no se dibuja en la conversación: se entrega el enlace «Mapa», que abre el visor de Poblaciones con la misma serie, nivel y regiones. No responder que no se puede mostrar un mapa: ofrecer ese enlace. Cada resultado de datos también trae su enlace «Mapa».\n"
			. "- Los ids (de indicadores, series, niveles, regiones y cartografías) sirven solo para llamar a las herramientas: no mostrarlos al usuario; nombrar siempre por el nombre.\n"
			. "- No hay listados de radios (usar el resumen o el mapa) ni tablas de cruce entre delimitaciones.\n"
			. "- Los listados largos se devuelven por tramos: continuar con el parámetro offset indicado.";
	}

	public function GetTools(): array
	{
		$tools = [];
		foreach ($this->GetDefinitions() as $name => $definition)
		{
			$tool = [
				'name' => $name,
				'title' => $definition['title'],
				'description' => $definition['description'],
				'inputSchema' => $this->BuildInputSchema($definition['params']),
				'annotations' => [
					'title' => $definition['title'],
					'readOnlyHint' => true,
					'destructiveHint' => false,
					'idempotentHint' => true,
					'openWorldHint' => false
				]
			];
			$tools[] = $tool;
		}
		return $tools;
	}

	public function Exists(string $toolName): bool
	{
		return array_key_exists($toolName, $this->GetDefinitions());
	}

	/**
	 * Valida los argumentos y devuelve los valores finales, con los omitidos resueltos.
	 */
	public function NormalizeArguments(string $toolName, $arguments): array
	{
		$params = $this->GetDefinitions()[$toolName]['params'];
		if ($arguments === null)
			$arguments = [];
		if (!is_array($arguments))
			throw new McpToolException('Los argumentos deben ser un objeto con los parámetros de la herramienta.');

		foreach (array_keys($arguments) as $given)
		{
			if (!array_key_exists($given, $params))
				throw new McpToolException("El parámetro '" . $given . "' no existe en " . $toolName
					. ". Parámetros válidos: " . $this->ListNames($params) . ".");
		}
		$normalized = [];
		foreach ($params as $name => $spec)
		{
			$normalized[$name] = $this->NormalizeParameter($name, $spec, $arguments);
		}
		return $normalized;
	}

	private function ListNames(array $params): string
	{
		if (count($params) === 0)
			return 'ninguno';
		return implode(', ', array_keys($params));
	}

	private function NormalizeParameter(string $name, array $spec, array $arguments)
	{
		$isGiven = array_key_exists($name, $arguments) && $arguments[$name] !== null;
		if (!$isGiven)
		{
			if ($spec['required'])
				throw new McpToolException("Falta el parámetro obligatorio '" . $name . "'.");
			return $spec['default'];
		}
		$value = $arguments[$name];
		if ($spec['type'] === 'integer')
			return $this->NormalizeInteger($name, $spec, $value);
		if ($spec['type'] === 'string')
			return $this->NormalizeString($name, $spec, $value);
		if ($spec['type'] === 'integer_array')
			return $this->NormalizeIntegerArray($name, $spec, $value);
		return $this->NormalizeStringArray($name, $value);
	}

	private function NormalizeInteger(string $name, array $spec, $value): int
	{
		if (is_string($value) && preg_match('/^-?\d+$/', $value) === 1)
			$value = intval($value);
		if (!is_int($value))
			throw new McpToolException("El parámetro '" . $name . "' debe ser un número entero.");
		if ($value < $spec['min'])
			throw new McpToolException("El parámetro '" . $name . "' no puede ser menor que " . $spec['min'] . ".");
		if ($spec['max'] !== null && $value > $spec['max'])
			throw new McpToolException("El parámetro '" . $name . "' no puede ser mayor que " . $spec['max'] . ".");
		return $value;
	}

	private function NormalizeString(string $name, array $spec, $value): string
	{
		if (!is_string($value))
			throw new McpToolException("El parámetro '" . $name . "' debe ser un texto.");
		$value = trim($value);
		if ($spec['enum'] !== null && !in_array($value, $spec['enum'], true))
			throw new McpToolException("El parámetro '" . $name . "' debe ser uno de: " . implode(', ', $spec['enum']) . ".");
		if (mb_strlen($value, 'UTF-8') < $spec['minLength'])
			throw new McpToolException("El parámetro '" . $name . "' debe tener al menos " . $spec['minLength'] . " caracteres.");
		return $value;
	}

	private function NormalizeIntegerArray(string $name, array $spec, $value): array
	{
		if (!is_array($value))
			throw new McpToolException("El parámetro '" . $name . "' debe ser una lista de números enteros.");
		if (count($value) > self::MAX_REGION_IDS)
			throw new McpToolException("El parámetro '" . $name . "' admite hasta " . self::MAX_REGION_IDS . " valores.");
		if ($spec['required'] && count($value) === 0)
			throw new McpToolException("El parámetro '" . $name . "' debe incluir al menos un valor.");
		$ids = [];
		foreach ($value as $item)
		{
			$ids[] = $this->NormalizeInteger($name, $spec, $item);
		}
		return array_values(array_unique($ids));
	}

	private function NormalizeStringArray(string $name, $value): array
	{
		if (!is_array($value))
			throw new McpToolException("El parámetro '" . $name . "' debe ser una lista de textos.");
		$items = [];
		foreach ($value as $item)
		{
			if (!is_string($item))
				throw new McpToolException("El parámetro '" . $name . "' debe ser una lista de textos.");
			$items[] = trim($item);
		}
		return array_values(array_unique($items));
	}

	private function BuildInputSchema(array $params): array
	{
		$properties = [];
		$required = [];
		foreach ($params as $name => $spec)
		{
			$properties[$name] = $this->BuildPropertySchema($spec);
			if ($spec['required'])
				$required[] = $name;
		}
		if (count($properties) === 0)
			$properties = new \stdClass();
		$schema = ['type' => 'object', 'properties' => $properties, 'additionalProperties' => false];
		if (count($required) > 0)
			$schema['required'] = $required;
		return $schema;
	}

	private function BuildPropertySchema(array $spec): array
	{
		if ($spec['type'] === 'integer')
			return $this->BuildIntegerSchema($spec);
		if ($spec['type'] === 'string')
			return $this->BuildStringSchema($spec);
		if ($spec['type'] === 'integer_array')
			return ['type' => 'array', 'items' => ['type' => 'integer'], 'description' => $spec['description']];
		return ['type' => 'array', 'items' => ['type' => 'string'], 'description' => $spec['description']];
	}

	private function BuildIntegerSchema(array $spec): array
	{
		$schema = ['type' => 'integer', 'description' => $spec['description']];
		$schema['minimum'] = $spec['min'];
		if ($spec['max'] !== null)
			$schema['maximum'] = $spec['max'];
		return $schema;
	}

	private function BuildStringSchema(array $spec): array
	{
		$schema = ['type' => 'string', 'description' => $spec['description']];
		if ($spec['enum'] !== null)
			$schema['enum'] = $spec['enum'];
		return $schema;
	}

	private function Param(string $type, string $description, bool $required = false, $default = null, array $extra = []): array
	{
		$spec = ['type' => $type, 'description' => $description, 'required' => $required, 'default' => $default,
			'min' => 0, 'max' => null, 'minLength' => 0, 'enum' => null];
		return array_merge($spec, $extra);
	}

	private function IdParam(string $description, bool $required = true): array
	{
		return $this->Param('integer', $description, $required, null, ['min' => 1]);
	}

	private function RegionsParam(bool $required): array
	{
		$description = 'Ids de región (ítems de delimitaciones) a los que se recortan los datos, por ejemplo el de una provincia.';
		if ($required)
			$description .= ' Obligatorio.';
		else
			$description .= ' Si se omiten, se consulta todo el nivel.';
		return $this->Param('integer_array', $description, $required, []);
	}

	private function PartitionParam(): array
	{
		return $this->Param('integer', 'Valor de partición del nivel, si lo tiene (se informa en describe_indicator).');
	}

	private function LimitParam(): array
	{
		return $this->Param('integer', 'Cantidad máxima de filas. Por omisión ' . $this->settings->DefaultRows . '.',
			false, $this->settings->DefaultRows, ['min' => 1, 'max' => $this->settings->MaxRows]);
	}

	private function OffsetParam(): array
	{
		return $this->Param('integer', 'Cantidad de filas a saltear, para continuar un listado por tramos.', false, 0);
	}

	private function GetDefinitions(): array
	{
		$levelParams = [
			'indicator_id' => $this->IdParam('Id del indicador.'),
			'version_id' => $this->IdParam('Id de la serie (edición) del indicador.'),
			'level_id' => $this->IdParam('Id del nivel de la serie.')
		];
		$dataParams = $levelParams;
		$dataParams['region_ids'] = $this->RegionsParam(false);
		$dataParams['partition'] = $this->PartitionParam();

		$summaryParams = $levelParams;
		$summaryParams['region_ids'] = $this->RegionsParam(true);
		$summaryParams['partition'] = $this->PartitionParam();

		$indicatorDataParams = $dataParams;
		$indicatorDataParams['sort_by'] = $this->Param('string', "Orden de las filas: 'name', 'code' o el id de una variable. Por omisión, por nombre.");
		$indicatorDataParams['order'] = $this->Param('string', 'Sentido del orden.', false, 'asc', ['enum' => ['asc', 'desc']]);
		$indicatorDataParams['limit'] = $this->LimitParam();
		$indicatorDataParams['offset'] = $this->OffsetParam();

		$recordsParams = $dataParams;
		$recordsParams['columns'] = $this->Param('string_array',
			'Nombres de las columnas a incluir, tal como figuran en el diccionario. Si se omiten, se incluyen todas.', false, []);
		$recordsParams['limit'] = $this->LimitParam();
		$recordsParams['offset'] = $this->OffsetParam();

		return [
			'get_catalog' => [
				'title' => 'Catálogo de Poblaciones',
				'description' => 'Primera llamada de toda consulta sobre Poblaciones («quiero consultar información en Poblaciones», datos de…, indicadores de…). '
					. 'Devuelve la guía de uso, los indicadores públicos y las delimitaciones territoriales (provincias, departamentos, etc.) con sus ítems e ids. Sin parámetros.',
				'params' => []
			],
			'describe_indicator' => [
				'title' => 'Describir un indicador',
				'description' => 'Series (ediciones), niveles, variables con su fórmula y categorías de un indicador, con el enlace a los metadatos de cada serie. Entrega los ids que piden las demás herramientas.',
				'params' => ['indicator_id' => $this->IdParam('Id del indicador (figura en el catálogo).')]
			],
			'describe_boundary' => [
				'title' => 'Describir una delimitación',
				'description' => 'Versiones de una delimitación territorial, con el enlace a sus metadatos y la cantidad de ítems.',
				'params' => ['boundary_id' => $this->IdParam('Id de la delimitación (figura en el catálogo).')]
			],
			'find_regions' => [
				'title' => 'Buscar regiones por nombre',
				'description' => 'Busca hasta 10 regiones (provincias, departamentos, localidades, etc.) por nombre. Devuelve ids para usar como region_ids.',
				'params' => ['query' => $this->Param('string', 'Nombre o parte del nombre de la región.', true, null, ['minLength' => 2])]
			],
			'list_boundary_items' => [
				'title' => 'Listar ítems de una delimitación',
				'description' => 'Lista los ítems de una delimitación (por ejemplo, los departamentos de una provincia). Sirve para las delimitaciones que el catálogo no incluyó completas.',
				'params' => [
					'boundary_id' => $this->IdParam('Id de la delimitación.'),
					'parent_id' => $this->Param('integer', 'Id del ítem superior (por ejemplo, una provincia) para listar solo sus ítems.', false, null, ['min' => 1]),
					'query' => $this->Param('string', 'Texto que debe contener el nombre.'),
					'limit' => $this->LimitParam(),
					'offset' => $this->OffsetParam()
				]
			],
			'show_map' => [
				'title' => 'Enlace al mapa de un indicador',
				'description' => 'Entrega el enlace al mapa de Poblaciones con la serie, el nivel y las regiones indicados. '
					. 'Usarla cuando el usuario pida ver o mostrar los datos en un mapa. No devuelve valores: para cifras usar get_indicator_summary.',
				'params' => $dataParams
			],
			'get_indicator_summary' => [
				'title' => 'Resumen de un indicador en una región',
				'description' => 'Valores agregados de un indicador para una o más regiones, por variable y categoría, ya calculados y con la cantidad y la base de cálculo de cada resultado. Suele ser lo más útil para responder en una conversación.',
				'params' => $summaryParams
			],
			'get_indicator_data' => [
				'title' => 'Valores de un indicador por área',
				'description' => 'Una fila por área (por ejemplo, por departamento) con el valor de cada variable y, en las normalizadas, su cantidad y su base de cálculo, en texto con diccionario y CSV. Solo para niveles de geografía estándar; para puntos y zonas usar get_dataset_records. No admite radios.',
				'params' => $indicatorDataParams
			],
			'get_dataset_records' => [
				'title' => 'Registros de un nivel',
				'description' => 'Registros del conjunto de datos de un nivel (por ejemplo, las escuelas de una provincia), sin geometrías, en texto con diccionario y CSV. No admite radios.',
				'params' => $recordsParams
			]
		];
	}
}
