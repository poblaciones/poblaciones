<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

use LongitudeOne\Spatial\DBAL\Types\GeometryType;
use LongitudeOne\Spatial\DBAL\Types\Geometry\PointType;

/**
 * GeographyItem
 *
 * @ORM\Table(name="geography_item", uniqueConstraints={@ORM\UniqueConstraint(name="carto_codes", columns={"gei_geography_id", "gei_code"})}, indexes={@ORM\Index(name="fk_geographies_items_geographies1_idx", columns={"gei_geography_id"}), @ORM\Index(name="fk_geographies_items_geographies_items1_idx", columns={"gei_parent_id"})})
 * @ORM\Entity
 */
class GeographyItem
{
    /**
     * @var integer
     *
     * @ORM\Column(name="gei_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="gei_code", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Code;

    /**
     * @var string
     *
     * @ORM\Column(name="gei_caption", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Caption;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="gei_geometry", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Geometry;

    /**
     * @var boolean
     *
     * @ORM\Column(name="gei_geometry_is_null", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryIsNull;

    /**
     * @var PointType
     *
     * @ORM\Column(name="gei_centroid", type="point", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Centroid;

    /**
     * @var float
     *
     * @ORM\Column(name="gei_area_m2", type="float", precision=10, scale=0, nullable=true, unique=false)
     */
    private $AreaM2;

    /**
     * @var integer
     *
     * @ORM\Column(name="gei_population", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Population;

    /**
     * @var integer
     *
     * @ORM\Column(name="gei_households", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Households;

    /**
     * @var integer
     *
     * @ORM\Column(name="gei_children", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Children;

    /**
     * @var string
     *
     * @ORM\Column(name="gei_urbanity", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Urbanity;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="gei_geometry_r1", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR1;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="gei_geometry_r2", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR2;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="gei_geometry_r3", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR3;

    /**
     * @var GeometryType
     *
     * @ORM\Column(name="gei_geometry_r4", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR4;

    /**
     * @var GeometryType
     *
		 * @ORM\Column(name="gei_geometry_r5", type="geometry", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $GeometryR5;

		/**
		 * @var GeometryType
		 *
		 * @ORM\Column(name="gei_geometry_r6", type="geometry", precision=0, scale=0, nullable=false, unique=false)
     */
    private $GeometryR6;

    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gei_geography_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $Geography;

    /**
     * @var \helena\entities\backoffice\GeographyItem
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\GeographyItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gei_parent_id", referencedColumnName="gei_id", nullable=true)
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
     * @return GeographyItem
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
     * @return GeographyItem
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
     * @return GeographyItem
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
     * Set GeometryType
     *
     * @param GeometryType $GeometryType
     *
     * @return GeographyItem
     */
    public function setGeometry($GeometryType)
    {
        $this->Geometry = $GeometryType;

        return $this;
    }

    /**
     * Get GeometryType
     *
     * @return GeometryType
     */
    public function getGeometry()
    {
        return $this->Geometry;
    }

    /**
     * Set geometryIsNull
     *
     * @param boolean $geometryIsNull
     *
     * @return GeographyItem
     */
    public function setGeometryIsNull($geometryIsNull)
    {
        $this->GeometryIsNull = $geometryIsNull;

        return $this;
    }

    /**
     * Get geometryIsNull
     *
     * @return boolean
     */
    public function getGeometryIsNull()
    {
        return $this->GeometryIsNull;
    }

    /**
     * Set centroid
     *
     * @param PointType $centroid
     *
     * @return GeographyItem
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
     * Set areaM2
     *
     * @param float $areaM2
     *
     * @return GeographyItem
     */
    public function setAreaM2($areaM2)
    {
        $this->AreaM2 = $areaM2;

        return $this;
    }

    /**
     * Get areaM2
     *
     * @return float
     */
    public function getAreaM2()
    {
        return $this->AreaM2;
    }

    /**
     * Set population
     *
     * @param integer $population
     *
     * @return GeographyItem
     */
    public function setPopulation($population)
    {
        $this->Population = $population;

        return $this;
    }

    /**
     * Get population
     *
     * @return integer
     */
    public function getPopulation()
    {
        return $this->Population;
    }

    /**
     * Set households
     *
     * @param integer $households
     *
     * @return GeographyItem
     */
    public function setHouseholds($households)
    {
        $this->Households = $households;

        return $this;
    }

    /**
     * Get households
     *
     * @return integer
     */
    public function getHouseholds()
    {
        return $this->Households;
    }

    /**
     * Set children
     *
     * @param integer $children
     *
     * @return GeographyItem
     */
    public function setChildren($children)
    {
        $this->Children = $children;

        return $this;
    }

    /**
     * Get children
     *
     * @return integer
     */
    public function getChildren()
    {
        return $this->Children;
    }

    /**
     * Set urbanity
     *
     * @param string $urbanity
     *
     * @return GeographyItem
     */
    public function setUrbanity($urbanity)
    {
        $this->Urbanity = $urbanity;

        return $this;
    }

    /**
     * Get urbanity
     *
     * @return string
     */
    public function getUrbanity()
    {
        return $this->Urbanity;
    }

    /**
     * Set geometryR1
     *
     * @param GeometryType $geometryR1
     *
     * @return GeographyItem
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
     * @return GeographyItem
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
     * @return GeographyItem
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
     * Set geometryR4
     *
     * @param GeometryType $geometryR4
     *
     * @return GeographyItem
     */
    public function setGeometryR4($geometryR4)
    {
        $this->GeometryR4 = $geometryR4;

        return $this;
    }

    /**
     * Get geometryR4
     *
     * @return GeometryType
     */
    public function getGeometryR4()
    {
        return $this->GeometryR4;
    }

    /**
     * Set geometryR5
     *
     * @param GeometryType $geometryR5
     *
     * @return GeographyItem
     */
    public function setGeometryR5($geometryR5)
    {
        $this->GeometryR5 = $geometryR5;

        return $this;
    }

    /**
     * Get geometryR5
     *
     * @return GeometryType
     */
    public function getGeometryR5()
    {
        return $this->GeometryR5;
    }


    /**
		 * Set geometryR6
		 *
		 * @param GeometryType $geometryR6
		 *
		 * @return GeographyItem
		 */
    public function setGeometryR6($geometryR6)
    {
			$this->GeometryR6 = $geometryR6;

			return $this;
    }

    /**
		 * Get geometryR6
		 *
		 * @return GeometryType
		 */
    public function getGeometryR6()
    {
			return $this->GeometryR6;
    }
    /**
     * Set geography
     *
     * @param \helena\entities\backoffice\Geography $geography
     *
     * @return GeographyItem
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

    /**
     * Set parent
     *
     * @param \helena\entities\backoffice\GeographyItem $parent
     *
     * @return GeographyItem
     */
    public function setParent(\helena\entities\backoffice\GeographyItem $parent = null)
    {
        $this->Parent = $parent;

        return $this;
    }

    /**
     * Get parent
     *
     * @return \helena\entities\backoffice\GeographyItem
     */
    public function getParent()
    {
        return $this->Parent;
    }
}

