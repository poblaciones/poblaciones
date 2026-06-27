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
     * @var string
     *
     * @ORM\Column(name="mvv_filter_value", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $FilterValue;

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
     * @var boolean
     *
     * @ORM\Column(name="mvv_data_column_is_categorical", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DataColumnIsCategorical;

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
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_gap_data_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $GapDataColumn;

    /**
     * @var string
     *
     * @ORM\Column(name="mvv_gap_data", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $GapData;


    /**
     * @var string
     *
     * @ORM\Column(name="mvv_gap_normalization", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $GapNormalization;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_gap_normalization_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $GapNormalizationColumn;


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
		 * @var string
		 *
		 * @ORM\Column(name="mvv_legend", type="string", length=2000, precision=0, scale=0, nullable=true, unique=false)
		 */
	private $Legend;


	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="mvv_has_gap_same_total", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $HasGapSameTotal;

	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="mvv_is_gap", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
    private $IsGap;

    /**
		 * @var float
		 *
		 * @ORM\Column(name="mvv_perimeter", type="float", precision=6, scale=0, nullable=true, unique=false)
     */
    private $Perimeter;

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
     * Set filterValue
     *
     * @param string $filterValue
     *
     * @return Variable
     */
    public function setFilterValue($filterValue)
    {
        $this->FilterValue = $filterValue;

        return $this;
    }

    /**
     * Get filterValue
     *
     * @return string
     */
    public function getFilterValue()
    {
        return $this->FilterValue;
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
	 * Set HasGapSameTotal
	 *
	 * @param boolean $HasGapSameTotal
	 *
	 * @return Variable
	 */
	public function setHasGapSameTotal($HasGapSameTotal)
	{
		$this->HasGapSameTotal = $HasGapSameTotal;

		return $this;
	}

	/**
	 * Get HasGapSameTotal
	 *
	 * @return boolean
	 */
	public function getHasGapSameTotal()
	{
		return $this->HasGapSameTotal;
	}

	/**
	 * Set isGap
	 *
	 * @param boolean $isGap
	 *
	 * @return Variable
	 */
	public function setIsGap($isGap)
	{
		$this->IsGap = $isGap;

		return $this;
	}

	/**
	 * Get isGap
	 *
	 * @return boolean
	 */
	public function getIsGap()
	{
		return $this->IsGap;
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
     * Set dataColumnIsCategorical
     *
     * @param boolean $dataColumnIsCategorical
     *
     * @return Variable
     */
    public function setDataColumnIsCategorical($dataColumnIsCategorical)
    {
        $this->DataColumnIsCategorical = $dataColumnIsCategorical;

        return $this;
    }

    /**
     * Get dataColumnIsCategorical
     *
     * @return boolean
     */
    public function getDataColumnIsCategorical()
    {
        return $this->DataColumnIsCategorical;
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
		 * Set perimeter
		 *
		 * @param float $perimeter
		 *
		 * @return Variable
		 */
    public function setPerimeter($perimeter)
    {
			$this->Perimeter = $perimeter;

			return $this;
    }

    /**
		 * Get perimeter
		 *
		 * @return float
		 */
    public function getPerimeter()
    {
			return $this->Perimeter;
    }


		/**
		 * Set legend
		 *
		 * @param string $legend
		 *
		 * @return Variable
		 */
    public function setLegend($legend)
    {
			$this->Legend = $legend;

			return $this;
    }

    /**
		 * Get legend
		 *
		 * @return string
		 */
    public function getLegend()
    {
			return $this->Legend;
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

    /**
     * Set gapDataColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $gapDataColumn
     *
     * @return Variable
     */
    public function setGapDataColumn(\helena\entities\backoffice\DatasetColumn $gapDataColumn = null)
    {
        $this->GapDataColumn = $gapDataColumn;
        return $this;
    }

    /**
     * Get gapDataColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getGapDataColumn()
    {
        return $this->GapDataColumn;
    }

    /**
     * Set gapNormalization
     *
     * @param string $gapNormalization
     *
     * @return Variable
     */
    public function setGapNormalization($gapNormalization)
    {
        $this->GapNormalization = $gapNormalization;
        return $this;
    }

    /**
     * Get gapNormalization
     *
     * @return string
     */
    public function getGapNormalization()
    {
        return $this->GapNormalization;
    }

    /**
     * Set gapNormalizationColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $gapNormalizationColumn
     *
     * @return Variable
     */
    public function setGapNormalizationColumn(\helena\entities\backoffice\DatasetColumn $gapNormalizationColumn = null)
    {
        $this->GapNormalizationColumn = $gapNormalizationColumn;
        return $this;
    }

    /**
     * Get gapNormalizationColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getGapNormalizationColumn()
    {
        return $this->GapNormalizationColumn;
    }

    /**
     * Set gapData
     *
     * @param string $gapData
     *
     * @return Variable
     */
    public function setGapData($gapData)
    {
        $this->GapData = $gapData;
        return $this;
    }

    /**
     * Get gapData
     *
     * @return string
     */
    public function getGapData()
    {
        return $this->GapData;
    }

}