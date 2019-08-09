<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * MetricVersion
 *
 * @ORM\Table(name="metric_version", indexes={@ORM\Index(name="fk_versions_layers1_idx", columns={"mvr_metric_id"})})
 * @ORM\Entity
 */
class MetricVersion
{
    /**
     * @var integer
     *
     * @ORM\Column(name="mvr_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="mvr_caption", type="string", length=10, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;


    /**
     * @var integer
     *
     * @ORM\Column(name="mvr_order", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Order;

    /**
     * @var \helena\entities\backoffice\Metric
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metric")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvr_metric_id", referencedColumnName="mtr_id", nullable=false)
     * })
     */
    private $Metric;

    /**
     * @var \helena\entities\backoffice\Work
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Work")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvr_work_id", referencedColumnName="wrk_id", nullable=false)
     * })
     */
    private $Work;

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
     * @return MetricVersion
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
     * @return MetricVersion
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
     * @return MetricVersion
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
     * Set metric
     *
     * @param \helena\entities\backoffice\Metric $metric
     *
     * @return MetricVersion
     */
    public function setMetric(\helena\entities\backoffice\Metric $metric = null)
    {
        $this->Metric = $metric;

        return $this;
    }

    /**
     * Get metric
     *
     * @return \helena\entities\backoffice\Metric
     */
    public function getMetric()
    {
        return $this->Metric;
    }


    /**
     * Set work
     *
     * @param \helena\entities\backoffice\Work $work
     *
     * @return MetricVersion
     */
    public function setWork(\helena\entities\backoffice\Work $work = null)
    {
        $this->Work = $work;

        return $this;
    }

    /**
     * Get work
     *
     * @return \helena\entities\backoffice\Work
     */
    public function getWork()
    {
        return $this->Work;
    }
}
