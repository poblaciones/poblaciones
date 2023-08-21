<?php

namespace helena\entities\backoffice;

use helena\db\backoffice\annotations\ClientReadonly;

use Doctrine\ORM\Mapping as ORM;
/**
 * DraftWork
 *
 * @ORM\Table(name="draft_work", indexes={@ORM\Index(name="draft_fk_work_file1_idx", columns={"wrk_image_id"}), @ORM\Index(name="draft_wk_type", columns={"wrk_type"}), @ORM\Index(name="draft_wrk_type", columns={"wrk_type"}), @ORM\Index(name="draft_work_ibfk_1", columns={"wrk_metadata_id"})})
 * @ORM\Entity
 */
class DraftWork
{
    /**
     * @var integer
     *
     * @ORM\Column(name="wrk_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
		 * @ClientReadonly
	   *
     * @ORM\Column(name="wrk_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Type;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_image_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $ImageType;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_comments", type="string", length=4096, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Comments;

    /**
     * @var boolean
     *
     * @ORM\Column(name="wrk_metadata_changed", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $MetadataChanged;

    /**
     * @var boolean
     *
     * @ORM\Column(name="wrk_dataset_labels_changed", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DatasetLabelsChanged;

    /**
     * @var boolean
     *
     * @ORM\Column(name="wrk_dataset_data_changed", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DatasetDataChanged;

    /**
     * @var boolean
     *
     * @ORM\Column(name="wrk_metric_labels_changed", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $MetricLabelsChanged;

    /**
     * @var boolean
     *
     * @ORM\Column(name="wrk_metric_data_changed", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $MetricDataChanged;

    /**
     * @var integer
     *
		 * @ORM\Column(name="wrk_shard", type="integer", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $Shard;

		/**
		 * @var integer
		 *
		 * @ORM\Column(name="wrk_preview_file_id", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $PreviewFileId;


		/**
     * @var \DateTime
		* @ClientReadonly
		* @ORM\Column(name="wrk_update", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Update;


		/**
     * @var integer
		* @ClientReadonly
		* @ORM\Column(name="wrk_update_user_id", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $UpdateUserId;

		/**
		 * @var boolean
		 *
		 * @ClientReadonly
		 *
		 * @ORM\Column(name="wrk_unfinished", type="boolean", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $Unfinished;

		/**
		 * @var boolean
		 *
		 * @ClientReadonly
		 *
		 * @ORM\Column(name="wrk_is_private", type="boolean", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $IsPrivate;

		/**
		 * @var boolean
		 *
		 * @ClientReadonly
		 *
		 * @ORM\Column(name="wrk_is_indexed", type="boolean", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $IsIndexed;


		/**
		 * @var boolean
		 *
		 * @ClientReadonly
		 *
		 * @ORM\Column(name="wrk_segmented_crawling", type="boolean", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $SegmentedCrawling;

		/**
		 * @var string
		 *
		 * @ClientReadonly
		 *
		 * @ORM\Column(name="wrk_access_link", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
		 */
    private $AccessLink;

		/**
		 * @var string
		 *
		 * @ClientReadonly
		 *
		 * @ORM\Column(name="wrk_last_access_link", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
		 */
    private $LastAccessLink;

    /**
     * @var \helena\entities\backoffice\DraftMetadata
     *
		 * @ClientReadonly
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wrk_metadata_id", referencedColumnName="met_id", nullable=false)
     * })
     */
    private $Metadata;

    /**
     * @var \helena\entities\backoffice\DraftFile
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftFile")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wrk_image_id", referencedColumnName="fil_id", nullable=true)
     * })
     */
    private $Image;

    /**
     * @var \helena\entities\backoffice\DraftWorkStartup
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWorkStartup")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wrk_startup_id", referencedColumnName="wst_id", nullable=false)
     * })
     */
    private $Startup;

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
     * @return DraftWork
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
     * @return DraftWork
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
     * Set imageType
     *
     * @param string $imageType
     *
     * @return DraftWork
     */
    public function setImageType($imageType)
    {
        $this->ImageType = $imageType;

        return $this;
    }

    /**
     * Get imageType
     *
     * @return string
     */
    public function getImageType()
    {
        return $this->ImageType;
    }


    /**
     * Set update
     *
     * @param \DateTime $update
     *
     * @return DraftWork
     */
    public function setUpdate($update)
    {
        $this->Update = $update;

        return $this;
    }

    /**
     * Get update
     *
     * @return \DateTime
     */
    public function getUpdate()
    {
        return $this->Update;
    }


    /**
     * Set updateUserId
     *
     * @param integer $updateUserId
     *
     * @return DraftWork
     */
    public function setUpdateUserId($updateUserId)
    {
        $this->UpdateUserId = $updateUserId;

        return $this;
    }

    /**
     * Get updateUserId
     *
     * @return integer
     */
    public function getUpdateUserId()
    {
        return $this->UpdateUserId;
    }


    /**
     * Set comments
     *
     * @param string $comments
     *
     * @return DraftWork
     */
    public function setComments($comments)
    {
        $this->Comments = $comments;

        return $this;
    }

    /**
     * Get comments
     *
     * @return string
     */
    public function getComments()
    {
        return $this->Comments;
    }


    /**
		 * Set isPrivate
		 *
		 * @param boolean $isPrivate
		 *
		 * @return DraftWork
		 */
    public function setIsPrivate($isPrivate)
    {
			$this->IsPrivate = $isPrivate;

			return $this;
    }

    /**
		 * Get isPrivate
		 *
		 * @return boolean
		 */
    public function getIsPrivate()
    {
			return $this->IsPrivate;
    }

    /**
		 * Set unfinished
		 *
		 * @param boolean $unfinished
		 *
		 * @return DraftWork
		 */
    public function setUnfinished($unfinished)
    {
			$this->Unfinished = $unfinished;

			return $this;
    }

    /**
		 * Get unfinished
		 *
		 * @return boolean
		 */
    public function getUnfinished()
    {
			return $this->Unfinished;
    }

    /**
		 * Set isIndexed
		 *
		 * @param boolean $isIndexed
		 *
		 * @return DraftWork
		 */
    public function setIsIndexed($isIndexed)
    {
			$this->IsIndexed = $isIndexed;

			return $this;
    }

    /**
		 * Get isIndexed
		 *
		 * @return boolean
		 */
    public function getIsIndexed()
    {
			return $this->IsIndexed;
    }


    /**
		 * Set segmentedCrawling
		 *
		 * @param boolean $segmentedCrawling
		 *
		 * @return DraftWork
		 */
    public function setSegmentedCrawling($segmentedCrawling)
    {
			$this->SegmentedCrawling = $segmentedCrawling;

			return $this;
    }

    /**
		 * Get segmentedCrawling
		 *
		 * @return boolean
		 */
    public function getSegmentedCrawling()
    {
			return $this->SegmentedCrawling;
    }
    /**
		 * Set accessLink
		 *
		 * @param string $accessLink
		 *
		 * @return DraftWork
		 */
    public function setAccessLink($accessLink)
    {
			$this->AccessLink = $accessLink;

			return $this;
    }

    /**
		 * Get accessLink
		 *
		 * @return string
		 */
    public function getAccessLink()
    {
			return $this->AccessLink;
    }

		    /**
		 * Set lastLastAccessLink
		 *
		 * @param string $lastLastAccessLink
		 *
		 * @return DraftWork
		 */
    public function setLastAccessLink($lastLastAccessLink)
    {
			$this->LastAccessLink = $lastLastAccessLink;

			return $this;
    }

    /**
		 * Get lastLastAccessLink
		 *
		 * @return string
		 */
    public function getLastAccessLink()
    {
			return $this->LastAccessLink;
    }

    /**
     * Set metadataChanged
     *
     * @param boolean $metadataChanged
     *
     * @return DraftWork
     */
    public function setMetadataChanged($metadataChanged)
    {
        $this->MetadataChanged = $metadataChanged;

        return $this;
    }

    /**
     * Get metadataChanged
     *
     * @return boolean
     */
    public function getMetadataChanged()
    {
        return $this->MetadataChanged;
    }

    /**
     * Set datasetLabelsChanged
     *
     * @param boolean $datasetLabelsChanged
     *
     * @return DraftWork
     */
    public function setDatasetLabelsChanged($datasetLabelsChanged)
    {
        $this->DatasetLabelsChanged = $datasetLabelsChanged;

        return $this;
    }

    /**
     * Get datasetLabelsChanged
     *
     * @return boolean
     */
    public function getDatasetLabelsChanged()
    {
        return $this->DatasetLabelsChanged;
    }

    /**
     * Set datasetDataChanged
     *
     * @param boolean $datasetDataChanged
     *
     * @return DraftWork
     */
    public function setDatasetDataChanged($datasetDataChanged)
    {
        $this->DatasetDataChanged = $datasetDataChanged;

        return $this;
    }

    /**
     * Get datasetDataChanged
     *
     * @return boolean
     */
    public function getDatasetDataChanged()
    {
        return $this->DatasetDataChanged;
    }

    /**
     * Set metricLabelsChanged
     *
     * @param boolean $metricLabelsChanged
     *
     * @return DraftWork
     */
    public function setMetricLabelsChanged($metricLabelsChanged)
    {
        $this->MetricLabelsChanged = $metricLabelsChanged;

        return $this;
    }

    /**
     * Get metricLabelsChanged
     *
     * @return boolean
     */
    public function getMetricLabelsChanged()
    {
        return $this->MetricLabelsChanged;
    }

    /**
     * Set metricDataChanged
     *
     * @param boolean $metricDataChanged
     *
     * @return DraftWork
     */
    public function setMetricDataChanged($metricDataChanged)
    {
        $this->MetricDataChanged = $metricDataChanged;

        return $this;
    }

    /**
     * Get metricDataChanged
     *
     * @return boolean
     */
    public function getMetricDataChanged()
    {
        return $this->MetricDataChanged;
    }

    /**
     * Set shard
     *
     * @param integer $shard
     *
     * @return DraftWork
     */
    public function setShard($shard)
    {
        $this->Shard = $shard;

        return $this;
    }

    /**
     * Get shard
     *
     * @return integer
     */
    public function getShard()
    {
        return $this->Shard;
    }

		/**
		 * Set previewFileId
		 *
		 * @param integer $previewFileId
		 *
		 * @return DraftWork
		 */
    public function setPreviewFileId($previewFileId)
    {
			$this->PreviewFileId = $previewFileId;

			return $this;
    }

    /**
		 * Get previewFileId
		 *
		 * @return integer
		 */
    public function getPreviewFileId()
    {
			return $this->PreviewFileId;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\DraftMetadata $metadata
     *
     * @return DraftWork
     */
    public function setMetadata(\helena\entities\backoffice\DraftMetadata $metadata = null)
    {
        $this->Metadata = $metadata;

        return $this;
    }

    /**
     * Get metadata
     *
     * @return \helena\entities\backoffice\DraftMetadata
     */
    public function getMetadata()
    {
        return $this->Metadata;
    }

    /**
     * Set image
     *
     * @param \helena\entities\backoffice\DraftFile $image
     *
     * @return DraftWork
     */
    public function setImage(\helena\entities\backoffice\DraftFile $image = null)
    {
        $this->Image = $image;

        return $this;
    }

    /**
     * Get image
     *
     * @return \helena\entities\backoffice\DraftFile
     */
    public function getImage()
    {
        return $this->Image;
    }


    /**
     * Set startup
     *
     * @param \helena\entities\backoffice\DraftWorkStartup $startup
     *
     * @return DraftWork
     */
    public function setStartup(\helena\entities\backoffice\DraftWorkStartup $startup = null)
    {
        $this->Startup = $startup;

        return $this;
    }

    /**
     * Get startup
     *
     * @return \helena\entities\backoffice\DraftWorkStartup
     */
    public function getStartup()
    {
        return $this->Startup;
    }
}

