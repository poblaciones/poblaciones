<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * WorkStartup
 *
 * @ORM\Table(name="work_startup")
 * @ORM\Entity
 */
class WorkStartup
{
    /**
     * @var integer
     *
     * @ORM\Column(name="wst_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="wst_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Type;

    /**
     * @var point
     *
     * @ORM\Column(name="wst_center", type="point", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Center;

    /**
     * @var integer
     *
     * @ORM\Column(name="wst_zoom", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Zoom;

		/**
     * @var string
     *
     * @ORM\Column(name="wst_active_metrics", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $ActiveMetrics;

    /**
     * @var integer
     *
     * @ORM\Column(name="wst_clipping_region_item_id", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $ClippingRegionItemId;

		/**
		 * @var boolean
		 *
		 * @ORM\Column(name="wst_clipping_region_item_selected", type="boolean", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $ClippingRegionItemSelected;


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
     * @return WorkStartup
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

	  /**
     * Get zoom
     *
     * @return integer
     */
    public function getZoom()
    {
        return $this->Zoom;
    }

		/**
     * Set zoom
     *
     * @param integer $zoom
     *
     * @return WorkStartup
     */
    public function setZoom($zoom)
    {
        $this->Zoom = $zoom;

        return $this;
    }

		/**
     * Set activeMetrics
     *
     * @param string $activeMetrics
     *
     * @return WorkStartup
     */
    public function setActiveMetrics($activeMetrics)
    {
        $this->ActiveMetrics = $activeMetrics;

        return $this;
    }

    /**
     * Get activeMetrics
     *
     * @return string
     */
    public function getActiveMetrics()
    {
        return $this->ActiveMetrics;
    }

    /**
     * Set type
     *
     * @param string $type
     *
     * @return WorkStartup
     */
    public function setType($type)
    {
        $this->Type = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return string
     */
    public function getType()
    {
        return $this->Type;
    }

    /**
     * Set center
     *
     * @param point $center
     *
     * @return WorkStartup
     */
    public function setCenter($center)
    {
        $this->Center = $center;

        return $this;
    }

    /**
     * Get center
     *
     * @return point
     */
    public function getCenter()
    {
        return $this->Center;
    }

    /**
     * Set clippingRegionItemId
     *
     * @param integer $clippingRegionItemId
     *
     * @return WorkStartup
     */
    public function setClippingRegionItemId($clippingRegionItemId)
    {
        $this->ClippingRegionItemId = $clippingRegionItemId;

        return $this;
    }

    /**
     * Get clippingRegionItemId
     *
     * @return integer
     */
    public function getClippingRegionItemId()
    {
        return $this->ClippingRegionItemId;
    }

		/**
		 * Set clippingRegionItemSelected
		 *
		 * @param boolean $clippingRegionItemSelected
		 *
		 * @return WorkStartup
		 */
    public function setClippingRegionItemSelected($clippingRegionItemSelected)
    {
			$this->ClippingRegionItemSelected = $clippingRegionItemSelected;

			return $this;
    }

    /**
		 * Get clippingRegionSelected
		 *
		 * @return boolean
		 */
    public function getClippingRegionItemSelected()
    {
			return $this->ClippingRegionItemSelected;
    }
}

