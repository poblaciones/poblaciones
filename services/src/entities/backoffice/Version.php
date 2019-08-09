<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * Version
 *
 * @ORM\Table(name="version", uniqueConstraints={@ORM\UniqueConstraint(name="upt_name_UNIQUE", columns={"ver_name"})})
 * @ORM\Entity
 */
class Version
{
    /**
     * @var integer
     *
     * @ORM\Column(name="ver_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="ver_name", type="string", length=45, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Name;

    /**
     * @var string
     *
     * @ORM\Column(name="ver_value", type="string", length=45, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Value;


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
     * @return Version
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set name
     *
     * @param string $name
     *
     * @return Version
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

    /**
     * Set value
     *
     * @param string $value
     *
     * @return Version
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
}

