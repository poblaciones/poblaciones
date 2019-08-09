<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * Source
 *
 * @ORM\Table(name="source", uniqueConstraints={@ORM\UniqueConstraint(name="srcUnique2", columns={"src_caption", "src_version"})}, indexes={@ORM\Index(name="source_ibfk_3", columns={"src_contact_id"}), @ORM\Index(name="source_ibfk_5", columns={"src_institution_id"})})
 * @ORM\Entity
 */
class Source
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
     * @var \helena\entities\backoffice\Contact
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Contact")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="src_contact_id", referencedColumnName="con_id", nullable=true)
     * })
     */
    private $Contact;

    /**
     * @var \helena\entities\backoffice\Institution
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Institution")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="src_institution_id", referencedColumnName="ins_id", nullable=true)
     * })
     */
    private $Institution;


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
     * @return Source
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
     * @return Source
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
     * Set authors
     *
     * @param string $authors
     *
     * @return Source
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
     * @return Source
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
     * @return Source
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
     * @return Source
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
     * Set type
     *
     * @param boolean $isGlobal
     *
     * @return Source
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
     * @param \helena\entities\backoffice\Contact $contact
     *
     * @return Source
     */
    public function setContact(\helena\entities\backoffice\Contact $contact = null)
    {
        $this->Contact = $contact;

        return $this;
    }

    /**
     * Get contact
     *
     * @return \helena\entities\backoffice\Contact
     */
    public function getContact()
    {
        return $this->Contact;
    }

    /**
     * Set institution
     *
     * @param \helena\entities\backoffice\Institution $institution
     *
     * @return Source
     */
    public function setInstitution(\helena\entities\backoffice\Institution $institution = null)
    {
        $this->Institution = $institution;

        return $this;
    }

    /**
     * Get institution
     *
     * @return \helena\entities\backoffice\Institution
     */
    public function getInstitution()
    {
        return $this->Institution;
    }
}

