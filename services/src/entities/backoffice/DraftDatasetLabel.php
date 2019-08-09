<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftDatasetLabel
 *
 * @ORM\Table(name="draft_dataset_label", indexes={@ORM\Index(name="draft_fk_datasets_labels_datasets_columns1_idx", columns={"dla_dataset_column_id"})})
 * @ORM\Entity
 */
class DraftDatasetLabel
{
    /**
     * @var integer
     *
     * @ORM\Column(name="dla_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="dla_value", type="string", length=20, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Value;

    /**
     * @var string
     *
     * @ORM\Column(name="dla_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;


    /**
     * @var integer
     *
     * @ORM\Column(name="dla_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Order;

    /**
     * @var \helena\entities\backoffice\DraftDatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dla_dataset_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $DatasetColumn;


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
     * @return DraftDatasetLabel
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set order
     *
     * @param integer $order
     *
     * @return DraftDatasetLabel
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
     * Set value
     *
     * @param string $value
     *
     * @return DraftDatasetLabel
     */
    public function setValue($value)
    {
        $this->Value = $value;

        return $this;
    }

    /**
     * Get value
     *
     * @return string
     */
    public function getValue()
    {
        return $this->Value;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return DraftDatasetLabel
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
     * Set datasetColumn
     *
     * @param \helena\entities\backoffice\DraftDatasetColumn $datasetColumn
     *
     * @return DraftDatasetLabel
     */
    public function setDatasetColumn(\helena\entities\backoffice\DraftDatasetColumn $datasetColumn = null)
    {
        $this->DatasetColumn = $datasetColumn;

        return $this;
    }

    /**
     * Get datasetColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
     */
    public function getDatasetColumn()
    {
        return $this->DatasetColumn;
    }
}

