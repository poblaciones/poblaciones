<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * Dataset
 *
 * @ORM\Table(name="dataset", indexes={@ORM\Index(name="fk_datasets_methodology1_idx", columns={"dat_work_id"}), @ORM\Index(name="fk_datasets_datasets_columns1_idx", columns={"dat_geography_item_column_id"}), @ORM\Index(name="fk_datasets_geographies1_idx", columns={"dat_geography_id"}), @ORM\Index(name="dat_latitude_column_id", columns={"dat_latitude_column_id"}), @ORM\Index(name="dat_longitude_column_id", columns={"dat_longitude_column_id"}),@ORM\Index(name="fk_datasets_datasets_columns1x", columns={"dat_caption_column_id"})})
 * @ORM\Entity
 */
class Dataset
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
     * @ORM\Column(name="dat_table", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Table;

    /**
     * @var boolean
     *
     * @ORM\Column(name="dat_exportable", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Exportable;

    /**
     * @var string
     *
     * @ORM\Column(name="dat_multilevel_matrix", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $MultilevelMatrix;

    /**
     * @var boolean
     *
     * @ORM\Column(name="dat_geocoded", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Geocoded;


		/**
     * @var boolean
		 *
     * @ORM\Column(name="dat_partition_mandatory", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $PartitionMandatory;


    /**
     * @var string
     *
     * @ORM\Column(name="dat_partition_all_label", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $PartitionAllLabel;


		/**
     * @var boolean
		 *
		 * @ClientReadonly
		 *
     * @ORM\Column(name="dat_are_segments", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $AreSegments;

    /**
     * @var boolean
		 *
     * @ORM\Column(name="dat_public_labels", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $PublicLabels;

		/**
     * @var boolean
		 *
     * @ORM\Column(name="dat_show_info", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowInfo;

    /**
     * @var boolean
     *
     * @ORM\Column(name="dat_skip_empty_fields", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $SkipEmptyFields;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_images_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $ImagesColumn;

		/**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_partition_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $PartitionColumn;


    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ClientReadonly
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_latitude_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $LatitudeColumn;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
		 * @ClientReadonly
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_longitude_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $LongitudeColumn;


    /**
     * @var \helena\entities\backoffice\DatasetColumn
 		 *
 		 * @ClientReadonly
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_latitude_column_segment_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $LatitudeColumnSegment;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
	   * @ClientReadonly
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_longitude_column_segment_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $LongitudeColumnSegment;


    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_geography_item_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $GeographyItemColumn;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_caption_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $CaptionColumn;

		 /**
     * @var integer
		 *
     * @ORM\Column(name="dat_texture_id", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $TextureId;


    /**
     * @var \helena\entities\backoffice\DatasetMarker
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetMarker", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_marker_id", referencedColumnName="dmk_id", nullable=false)
     * })
     */
    private $Marker;

    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_geography_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $Geography;

		    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dat_geography_segment_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $GeographySegment;

    /**
     * @var \helena\entities\backoffice\Work
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Work")
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
     * @return Dataset
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }


    /**
     * Get textureId
     *
     * @return integer
     */
    public function getTextureId()
    {
        return $this->TextureId;
    }

		/**
     * Set textureId
     *
     * @param integer $textureId
     *
     * @return Dataset
     */
    public function setTextureId($textureId)
    {
        $this->TextureId = $textureId;

        return $this;
    }

    /**
     * Set type
     *
     * @param string $type
     *
     * @return Dataset
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
     * Set partitionAllLabel
     *
     * @param string $partitionAllLabel
     *
     * @return Dataset
     */
    public function setPartitionAllLabel($partitionAllLabel)
    {
        $this->PartitionAllLabel = $partitionAllLabel;

        return $this;
    }

    /**
     * Get partitionAllLabel
     *
     * @return string
     */
    public function getPartitionAllLabel()
    {
        return $this->PartitionAllLabel;
    }

    /**
     * Set multilevelMatrix
     *
     * @param string $multilevelMatrix
     *
     * @return Dataset
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
     * Set caption
     *
     * @param string $caption
     *
     * @return Dataset
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
     * Set table
     *
     * @param string $table
     *
     * @return Dataset
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
     * @return Dataset
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
     * Set SkipEmptyFields
     *
     * @param boolean $SkipEmptyFields
     *
     * @return Dataset
     */
    public function setSkipEmptyFields($SkipEmptyFields)
    {
        $this->SkipEmptyFields = $SkipEmptyFields;

        return $this;
    }

    /**
     * Get SkipEmptyFields
     *
     * @return boolean
     */
    public function getSkipEmptyFields()
    {
        return $this->SkipEmptyFields;
    }



    /**
     * Set ShowInfo
     *
     * @param boolean $ShowInfo
     *
     * @return Dataset
     */
    public function setShowInfo($ShowInfo)
    {
        $this->ShowInfo = $ShowInfo;

        return $this;
    }

    /**
     * Get ShowInfo
     *
     * @return boolean
     */
    public function getShowInfo()
    {
        return $this->ShowInfo;
    }


    /**
     * Set publicLabels
     *
     * @param boolean $publicLabels
     *
     * @return Dataset
     */
    public function setPublicLabels($publicLabels)
    {
        $this->PublicLabels = $publicLabels;

        return $this;
    }

    /**
     * Get publicLabels
     *
     * @return boolean
     */
    public function getPublicLabels()
    {
        return $this->PublicLabels;
    }

    /**
     * Set geocoded
     *
     * @param boolean $geocoded
     *
     * @return Dataset
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
     * Set partitionMandatory
     *
     * @param boolean $partitionMandatory
     *
     * @return Dataset
     */
    public function setPartitionMandatory($partitionMandatory)
    {
        $this->PartitionMandatory = $partitionMandatory;

        return $this;
    }

    /**
     * Get partitionMandatory
     *
     * @return boolean
     */
    public function getPartitionMandatory()
    {
        return $this->PartitionMandatory;
    }

    /**
     * Set areSegments
     *
     * @param boolean $areSegments
     *
     * @return Dataset
     */
    public function setAreSegments($areSegments)
    {
        $this->AreSegments = $areSegments;

        return $this;
    }

    /**
     * Get areSegments
     *
     * @return boolean
     */
    public function getAreSegments()
    {
        return $this->AreSegments;
    }

    /**
     * Set imagesColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $imagesColumn
     *
     * @return Dataset
     */
    public function setImagesColumn(\helena\entities\backoffice\DatasetColumn $imagesColumn = null)
    {
        $this->ImagesColumn = $imagesColumn;

        return $this;
    }

    /**
     * Get imagesColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getImagesColumn()
    {
        return $this->ImagesColumn;
    }


    /**
     * Set partitionColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $partitionColumn
     *
     * @return Dataset
     */
    public function setPartitionColumn(\helena\entities\backoffice\DatasetColumn $partitionColumn = null)
    {
        $this->PartitionColumn = $partitionColumn;

        return $this;
    }

    /**
     * Get partitionColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getPartitionColumn()
    {
        return $this->PartitionColumn;
    }

    /**
     * Set marker
     *
     * @param \helena\entities\backoffice\DatasetMarker $marker
     *
     * @return Dataset
     */
    public function setMarker(\helena\entities\backoffice\DatasetMarker $marker = null)
    {
        $this->Marker = $marker;

        return $this;
    }

    /**
     * Get marker
     *
     * @return \helena\entities\backoffice\DatasetMarker
     */
    public function getMarker()
    {
        return $this->Marker;
    }

    /**
     * Set latitudeColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $latitudeColumn
     *
     * @return Dataset
     */
    public function setLatitudeColumn(\helena\entities\backoffice\DatasetColumn $latitudeColumn = null)
    {
        $this->LatitudeColumn = $latitudeColumn;

        return $this;
    }

    /**
     * Get latitudeColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getLatitudeColumn()
    {
        return $this->LatitudeColumn;
    }

    /**
     * Set longitudeColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $longitudeColumn
     *
     * @return Dataset
     */
    public function setLongitudeColumn(\helena\entities\backoffice\DatasetColumn $longitudeColumn = null)
    {
        $this->LongitudeColumn = $longitudeColumn;

        return $this;
    }

    /**
     * Get longitudeColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getLongitudeColumn()
    {
        return $this->LongitudeColumn;
    }


    /**
     * Set latitudeColumnSegment
     *
     * @param \helena\entities\backoffice\DatasetColumn $latitudeColumnSegment
     *
     * @return Dataset
     */
    public function setLatitudeColumnSegment(\helena\entities\backoffice\DatasetColumn $latitudeColumnSegment = null)
    {
        $this->LatitudeColumnSegment = $latitudeColumnSegment;

        return $this;
    }

    /**
     * Get latitudeColumnSegment
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getLatitudeColumnSegment()
    {
        return $this->LatitudeColumnSegment;
    }

    /**
     * Set longitudeColumnSegment
     *
     * @param \helena\entities\backoffice\DatasetColumn $longitudeColumnSegment
     *
     * @return Dataset
     */
    public function setLongitudeColumnSegment(\helena\entities\backoffice\DatasetColumn $longitudeColumnSegment = null)
    {
        $this->LongitudeColumnSegment = $longitudeColumnSegment;

        return $this;
    }

    /**
     * Get longitudeColumnSegment
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getLongitudeColumnSegment()
    {
        return $this->LongitudeColumnSegment;
    }

    /**
     * Set geographyItemColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $geographyItemColumn
     *
     * @return Dataset
     */
    public function setGeographyItemColumn(\helena\entities\backoffice\DatasetColumn $geographyItemColumn = null)
    {
        $this->GeographyItemColumn = $geographyItemColumn;

        return $this;
    }

    /**
     * Get geographyItemColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getGeographyItemColumn()
    {
        return $this->GeographyItemColumn;
    }

    /**
     * Set captionColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $captionColumn
     *
     * @return Dataset
     */
    public function setCaptionColumn(\helena\entities\backoffice\DatasetColumn $captionColumn = null)
    {
        $this->CaptionColumn = $captionColumn;

        return $this;
    }

    /**
     * Get captionColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
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
     * @return Dataset
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
     * Set geography
     *
     * @param \helena\entities\backoffice\Geography $geography
     *
     * @return Dataset
     */
    public function setGeographySegment(\helena\entities\backoffice\Geography $geography = null)
    {
        $this->GeographySegment = $geography;

        return $this;
    }

    /**
     * Get geography
     *
     * @return \helena\entities\backoffice\Geography
     */
    public function getGeographySegment()
    {
        return $this->GeographySegment;
    }

    /**
     * Set work
     *
     * @param \helena\entities\backoffice\Work $work
     *
     * @return Dataset
     */
    public function setWork(\helena\entities\backoffice\Work $work = null)
    {
        $this->Work = $work;

        return $this;
    }

    /**
     * Get work
     *
     * @return \helena\entities\backoffice\Work
     */
    public function getWork()
    {
        return $this->Work;
    }
}

