<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\MaxDepth;
use JMS\Serializer\Annotation\ExclusionPolicy;
use JMS\Serializer\Annotation\Exclude;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * DraftDataset
 *
 * @ORM\Table(name="draft_dataset", indexes={@ORM\Index(name="draft_fk_datasets_methodology1_idx", columns={"dat_work_id"}), @ORM\Index(name="draft_fk_datasets_datasets_columns1_idx", columns={"dat_geography_item_column_id"}), @ORM\Index(name="draft_fk_datasets_geographies1_idx", columns={"dat_geography_id"}), @ORM\Index(name="draft_dat_latitude_column_id", columns={"dat_latitude_column_id"}), @ORM\Index(name="draft_dat_longitude_column_id", columns={"dat_longitude_column_id"}), @ORM\Index(name="draft_fk_datasets_datasets_columns1x", columns={"dat_caption_column_id"})})
 * @ORM\Entity
 */
class DraftDataset
{
    /**
     * @var integer
		 *
     * @ORM\Column(name="dat_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
 		 * @ClientReadonly
     * @ORM\Column(name="dat_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Type;

    /**
     * @var string
     *
     * @ORM\Column(name="dat_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="dat_symbol", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Symbol;

    /**
     * @var string
     *
     * @ORM\Column(name="dat_multilevel_matrix", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $MultilevelMatrix;

    /**
     * @var string
 		 * @ClientReadonly
     *
     * @ORM\Column(name="dat_table", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
		 */
    private $Table;

    /**
     * @var string
     * @ClientReadonly
		 *
     * @ORM\Column(name="dat_georeference_attributes", type="string", length=250, precision=0, scale=0, nullable=true, unique=false)
     */
    private $GeoreferenceAttributes;

    /**
     * @var boolean
     *
     * @ORM\Column(name="dat_exportable", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Exportable;

		/**
     * @var integer
     *
     * @ORM\Column(name="dat_georeference_status", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeoreferenceStatus;

    /**
     * @var boolean
		 *
		 * @ClientReadonly
		 *
     * @ORM\Column(name="dat_geocoded", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Geocoded;

    /**
     * @var \helena\entities\backoffice\DraftDatasetColumn
 		 *
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_latitude_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $LatitudeColumn;

    /**
     * @var \helena\entities\backoffice\DraftDatasetColumn
     *
	   *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_longitude_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $LongitudeColumn;


    /**
     * @var \helena\entities\backoffice\DraftDatasetColumn
     *
	   *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_images_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $ImagesColumn;

    /**
     * @var \helena\entities\backoffice\DraftDatasetColumn
 *
         *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_geography_item_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $GeographyItemColumn;

    /**
     * @var \helena\entities\backoffice\DraftDatasetColumn
     *
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
	 *   @ORM\JoinColumn(name="dat_caption_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $CaptionColumn;

    /**
     * @var \helena\entities\backoffice\Geography
     *
		 * @ClientReadonly
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_geography_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $Geography;

    /**
     * @var \helena\entities\backoffice\DraftWork
     *
     * @Exclude
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_work_id", referencedColumnName="wrk_id", nullable=true)
     * })
     */
    private $Work;

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
     * @return DraftDataset
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set type
     *
     * @param string $type
     *
     * @return DraftDataset
     */
    public function setType($type)
    {
        $this->Type = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return string
     */
    public function getType()
    {
        return $this->Type;
    }


    /**
     * Set multilevelMatrix
     *
     * @param string $multilevelMatrix
     *
     * @return DraftDataset
     */
    public function setMultilevelMatrix($multilevelMatrix)
    {
        $this->MultilevelMatrix = $multilevelMatrix;

        return $this;
    }

    /**
     * Get multilevelMatrix
     *
     * @return string
     */
    public function getMultilevelMatrix()
    {
        return $this->MultilevelMatrix;
    }

		/**
     * Set GeoreferenceAttributes
     *
     * @param string $GeoreferenceAttributes
     *
     * @return DraftDataset
     */
    public function setGeoreferenceAttributes($GeoreferenceAttributes)
    {
        $this->GeoreferenceAttributes = $GeoreferenceAttributes;

        return $this;
    }

    /**
     * Get GeoreferenceAttributes
     *
     * @return string
     */
    public function getGeoreferenceAttributes()
    {
        return $this->GeoreferenceAttributes;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return DraftDataset
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
     * Set GeoreferenceStatus
     *
     * @param integer $GeoreferenceStatus
     *
     * @return DraftDataset
     */
    public function setGeoreferenceStatus($GeoreferenceStatus)
    {
        $this->GeoreferenceStatus = $GeoreferenceStatus;

        return $this;
    }

    /**
     * Get GeoreferenceStatus
     *
     * @return integer
     */
    public function getGeoreferenceStatus()
    {
        return $this->GeoreferenceStatus;
    }

    /**
     * Set symbol
     *
     * @param string $symbol
     *
     * @return DraftDataset
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
     * Set table
     *
     * @param string $table
     *
     * @return DraftDataset
     */
    public function setTable($table)
    {
        $this->Table = $table;

        return $this;
    }

    /**
     * Get table
     *
     * @return string
     */
    public function getTable()
    {
        return $this->Table;
    }

    /**
     * Set exportable
     *
     * @param boolean $exportable
     *
     * @return DraftDataset
     */
    public function setExportable($exportable)
    {
        $this->Exportable = $exportable;

        return $this;
    }

    /**
     * Get exportable
     *
     * @return boolean
     */
    public function getExportable()
    {
        return $this->Exportable;
    }

    /**
     * Set geocoded
     *
     * @param boolean $geocoded
     *
     * @return DraftDataset
     */
    public function setGeocoded($geocoded)
    {
        $this->Geocoded = $geocoded;

        return $this;
    }

    /**
     * Get geocoded
     *
     * @return boolean
     */
    public function getGeocoded()
    {
        return $this->Geocoded;
    }

    /**
     * Set imagesColumn
     *
     * @param \helena\entities\backoffice\DraftDatasetColumn $imagesColumn
     *
     * @return DraftDataset
     */
    public function setImagesColumn(\helena\entities\backoffice\DraftDatasetColumn $imagesColumn = null)
    {
        $this->ImagesColumn = $imagesColumn;

        return $this;
    }

    /**
     * Get imagesColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getImagesColumn()
    {
        return $this->ImagesColumn;
    }
    /**
     * Set latitudeColumn
     *
     * @param \helena\entities\backoffice\DraftDatasetColumn $latitudeColumn
     *
     * @return DraftDataset
     */
    public function setLatitudeColumn(\helena\entities\backoffice\DraftDatasetColumn $latitudeColumn = null)
    {
        $this->LatitudeColumn = $latitudeColumn;

        return $this;
    }

    /**
     * Get latitudeColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getLatitudeColumn()
    {
        return $this->LatitudeColumn;
    }

    /**
     * Set longitudeColumn
     *
     * @param \helena\entities\backoffice\DraftDatasetColumn $longitudeColumn
     *
     * @return DraftDataset
     */
    public function setLongitudeColumn(\helena\entities\backoffice\DraftDatasetColumn $longitudeColumn = null)
    {
        $this->LongitudeColumn = $longitudeColumn;

        return $this;
    }

    /**
     * Get longitudeColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getLongitudeColumn()
    {
        return $this->LongitudeColumn;
    }

    /**
     * Set geographyItemColumn
     *
     * @param \helena\entities\backoffice\DraftDatasetColumn $geographyItemColumn
     *
     * @return DraftDataset
     */
    public function setGeographyItemColumn(\helena\entities\backoffice\DraftDatasetColumn $geographyItemColumn = null)
    {
        $this->GeographyItemColumn = $geographyItemColumn;

        return $this;
    }

    /**
     * Get geographyItemColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getGeographyItemColumn()
    {
        return $this->GeographyItemColumn;
    }

    /**
     * Set captionColumn
     *
     * @param \helena\entities\backoffice\DraftDatasetColumn $captionColumn
     *
     * @return DraftDataset
     */
    public function setCaptionColumn(\helena\entities\backoffice\DraftDatasetColumn $captionColumn = null)
    {
        $this->CaptionColumn = $captionColumn;

        return $this;
    }

    /**
     * Get captionColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getCaptionColumn()
    {
        return $this->CaptionColumn;
    }

    /**
     * Set geography
     *
     * @param \helena\entities\backoffice\Geography $geography
     *
     * @return DraftDataset
     */
    public function setGeography(\helena\entities\backoffice\Geography $geography = null)
    {
        $this->Geography = $geography;

        return $this;
    }

    /**
     * Get geography
     *
     * @return \helena\entities\backoffice\Geography
     */
    public function getGeography()
    {
        return $this->Geography;
    }

    /**
     * Set work
     *
     * @param \helena\entities\backoffice\DraftWork $work
     *
     * @return DraftDataset
     */
    public function setWork(\helena\entities\backoffice\DraftWork $work = null)
    {
        $this->Work = $work;

        return $this;
    }

    /**
     * Get work
     *
     * @return \helena\entities\backoffice\DraftWork
     */
    public function getWork()
    {
        return $this->Work;
    }

}

