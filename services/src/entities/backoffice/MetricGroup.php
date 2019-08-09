<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * MetricGroup
 *
 * @ORM\Table(name="metric_group")
 * @ORM\Entity
 */
class MetricGroup
{
    /**
     * @var integer
     *
     * @ORM\Column(name="lgr_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="lgr_caption", type="string", length=45, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="lgr_icon", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Icon;

    /**
     * @var integer
     *
     * @ORM\Column(name="lgr_order", type="integer", precision=0, scale=0, nullable=true, unique=false)
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
     * @return MetricGroup
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
     * @return MetricGroup
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
     * Set icon
     *
     * @param string $icon
     *
     * @return MetricGroup
     */
    public function setIcon($icon)
    {
        $this->Icon = $icon;

        return $this;
    }

    /**
     * Get icon
     *
     * @return string
     */
    public function getIcon()
    {
        return $this->Icon;
    }

    /**
     * Set order
     *
     * @param integer $order
     *
     * @return MetricGroup
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

