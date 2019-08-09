<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * ClippingRegionGeographyItem
 *
 * @ORM\Table(name="clipping_region_geography_item", indexes={@ORM\Index(name="fk_clipping_regions_items_geography_items_clipping_regions__idx", columns={"cgi_clipping_region_item_id"}), @ORM\Index(name="fk_clipping_regions_items_geography_items_geographies_items_idx", columns={"cgi_geography_item_id"}), @ORM\Index(name="fk_clipping_regions_items_geography_items_clipping_regions__idx1", columns={"cgi_clipping_region_geography_id"})})
 * @ORM\Entity
 */
class ClippingRegionGeographyItem
{
    /**
     * @var integer
     *
     * @ORM\Column(name="cgi_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var float
     *
     * @ORM\Column(name="cgi_intersection_percent", type="float", precision=10, scale=0, nullable=false, unique=false)
     */
    private $IntersectionPercent;

    /**
     * @var \helena\entities\backoffice\ClippingRegionGeography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegionGeography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="cgi_clipping_region_geography_id", referencedColumnName="crg_id", nullable=true)
     * })
     */
    private $ClippingRegionGeography;

    /**
     * @var \helena\entities\backoffice\ClippingRegionItem
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegionItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="cgi_clipping_region_item_id", referencedColumnName="cli_id", nullable=true)
     * })
     */
    private $ClippingRegionItem;

    /**
     * @var \helena\entities\backoffice\GeographyItem
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\GeographyItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="cgi_geography_item_id", referencedColumnName="gei_id", nullable=true)
     * })
     */
    private $GeographyItem;


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
     * @return ClippingRegionGeographyItem
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set intersectionPercent
     *
     * @param float $intersectionPercent
     *
     * @return ClippingRegionGeographyItem
     */
    public function setIntersectionPercent($intersectionPercent)
    {
        $this->IntersectionPercent = $intersectionPercent;

        return $this;
    }

    /**
     * Get intersectionPercent
     *
     * @return float
     */
    public function getIntersectionPercent()
    {
        return $this->IntersectionPercent;
    }

    /**
     * Set clippingRegionGeography
     *
     * @param \helena\entities\backoffice\ClippingRegionGeography $clippingRegionGeography
     *
     * @return ClippingRegionGeographyItem
     */
    public function setClippingRegionGeography(\helena\entities\backoffice\ClippingRegionGeography $clippingRegionGeography = null)
    {
        $this->ClippingRegionGeography = $clippingRegionGeography;

        return $this;
    }

    /**
     * Get clippingRegionGeography
     *
     * @return \helena\entities\backoffice\ClippingRegionGeography
     */
    public function getClippingRegionGeography()
    {
        return $this->ClippingRegionGeography;
    }

    /**
     * Set clippingRegionItem
     *
     * @param \helena\entities\backoffice\ClippingRegionItem $clippingRegionItem
     *
     * @return ClippingRegionGeographyItem
     */
    public function setClippingRegionItem(\helena\entities\backoffice\ClippingRegionItem $clippingRegionItem = null)
    {
        $this->ClippingRegionItem = $clippingRegionItem;

        return $this;
    }

    /**
     * Get clippingRegionItem
     *
     * @return \helena\entities\backoffice\ClippingRegionItem
     */
    public function getClippingRegionItem()
    {
        return $this->ClippingRegionItem;
    }

    /**
     * Set geographyItem
     *
     * @param \helena\entities\backoffice\GeographyItem $geographyItem
     *
     * @return ClippingRegionGeographyItem
     */
    public function setGeographyItem(\helena\entities\backoffice\GeographyItem $geographyItem = null)
    {
        $this->GeographyItem = $geographyItem;

        return $this;
    }

    /**
     * Get geographyItem
     *
     * @return \helena\entities\backoffice\GeographyItem
     */
    public function getGeographyItem()
    {
        return $this->GeographyItem;
    }
}

