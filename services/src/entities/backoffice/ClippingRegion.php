<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * ClippingRegion
 *
 * @ORM\Table(name="clipping_region", indexes={@ORM\Index(name="fk_geographies_geographies1_idx", columns={"clr_parent_id"}), @ORM\Index(name="fk_clipping_region_clipping_region_item1", columns={"clr_country_id"}), @ORM\Index(name="clipping_region_ibfk_1", columns={"clr_metadata_id"})})
 * @ORM\Entity
 */
class ClippingRegion
{
		// Propiedades no almacenada en la base de datos
		public $Level;
		public $ChildCount = 0;
    /**
     * @var integer
     *
     * @ORM\Column(name="clr_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="clr_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="clr_symbol", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Symbol;

    /**
     * @var integer
     *
     * @ORM\Column(name="clr_priority", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Priority;

    /**
     * @var string
     *
     * @ORM\Column(name="clr_field_code_name", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $FieldCodeName;

    /**
     * @var boolean
     *
     * @ORM\Column(name="clr_no_autocomplete", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $NoAutocomplete;
		    /**
     * @var boolean
     *
     * @ORM\Column(name="clr_index_code", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IndexCode;

    /**
     * @var boolean
     *
     * @ORM\Column(name="clr_is_crawler_indexer", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsCrawlerIndexer;

    /**
     * @var integer
     *
     * @ORM\Column(name="clr_labels_min_zoom", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $LabelsMinZoom;

    /**
     * @var integer
     *
     * @ORM\Column(name="clr_labels_max_zoom", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $LabelsMaxZoom;

    /**
     * @var \helena\entities\backoffice\Metadata
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="clr_metadata_id", referencedColumnName="met_id", nullable=true)
     * })
     */
    private $Metadata;

    /**
     * @var \helena\entities\backoffice\ClippingRegionItem
		 * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegionItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="clr_country_id", referencedColumnName="cli_id", nullable=true)
     * })
     */
    private $Country;

    /**
     * @var \helena\entities\backoffice\ClippingRegion
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegion")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="clr_parent_id", referencedColumnName="clr_id", nullable=true)
     * })
     */
    private $Parent;


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
     * @return ClippingRegion
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
     * @return ClippingRegion
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
     * Set symbol
     *
     * @param string $symbol
     *
     * @return ClippingRegion
     */
    public function setSymbol($symbol)
    {
        $this->Symbol = $symbol;

        return $this;
    }

    /**
     * Get symbol
     *
     * @return string
     */
    public function getSymbol()
    {
        return $this->Symbol;
    }

    /**
     * Set priority
     *
     * @param integer $priority
     *
     * @return ClippingRegion
     */
    public function setPriority($priority)
    {
        $this->Priority = $priority;

        return $this;
    }

    /**
     * Get priority
     *
     * @return integer
     */
    public function getPriority()
    {
        return $this->Priority;
    }

    /**
     * Set fieldCodeName
     *
     * @param string $fieldCodeName
     *
     * @return ClippingRegion
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
     * Set isCrawlerIndexer
     *
     * @param boolean $isCrawlerIndexer
     *
     * @return ClippingRegion
     */
    public function setIsCrawlerIndexer($isCrawlerIndexer)
    {
        $this->IsCrawlerIndexer = $isCrawlerIndexer;

        return $this;
    }

    /**
     * Get isCrawlerIndexer
     *
     * @return boolean
     */
    public function getIsCrawlerIndexer()
    {
        return $this->IsCrawlerIndexer;
    }

    /**
     * Set noAutocomplete
     *
     * @param boolean $noAutocomplete
     *
     * @return ClippingRegion
     */
    public function setNoAutocomplete($noAutocomplete)
    {
        $this->NoAutocomplete = $noAutocomplete;

        return $this;
    }

    /**
     * Get noAutocomplete
     *
     * @return boolean
     */
    public function getNoAutocomplete()
    {
        return $this->NoAutocomplete;
    }


    /**
     * Set indexCode
     *
     * @param boolean $indexCode
     *
     * @return ClippingRegion
     */
    public function setIndexCode($indexCode)
    {
        $this->IndexCode = $indexCode;

        return $this;
    }

    /**
     * Get indexCode
     *
     * @return boolean
     */
    public function getIndexCode()
    {
        return $this->IndexCode;
    }

    /**
     * Set labelsMinZoom
     *
     * @param integer $labelsMinZoom
     *
     * @return ClippingRegion
     */
    public function setLabelsMinZoom($labelsMinZoom)
    {
        $this->LabelsMinZoom = $labelsMinZoom;

        return $this;
    }

    /**
     * Get labelsMinZoom
     *
     * @return integer
     */
    public function getLabelsMinZoom()
    {
        return $this->LabelsMinZoom;
    }

    /**
     * Set labelsMaxZoom
     *
     * @param int $labelsMaxZoom
     *
     * @return ClippingRegion
     */
    public function setLabelsMaxZoom($labelsMaxZoom)
    {
        $this->LabelsMaxZoom = $labelsMaxZoom;

        return $this;
    }

    /**
     * Get labelsMaxZoom
     *
     * @return int
     */
    public function getLabelsMaxZoom()
    {
        return $this->LabelsMaxZoom;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return ClippingRegion
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
     * Set country
     *
     * @param \helena\entities\backoffice\ClippingRegionItem $country
     *
     * @return ClippingRegion
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
     * Set parent
     *
     * @param \helena\entities\backoffice\ClippingRegion $parent
     *
     * @return ClippingRegion
     */
    public function setParent(\helena\entities\backoffice\ClippingRegion $parent = null)
    {
        $this->Parent = $parent;

        return $this;
    }

    /**
     * Get parent
     *
     * @return \helena\entities\backoffice\ClippingRegion
     */
    public function getParent()
    {
        return $this->Parent;
    }
}

