<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\VirtualProperty;
use \JMS\Serializer\Annotation\SerializedName;

/**
 * Geography
 *
 * @ORM\Table(name="geography", indexes={@ORM\Index(name="fk_geographies_geographies1_idx", columns={"geo_parent_id"}), @ORM\Index(name="fk_cartography_clipping_region_item1", columns={"geo_country_id"}), @ORM\Index(name="geography_ibfk_1", columns={"geo_metadata_id"})})
 * @ORM\Entity
 */
class Geography
{
    // Propiedades no almacenadas en la base de datos
    public $Level;
    public $ChildCount = 0;

    /**
     * @var integer
     *
     * @ORM\Column(name="geo_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="geo_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="geo_caption_short", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $CaptionShort;

    /**
     * @var string
     *
     * @ORM\Column(name="geo_root_caption", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
     */
    private $RootCaption;

    /**
     * @var string
     *
     * @ORM\Column(name="geo_revision", type="string", length=10, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Revision;

    /**
     * @var float
     *
     * @ORM\Column(name="geo_area_avg_m2", type="float", precision=10, scale=0, nullable=false, unique=false)
     */
    private $AreaAvgM2;

    /**
     * @var integer
     *
     * @ORM\Column(name="geo_max_zoom", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $MaxZoom;

    /**
     * @var integer
     *
     * @ORM\Column(name="geo_min_zoom", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $MinZoom;

    /**
     * @var string
     *
     * @ORM\Column(name="geo_field_code_name", type="string", length=50, precision=0, scale=0, nullable=false, unique=false)
     */
    private $FieldCodeName;

    /**
		 * @var integer
		 *
		 * @ORM\Column(name="geo_field_code_size", type="integer", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $FieldCodeSize;

    /**
     * @var string
     *
     * @ORM\Column(name="geo_field_caption_name", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $FieldCaptionName;

    /**
     * @var string
     *
     * @ORM\Column(name="geo_field_urbanity_name", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $FieldUrbanityName;

    /**
     * @var boolean
     *
     * @ORM\Column(name="geo_use_for_clipping", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $UseForClipping;

		 /**
     * @var boolean
     *
     * @ORM\Column(name="geo_is_tracking_level", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsTrackingLevel;

		/**
     * @var float
     *
     * @ORM\Column(name="geo_gradient_luminance", type="float", precision=0, scale=0, nullable=true, unique=false)
     */
    private $GradientLuminance;

    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="geo_parent_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $Parent;

    /**
     * @var \helena\entities\backoffice\ClippingRegionItem
     * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegionItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="geo_country_id", referencedColumnName="cli_id", nullable=false)
     * })
     */
    private $Country;

    /**
     * @var \helena\entities\backoffice\Gradient
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Gradient")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="geo_gradient_id", referencedColumnName="grd_id", nullable=true)
     * })
     */
    private $Gradient;

    /**
     * @var \helena\entities\backoffice\Metadata
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="geo_metadata_id", referencedColumnName="met_id", nullable=true)
     * })
     */
    private $Metadata;


    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->Id;
    }


		/**
     * Set id
     *
     * @param integer $id
     *
     * @return Geography
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return Geography
     */
    public function setCaption($caption)
    {
        $this->Caption = $caption;

        return $this;
    }

    /**
     * Get caption
     *
     * @return string
     */
    public function getCaption()
    {
        return $this->Caption;
    }

    /**
     * Set captionShort
     *
     * @param string $captionShort
     *
     * @return Geography
     */
    public function setCaptionShort($captionShort)
    {
        $this->CaptionShort = $captionShort;

        return $this;
    }

    /**
     * Get captionShort
     *
     * @return string
     */
    public function getCaptionShort()
    {
        return $this->CaptionShort;
    }

    /**
     * Set rootCaption
     *
     * @param string $rootCaption
     *
     * @return Geography
     */
    public function setRootCaption($rootCaption)
    {
        $this->RootCaption = $rootCaption;

        return $this;
    }

    /**
     * Get rootCaption
     *
     * @return string
     */
    public function getRootCaption()
    {
        return $this->RootCaption;
    }

    /**
     * Set revision
     *
     * @param string $revision
     *
     * @return Geography
     */
    public function setRevision($revision)
    {
        $this->Revision = $revision;

        return $this;
    }

    /**
     * Get revision
     *
     * @return string
     */
    public function getRevision()
    {
        return $this->Revision;
    }

    /**
     * Set areaAvgM2
     *
     * @param float $areaAvgM2
     *
     * @return Geography
     */
    public function setAreaAvgM2($areaAvgM2)
    {
        $this->AreaAvgM2 = $areaAvgM2;

        return $this;
    }

    /**
     * Get areaAvgM2
     *
     * @return float
     */
    public function getAreaAvgM2()
    {
        return $this->AreaAvgM2;
    }

    /**
     * Set maxZoom
     *
     * @param integer $maxZoom
     *
     * @return Geography
     */
    public function setMaxZoom($maxZoom)
    {
        $this->MaxZoom = $maxZoom;

        return $this;
    }

    /**
     * Get maxZoom
     *
     * @return integer
     */
    public function getMaxZoom()
    {
        return $this->MaxZoom;
    }

    /**
     * Set minZoom
     *
     * @param integer $minZoom
     *
     * @return Geography
     */
    public function setMinZoom($minZoom)
    {
        $this->MinZoom = $minZoom;

        return $this;
    }

    /**
     * Get minZoom
     *
     * @return integer
     */
    public function getMinZoom()
    {
        return $this->MinZoom;
    }

    /**
     * Set fieldCodeName
     *
     * @param string $fieldCodeName
     *
     * @return Geography
     */
    public function setFieldCodeName($fieldCodeName)
    {
        $this->FieldCodeName = $fieldCodeName;

        return $this;
    }

    /**
     * Get fieldCodeName
     *
     * @return string
     */
    public function getFieldCodeName()
    {
        return $this->FieldCodeName;
    }

		/**
		 * Set fieldCodeSize
		 *
	 * @param integer $fieldCodeSize
		 *
		 * @return Geography
		 */
    public function setFieldCodeSize($fieldCodeSize)
    {
			$this->FieldCodeSize = $fieldCodeSize;

			return $this;
    }

    /**
		 * Get fieldCodeSize
		 *
		 * @return integer
		 */
    public function getFieldCodeSize()
    {
			return $this->FieldCodeSize;
    }

    /**
     * Set fieldCaptionName
     *
     * @param string $fieldCaptionName
     *
     * @return Geography
     */
    public function setFieldCaptionName($fieldCaptionName)
    {
        $this->FieldCaptionName = $fieldCaptionName;

        return $this;
    }

    /**
     * Get fieldCaptionName
     *
     * @return string
     */
    public function getFieldCaptionName()
    {
        return $this->FieldCaptionName;
    }

    /**
     * Set fieldUrbanityName
     *
     * @param string $fieldUrbanityName
     *
     * @return Geography
     */
    public function setFieldUrbanityName($fieldUrbanityName)
    {
        $this->FieldUrbanityName = $fieldUrbanityName;

        return $this;
    }

    /**
     * Get fieldUrbanityName
     *
     * @return string
     */
    public function getFieldUrbanityName()
    {
        return $this->FieldUrbanityName;
    }

    /**
     * Set isTrackingLevel
     *
     * @param boolean $isTrackingLevel
     *
     * @return Geography
     */
    public function setIsTrackingLevel($isTrackingLevel)
    {
        $this->IsTrackingLevel = $isTrackingLevel;

        return $this;
    }

    /**
     * Get isTrackingLevel
     *
     * @return boolean
     */
    public function getIsTrackingLevel()
    {
        return $this->IsTrackingLevel;
    }

    /**
     * Set useForClipping
     *
     * @param boolean $useForClipping
     *
     * @return Geography
     */
    public function setUseForClipping($useForClipping)
    {
        $this->UseForClipping = $useForClipping;

        return $this;
    }

    /**
     * Get useForClipping
     *
     * @return boolean
     */
    public function getUseForClipping()
    {
        return $this->UseForClipping;
    }


    /**
     * Set gradientLuminance
     *
     * @param float $gradientLuminance
     *
     * @return Geography
     */
    public function setGradientLuminance($gradientLuminance)
    {
        $this->GradientLuminance = $gradientLuminance;

        return $this;
    }

    /**
     * Get gradientLuminance
     *
     * @return float
     */
    public function getGradientLuminance()
    {
        return $this->GradientLuminance;
    }

    /**
     * Set parent
     *
     * @param \helena\entities\backoffice\Geography $parent
     *
     * @return Geography
     */
    public function setParent(\helena\entities\backoffice\Geography $parent = null)
    {
        $this->Parent = $parent;

        return $this;
    }

    /**
     * Get parent
     *
     * @return \helena\entities\backoffice\Geography
     */
    public function getParent()
    {
        return $this->Parent;
    }


    /**
     * Set gradient
     *
     * @param \helena\entities\backoffice\Gradient $gradient
     *
     * @return Geography
     */
    public function setGradient(\helena\entities\backoffice\Gradient $gradient = null)
    {
        $this->Gradient = $gradient;

        return $this;
    }

    /**
     * Get gradient
     *
     * @return \helena\entities\backoffice\Gradient
     */
    public function getGradient()
    {
        return $this->Gradient;
    }

    // Propiedades calculadas, solo para la serialización (no hay setters:
    // Parent/Gradient son las relaciones reales, ver más arriba). Otros
    // puntos del sistema por fuera de 'packs' todavía esperan ParentId y
    // GradientId como enteros sueltos: esto evita romper esos consumidores
    // sin tener que acordarse de poblarlos a mano en cada servicio que
    // toque una Geography.
    /**
     * @VirtualProperty
     * @SerializedName("ParentId")
     */
    public function getParentIdForCompatibility()
    {
        if ($this->Parent !== null)
        {
            return $this->Parent->getId();
        }
        return null;
    }

    /**
     * @VirtualProperty
     * @SerializedName("GradientId")
     */
    public function getGradientIdForCompatibility()
    {
        if ($this->Gradient !== null)
        {
            return $this->Gradient->getId();
        }
        return null;
    }

    /**
     * Set country
     *
     * @param \helena\entities\backoffice\ClippingRegionItem $country
     *
     * @return Geography
     */
    public function setCountry(\helena\entities\backoffice\ClippingRegionItem $country = null)
    {
        $this->Country = $country;

        return $this;
    }

    /**
     * Get country
     *
     * @return \helena\entities\backoffice\ClippingRegionItem
     */
    public function getCountry()
    {
        return $this->Country;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return Geography
     */
    public function setMetadata(\helena\entities\backoffice\Metadata $metadata = null)
    {
        $this->Metadata = $metadata;

        return $this;
    }

    /**
     * Get metadata
     *
     * @return \helena\entities\backoffice\Metadata
     */
    public function getMetadata()
    {
        return $this->Metadata;
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

