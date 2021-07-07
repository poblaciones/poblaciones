<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftFile
 *
 * @ORM\Table(name="draft_file")
 * @ORM\Entity
 */
class DraftFile
{
    /**
     * @var integer
     *
     * @ORM\Column(name="fil_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="fil_name", type="string", length=200, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Name;

    /**
     * @var string
     *
     * @ORM\Column(name="fil_type", type="string", length=200, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Type;

	  /**
     * @var integer
     *
     * @ORM\Column(name="fil_size", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Size;

	  /**
     * @var integer
     *
     * @ORM\Column(name="fil_pages", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Pages;

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
     * @return DraftFile
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Get pages
     *
     * @return integer
     */
    public function getPages()
    {
        return $this->Pages;
    }

		/**
     * Set pages
     *
     * @param integer $pages
     *
     * @return DraftFile
     */
    public function setPages($pages)
    {
        $this->Pages = $pages;

        return $this;
    }

    /**
     * Get size
     *
     * @return integer
     */
    public function getSize()
    {
        return $this->Size;
    }

		/**
     * Set size
     *
     * @param integer $size
     *
     * @return DraftFile
     */
    public function setSize($size)
    {
        $this->Size = $size;

        return $this;
    }

    /**
     * Set type
     *
     * @param string $type
     *
     * @return DraftFile
     */
    public function setType($type)
    {
        $this->Type = $type;

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
     * Set name
     *
     * @param string $name
     *
     * @return DraftFile
     */
    public function setName($name)
    {
        $this->Name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->Name;
    }
}

