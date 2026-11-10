<?php

namespace helena\services\wfs;

use helena\classes\App;
use helena\services\common\BaseService;
use minga\framework\PublicException;

class WfsDescribeFeatureTypeService extends BaseService
{
	public function DescribeFeatureType()
	{
		$requested = WfsRequest::GetTypeNames();
		if ($requested === null || $requested === '')
			throw new PublicException("TYPENAMES es requerido.");

		// Los clientes (GDAL, QGIS) piden el esquema de todas las capas en una sola solicitud.
		$layers = [];
		foreach (WfsTypeName::ParseRequestedList($requested) as $typeName)
			$layers[] = $this->DescribeLayer($typeName);

		return $this->Respond($layers);
	}

	// ['localName', 'geometryType', 'variableElements']
	private function DescribeLayer(WfsTypeName $typeName)
	{
		if ($typeName->Type === WfsTypeName::TYPE_BOUNDARY)
			return [$typeName->LocalName, 'gml:MultiSurfacePropertyType', []];

		$descriptor = WfsLayerDescriptor::FromTypeName($typeName);
		$geometryType = 'gml:MultiSurfacePropertyType';
		if ($descriptor->DatasetType === WfsDatasetType::POINTS)
			$geometryType = 'gml:PointPropertyType';

		return [$typeName->LocalName, $geometryType, $this->VariableElements($descriptor)];
	}

	// [nombre => tipo xsd], en el mismo orden en que GetFeature emite las propiedades.
	private function VariableElements(WfsLayerDescriptor $descriptor)
	{
		$names = WfsFieldNames::ForVariables($descriptor->Variables);
		$elements = [];
		foreach ($descriptor->Variables as $variable)
		{
			$name = $names[(int) $variable['Id']];
			$elements[$name] = 'xsd:double';
			$elements[$name . '_total'] = 'xsd:double';
			$elements[$name . '_lid'] = 'xsd:integer';
			if (WfsFeatureWriter::HasPercentage($variable))
				$elements[$name . '_pct'] = 'xsd:double';
		}
		return $elements;
	}

	private function Respond($layers)
	{
		$ns  = WfsGml::Escape(WfsConfig::GetWfsNamespaceUri());
		$pfx = WfsConfig::NAMESPACE_PREFIX;

		$xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
		$xml .= '<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"'
			. ' xmlns:' . $pfx . '="' . $ns . '"'
			. ' xmlns:gml="http://www.opengis.net/gml/3.2"'
			. ' targetNamespace="' . $ns . '"'
			. ' elementFormDefault="qualified" version="1.0">' . "\n";
		$xml .= '  <xsd:import namespace="http://www.opengis.net/gml/3.2"'
			. ' schemaLocation="http://schemas.opengis.net/gml/3.2.1/gml.xsd"/>' . "\n";

		foreach ($layers as $layer)
			$xml .= $this->LayerSchema($pfx, $layer[0], $layer[1], $layer[2]);

		$xml .= "</xsd:schema>\n";
		return App::Response($xml, 'application/xml; charset=UTF-8');
	}

	private function LayerSchema($pfx, $localName, $geometryType, $variableElements)
	{
		$local = WfsGml::Escape($localName);
		$xml = '  <xsd:element name="' . $local . '" type="' . $pfx . ':' . $local . 'Type"'
			. ' substitutionGroup="gml:AbstractFeature"/>' . "\n";
		$xml .= '  <xsd:complexType name="' . $local . 'Type">' . "\n"
			. '    <xsd:complexContent><xsd:extension base="gml:AbstractFeatureType">' . "\n"
			. "      <xsd:sequence>\n";

		$xml .= $this->Element(WfsFieldNames::GEOMETRY, $geometryType);
		$xml .= $this->Element(WfsFieldNames::ITEM_ID, 'xsd:integer');
		$xml .= $this->Element(WfsFieldNames::NAME, 'xsd:string');
		foreach ($variableElements as $name => $type)
			$xml .= $this->Element($name, $type);

		$xml .= "      </xsd:sequence>\n"
			. "    </xsd:extension></xsd:complexContent>\n"
			. "  </xsd:complexType>\n";
		return $xml;
	}

	private function Element($name, $type)
	{
		return '        <xsd:element name="' . $name . '" type="' . $type . '" minOccurs="0" nillable="true"/>' . "\n";
	}
}
