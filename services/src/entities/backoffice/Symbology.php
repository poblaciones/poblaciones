<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * Symbology
 *
 * @ORM\Table(name="symbology")
 * @ORM\Entity
 */
class Symbology
{
    /**
     * @var integer
     *
     * @ORM\Column(name="vsy_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="vsy_color_from", type="string", length=6, precision=0, scale=0, nullable=true, unique=false)
     */
    private $ColorFrom;

    /**
     * @var string
     *
     * @ORM\Column(name="vsy_color_to", type="string", length=6, precision=0, scale=0, nullable=true, unique=false)
     */
    private $ColorTo;

    /**
     * @var integer
     *
     * @ORM\Column(name="vsy_rainbow", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Rainbow;

    /**
     * @var integer
     *
     * @ORM\Column(name="vsy_opacity", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Opacity;

		 /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_null_category", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $NullCategory;

    /**
     * @var integer
     *
     * @ORM\Column(name="vsy_pattern", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Pattern;

    /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_show_values", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowValues;

    /**
     * @var string
     *
     * @ORM\Column(name="vsy_palette_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $PaletteType;


    /**
     * @var string
     *
     * @ORM\Column(name="vsy_custom_colors", type="string", length=2048, precision=0, scale=0, nullable=false, unique=false)
     */
    private $CustomColors;

    /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_show_labels", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowLabels;

    /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_show_totals", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowTotals;

	   /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_show_empty_categories", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowEmptyCategories;

		 /**
     * @var float
     *
     * @ORM\Column(name="vsy_round", type="float", precision=6, scale=0, nullable=false, unique=false)
     */
    private $Round;

		 /**
     * @var integer
     *
     * @ORM\Column(name="vsy_categories", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Categories;

		 /**
     * @var string
     *
     * @ORM\Column(name="vsy_cut_mode", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $CutMode;

    /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_rainbow_reverse", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $RainbowReverse;

		/**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="vsy_cut_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $CutColumn;


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
     * @return Symbology
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set colorFrom
     *
     * @param string $colorFrom
     *
     * @return Symbology
     */
    public function setColorFrom($colorFrom)
    {
        $this->ColorFrom = $colorFrom;

        return $this;
    }

    /**
     * Get colorFrom
     *
     * @return string
     */
    public function getColorFrom()
    {
        return $this->ColorFrom;
    }


    /**
     * Set customColors
     *
     * @param string $customColors
     *
     * @return Symbology
     */
    public function setCustomColors($customColors)
    {
        $this->CustomColors = $customColors;

        return $this;
    }

    /**
     * Get customColors
     *
     * @return string
     */
    public function getCustomColors()
    {
        return $this->CustomColors;
    }

    /**
     * Set colorTo
     *
     * @param string $colorTo
     *
     * @return Symbology
     */
    public function setColorTo($colorTo)
    {
        $this->ColorTo = $colorTo;

        return $this;
    }

    /**
     * Get colorTo
     *
     * @return string
     */
    public function getColorTo()
    {
        return $this->ColorTo;
    }


    /**
     * Set categories
     *
     * @param integer $categories
     *
     * @return Symbology
     */
    public function setCategories($categories)
    {
        $this->Categories = $categories;

        return $this;
    }

    /**
     * Get categories
     *
     * @return integer
     */
    public function getCategories()
    {
        return $this->Categories;
    }

    /**
     * Set round
     *
     * @param float $round
     *
     * @return Symbology
     */
    public function setRound($round)
    {
        $this->Round = $round;

        return $this;
    }

    /**
     * Get round
     *
     * @return float
     */
    public function getRound()
    {
        return $this->Round;
    }


    /**
     * Set palettePaletteType
     *
     * @param string $palettePaletteType
     *
     * @return Symbology
     */
    public function setPaletteType($palettePaletteType)
    {
        $this->PaletteType = $palettePaletteType;

        return $this;
    }

    /**
     * Get palettePaletteType
     *
     * @return string
     */
    public function getPaletteType()
    {
        return $this->PaletteType;
    }

    /**
     * Set cutMode
     *
     * @param string $cutMode
     *
     * @return Symbology
     */
    public function setCutMode($cutMode)
    {
        $this->CutMode = $cutMode;

        return $this;
    }

    /**
     * Get cutMode
     *
     * @return string
     */
    public function getCutMode()
    {
        return $this->CutMode;
    }

    /**
     * Set cutColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $cutColumn
     *
     * @return Symbology
     */
    public function setCutColumn(\helena\entities\backoffice\DatasetColumn $cutColumn = null)
    {
        $this->CutColumn = $cutColumn;

        return $this;
    }

    /**
     * Get cutColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getCutColumn()
    {
        return $this->CutColumn;
    }


    /**
     * Set rainbow
     *
     * @param integer $rainbow
     *
     * @return Symbology
     */
    public function setRainbow($rainbow)
    {
        $this->Rainbow = $rainbow;

        return $this;
    }

    /**
     * Get rainbow
     *
     * @return integer
     */
    public function getRainbow()
    {
        return $this->Rainbow;
    }

    /**
     * Set opacity
     *
     * @param integer $opacity
     *
     * @return Symbology
     */
    public function setOpacity($opacity)
    {
        $this->Opacity = $opacity;

        return $this;
    }

    /**
     * Get opacity
     *
     * @return integer
     */
    public function getOpacity()
    {
        return $this->Opacity;
    }

    /**
     * Set pattern
     *
     * @param integer $pattern
     *
     * @return Symbology
     */
    public function setPattern($pattern)
    {
        $this->Pattern = $pattern;

        return $this;
    }

    /**
     * Get pattern
     *
     * @return integer
     */
    public function getPattern()
    {
        return $this->Pattern;
    }

    /**
     * Set showValues
     *
     * @param boolean $showValues
     *
     * @return Symbology
     */
    public function setShowValues($showValues)
    {
        $this->ShowValues = $showValues;

        return $this;
    }

    /**
     * Get showValues
     *
     * @return boolean
     */
    public function getShowValues()
    {
        return $this->ShowValues;
    }

    /**
     * Set showEmptyCategories
     *
     * @param boolean $showEmptyCategories
     *
     * @return Symbology
     */
    public function setShowEmptyCategories($showEmptyCategories)
    {
        $this->ShowEmptyCategories = $showEmptyCategories;

        return $this;
    }

    /**
     * Get showEmptyCategories
     *
     * @return boolean
     */
    public function getShowEmptyCategories()
    {
        return $this->ShowEmptyCategories;
    }

    /**
     * Set showLabels
     *
     * @param boolean $showLabels
     *
     * @return Symbology
     */
    public function setShowLabels($showLabels)
    {
        $this->ShowLabels = $showLabels;

        return $this;
    }

    /**
     * Get showLabels
     *
     * @return boolean
     */
    public function getShowLabels()
    {
        return $this->ShowLabels;
    }


    /**
     * Set showTotals
     *
     * @param boolean $showTotals
     *
     * @return Symbology
     */
    public function setShowTotals($showTotals)
    {
        $this->ShowTotals = $showTotals;

        return $this;
    }

    /**
     * Get showTotals
     *
     * @return boolean
     */
    public function getShowTotals()
    {
        return $this->ShowTotals;
    }

    /**
     * Set nullCategory
     *
     * @param boolean $nullCategory
     *
     * @return Symbology
     */
    public function setNullCategory($nullCategory)
    {
        $this->NullCategory = $nullCategory;

        return $this;
    }

    /**
     * Get nullCategory
     *
     * @return boolean
     */
    public function getNullCategory()
    {
        return $this->NullCategory;
    }

    /**
     * Set rainbowReverse
     *
     * @param boolean $rainbowReverse
     *
     * @return Symbology
     */
    public function setRainbowReverse($rainbowReverse)
    {
        $this->RainbowReverse = $rainbowReverse;

        return $this;
    }

    /**
     * Get rainbowReverse
     *
     * @return boolean
     */
    public function getRainbowReverse()
    {
        return $this->RainbowReverse;
    }
}

