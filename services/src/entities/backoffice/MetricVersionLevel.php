<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * MetricVersionLevel
 *
 * @ORM\Table(name="metric_version_level", indexes={@ORM\Index(name="fk_metric_version_level_metric_version1_idx", columns={"mvl_metric_level_id"}), @ORM\Index(name="fk_layer_version_work1_idx", columns={"mvl_work_id"})})
 * @ORM\Entity
 */
class MetricVersionLevel
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
     * @var \helena\entities\backoffice\Dataset
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Dataset")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvl_dataset_id", referencedColumnName="dat_id", nullable=false)
     * })
     */
    private $Dataset;

    /**
     * @var \helena\entities\backoffice\MetricVersion
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\MetricVersion")
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
     * @return MetricVersionLevel
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
     * @return MetricVersionLevel
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
     * @param \helena\entities\backoffice\Dataset $dataset
     *
     * @return MetricVersionLevel
     */
    public function setDataset(\helena\entities\backoffice\Dataset $dataset = null)
    {
        $this->Dataset = $dataset;

        return $this;
    }

    /**
     * Get dataset
     *
     * @return \helena\entities\backoffice\Dataset
     */
    public function getDataset()
    {
        return $this->Dataset;
    }

    /**
     * Set metricVersion
     *
     * @param \helena\entities\backoffice\MetricVersion $metricVersion
     *
     * @return MetricVersionLevel
     */
    public function setMetricVersion(\helena\entities\backoffice\MetricVersion $metricVersion = null)
    {
        $this->MetricVersion = $metricVersion;

        return $this;
    }

    /**
     * Get metricVersion
     *
     * @return \helena\entities\backoffice\MetricVersion
     */
    public function getMetricVersion()
    {
        return $this->MetricVersion;
    }
}

