<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftSymbology
 *
 * @ORM\Table(name="draft_symbology")
 * @ORM\Entity
 */
class DraftSymbology
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
     * @var string
     *
     * @ORM\Column(name="vsy_opacity", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Opacity;

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
     * @var boolean
     *
     * @ORM\Column(name="vsy_show_labels", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowLabels;

		/**
     * @var string
     *
     * @ORM\Column(name="vsy_custom_colors", type="string", length=2048, precision=0, scale=0, nullable=false, unique=false)
     */
    private $CustomColors;

	   /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_show_empty_categories", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowEmptyCategories;

    /**
     * @var boolean
     *
     * @ORM\Column(name="vsy_show_totals", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $ShowTotals;

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
     * @var boolean
     *
     * @ORM\Column(name="vsy_null_category", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $NullCategory;

    /**
     * @var string
     *
     * @ORM\Column(name="vsy_palette_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $PaletteType;

		/**
     * @var \helena\entities\backoffice\DraftDatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftDatasetColumn")
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
     * @return DraftSymbology
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
     * @return DraftSymbology
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
     * Set colorTo
     *
     * @param string $colorTo
     *
     * @return DraftSymbology
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
     * Set palettePaletteType
     *
     * @param string $palettePaletteType
     *
     * @return DraftSymbology
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
     * Set customColors
     *
     * @param string $customColors
     *
     * @return DraftSymbology
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
     * Set cutColumn
     *
     * @param \helena\entities\backoffice\DraftDatasetColumn $cutColumn
     *
     * @return DraftSymbology
     */
    public function setCutColumn(\helena\entities\backoffice\DraftDatasetColumn $cutColumn = null)
    {
        $this->CutColumn = $cutColumn;

        return $this;
    }

    /**
     * Get cutColumn
     *
     * @return \helena\entities\backoffice\DraftDatasetColumn
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
     * @return DraftSymbology
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
     * Set categories
     *
     * @param integer $categories
     *
     * @return DraftSymbology
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
     * @return DraftSymbology
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
     * Set cutMode
     *
     * @param string $cutMode
     *
     * @return DraftSymbology
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
     * Set opacity
     *
     * @param string $opacity
     *
     * @return DraftSymbology
     */
    public function setOpacity($opacity)
    {
        $this->Opacity = $opacity;

        return $this;
    }

    /**
     * Get opacity
     *
     * @return string
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
     * @return DraftSymbology
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
     * @return DraftSymbology
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
     * @return DraftSymbology
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
     * @return DraftSymbology
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
     * @return DraftSymbology
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
     * @return DraftSymbology
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
     * @return DraftSymbology
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

