<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\SerializedName;
use \JMS\Serializer\Annotation\VirtualProperty;

/**
 * BasemapLayer
 *
 * @ORM\Table(name="basemap_layer", uniqueConstraints={@ORM\UniqueConstraint(name="bml_route_tag_UNIQUE", columns={"bml_route_tag"})}, indexes={@ORM\Index(name="fk_basemap_layer_metadata", columns={"bml_metadata_id"})})
 * @ORM\Entity
 */
class BasemapLayer
{
	// Propiedad no almacenada: nombres de los indicadores o delimitaciones de ItemIds, para la grilla.
	public $ItemsSummary;

	/**
	 * @var integer
	 *
	 * @ORM\Column(name="bml_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="IDENTITY")
	 */
	private $Id;

	/**
	 * Tipo de capa: 'R' raster, 'M' basada en indicador, 'B' basada en
	 * delimitación, 'L' etiquetas (ver BasemapLayerTypeEnum).
	 *
	 * @var string
	 *
	 * @ORM\Column(name="bml_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Type;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="bml_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Caption;

	/**
	 * @var integer
	 *
	 * @ORM\Column(name="bml_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Order;

	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="bml_separator", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Separator;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="bml_icon", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
	 */
	private $Icon;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="bml_route_tag", type="string", length=5, precision=0, scale=0, nullable=true, unique=false)
	 */
	private $RouteTag;

	/**
	 * Si es verdadero, la capa no se dibuja sobre el mapa satelital.
	 *
	 * @var boolean
	 *
	 * @ORM\Column(name="bml_hide_on_satellite", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $HideOnSatellite;

	/**
	 * Ids separados por coma: de indicadores publicados (tipo 'M') o de
	 * delimitaciones (tipo 'B').
	 *
	 * @var string
	 *
	 * @ORM\Column(name="bml_item_ids", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
	 */
	private $ItemIds;

	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="bml_dynamic_width", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $DynamicWidth;

	/**
	 * @var integer
	 *
	 * @ORM\Column(name="bml_line_width", type="integer", precision=0, scale=0, nullable=true, unique=false)
	 */
	private $LineWidth;

	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="bml_dashed_line", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $DashedLine;

	/**
	 * Modo de etiquetas de las capas de indicador: 'L' color claro, 'S' mismo
	 * color, 'N' sin etiquetas (ver BasemapLabelsModeEnum).
	 *
	 * @var string
	 *
	 * @ORM\Column(name="bml_labels_mode", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
	 */
	private $LabelsMode;

	/**
	 * Abreviaturas aplicadas a las etiquetas, como objeto JSON {"Texto":"Abreviatura"}.
	 *
	 * @var string
	 *
	 * @ORM\Column(name="bml_aliases", type="text", precision=0, scale=0, nullable=true, unique=false)
	 */
	private $Aliases;

	/**
	 * Patrón de URL de teselas con {z}, {x} y {y} (solo tipo 'R').
	 *
	 * @var string
	 *
	 * @ORM\Column(name="bml_raster_url", type="string", length=500, precision=0, scale=0, nullable=true, unique=false)
	 */
	private $RasterUrl;

	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="bml_raster_tms", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $RasterTms;

	/**
	 * @var integer
	 *
	 * @ORM\Column(name="bml_raster_max_native_zoom", type="integer", precision=0, scale=0, nullable=true, unique=false)
	 */
	private $RasterMaxNativeZoom;

	/**
	 * @var integer
	 *
	 * @ORM\Column(name="bml_raster_max_zoom", type="integer", precision=0, scale=0, nullable=true, unique=false)
	 */
	private $RasterMaxZoom;

	/**
	 * Opacidad de 0 a 100 (solo tipo 'R').
	 *
	 * @var integer
	 *
	 * @ORM\Column(name="bml_raster_opacity", type="integer", precision=0, scale=0, nullable=true, unique=false)
	 */
	private $RasterOpacity;

	/**
	 * Metadata propia de la capa. Opcional: en capas de indicador, si falta se usa
	 * la de la cartografía que publica el indicador.
	 *
	 * @var \helena\entities\backoffice\Metadata
	 *
	 * @Exclude
	 *
	 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
	 * @ORM\JoinColumns({
	 *   @ORM\JoinColumn(name="bml_metadata_id", referencedColumnName="met_id", nullable=true)
	 * })
	 */
	private $Metadata;

	public function getId()
	{
		return $this->Id;
	}

	public function setId($id)
	{
		$this->Id = $id;
		return $this;
	}

	public function getType()
	{
		return $this->Type;
	}

	public function setType($value)
	{
		$this->Type = $value;
		return $this;
	}

	public function getCaption()
	{
		return $this->Caption;
	}

	public function setCaption($value)
	{
		$this->Caption = $value;
		return $this;
	}

	public function getOrder()
	{
		return $this->Order;
	}

	public function setOrder($value)
	{
		$this->Order = $value;
		return $this;
	}

	public function getSeparator()
	{
		return $this->Separator;
	}

	public function setSeparator($value)
	{
		$this->Separator = $value;
		return $this;
	}

	public function getIcon()
	{
		return $this->Icon;
	}

	public function setIcon($value)
	{
		$this->Icon = $value;
		return $this;
	}

	public function getRouteTag()
	{
		return $this->RouteTag;
	}

	public function setRouteTag($value)
	{
		$this->RouteTag = $value;
		return $this;
	}

	public function getHideOnSatellite()
	{
		return $this->HideOnSatellite;
	}

	public function setHideOnSatellite($value)
	{
		$this->HideOnSatellite = $value;
		return $this;
	}

	public function getItemIds()
	{
		return $this->ItemIds;
	}

	public function setItemIds($value)
	{
		$this->ItemIds = $value;
		return $this;
	}

	public function getDynamicWidth()
	{
		return $this->DynamicWidth;
	}

	public function setDynamicWidth($value)
	{
		$this->DynamicWidth = $value;
		return $this;
	}

	public function getLineWidth()
	{
		return $this->LineWidth;
	}

	public function setLineWidth($value)
	{
		$this->LineWidth = $value;
		return $this;
	}

	public function getDashedLine()
	{
		return $this->DashedLine;
	}

	public function setDashedLine($value)
	{
		$this->DashedLine = $value;
		return $this;
	}

	public function getLabelsMode()
	{
		return $this->LabelsMode;
	}

	public function setLabelsMode($value)
	{
		$this->LabelsMode = $value;
		return $this;
	}

	public function getAliases()
	{
		return $this->Aliases;
	}

	public function setAliases($value)
	{
		$this->Aliases = $value;
		return $this;
	}

	public function getRasterUrl()
	{
		return $this->RasterUrl;
	}

	public function setRasterUrl($value)
	{
		$this->RasterUrl = $value;
		return $this;
	}

	public function getRasterTms()
	{
		return $this->RasterTms;
	}

	public function setRasterTms($value)
	{
		$this->RasterTms = $value;
		return $this;
	}

	public function getRasterMaxNativeZoom()
	{
		return $this->RasterMaxNativeZoom;
	}

	public function setRasterMaxNativeZoom($value)
	{
		$this->RasterMaxNativeZoom = $value;
		return $this;
	}

	public function getRasterMaxZoom()
	{
		return $this->RasterMaxZoom;
	}

	public function setRasterMaxZoom($value)
	{
		$this->RasterMaxZoom = $value;
		return $this;
	}

	public function getRasterOpacity()
	{
		return $this->RasterOpacity;
	}

	public function setRasterOpacity($value)
	{
		$this->RasterOpacity = $value;
		return $this;
	}

	public function getMetadata()
	{
		return $this->Metadata;
	}

	public function setMetadata(\helena\entities\backoffice\Metadata $metadata = null)
	{
		$this->Metadata = $metadata;
		return $this;
	}

	/**
	 * @VirtualProperty
	 * @SerializedName("MetadataId")
	 */
	public function getMetadataIdForDisplay()
	{
		if ($this->Metadata !== null)
		{
			return $this->Metadata->getId();
		}
		return null;
	}
}
