<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * MetadataInstitution
 *
 * @ORM\Table(name="metadata_institution", indexes={@ORM\Index(name="metadata_institution_institution", columns={"min_institution_id"}), @ORM\Index(name="metadata_institution_metadata", columns={"min_metadata_id"})})
 * @ORM\Entity
 */
class MetadataInstitution
{
    /**
     * @var integer
     *
     * @ORM\Column(name="min_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     */
    private $Id;

    /**
     * @var integer
     *
     * @ORM\Column(name="min_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var \helena\entities\backoffice\Metadata
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="min_metadata_id", referencedColumnName="met_id", nullable=false)
     * })
     */
    private $Metadata;

    /**
     * @var \helena\entities\backoffice\Institution
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Institution")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="min_institution_id", referencedColumnName="ins_id", nullable=false)
     * })
     */
    private $Institution;


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
     * @return MetadataInstitution
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
     * @return MetadataInstitution
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
     * @return MetadataInstitution
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
     * Set institution
     *
     * @param \helena\entities\backoffice\Institution $institution
     *
     * @return MetadataInstitution
     */
    public function setInstitution(\helena\entities\backoffice\Institution $institution = null)
    {
        $this->Institution = $institution;

        return $this;
    }

    /**
     * Get institution
     *
     * @return \helena\entities\backoffice\Institution
     */
    public function getInstitution()
    {
        return $this->Institution;
    }
}

