<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * DraftMetadataInstitution
 *
 * @ORM\Table(name="draft_metadata_institution", indexes={@ORM\Index(name="draft_metadata_institution_institution", columns={"min_institution_id"}), @ORM\Index(name="draft_metadata_institution_metadata", columns={"min_metadata_id"})})
 * @ORM\Entity
 */
class DraftMetadataInstitution
{
    /**
     * @var integer
     *
     * @ORM\Column(name="min_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var integer
     *
     * @ORM\Column(name="min_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var \helena\entities\backoffice\DraftMetadata
     *
     * @Exclude
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="min_metadata_id", referencedColumnName="met_id", nullable=false)
     * })
     */
    private $Metadata;

    /**
     * @var \helena\entities\backoffice\DraftInstitution
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftInstitution")
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
     * @return DraftMetadataInstitution
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
     * @return DraftMetadataInstitution
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
     * @return DraftMetadataInstitution
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
     * Set institution
     *
     * @param \helena\entities\backoffice\DraftInstitution $institution
     *
     * @return DraftMetadataInstitution
     */
    public function setInstitution(\helena\entities\backoffice\DraftInstitution $institution = null)
    {
        $this->Institution = $institution;

        return $this;
    }

    /**
     * Get institution
     *
     * @return \helena\entities\backoffice\DraftInstitution
     */
    public function getInstitution()
    {
        return $this->Institution;
    }
}

