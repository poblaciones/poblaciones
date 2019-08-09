<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * ClippingRegionItem
 *
 * @ORM\Table(name="clipping_region_item", indexes={@ORM\Index(name="fk_clipping_regions_items_clipping_regions1_idx", columns={"cli_clipping_region_id"}), @ORM\Index(name="fk_clipping_regions_items_clipping_regions_items1_idx", columns={"cli_parent_id"})})
 * @ORM\Entity
 */
class ClippingRegionItem
{
    /**
     * @var integer
     *
     * @ORM\Column(name="cli_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="cli_code", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Code;

    /**
     * @var string
     *
     * @ORM\Column(name="cli_caption", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Caption;

    /**
     * @var geometry
     *
     * @ORM\Column(name="cli_geometry", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Geometry;

    /**
     * @var geometry
     *
     * @ORM\Column(name="cli_geometry_r1", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR1;

    /**
     * @var point
     *
     * @ORM\Column(name="cli_centroid", type="point", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Centroid;

    /**
     * @var string
     *
     * @ORM\Column(name="cli_wiki", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Wiki;

    /**
     * @var \helena\entities\backoffice\ClippingRegion
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegion")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="cli_clipping_region_id", referencedColumnName="clr_id", nullable=true)
     * })
     */
    private $ClippingRegion;

    /**
     * @var \helena\entities\backoffice\ClippingRegionItem
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegionItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="cli_parent_id", referencedColumnName="cli_id", nullable=true)
     * })
     */
    private $Parent;


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
     * @return ClippingRegionItem
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set code
     *
     * @param string $code
     *
     * @return ClippingRegionItem
     */
    public function setCode($code)
    {
        $this->Code = $code;

        return $this;
    }

    /**
     * Get code
     *
     * @return string
     */
    public function getCode()
    {
        return $this->Code;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return ClippingRegionItem
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
     * Set geometry
     *
     * @param geometry $geometry
     *
     * @return ClippingRegionItem
     */
    public function setGeometry($geometry)
    {
        $this->Geometry = $geometry;

        return $this;
    }

    /**
     * Get geometry
     *
     * @return geometry
     */
    public function getGeometry()
    {
        return $this->Geometry;
    }

    /**
     * Set geometryR1
     *
     * @param geometry $geometryR1
     *
     * @return ClippingRegionItem
     */
    public function setGeometryR1($geometryR1)
    {
        $this->GeometryR1 = $geometryR1;

        return $this;
    }

    /**
     * Get geometryR1
     *
     * @return geometry
     */
    public function getGeometryR1()
    {
        return $this->GeometryR1;
    }

    /**
     * Set centroid
     *
     * @param point $centroid
     *
     * @return ClippingRegionItem
     */
    public function setCentroid($centroid)
    {
        $this->Centroid = $centroid;

        return $this;
    }

    /**
     * Get centroid
     *
     * @return point
     */
    public function getCentroid()
    {
        return $this->Centroid;
    }

    /**
     * Set wiki
     *
     * @param string $wiki
     *
     * @return ClippingRegionItem
     */
    public function setWiki($wiki)
    {
        $this->Wiki = $wiki;

        return $this;
    }

    /**
     * Get wiki
     *
     * @return string
     */
    public function getWiki()
    {
        return $this->Wiki;
    }

    /**
     * Set clippingRegion
     *
     * @param \helena\entities\backoffice\ClippingRegion $clippingRegion
     *
     * @return ClippingRegionItem
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
     * Set parent
     *
     * @param \helena\entities\backoffice\ClippingRegionItem $parent
     *
     * @return ClippingRegionItem
     */
    public function setParent(\helena\entities\backoffice\ClippingRegionItem $parent = null)
    {
        $this->Parent = $parent;

        return $this;
    }

    /**
     * Get parent
     *
     * @return \helena\entities\backoffice\ClippingRegionItem
     */
    public function getParent()
    {
        return $this->Parent;
    }
}

