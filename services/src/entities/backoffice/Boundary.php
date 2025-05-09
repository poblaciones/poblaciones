<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * Geography
 *
 * @ORM\Table(name="boundary")
 * @ORM\Entity
 */
class Boundary
{
		// Propiedades no almacenada en la base de datos
		public $ClippingRegions;

		/**
     * @var integer
     *
     * @ORM\Column(name="bou_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="bou_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
		 * @var integer
		 *
		 * @ORM\Column(name="bou_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $Order;

    /**
     * @var boolean
     *
     * @ORM\Column(name="bou_is_private", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsPrivate;

    /**
     * @var \helena\entities\backoffice\Metadata
     * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
		 * @ORM\JoinColumns({
		 *   @ORM\JoinColumn(name="bou_metadata_id", referencedColumnName="met_id", nullable=true)
		 * })
		 */
    private $Metadata;

    /**
		 * @var \helena\entities\backoffice\Geography
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
		 * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="bou_geography_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $Geography;

		/**
		 * @var \helena\entities\backoffice\BoundaryGroup
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\BoundaryGroup")
		 * @ORM\JoinColumns({
		 *   @ORM\JoinColumn(name="bou_group_id", referencedColumnName="bgr_id", nullable=false)
		 * })
		 */
	private $Group;



	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="bou_is_suggestion", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
    private $IsSuggestion;


	/**
	 * @var string
	 *
	 * @ORM\Column(name="bou_icon", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Icon;

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
     * @return Boundary
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return Boundary
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
		 * Set order
		 *
		 * @param integer $order
		 *
		 * @return Boundary
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
	 * Set isPrivate
	 *
	 * @param boolean $isPrivate
	 *
	 * @return Boundary
	 */
	public function setIsPrivate($isPrivate)
	{
		$this->IsPrivate = $isPrivate;

		return $this;
	}

	/**
	 * Get isPrivate
	 *
	 * @return boolean
	 */
	public function getIsPrivate()
	{
		return $this->IsPrivate;
	}



	/**
	 * Set isSuggestion
	 *
	 * @param boolean $isSuggestion
	 *
	 * @return Boundary
	 */
    public function setIsSuggestion($isSuggestion)
    {
        $this->IsSuggestion = $isSuggestion;

        return $this;
    }

    /**
     * Get isSuggestion
     *
     * @return boolean
     */
    public function getIsSuggestion()
    {
        return $this->IsSuggestion;
    }


	/**
	 * Set icon
	 *
	 * @param boolean $icon
	 *
	 * @return Boundary
	 */
	public function setIcon($icon)
	{
		$this->Icon = $icon;

		return $this;
	}

	/**
	 * Get icon
	 *
	 * @return boolean
	 */
	public function getIcon()
	{
		return $this->Icon;
	}


	/**
	 * Set geography
	 *
	 * @param \helena\entities\backoffice\Geography $geography
	 *
	 * @return Boundary
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
		 * Set group
		 *
		 * @param \helena\entities\backoffice\BoundaryGroup $group
		 *
		 * @return Boundary
		 */
    public function setGroup(\helena\entities\backoffice\BoundaryGroup $group = null)
    {
			$this->Group = $group;

			return $this;
    }

    /**
		 * Get group
		 *
	 * @return \helena\entities\backoffice\BoundaryGroup
		 */
    public function getGroup()
    {
			return $this->Group;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return Boundary
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
}

