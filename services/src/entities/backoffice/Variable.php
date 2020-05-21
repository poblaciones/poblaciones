<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * Variable
 *
 * @ORM\Table(name="variable", indexes={@ORM\Index(name="fk_layer_version_variable_dataset_column1_idx", columns={"mvv_data_column_id"}), @ORM\Index(name="fk_layer_version_variable_layer_version1_idx1", columns={"mvv_metric_version_id"})})
 * @ORM\Entity
 */
class Variable
{
    /**
     * @var integer
     *
     * @ORM\Column(name="mvv_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="mvv_caption", type="string", length=255, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var integer
     *
     * @ORM\Column(name="mvv_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var string
     *
     * @ORM\Column(name="mvv_data", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Data;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_data_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $DataColumn;


    /**
     * @var string
     *
     * @ORM\Column(name="mvv_normalization", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Normalization;

		 /**
     * @var boolean
     *
     * @ORM\Column(name="mvv_is_default", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsDefault;

    /**
     * @var string
     *
     * @ORM\Column(name="mvv_default_measure", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $DefaultMeasure;

    /**
     * @var float
     *
     * @ORM\Column(name="mvv_normalization_scale", type="float", precision=10, scale=0, nullable=false, unique=false)
     */
    private $NormalizationScale;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_normalization_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $NormalizationColumn;

    /**
     * @var \helena\entities\backoffice\MetricVersionLevel
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\MetricVersionLevel")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_metric_version_level_id", referencedColumnName="mvl_id", nullable=true)
     * })
     */
    private $MetricVersionLevel;


		  /**
     * @var \helena\entities\backoffice\Symbology
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Symbology", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_symbology_id", referencedColumnName="vsy_id", nullable=true)
     * })
     */
    private $Symbology;


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
     * @return Variable
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
     * @return Variable
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
     * @return Variable
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
     * Set isDefault
     *
     * @param boolean $isDefault
     *
     * @return Variable
     */
    public function setIsDefault($isDefault)
    {
        $this->IsDefault = $isDefault;

        return $this;
    }

    /**
     * Get isDefault
     *
     * @return boolean
     */
    public function getIsDefault()
    {
        return $this->IsDefault;
    }

		/**
     * Set defaultMeasure
     *
     * @param string $defaultMeasure
     *
     * @return Variable
     */
    public function setDefaultMeasure($defaultMeasure)
    {
        $this->DefaultMeasure = $defaultMeasure;

        return $this;
    }

    /**
     * Get defaultMeasure
     *
     * @return string
     */
    public function getDefaultMeasure()
    {
        return $this->DefaultMeasure;
    }

    /**
     * Set data
     *
     * @param string $data
     *
     * @return Variable
     */
    public function setData($data)
    {
        $this->Data = $data;

        return $this;
    }

    /**
     * Get data
     *
     * @return string
     */
    public function getData()
    {
        return $this->Data;
    }


    /**
     * Set dataColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $dataColumn
     *
     * @return Variable
     */
    public function setDataColumn(\helena\entities\backoffice\DatasetColumn $dataColumn = null)
    {
        $this->DataColumn = $dataColumn;

        return $this;
    }

    /**
     * Get dataColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getDataColumn()
    {
        return $this->DataColumn;
    }


    /**
     * Set symbology
     *
     * @param \helena\entities\backoffice\Symbology $symbology
     *
     * @return Variable
     */
    public function setSymbology(\helena\entities\backoffice\Symbology $symbology = null)
    {
        $this->Symbology = $symbology;

        return $this;
    }

    /**
     * Get symbology
     *
     * @return \helena\entities\backoffice\Symbology
     */
    public function getSymbology()
    {
        return $this->Symbology;
    }


		 /**
     * Set normalization
     *
     * @param string $normalization
     *
     * @return Variable
     */
    public function setNormalization($normalization)
    {
        $this->Normalization = $normalization;

        return $this;
    }

    /**
     * Get normalization
     *
     * @return string
     */
    public function getNormalization()
    {
        return $this->Normalization;
    }

    /**
     * Set normalizationScale
     *
     * @param float $normalizationScale
     *
     * @return Variable
     */
    public function setNormalizationScale($normalizationScale)
    {
        $this->NormalizationScale = $normalizationScale;

        return $this;
    }

    /**
     * Get normalizationScale
     *
     * @return float
     */
    public function getNormalizationScale()
    {
        return $this->NormalizationScale;
    }

    /**
     * Set normalizationColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $normalizationColumn
     *
     * @return Variable
     */
    public function setNormalizationColumn(\helena\entities\backoffice\DatasetColumn $normalizationColumn = null)
    {
        $this->NormalizationColumn = $normalizationColumn;

        return $this;
    }

    /**
     * Get normalizationColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getNormalizationColumn()
    {
        return $this->NormalizationColumn;
    }


    /**
     * Set metricVersionLevel
     *
     * @param \helena\entities\backoffice\MetricVersionLevel $metricVersionLevel
     *
     * @return Variable
     */
    public function setMetricVersionLevel(\helena\entities\backoffice\MetricVersionLevel $metricVersionLevel = null)
    {
        $this->MetricVersionLevel = $metricVersionLevel;

        return $this;
    }

    /**
     * Get metricVersionLevel
     *
     * @return \helena\entities\backoffice\MetricVersionLevel
     */
    public function getMetricVersionLevel()
    {
        return $this->MetricVersionLevel;
    }
}

