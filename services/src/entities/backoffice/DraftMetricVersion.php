<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * DraftMetricVersion
 *
 * @ORM\Table(name="draft_metric_version", indexes={@ORM\Index(name="draft_fk_versions_layers1_idx", columns={"mvr_metric_id"})})
 * @ORM\Entity
 */
class DraftMetricVersion
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
     * @ORM\Column(name="mvr_caption", type="string", length=20, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var integer
     *
     * @ORM\Column(name="mvr_order", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Order;


    /**
     * @var boolean
     *
     * @ORM\Column(name="mvr_multilevel", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Multilevel;

    /**
     * @var \helena\entities\backoffice\DraftMetric
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetric", fetch="EAGER", cascade={"persist"})
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvr_metric_id", referencedColumnName="mtr_id",  nullable=false)
     * })
     */
    private $Metric;

		/**
     * @var \helena\entities\backoffice\DraftWork
     *
     * @Exclude
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork", fetch="EAGER")
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
     * @return DraftMetricVersion
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
     * @return DraftMetricVersion
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
     * Set metric
     *
     * @param \helena\entities\backoffice\DraftMetric $metric
     *
     * @return DraftMetricVersion
     */
    public function setMetric(\helena\entities\backoffice\DraftMetric $metric = null)
    {
        $this->Metric = $metric;

        return $this;
    }

    /**
     * Get metric
     *
     * @return \helena\entities\backoffice\DraftMetric
     */
    public function getMetric()
    {
        return $this->Metric;
    }

    /**
     * Set multilevel
     *
     * @param boolean $multilevel
     *
     * @return DraftMetricVersion
     */
    public function setMultilevel($multilevel)
    {
        $this->Multilevel = $multilevel;

        return $this;
    }

    /**
     * Get multilevel
     *
     * @return boolean
     */
    public function getMultilevel()
    {
        return $this->Multilevel;
    }


    /**
     * Set order
     *
     * @param integer $order
     *
     * @return DraftMetricVersion
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
     * Set work
     *
     * @param \helena\entities\backoffice\DraftWork $work
     *
     * @return DraftMetricVersion
     */
    public function setWork(\helena\entities\backoffice\DraftWork $work = null)
    {
        $this->Work = $work;

        return $this;
    }

    /**
     * Get work
     *
     * @return \helena\entities\backoffice\DraftWork
     */
    public function getWork()
    {
        return $this->Work;
    }
}
