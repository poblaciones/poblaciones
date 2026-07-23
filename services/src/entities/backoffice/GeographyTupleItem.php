<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * GeographyTupleItem
 *
 * @ORM\Table(name="geography_tuple_item", indexes={@ORM\Index(name="fk_geography_tuple_item_tuple_idx", columns={"gti_geography_tuple_id"})})
 * @ORM\Entity
 */
class GeographyTupleItem
{
    /**
     * @var integer
     *
     * @ORM\Column(name="gti_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var \helena\entities\backoffice\GeographyTuple
     * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\GeographyTuple")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gti_geography_tuple_id", referencedColumnName="gtu_id", nullable=false)
     * })
     */
    private $GeographyTuple;

    /**
     * @var integer
     *
     * @ORM\Column(name="gti_geography_item_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeographyItemId;

    /**
     * @var integer
     *
     * @ORM\Column(name="gti_geography_previous_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeographyPreviousId;

    /**
     * @var integer
     *
     * @ORM\Column(name="gti_geography_previous_item_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeographyPreviousItemId;

    /**
     * @var boolean
     *
     * @ORM\Column(name="gti_is_partial", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsPartial;

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
     * @return GeographyTupleItem
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set geographyTuple
     *
     * @param \helena\entities\backoffice\GeographyTuple $geographyTuple
     *
     * @return GeographyTupleItem
     */
    public function setGeographyTuple(\helena\entities\backoffice\GeographyTuple $geographyTuple = null)
    {
        $this->GeographyTuple = $geographyTuple;

        return $this;
    }

    /**
     * Get geographyTuple
     *
     * @return \helena\entities\backoffice\GeographyTuple
     */
    public function getGeographyTuple()
    {
        return $this->GeographyTuple;
    }

    /**
     * Set geographyItemId
     *
     * @param integer $geographyItemId
     *
     * @return GeographyTupleItem
     */
    public function setGeographyItemId($geographyItemId)
    {
        $this->GeographyItemId = $geographyItemId;

        return $this;
    }

    /**
     * Get geographyItemId
     *
     * @return integer
     */
    public function getGeographyItemId()
    {
        return $this->GeographyItemId;
    }

    /**
     * Set geographyPreviousId
     *
     * @param integer $geographyPreviousId
     *
     * @return GeographyTupleItem
     */
    public function setGeographyPreviousId($geographyPreviousId)
    {
        $this->GeographyPreviousId = $geographyPreviousId;

        return $this;
    }

    /**
     * Get geographyPreviousId
     *
     * @return integer
     */
    public function getGeographyPreviousId()
    {
        return $this->GeographyPreviousId;
    }

    /**
     * Set geographyPreviousItemId
     *
     * @param integer $geographyPreviousItemId
     *
     * @return GeographyTupleItem
     */
    public function setGeographyPreviousItemId($geographyPreviousItemId)
    {
        $this->GeographyPreviousItemId = $geographyPreviousItemId;

        return $this;
    }

    /**
     * Get geographyPreviousItemId
     *
     * @return integer
     */
    public function getGeographyPreviousItemId()
    {
        return $this->GeographyPreviousItemId;
    }

    /**
     * Set isPartial
     *
     * @param boolean $isPartial
     *
     * @return GeographyTupleItem
     */
    public function setIsPartial($isPartial)
    {
        $this->IsPartial = $isPartial;

        return $this;
    }

    /**
     * Get isPartial
     *
     * @return boolean
     */
    public function getIsPartial()
    {
        return $this->IsPartial;
    }
}
