<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DatasetMarker
 *
 * @ORM\Table(name="dataset_marker")
 * @ORM\Entity
 */
class DatasetMarker
{
    /**
     * @var integer
     *
     * @ORM\Column(name="dmk_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="dmk_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Type;


    /**
     * @var string
     *
     * @ORM\Column(name="dmk_source", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Source;

    /**
     * @var string
     *
     * @ORM\Column(name="dmk_size", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Size;

    /**
     * @var string
     *
     * @ORM\Column(name="dmk_description_vertical_alignment", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $DescriptionVerticalAlignment;

    /**
     * @var string
     *
     * @ORM\Column(name="dmk_frame", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Frame;

		/**
     * @var string
     *
     * @ORM\Column(name="dmk_text", type="string", length=4, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Text;

		/**
     * @var string
     *
     * @ORM\Column(name="dmk_image", type="string", length=4096, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Image;

		/**
     * @var string
     *
     * @ORM\Column(name="dmk_symbol", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Symbol;
		    /**
     * @var boolean
     *
     * @ORM\Column(name="dmk_auto_scale", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $AutoScale;

		/**
     * @var \helena\entities\backoffice\DatasetColumn
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DatasetColumn", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="dmk_content_column_id", referencedColumnName="dco_id", nullable=true)
     * })
     */
    private $ContentColumn;


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
     * @return DatasetMarker
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }



    /**
     * Get type
     *
     * @return string
     */
    public function getType()
    {
        return $this->Type;
    }

		/**
     * Set type
     *
     * @param string $type
     *
     * @return DatasetMarker
     */
    public function setType($type)
    {
        $this->Type = $type;

        return $this;
    }


    /**
     * Get size
     *
     * @return string
     */
    public function getSize()
    {
        return $this->Size;
    }

		/**
     * Set size
     *
     * @param string $size
     *
     * @return DatasetMarker
     */
    public function setSize($size)
    {
        $this->Size = $size;

        return $this;
    }


    /**
     * Get descriptionVerticalAlign
     *
     * @return string
     */
    public function getDescriptionVerticalAlignment()
    {
        return $this->DescriptionVerticalAlignment;
    }

		/**
     * Set descriptionVerticalAlign
     *
     * @param string $descriptionVerticalAlign
     *
     * @return DatasetMarker
     */
    public function setDescriptionVerticalAlignment($descriptionVerticalAlign)
    {
        $this->DescriptionVerticalAlignment = $descriptionVerticalAlign;

        return $this;
    }


    /**
     * Get source
     *
     * @return string
     */
    public function getSource()
    {
        return $this->Source;
    }

		/**
     * Set source
     *
     * @param string $source
     *
     * @return DatasetMarker
     */
    public function setSource($source)
    {
        $this->Source = $source;

        return $this;
    }

    /**
     * Get frame
     *
     * @return string
     */
    public function getFrame()
    {
        return $this->Frame;
    }

		/**
     * Set frame
     *
     * @param string $frame
     *
     * @return DatasetMarker
     */
    public function setFrame($frame)
    {
        $this->Frame = $frame;

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
     * Set symbol
     *
     * @param string $symbol
     *
     * @return DatasetMarker
     */
    public function setSymbol($symbol)
    {
        $this->Symbol = $symbol;

        return $this;
    }

    /**
     * Get image
     *
     * @return string
     */
    public function getImage()
    {
        return $this->Image;
    }

		/**
     * Set image
     *
     * @param string $image
     *
     * @return DatasetMarker
     */
    public function setImage($image)
    {
        $this->Image = $image;

        return $this;
    }


    /**
     * Get text
     *
     * @return string
     */
    public function getText()
    {
        return $this->Text;
    }

		/**
     * Set text
     *
     * @param string $text
     *
     * @return DatasetMarker
     */
    public function setText($text)
    {
        $this->Text = $text;

        return $this;
    }

    /**
     * Get autoScale
     *
     * @return boolean
     */
    public function getAutoScale()
    {
        return $this->AutoScale;
    }

		/**
     * Set autoScale
     *
     * @param boolean $autoScale
     *
     * @return DatasetMarker
     */
    public function setAutoScale($autoScale)
    {
        $this->AutoScale = $autoScale;

        return $this;
    }

    /**
     * Get contentColumn
     *
     * @return \helena\entities\backoffice\DatasetColumn
     */
    public function getContentColumn()
    {
        return $this->ContentColumn;
    }

		/**
     * Set contentColumn
     *
     * @param \helena\entities\backoffice\DatasetColumn $contentColumn
     *
     * @return DatasetMarker
     */
    public function setContentColumn($contentColumn)
    {
        $this->ContentColumn = $contentColumn;

        return $this;
    }


}

