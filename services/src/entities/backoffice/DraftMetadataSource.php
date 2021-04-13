<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * DraftMetadataSource
 *
 * @ORM\Table(name="draft_metadata_source", indexes={@ORM\Index(name="draft_metadata_source_source", columns={"msc_source_id"}), @ORM\Index(name="draft_metadata_source_metadata", columns={"msc_metadata_id"})})
 * @ORM\Entity
 */
class DraftMetadataSource
{
    /**
     * @var integer
     *
     * @ORM\Column(name="msc_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var integer
     *
     * @ORM\Column(name="msc_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var \helena\entities\backoffice\DraftMetadata
     *
     * @Exclude
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="msc_metadata_id", referencedColumnName="met_id", nullable=false)
     * })
     */
    private $Metadata;

    /**
     * @var \helena\entities\backoffice\DraftSource
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftSource")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="msc_source_id", referencedColumnName="src_id", nullable=false)
     * })
     */
    private $Source;

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
     * @return DraftMetadataSource
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
     * @return DraftMetadataSource
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
     * Set metadata
     *
     * @param \helena\entities\backoffice\DraftMetadata $metadata
     *
     * @return DraftMetadataSource
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
     * Set source
     *
     * @param \helena\entities\backoffice\DraftSource $source
     *
     * @return DraftMetadataSource
     */
    public function setSource(\helena\entities\backoffice\DraftSource $source = null)
    {
        $this->Source = $source;

        return $this;
    }

    /**
     * Get source
     *
     * @return \helena\entities\backoffice\DraftSource
     */
    public function getSource()
    {
        return $this->Source;
    }
}

