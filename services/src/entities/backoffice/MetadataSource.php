<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * MetadataSource
 *
 * @ORM\Table(name="metadata_source", indexes={@ORM\Index(name="metadata_source_source", columns={"msc_source_id"}), @ORM\Index(name="metadata_source_metadata", columns={"msc_metadata_id"})})
 * @ORM\Entity
 */
class MetadataSource
{
    /**
     * @var integer
     *
     * @ORM\Column(name="msc_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     */
    private $Id;

    /**
     * @var integer
     *
     * @ORM\Column(name="msc_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var \helena\entities\backoffice\Metadata
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="msc_metadata_id", referencedColumnName="met_id", nullable=false)
     * })
     */
    private $Metadata;

    /**
     * @var \helena\entities\backoffice\Source
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Source")
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
     * @return MetadataSource
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
     * @return MetadataSource
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
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return MetadataSource
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
     * Set source
     *
     * @param \helena\entities\backoffice\Source $source
     *
     * @return MetadataSource
     */
    public function setSource(\helena\entities\backoffice\Source $source = null)
    {
        $this->Source = $source;

        return $this;
    }

    /**
     * Get source
     *
     * @return \helena\entities\backoffice\Source
     */
    public function getSource()
    {
        return $this->Source;
    }
}

