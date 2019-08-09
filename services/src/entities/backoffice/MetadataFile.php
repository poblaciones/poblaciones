<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * MetadataFile
 *
 * @ORM\Table(name="metadata_file", uniqueConstraints={@ORM\UniqueConstraint(name="unique_work_file", columns={"mfi_metadata_id", "mfi_caption"})}, indexes={@ORM\Index(name="fk_work_file_work1_idx", columns={"mfi_metadata_id"}), @ORM\Index(name="fk_work_file_file1_idx", columns={"mfi_file_id"})})
 * @ORM\Entity
 */
class MetadataFile
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
     * @var \helena\entities\backoffice\File
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\File")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mfi_file_id", referencedColumnName="fil_id", nullable=true)
     * })
     */
    private $File;

    /**
     * @var \helena\entities\backoffice\Metadata
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
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
     * @return MetadataFile
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
     * @return MetadataFile
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
     * @return MetadataFile
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
     * @return MetadataFile
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
     * @param \helena\entities\backoffice\File $file
     *
     * @return MetadataFile
     */
    public function setFile($file)
    {
        $this->File = $file;

        return $this;
    }

    /**
     * Get file
     *
     * @return \helena\entities\backoffice\File
     */
    public function getFile()
    {
        return $this->File;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return MetadataFile
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

