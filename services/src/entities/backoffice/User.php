<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * User
 *
 * @ORM\Table(name="user", uniqueConstraints={@ORM\UniqueConstraint(name="idx_email", columns={"usr_email"})})
 * @ORM\Entity
 */
class User
{
    /**
     * @var integer
     *
     * @ORM\Column(name="usr_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="usr_email", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Email;


	/**
	 * @var string
	 * @ClientReadonly
	 *
	 * @ORM\Column(name="usr_email_new", type="string", length=100, nullable=true)
	 */
	private $EmailNew;


	/**
	 * @var string
	 *
	 * @ORM\Column(name="usr_firstname", type="string", length=255, precision=0, scale=0, nullable=false, unique=false)
	 */
    private $Firstname;

    /**
     * @var string
     *
     * @ORM\Column(name="usr_lastname", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Lastname;

    /**
     * @var boolean
     *
     * @ORM\Column(name="usr_is_active", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsActive;

    /**
     * @var \DateTime
		 * @Exclude
		 * @ClientReadonly
     *
     * @ORM\Column(name="usr_create_time", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $CreateTime;

    /**
     * @var string
     *
     * @ORM\Column(name="usr_privileges", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Privileges;

    /**
     * @var boolean
     *
     * @ORM\Column(name="usr_deleted", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Deleted;


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
     * @return User
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set email
     *
     * @param string $email
     *
     * @return User
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
	 * Set emailNew
	 *
	 * @param string $emailNew
	 *
	 * @return User
	 */
	public function setEmailNew($emailNew)
	{
		$this->EmailNew = $emailNew;

		return $this;
	}

	/**
	 * Get emailNew
	 *
	 * @return string
	 */
	public function getEmailNew()
	{
		return $this->EmailNew;
	}

	/**
	 * Set firstname
	 *
	 * @param string $firstname
	 *
	 * @return User
	 */
    public function setFirstname($firstname)
    {
        $this->Firstname = $firstname;

        return $this;
    }

    /**
     * Get firstname
     *
     * @return string
     */
    public function getFirstname()
    {
        return $this->Firstname;
    }

    /**
     * Set lastname
     *
     * @param string $lastname
     *
     * @return User
     */
    public function setLastname($lastname)
    {
        $this->Lastname = $lastname;

        return $this;
    }

    /**
     * Get lastname
     *
     * @return string
     */
    public function getLastname()
    {
        return $this->Lastname;
    }

    /**
     * Set isActive
     *
     * @param boolean $isActive
     *
     * @return User
     */
    public function setIsActive($isActive)
    {
        $this->IsActive = $isActive;

        return $this;
    }

    /**
     * Get isActive
     *
     * @return boolean
     */
    public function getIsActive()
    {
        return $this->IsActive;
    }

    /**
     * Set createTime
     *
     * @param \DateTime $createTime
     *
     * @return User
     */
    public function setCreateTime($createTime)
    {
        $this->CreateTime = $createTime;

        return $this;
    }

    /**
     * Get createTime
     *
     * @return \DateTime
     */
    public function getCreateTime()
    {
        return $this->CreateTime;
    }

    /**
     * Set privileges
     *
     * @param string $privileges
     *
     * @return User
     */
    public function setPrivileges($privileges)
    {
        $this->Privileges = $privileges;

        return $this;
    }

    /**
     * Get privileges
     *
     * @return string
     */
    public function getPrivileges()
    {
        return $this->Privileges;
    }

    /**
     * Set deleted
     *
     * @param boolean $deleted
     *
     * @return User
     */
    public function setDeleted($deleted)
    {
        $this->Deleted = $deleted;

        return $this;
    }

    /**
     * Get deleted
     *
     * @return boolean
     */
    public function getDeleted()
    {
        return $this->Deleted;
    }
}

