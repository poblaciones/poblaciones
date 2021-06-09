<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * Geography
 *
 * @ORM\Table(name="geography", indexes={@ORM\Index(name="fk_geographies_geographies1_idx", columns={"geo_parent_id"}), @ORM\Index(name="fk_cartography_clipping_region_item1", columns={"geo_country_id"}), @ORM\Index(name="geography_ibfk_1", columns={"geo_metadata_id"})})
 * @ORM\Entity
 */
class Geography
{
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
     * @ORM\Column(name="geo_root_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
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
     * @ORM\Column(name="geo_field_code_type", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $FieldCodeType;

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
     * @var string
     *
     * @ORM\Column(name="geo_partial_coverage", type="string", length=500, precision=0, scale=0, nullable=true, unique=false)
     */
    private $PartialCoverage;

    /**
		 * @var integer
		 *
		 * @ORM\Column(name="geo_parent_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ParentId;

    /**
     * @var \helena\entities\backoffice\ClippingRegionItem
     * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegionItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="geo_country_id", referencedColumnName="cli_id", nullable=true)
     * })
     */
    private $Country;

    /**
     * @var integer
		 *
		 * @ORM\Column(name="geo_gradient_id", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $GradientId;

    /**
     * @var \helena\entities\backoffice\Metadata
     * @Exclude
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
     * Set fieldCodeType
     *
     * @param string $fieldCodeType
     *
     * @return Geography
     */
    public function setFieldCodeType($fieldCodeType)
    {
        $this->FieldCodeType = $fieldCodeType;

        return $this;
    }

    /**
     * Get fieldCodeType
     *
     * @return string
     */
    public function getFieldCodeType()
    {
        return $this->FieldCodeType;
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
     * Set partialCoverage
     *
     * @param string $partialCoverage
     *
     * @return Geography
     */
    public function setPartialCoverage($partialCoverage)
    {
        $this->PartialCoverage = $partialCoverage;

        return $this;
    }

    /**
     * Get partialCoverage
     *
     * @return string
     */
    public function getPartialCoverage()
    {
        return $this->PartialCoverage;
    }

    /**
     * Set parentId
     *
     * @param integer $parentId
     *
     * @return Geography
     */
    public function setParent($parentId)
    {
        $this->ParentId = $parentId;

        return $this;
    }

    /**
     * Get parentId
     *
     * @return integer
     */
    public function getParentId()
    {
        return $this->ParentId;
    }


    /**
     * Set gradientId
     *
     * @param integer $gradientId
     *
     * @return Geography
     */
    public function setGradient($gradientId)
    {
        $this->GradientId = $gradientId;

        return $this;
    }

    /**
     * Get gradientId
     *
     * @return integer
     */
    public function getGradientId()
    {
        return $this->GradientId;
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
}

