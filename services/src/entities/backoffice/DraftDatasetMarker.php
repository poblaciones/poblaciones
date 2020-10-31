<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftDatasetMarker
 *
 * @ORM\Table(name="draft_dataset_marker")
 * @ORM\Entity
 */
class DraftDatasetMarker
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
     * @ORM\Column(name="dmk_frame", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Frame;

		/**
     * @var string
     *
     * @ORM\Column(name="dmk_symbol", type="string", length=4096, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Symbol;


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
     * @var boolean
     *
     * @ORM\Column(name="dmk_auto_scale", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $AutoScale;

		/**
     * @var integer
     *
     * @ORM\Column(name="dmk_sequence_column_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $SequenceColumnId;

		/**
     * @var integer
     *
     * @ORM\Column(name="dmk_symbol_column_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $SymbolColumnId;


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
     * @return DraftDatasetMarker
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
     * @return DraftDatasetMarker
     */
    public function setType($type)
    {
        $this->Type = $type;

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
     * @return DraftDatasetMarker
     */
    public function setSource($source)
    {
        $this->Source = $source;

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
     * @return DraftDatasetMarker
     */
    public function setSize($size)
    {
        $this->Size = $size;

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
     * @return DraftDatasetMarker
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
     * @return DraftDatasetMarker
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
     * @return DraftDatasetMarker
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
     * @return DraftDatasetMarker
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
     * @return DraftDatasetMarker
     */
    public function setAutoScale($autoScale)
    {
        $this->AutoScale = $autoScale;

        return $this;
    }


    /**
     * Get symbolColumnId
     *
     * @return integer
     */
    public function getSymbolColumnId()
    {
        return $this->SymbolColumnId;
    }

		/**
     * Set symbolColumnId
     *
     * @param integer $symbolColumnId
     *
     * @return DraftDatasetMarker
     */
    public function setSymbolColumnId($symbolColumnId)
    {
        $this->SymbolColumnId = $symbolColumnId;

        return $this;
    }


    /**
     * Get sequenceColumnId
     *
     * @return integer
     */
    public function getSequenceColumnId()
    {
        return $this->SequenceColumnId;
    }

		/**
     * Set sequenceColumnId
     *
     * @param integer $sequenceColumnId
     *
     * @return DraftDatasetMarker
     */
    public function setSequenceColumnId($sequenceColumnId)
    {
        $this->SequenceColumnId = $sequenceColumnId;

        return $this;
    }
}

