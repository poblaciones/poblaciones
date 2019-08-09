<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;

/**
 * Metric
 *
 * @ORM\Table(name="metric", indexes={@ORM\Index(name="fk_layers_layers_groups1_idx", columns={"mtr_metric_group_id"}), @ORM\Index(name="fk_layer_user2_idx", columns={"mtr_update_user_id"})})
 * @ORM\Entity
 */
class Metric
{
    /**
     * @var integer
     *
     * @ORM\Column(name="mtr_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="mtr_caption", type="string", length=75, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var boolean
     *
     * @ORM\Column(name="mtr_is_basic_metric", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsBasicMetric;

    /**
     * @var \helena\entities\backoffice\MetricGroup
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\MetricGroup")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mtr_metric_group_id", referencedColumnName="lgr_id", nullable=true)
     * })
     */
    private $MetricGroup;

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
     * @return Metric
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
     * @return Metric
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
     * Set isBasicMetric
     *
     * @param boolean $IsBasicMetric
     *
     * @return Metric
     */
    public function setIsBasicMetric($IsBasicMetric)
    {
        $this->IsBasicMetric = $IsBasicMetric;

        return $this;
    }

    /**
     * Get isBasicMetric
     *
     * @return boolean
     */
    public function getIsBasicMetric()
    {
        return $this->IsBasicMetric;
    }


    /**
     * Set metricGroup
     *
     * @param \helena\entities\backoffice\MetricGroup $metricGroup
     *
     * @return Metric
     */
    public function setMetricGroup(\helena\entities\backoffice\MetricGroup $metricGroup = null)
    {
        $this->MetricGroup = $metricGroup;

        return $this;
    }

    /**
     * Get metricGroup
     *
     * @return \helena\entities\backoffice\MetricGroup
     */
    public function getMetricGroup()
    {
        return $this->MetricGroup;
    }
}

