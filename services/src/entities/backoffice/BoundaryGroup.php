<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;

/**
 * Geography
 *
 * @ORM\Table(name="boundary_group")
 * @ORM\Entity
 */
class BoundaryGroup
{
    /**
     * @var integer
     *
     * @ORM\Column(name="bgr_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="bgr_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
		 * @var integer
		 *
		 * @ORM\Column(name="bgr_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
		 */
    private $Order;

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
}

