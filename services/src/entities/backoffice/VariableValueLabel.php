<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * VariableValueLabel
 *
 * @ORM\Table(name="variable_value_label", indexes={@ORM\Index(name="fk_variable_value_label_variable_level1_idx", columns={"vvl_version_level_variable_id"})})
 * @ORM\Entity
 */
class VariableValueLabel
{
    /**
     * @var integer
     *
     * @ORM\Column(name="vvl_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="vvl_caption", type="string", length=250, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var boolean
     *
     * @ORM\Column(name="vvl_visible", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Visible;

    /**
     * @var float
     *
     * @ORM\Column(name="vvl_value", type="float", precision=10, scale=0, nullable=true, unique=false)
     */
    private $Value;

		/**
		 * @var string
		 *
		 * @ORM\Column(name="vvl_symbol", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
		 */
    private $Symbol;

    /**
     * @var string
     *
     * @ORM\Column(name="vvl_fill_color", type="string", length=6, precision=0, scale=0, nullable=true, unique=false)
     */
    private $FillColor;

    /**
     * @var string
     *
     * @ORM\Column(name="vvl_line_color", type="string", length=6, precision=0, scale=0, nullable=true, unique=false)
     */
    private $LineColor;

    /**
     * @var integer
     *
     * @ORM\Column(name="vvl_order", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Order;

    /**
     * @var \helena\entities\backoffice\Variable
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Variable")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="vvl_variable_id", referencedColumnName="mvv_id", nullable=false)
     * })
     */
    private $Variable;


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
     * @return VariableValueLabel
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
     * @return VariableValueLabel
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
		 * Set symbol
		 *
		 * @param string $symbol
		 *
		 * @return VariableValueLabel
		 */
		public function setSymbol($symbol)
		{
			$this->Symbol = $symbol;

			return $this;
		}

		/**
		 * Get symbol
		 *
		 * @return string
		 */
		public function getSymbol()
		{
			return $this->Symbol;
		}

    /**
     * Set visible
     *
     * @param boolean $visible
     *
     * @return VariableValueLabel
     */
    public function setVisible($visible)
    {
        $this->Visible = $visible;

        return $this;
    }

    /**
     * Get visible
     *
     * @return boolean
     */
    public function getVisible()
    {
        return $this->Visible;
    }

    /**
     * Set value
     *
     * @param float $value
     *
     * @return VariableValueLabel
     */
    public function setValue($value)
    {
        $this->Value = $value;

        return $this;
    }

    /**
     * Get value
     *
     * @return float
     */
    public function getValue()
    {
        return $this->Value;
    }

    /**
     * Set fillColor
     *
     * @param string $fillColor
     *
     * @return VariableValueLabel
     */
    public function setFillColor($fillColor)
    {
        $this->FillColor = $fillColor;

        return $this;
    }

    /**
     * Get fillColor
     *
     * @return string
     */
    public function getFillColor()
    {
        return $this->FillColor;
    }

    /**
     * Set lineColor
     *
     * @param string $lineColor
     *
     * @return VariableValueLabel
     */
    public function setLineColor($lineColor)
    {
        $this->LineColor = $lineColor;

        return $this;
    }

    /**
     * Get lineColor
     *
     * @return string
     */
    public function getLineColor()
    {
        return $this->LineColor;
    }

    /**
     * Set order
     *
     * @param integer $order
     *
     * @return VariableValueLabel
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
     * Set variable
     *
     * @param \helena\entities\backoffice\Variable $variable
     *
     * @return VariableValueLabel
     */
    public function setVariable(\helena\entities\backoffice\Variable $variable = null)
    {
        $this->Variable = $variable;

        return $this;
    }

    /**
     * Get variable
     *
     * @return \helena\entities\backoffice\Variable
     */
    public function getVariable()
    {
        return $this->Variable;
    }
}

