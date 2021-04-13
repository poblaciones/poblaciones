<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * DraftWorkExtraMetric
 *
 * @ORM\Table(name="draft_work_extra_metric", indexes={@ORM\Index(name="fk_draft_work_per", columns={"wmt_metric_id"}), @ORM\Index(name="fk_draft_work_pe", columns={"wmt_work_id"})})
 * @ORM\Entity
 */
class DraftWorkExtraMetric
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
     * @var \helena\entities\backoffice\DraftMetric
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetric")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wmt_metric_id", referencedColumnName="mtr_id", nullable=false)
     * })
     */
    private $Metric;

    /**
     * @var \helena\entities\backoffice\DraftWork
     *
		 * @Exclude
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wmt_work_id", referencedColumnName="wrk_id", nullable=false)
     * })
     */
    private $Work;

		/**
     * @var boolean
     *
     * @ORM\Column(name="wmt_start_active", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $StartActive;


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
     * @return DraftWorkExtraMetric
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

		/**
     * Set startActive
     *
     * @param boolean $startActive
     *
     * @return DraftWorkExtraMetric
     */
    public function setStartActive($startActive)
    {
        $this->StartActive = $startActive;

        return $this;
    }

    /**
     * Get startActive
     *
     * @return boolean
     */
    public function getStartActive()
    {
        return $this->StartActive;
    }


    /**
     * Set metric
     *
     * @param \helena\entities\backoffice\DraftMetric $metric
     *
     * @return DraftWorkExtraMetric
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
     * Set work
     *
     * @param \helena\entities\backoffice\DraftWork $work
     *
     * @return DraftWorkExtraMetric
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

