<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;

/**
 * Gradient
 *
 * @ORM\Table(name="file")
 * @ORM\Entity
 */
class Gradient
{
    /**
     * @var integer
     *
     * @ORM\Column(name="grd_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="grd_caption", type="string", length=50, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;


    /**
     * @var string
     *
     * @ORM\Column(name="grd_image_type", type="string", length=20, precision=0, scale=0, nullable=false, unique=false)
     */
    private $ImageType;


	  /**
     * @var integer
     *
     * @ORM\Column(name="grd_max_zoom_level", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $MaxZoomLevel;


    /**
     * @var \helena\entities\backoffice\ClippingRegionItem
     * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\ClippingRegionItem")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="grd_country_id", referencedColumnName="cli_id", nullable=true)
     * })
     */
    private $Country;


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
     * @return Gradient
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }


    /**
     * Get maxZoomLevel
     *
     * @return integer
     */
    public function getMaxZoomLevel()
    {
        return $this->MaxZoomLevel;
    }

		/**
     * Set maxZoomLevel
     *
     * @param integer $maxZoomLevel
     *
     * @return Gradient
     */
    public function setMaxZoomLevel($maxZoomLevel)
    {
        $this->MaxZoomLevel = $maxZoomLevel;

        return $this;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return Gradient
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
     * Set imageType
     *
     * @param string $imageType
     *
     * @return Gradient
     */
    public function setImageType($imageType)
    {
        $this->ImageType = $imageType;

        return $this;
    }

    /**
     * Get imageType
     *
     * @return string
     */
    public function getImageType()
    {
        return $this->ImageType;
    }

    /**
     * Set country
     *
     * @param \helena\entities\backoffice\ClippingRegionItem $country
     *
     * @return Gradient
     */
    public function setCountry(\helena\entities\backoffice\ClippingRegionItem $country = null)
    {
        $this->Country = $country;

        return $this;
    }

    /**
     * Get country
     *
     * @return \helena\entities\backoffice\ClippingRegionItem
     */
    public function getCountry()
    {
        return $this->Country;
    }

}

