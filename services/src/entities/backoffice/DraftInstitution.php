<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftInstitution
 *
 * @ORM\Table(name="draft_institution", uniqueConstraints={@ORM\UniqueConstraint(name="draft_insUnique", columns={"ins_caption"})})
 * @ORM\Entity
 */
class DraftInstitution
{
    /**
     * @var integer
     *
     * @ORM\Column(name="ins_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="ins_caption", type="string", length=200, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="ins_web", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Web;

    /**
     * @var string
     *
     * @ORM\Column(name="ins_email", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Email;

    /**
     * @var string
     *
     * @ORM\Column(name="ins_address", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Address;

    /**
     * @var string
     *
     * @ORM\Column(name="ins_phone", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Phone;

    /**
     * @var string
     *
     * @ORM\Column(name="ins_country", type="string", length=50, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Country;


    /**
     * @var boolean
     *
     * @ORM\Column(name="ins_is_global", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsGlobal;

    /**
     * @var boolean
     */
    private $IsEditableByCurrentUser = false;

		/**
     * @var \helena\entities\backoffice\DraftFile
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftFile",
													cascade={"persist", "remove"}, fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="ins_watermark_id", referencedColumnName="fil_id", nullable=true)
     * })
     */
    private $Watermark;

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
     * @return DraftInstitution
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
     * @return DraftInstitution
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
     * Set web
     *
     * @param string $web
     *
     * @return DraftInstitution
     */
    public function setWeb($web)
    {
        $this->Web = $web;

        return $this;
    }

    /**
     * Get web
     *
     * @return string
     */
    public function getWeb()
    {
        return $this->Web;
    }

		    /**
     * Set isGlobal
     *
     * @param boolean $isGlobal
     *
     * @return DraftInstitution
     */
    public function setIsGlobal($isGlobal)
    {
        $this->IsGlobal = $isGlobal;

        return $this;
    }

    /**
     * Get isGlobal
     *
     * @return boolean
     */
    public function getIsGlobal()
    {
        return $this->IsGlobal;
    }


    /**
     * Set watermark
     *
     * @param \helena\entities\backoffice\DraftFile $watermark
     *
     * @return DraftInstitution
     */
    public function setWatermark($watermark)
    {
        $this->Watermark = $watermark;

        return $this;
    }

    /**
     * Get watermark
     *
     * @return \helena\entities\backoffice\DraftFile
     */
    public function getWatermark()
    {
        return $this->Watermark;
    }


    /**
     * Set email
     *
     * @param string $email
     *
     * @return DraftInstitution
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
     * Set address
     *
     * @param string $address
     *
     * @return DraftInstitution
     */
    public function setAddress($address)
    {
        $this->Address = $address;

        return $this;
    }

    /**
     * Get address
     *
     * @return string
     */
    public function getAddress()
    {
        return $this->Address;
    }

		    /**
     * Set isEditableByCurrentUser
     *
     * @param boolean $isEditableByCurrentUser
     *
     * @return DraftInstitution
     */
    public function setIsEditableByCurrentUser($isEditableByCurrentUser)
    {
        $this->IsEditableByCurrentUser = $isEditableByCurrentUser;

        return $this;
    }

    /**
     * Get isEditableByCurrentUser
     *
     * @return boolean
     */
    public function getIsEditableByCurrentUser()
    {
        return $this->IsEditableByCurrentUser;
    }

    /**
     * Set phone
     *
     * @param string $phone
     *
     * @return DraftInstitution
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

    /**
     * Set country
     *
     * @param string $country
     *
     * @return DraftInstitution
     */
    public function setCountry($country)
    {
        $this->Country = $country;

        return $this;
    }

    /**
     * Get country
     *
     * @return string
     */
    public function getCountry()
    {
        return $this->Country;
    }

}

