<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * DraftMetadataFile
 *
 * @ORM\Table(name="draft_metadata_file", uniqueConstraints={@ORM\UniqueConstraint(name="draft_unique_work_file", columns={"mfi_metadata_id", "mfi_caption"})}, indexes={@ORM\Index(name="draft_fk_work_file_work1_idx", columns={"mfi_metadata_id"}), @ORM\Index(name="draft_fk_work_file_file1_idx", columns={"mfi_file_id"})})
 * @ORM\Entity
 */
class DraftMetadataFile
{
    /**
     * @var integer
     *
     * @ORM\Column(name="mfi_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var integer
     *
     * @ORM\Column(name="mfi_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var string
     *
     * @ORM\Column(name="mfi_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="mfi_web", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Web;

    /**
     * @var \helena\entities\backoffice\DraftFile
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftFile", cascade={"persist", "remove"}, fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mfi_file_id", referencedColumnName="fil_id", nullable=true)
     * })
     */
    private $File;

    /**
     * @var \helena\entities\backoffice\DraftMetadata
     *
		 * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mfi_metadata_id", referencedColumnName="met_id", nullable=true)
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
     * @return DraftMetadataFile
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set order
     *
     * @param integer $order
     *
     * @return DraftMetadataFile
     */
    public function setOrder($order)
    {
        $this->Order = $order;

        return $this;
    }

    /**
     * Get order
     *
     * @return integer
     */
    public function getOrder()
    {
        return $this->Order;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return DraftMetadataFile
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
     * Set web
     *
     * @param string $web
     *
     * @return DraftMetadataFile
     */
    public function setWeb($web)
    {
        $this->Web = $web;

        return $this;
    }

    /**
     * Get web
     *
     * @return string
     */
    public function getWeb()
    {
        return $this->Web;
    }

    /**
     * Set file
     *
     * @param \helena\entities\backoffice\DraftFile $file
     *
     * @return DraftMetadataFile
     */
    public function setFile($file)
    {
        $this->File = $file;

        return $this;
    }

    /**
     * Get file
     *
     * @return \helena\entities\backoffice\DraftFile
     */
    public function getFile()
    {
        return $this->File;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\DraftMetadata $metadata
     *
     * @return DraftMetadataFile
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
}

