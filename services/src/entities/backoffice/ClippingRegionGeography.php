<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * ClippingRegionGeography
 *
 * @ORM\Table(name="clipping_region_geography", uniqueConstraints={@ORM\UniqueConstraint(name="crg_cartography_id", columns={"crg_geography_id", "crg_clipping_region_id"})}, indexes={@ORM\Index(name="fk_clipping_regions_geographies_geographies1_idx", columns={"crg_geography_id"}), @ORM\Index(name="fk_clipping_regions_geographies_clipping_regions1_idx", columns={"crg_clipping_region_id"})})
 * @ORM\Entity
 */
class ClippingRegionGeography
{
    /**
     * @var integer
     *
     * @ORM\Column(name="crg_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var \helena\entities\backoffice\ClippingRegion
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegion")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="crg_clipping_region_id", referencedColumnName="clr_id", nullable=true)
     * })
     */
    private $ClippingRegion;

    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="crg_geography_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $Geography;


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
     * @return ClippingRegionGeography
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set clippingRegion
     *
     * @param \helena\entities\backoffice\ClippingRegion $clippingRegion
     *
     * @return ClippingRegionGeography
     */
    public function setClippingRegion(\helena\entities\backoffice\ClippingRegion $clippingRegion = null)
    {
        $this->ClippingRegion = $clippingRegion;

        return $this;
    }

    /**
     * Get clippingRegion
     *
     * @return \helena\entities\backoffice\ClippingRegion
     */
    public function getClippingRegion()
    {
        return $this->ClippingRegion;
    }

    /**
     * Set geography
     *
     * @param \helena\entities\backoffice\Geography $geography
     *
     * @return ClippingRegionGeography
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
}

