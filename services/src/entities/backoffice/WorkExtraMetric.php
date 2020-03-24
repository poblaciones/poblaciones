<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;
use JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * WorkExtraMetric
 *
 * @ORM\Table(name="work_extra_metric", indexes={@ORM\Index(name="fk_work_per", columns={"wmt_metric_id"}), @ORM\Index(name="fk_work_pe", columns={"wmt_work_id"})})
 * @ORM\Entity
 */
class WorkExtraMetric
{
    /**
     * @var integer
     *
     * @ORM\Column(name="wmt_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var \helena\entities\backoffice\Metric
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metric")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wmt_metric_id", referencedColumnName="mtr_id", nullable=false)
     * })
     */
    private $Metric;

    /**
     * @var \helena\entities\backoffice\Work
     *
		 * @Exclude
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Work")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wmt_work_id", referencedColumnName="wrk_id", nullable=false)
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
     * @return WorkExtraMetric
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set metric
     *
     * @param \helena\entities\backoffice\Metric $metric
     *
     * @return WorkExtraMetric
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
     * @return WorkExtraMetric
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

