<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftContact
 *
 * @ORM\Table(name="draft_contact")
 * @ORM\Entity
 */
class DraftContact
{
    /**
     * @var integer
     *
     * @ORM\Column(name="con_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="con_person", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Person;

    /**
     * @var string
     *
     * @ORM\Column(name="con_email", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Email;

    /**
     * @var string
     *
     * @ORM\Column(name="con_phone", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Phone;

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
     * @return DraftContact
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set person
     *
     * @param string $person
     *
     * @return DraftContact
     */
    public function setPerson($person)
    {
        $this->Person = $person;

        return $this;
    }

    /**
     * Get person
     *
     * @return string
     */
    public function getPerson()
    {
        return $this->Person;
    }

    /**
     * Set email
     *
     * @param string $email
     *
     * @return DraftContact
     */
    public function setEmail($email)
    {
        $this->Email = $email;

        return $this;
    }

    /**
     * Get email
     *
     * @return string
     */
    public function getEmail()
    {
        return $this->Email;
    }

    /**
     * Set phone
     *
     * @param string $phone
     *
     * @return DraftContact
     */
    public function setPhone($phone)
    {
        $this->Phone = $phone;

        return $this;
    }

    /**
     * Get phone
     *
     * @return string
     */
    public function getPhone()
    {
        return $this->Phone;
    }
}

