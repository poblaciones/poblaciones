<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * DraftVariable
 *
 * @ORM\Table(name="draft_variable", indexes={@ORM\Index(name="draft_fk_layer_version_variable_dataset_column1_idx", columns={"mvv_data_column_id"}), @ORM\Index(name="draft_fk_layer_version_variable_layer_version1_idx1", columns={"mvv_metric_version_id"})})
 * @ORM\Entity
 */
class DraftVariable
{
		// Colección no mapeada
		public $Values;

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
     * @var \helena\entities\backoffice\DraftDatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_data_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $DataColumn;

	  /**
     * @var boolean
     *
     * @ORM\Column(name="mvv_data_column_is_categorical", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DataColumnIsCategorical;

    /**
     * @var \helena\entities\backoffice\DraftMetricVersionLevel
     *
     * @Exclude
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftMetricVersionLevel", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="mvv_metric_version_level_id", referencedColumnName="mvl_id", nullable=true)
     * })
     */
    private $MetricVersionLevel;

    /**
     * @var string
     *
     * @ORM\Column(name="mvv_normalization", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Normalization;

    /**
     * @var float
     *
     * @ORM\Column(name="mvv_normalization_scale", type="float", precision=10, scale=0, nullable=false, unique=false)
     */
    private $NormalizationScale;

    /**
     * @var \helena\entities\backoffice\DraftDatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn", fetch="EAGER")
     * @ORM\JoinColumns({
		 *   @ORM\JoinColumn(name="mvv_normalization_column_id", referencedColumnName="dco_id", nullable=true)
		 * })
		 */
    private $NormalizationColumn;

		/**
		 * @var string
		 *
		 * @ORM\Column(name="mvv_legend", type="string", length=2000, precision=0, scale=0, nullable=true, unique=false)
		 */
    private $Legend;


		/**
		 * @var string
		 *
		 * @ORM\Column(name="mvv_perimeter", type="float", precision=6, scale=0, nullable=true, unique=false)
     */
    private $Perimeter;

		/**
     * @var \helena\entities\backoffice\DraftSymbology
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftSymbology", fetch="EAGER")
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
     * @return DraftVariable
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
     * @return DraftVariable
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
     * @return DraftVariable
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
     * @return DraftVariable
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
     * @return DraftVariable
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
     * @return DraftVariable
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
     * @return DraftVariable
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
		 * Set legend
		 *
		 * @param string $legend
		 *
		 * @return DraftVariable
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
		 * Set perimeter
		 *
		 * @param float $perimeter
		 *
		 * @return DraftVariable
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
     * Set data
     *
     * @param string $data
     *
     * @return DraftVariable
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
     * @param \helena\entities\backoffice\DraftDatasetColumn $dataColumn
     *
     * @return DraftVariable
     */
    public function setDataColumn(\helena\entities\backoffice\DraftDatasetColumn $dataColumn = null)
    {
        $this->DataColumn = $dataColumn;

        return $this;
    }

    /**
     * Get dataColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getDataColumn()
    {
        return $this->DataColumn;
    }

		/**
     * Set symbology
     *
     * @param \helena\entities\backoffice\DraftSymbology $symbology
     *
     * @return DraftVariable
     */
    public function setSymbology(\helena\entities\backoffice\DraftSymbology $symbology = null)
    {
        $this->Symbology = $symbology;

        return $this;
    }

    /**
     * Get symbology
     *
     * @return \helena\entities\backoffice\DraftSymbology
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
     * @return DraftVariable
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
     * @return DraftVariable
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
     * @param \helena\entities\backoffice\DraftDatasetColumn $normalizationColumn
     *
     * @return DraftVariable
     */
    public function setNormalizationColumn(\helena\entities\backoffice\DraftDatasetColumn $normalizationColumn = null)
    {
        $this->NormalizationColumn = $normalizationColumn;

        return $this;
    }

    /**
     * Get normalizationColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getNormalizationColumn()
    {
        return $this->NormalizationColumn;
    }


    /**
     * Set metricVersionLevel
     *
     * @param \helena\entities\backoffice\DraftMetricVersionLevel $metricVersionLevel
     *
     * @return DraftVariable
     */
    public function setMetricVersionLevel(\helena\entities\backoffice\DraftMetricVersionLevel $metricVersionLevel = null)
    {
        $this->MetricVersionLevel = $metricVersionLevel;

        return $this;
    }

    /**
     * Get metricVersionLevel
     *
     * @return \helena\entities\backoffice\DraftMetricVersionLevel
     */
    public function getMetricVersionLevel()
    {
        return $this->MetricVersionLevel;
    }
}

