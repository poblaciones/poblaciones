<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;

/**
 * DraftVariableValueLabel
 *
 * @ORM\Table(name="draft_variable_value_label", indexes={@ORM\Index(name="draft_fk_variable_value_label_variable_level1_idx", columns={"vvl_version_level_variable_id"})})
 * @ORM\Entity
 */
class DraftVariableValueLabel
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
		 * @ORM\Column(name="vvl_caption", type="string", length=50, precision=0, scale=0, nullable=false, unique=false)
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
		 * @var \helena\entities\backoffice\DraftVariable
		 *
		 * @Exclude
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftVariable", fetch="EAGER")
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
		 * @return DraftVariableValueLabel
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
		 * @return DraftVariableValueLabel
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
		 * Set visible
		 *
		 * @param boolean $visible
		 *
		 * @return DraftVariableValueLabel
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
		 * @return DraftVariableValueLabel
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
		 * @return DraftVariableValueLabel
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
		 * @return DraftVariableValueLabel
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
		 * @return DraftVariableValueLabel
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
		* @param \helena\entities\backoffice\DraftVariable $variable
		*
		* @return DraftVariableValueLabel
		*/
		public function setVariable(\helena\entities\backoffice\DraftVariable $variable = null)
		{
				$this->Variable = $variable;

				return $this;
		}

		/**
		 * Get variable
		 *
		 * @return \helena\entities\backoffice\DraftVariable
		 */
		public function getVariable()
		{
				return $this->Variable;
		}
}

