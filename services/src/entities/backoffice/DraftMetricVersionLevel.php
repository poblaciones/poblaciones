<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * DraftMetricVersionLevel
 *
 * @ORM\Table(name="draft_metric_version_level", indexes={@ORM\Index(name="fk_draft_metric_version_level_draft_metric_version1_idx", columns={"mvl_metric_version_id"}),  @ORM\Index(name="draft_fk_layer_version_work1_idx", columns={"mvl_work_id"})})
 * @ORM\Entity
 */
class DraftMetricVersionLevel
{
    /**
     * @var integer
     *
     * @ORM\Column(name="mvl_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="mvl_partial_coverage", type="string", length=500, precision=0, scale=0, nullable=true, unique=false)
     */
    private $PartialCoverage;

    /**
     * @var \helena\entities\backoffice\DraftDataset
     *
     * @Exclude
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDataset")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvl_dataset_id", referencedColumnName="dat_id", nullable=false)
     * })
     */
    private $Dataset;

    /**
     * @var \helena\entities\backoffice\DraftMetricVersion
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetricVersion", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvl_metric_version_id", referencedColumnName="mvr_id", nullable=false)
     * })
     */
    private $MetricVersion;

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
     * @return DraftMetricVersionLevel
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set partialCoverage
     *
     * @param string $partialCoverage
     *
     * @return DraftMetricVersionLevel
     */
    public function setPartialCoverage($partialCoverage)
    {
        $this->PartialCoverage = $partialCoverage;

        return $this;
    }

    /**
     * Get partialCoverage
     *
     * @return string
     */
    public function getPartialCoverage()
    {
        return $this->PartialCoverage;
    }

    /**
     * Set dataset
     *
     * @param \helena\entities\backoffice\DraftDataset $dataset
     *
     * @return DraftMetricVersionLevel
     */
    public function setDataset(\helena\entities\backoffice\DraftDataset $dataset = null)
    {
        $this->Dataset = $dataset;

        return $this;
    }

    /**
     * Get dataset
     *
     * @return \helena\entities\backoffice\DraftDataset
     */
    public function getDataset()
    {
        return $this->Dataset;
    }


    /**
     * Set metricVersion
     *
     * @param \helena\entities\backoffice\DraftMetricVersion $metricVersion
     *
     * @return DraftMetricVersionLevel
     */
    public function setMetricVersion(\helena\entities\backoffice\DraftMetricVersion $metricVersion = null)
    {
        $this->MetricVersion = $metricVersion;

        return $this;
    }

    /**
     * Get metricVersion
     *
     * @return \helena\entities\backoffice\DraftMetricVersion
     */
    public function getMetricVersion()
    {
        return $this->MetricVersion;
    }
}

