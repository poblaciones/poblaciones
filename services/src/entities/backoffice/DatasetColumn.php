<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DatasetColumn
 *
 * @ORM\Table(name="dataset_column", indexes={@ORM\Index(name="fk_datasets_columns_datasets1_idx", columns={"dco_dataset_id"}), @ORM\Index(name="fk_dataset_column_dataset_column1_idx", columns={"dco_aggregation_weight_id"})})
 * @ORM\Entity
 */
class DatasetColumn
{
    /**
     * @var integer
     *
     * @ORM\Column(name="dco_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="dco_field", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Field;

    /**
     * @var string
     *
     * @ORM\Column(name="dco_variable", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Variable;

    /**
     * @var string
     *
     * @ORM\Column(name="dco_caption", type="string", length=255, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="dco_label", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Label;

    /**
     * @var integer
     *
     * @ORM\Column(name="dco_column_width", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ColumnWidth;

    /**
     * @var integer
     *
     * @ORM\Column(name="dco_field_width", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $FieldWidth;

    /**
     * @var integer
     *
     * @ORM\Column(name="dco_decimals", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Decimals;

    /**
     * @var integer
     *
     * @ORM\Column(name="dco_format", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Format;

    /**
     * @var integer
     *
     * @ORM\Column(name="dco_measure", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Measure;

    /**
     * @var integer
     *
     * @ORM\Column(name="dco_alignment", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Alignment;

    /**
     * @var boolean
     *
     * @ORM\Column(name="dco_use_in_summary", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $UseInSummary;

    /**
     * @var boolean
     *
     * @ORM\Column(name="dco_use_in_export", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $UseInExport;

    /**
     * @var integer
     *
     * @ORM\Column(name="dco_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var string
     *
     * @ORM\Column(name="dco_aggregation", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Aggregation;

    /**
     * @var string
     *
     * @ORM\Column(name="dco_aggregation_label", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $AggregationLabel;

    /**
     * @var string
     *
     * @ORM\Column(name="dco_aggregation_transpose_labels", type="text", length=65535, precision=0, scale=0, nullable=true, unique=false)
     */
    private $AggregationTransposeLabels;

    /**
     * @var \helena\entities\backoffice\Dataset
	   *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Dataset")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dco_dataset_id", referencedColumnName="dat_id", nullable=true)
     * })
     */
    private $Dataset;

    /**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dco_aggregation_weight_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $AggregationWeight;


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
     * @return DatasetColumn
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set field
     *
     * @param string $field
     *
     * @return DatasetColumn
     */
    public function setField($field)
    {
        $this->Field = $field;

        return $this;
    }

    /**
     * Get field
     *
     * @return string
     */
    public function getField()
    {
        return $this->Field;
    }

    /**
     * Set variable
     *
     * @param string $variable
     *
     * @return DatasetColumn
     */
    public function setVariable($variable)
    {
        $this->Variable = $variable;

        return $this;
    }

    /**
     * Get variable
     *
     * @return string
     */
    public function getVariable()
    {
        return $this->Variable;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return DatasetColumn
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
     * Set label
     *
     * @param string $label
     *
     * @return DatasetColumn
     */
    public function setLabel($label)
    {
        $this->Label = $label;

        return $this;
    }

    /**
     * Get label
     *
     * @return string
     */
    public function getLabel()
    {
        return $this->Label;
    }

    /**
     * Set columnWidth
     *
     * @param integer $columnWidth
     *
     * @return DatasetColumn
     */
    public function setColumnWidth($columnWidth)
    {
        $this->ColumnWidth = $columnWidth;

        return $this;
    }

    /**
     * Get columnWidth
     *
     * @return integer
     */
    public function getColumnWidth()
    {
        return $this->ColumnWidth;
    }

    /**
     * Set fieldWidth
     *
     * @param integer $fieldWidth
     *
     * @return DatasetColumn
     */
    public function setFieldWidth($fieldWidth)
    {
        $this->FieldWidth = $fieldWidth;

        return $this;
    }

    /**
     * Get fieldWidth
     *
     * @return integer
     */
    public function getFieldWidth()
    {
        return $this->FieldWidth;
    }

    /**
     * Set decimals
     *
     * @param integer $decimals
     *
     * @return DatasetColumn
     */
    public function setDecimals($decimals)
    {
        $this->Decimals = $decimals;

        return $this;
    }

    /**
     * Get decimals
     *
     * @return integer
     */
    public function getDecimals()
    {
        return $this->Decimals;
    }

    /**
     * Set format
     *
     * @param integer $format
     *
     * @return DatasetColumn
     */
    public function setFormat($format)
    {
        $this->Format = $format;

        return $this;
    }

    /**
     * Get format
     *
     * @return integer
     */
    public function getFormat()
    {
        return $this->Format;
    }

    /**
     * Set measure
     *
     * @param integer $measure
     *
     * @return DatasetColumn
     */
    public function setMeasure($measure)
    {
        $this->Measure = $measure;

        return $this;
    }

    /**
     * Get measure
     *
     * @return integer
     */
    public function getMeasure()
    {
        return $this->Measure;
    }

    /**
     * Set alignment
     *
     * @param integer $alignment
     *
     * @return DatasetColumn
     */
    public function setAlignment($alignment)
    {
        $this->Alignment = $alignment;

        return $this;
    }

    /**
     * Get alignment
     *
     * @return integer
     */
    public function getAlignment()
    {
        return $this->Alignment;
    }

    /**
     * Set useInSummary
     *
     * @param boolean $useInSummary
     *
     * @return DatasetColumn
     */
    public function setUseInSummary($useInSummary)
    {
        $this->UseInSummary = $useInSummary;

        return $this;
    }

    /**
     * Get useInSummary
     *
     * @return boolean
     */
    public function getUseInSummary()
    {
        return $this->UseInSummary;
    }

    /**
     * Set useInExport
     *
     * @param boolean $useInExport
     *
     * @return DatasetColumn
     */
    public function setUseInExport($useInExport)
    {
        $this->UseInExport = $useInExport;

        return $this;
    }

    /**
     * Get useInExport
     *
     * @return boolean
     */
    public function getUseInExport()
    {
        return $this->UseInExport;
    }

    /**
     * Set order
     *
     * @param integer $order
     *
     * @return DatasetColumn
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
     * Set aggregation
     *
     * @param string $aggregation
     *
     * @return DatasetColumn
     */
    public function setAggregation($aggregation)
    {
        $this->Aggregation = $aggregation;

        return $this;
    }

    /**
     * Get aggregation
     *
     * @return string
     */
    public function getAggregation()
    {
        return $this->Aggregation;
    }

    /**
     * Set aggregationLabel
     *
     * @param string $aggregationLabel
     *
     * @return DatasetColumn
     */
    public function setAggregationLabel($aggregationLabel)
    {
        $this->AggregationLabel = $aggregationLabel;

        return $this;
    }

    /**
     * Get aggregationLabel
     *
     * @return string
     */
    public function getAggregationLabel()
    {
        return $this->AggregationLabel;
    }

    /**
     * Set aggregationTransposeLabels
     *
     * @param string $aggregationTransposeLabels
     *
     * @return DatasetColumn
     */
    public function setAggregationTransposeLabels($aggregationTransposeLabels)
    {
        $this->AggregationTransposeLabels = $aggregationTransposeLabels;

        return $this;
    }

    /**
     * Get aggregationTransposeLabels
     *
     * @return string
     */
    public function getAggregationTransposeLabels()
    {
        return $this->AggregationTransposeLabels;
    }

    /**
     * Set dataset
     *
     * @param \helena\entities\backoffice\Dataset $dataset
     *
     * @return DatasetColumn
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
     * Set aggregationWeight
     *
     * @param \helena\entities\backoffice\DatasetColumn $aggregationWeight
     *
     * @return DatasetColumn
     */
    public function setAggregationWeight(\helena\entities\backoffice\DatasetColumn $aggregationWeight = null)
    {
        $this->AggregationWeight = $aggregationWeight;

        return $this;
    }

    /**
     * Get aggregationWeight
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getAggregationWeight()
    {
        return $this->AggregationWeight;
    }
}

