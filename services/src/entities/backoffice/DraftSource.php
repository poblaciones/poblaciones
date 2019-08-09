<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftSource
 *
 * @ORM\Table(name="draft_source", uniqueConstraints={@ORM\UniqueConstraint(name="draft_srcUnique2", columns={"src_caption", "src_version"})}, indexes={@ORM\Index(name="draft_source_ibfk_3", columns={"src_contact_id"}), @ORM\Index(name="draft_source_ibfk_5", columns={"src_institution_id"})})
 * @ORM\Entity
 */
class DraftSource
{
    /**
     * @var integer
     *
     * @ORM\Column(name="src_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="src_caption", type="string", length=200, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var string
     *
     * @ORM\Column(name="src_authors", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Authors;

    /**
     * @var string
     *
     * @ORM\Column(name="src_version", type="string", length=50, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Version;

    /**
     * @var string
     *
     * @ORM\Column(name="src_web", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Web;

    /**
     * @var boolean
     */
    private $IsEditableByCurrentUser = false;


    /**
     * @var string
     *
     * @ORM\Column(name="src_wiki", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Wiki;

    /**
     * @var boolean
     *
     * @ORM\Column(name="src_is_global", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IsGlobal;

    /**
     * @var \helena\entities\backoffice\DraftInstitution
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftInstitution", cascade={"persist"}, fetch="EAGER")
     * @ORM\JoinColumns({
		 *   @ORM\JoinColumn(name="src_institution_id", referencedColumnName="ins_id", nullable=true)
		 * })
		 */
    private $Institution;


    /**
		 * @var \helena\entities\backoffice\DraftContact
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftContact", cascade={"persist"}, fetch="EAGER")
		 * @ORM\JoinColumns({
		 *   @ORM\JoinColumn(name="src_contact_id", referencedColumnName="con_id", nullable=true)
     * })
     */
    private $Contact;

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
     * @return DraftSource
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
     * @return DraftSource
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
     * Set isEditableByCurrentUser
     *
     * @param boolean $isEditableByCurrentUser
     *
     * @return DraftSource
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
     * Set authors
     *
     * @param string $authors
     *
     * @return DraftSource
     */
    public function setAuthors($authors)
    {
        $this->Authors = $authors;

        return $this;
    }

    /**
     * Get authors
     *
     * @return string
     */
    public function getAuthors()
    {
        return $this->Authors;
    }

    /**
     * Set version
     *
     * @param string $version
     *
     * @return DraftSource
     */
    public function setVersion($version)
    {
        $this->Version = $version;

        return $this;
    }

    /**
     * Get version
     *
     * @return string
     */
    public function getVersion()
    {
        return $this->Version;
    }

    /**
     * Set web
     *
     * @param string $web
     *
     * @return DraftSource
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
     * Set wiki
     *
     * @param string $wiki
     *
     * @return DraftSource
     */
    public function setWiki($wiki)
    {
        $this->Wiki = $wiki;

        return $this;
    }

    /**
     * Get wiki
     *
     * @return string
     */
    public function getWiki()
    {
        return $this->Wiki;
    }

    /**
     * Set isGlobal
     *
     * @param boolean $isGlobal
     *
     * @return DraftSource
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
     * Set contact
     *
     * @param \helena\entities\backoffice\DraftContact $contact
     *
     * @return DraftSource
     */
    public function setContact(\helena\entities\backoffice\DraftContact $contact = null)
    {
        $this->Contact = $contact;

        return $this;
    }

    /**
     * Get contact
     *
     * @return \helena\entities\backoffice\DraftContact
     */
    public function getContact()
    {
        return $this->Contact;
    }

    /**
     * Set institution
     *
     * @param \helena\entities\backoffice\DraftInstitution $institution
     *
     * @return DraftSource
     */
    public function setInstitution(\helena\entities\backoffice\DraftInstitution $institution = null)
    {
        $this->Institution = $institution;

        return $this;
    }

    /**
     * Get institution
     *
     * @return \helena\entities\backoffice\DraftInstitution
     */
    public function getInstitution()
    {
        return $this->Institution;
    }
}

