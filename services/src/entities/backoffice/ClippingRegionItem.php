<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

use LongitudeOne\Spatial\DBAL\Types\Geometry\PointType;
use LongitudeOne\Spatial\DBAL\Types\GeometryType;
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
     * @ORM\Column(name="cli_code", type="string", length=20, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Code;

    /**
     * @var string
     *
     * @ORM\Column(name="cli_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="cli_geometry", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryType;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="cli_geometry_r1", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR1;


    /**
     * @var GeometryType
     *
     * @ORM\Column(name="cli_geometry_r2", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR2;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="cli_geometry_r3", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR3;

    /**
     * @var PointType
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
		 * @Exclude
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
     * @param GeometryType $geometry
     *
     * @return ClippingRegionItem
     */
    public function setGeometry($geometry)
    {
        $this->GeometryType = $geometry;

        return $this;
    }

    /**
     * Get geometry
     *
     * @return GeometryType
     */
    public function getGeometry()
    {
        return $this->GeometryType;
    }

    /**
     * Set geometryR1
     *
     * @param GeometryType $geometryR1
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
     * @return GeometryType
     */
    public function getGeometryR1()
    {
        return $this->GeometryR1;
    }


    /**
     * Set geometryR2
     *
     * @param GeometryType $geometryR2
     *
     * @return ClippingRegionItem
     */
    public function setGeometryR2($geometryR2)
    {
        $this->GeometryR2 = $geometryR2;

        return $this;
    }

    /**
     * Get geometryR2
     *
     * @return GeometryType
     */
    public function getGeometryR2()
    {
        return $this->GeometryR2;
    }

    /**
     * Set geometryR3
     *
     * @param GeometryType $geometryR3
     *
     * @return ClippingRegionItem
     */
    public function setGeometryR3($geometryR3)
    {
        $this->GeometryR3 = $geometryR3;

        return $this;
    }

    /**
     * Get geometryR3
     *
     * @return GeometryType
     */
    public function getGeometryR3()
    {
        return $this->GeometryR3;
    }

    /**
     * Set centroid
     *
     * @param PointType $centroid
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
     * @return PointType
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

