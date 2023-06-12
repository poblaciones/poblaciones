<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * DraftMetadata
 *
 * @ORM\Table(name="draft_metadata", indexes={@ORM\Index(name="draft_metadata_ibfk_1", columns={"met_contact_id"}), @ORM\Index(name="draft_metadata_ibfk_2", columns={"met_institution_id"})})
 * @ORM\Entity
 */
class DraftMetadata
{
    /**
     * @var integer
     *
     * @ORM\Column(name="met_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="met_title", type="string", length=150, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Title;

    /**
     * @var string
     *
     * @ORM\Column(name="met_publication_date", type="string", length=10, precision=0, scale=0, nullable=true, unique=false)
     */
    private $PublicationDate;

    /**
     * @var string
     *
     * @ORM\Column(name="met_abstract", type="string", length=400, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Abstract;

    /**
     * @var string
     *
     * @ORM\Column(name="met_status", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Status;

		/**
     * @var string
     *
     * @ORM\Column(name="met_authors", type="string", length=2000, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Authors;

    /**
     * @var string
     *
     * @ORM\Column(name="met_coverage_caption", type="string", length=200, precision=0, scale=0, nullable=false, unique=false)
     */
    private $CoverageCaption;

    /**
     * @var string
     *
     * @ORM\Column(name="met_period_caption", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $PeriodCaption;

    /**
     * @var string
     *
     * @ORM\Column(name="met_frequency", type="string", length=100, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Frequency;

    /**
     * @var integer
     *
     * @ORM\Column(name="met_group_id", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $GroupId;

    /**
     * @var string
     *
     * @ORM\Column(name="met_license", type="string", length=500, precision=0, scale=0, nullable=false, unique=false)
     */
    private $License;

    /**
     * @var string
     *
     * @ORM\Column(name="met_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Type;

    /**
     * @var string
     *
     * @ORM\Column(name="met_abstract_long", type="text", length=65535, precision=0, scale=0, nullable=true, unique=false)
     */
    private $AbstractLong;

    /**
     * @var string
     *
     * @ORM\Column(name="met_methods", type="text", length=65535, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Methods;

    /**
     * @var string
     *
     * @ORM\Column(name="met_references", type="text", length=65535, precision=0, scale=0, nullable=true, unique=false)
     */
    private $References;

    /**
     * @var string
     *
     * @ORM\Column(name="met_language", type="string", length=50, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Language;

    /**
     * @var string
     *
     * @ORM\Column(name="met_wiki", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Wiki;

    /**
     * @var string
     *
     * @ORM\Column(name="met_url", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Url;

    /**
     * @var \DateTime
		 * @Exclude
     *
     * @ORM\Column(name="met_create", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Create;

    /**
     * @var \DateTime
		 * @Exclude
     *
     * @ORM\Column(name="met_update", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Update;

    /**
     * @var \helena\entities\backoffice\DraftContact
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftContact", cascade={"persist"}, fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="met_contact_id", referencedColumnName="con_id", nullable=true)
     * })
     */
    private $Contact;

		 /**
     * @var integer
     *
     * @ORM\Column(name="met_last_online_user_id", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $LastOnlineUserId;

    /**
     * @var \helena\entities\backoffice\DraftInstitution
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftInstitution", cascade={"persist"}, fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="met_institution_id", referencedColumnName="ins_id", nullable=true)
     * })
     */
    private $Institution;


    /**
     * @var \DateTime
     *
     * @ORM\Column(name="met_online_since", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $OnlineSince;


    /**
     * @var \DateTime
		 * @ClientReadonly
     *
     * @ORM\Column(name="met_last_online", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $LastOnline;


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
     * @return DraftMetadata
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set title
     *
     * @param string $title
     *
     * @return DraftMetadata
     */
    public function setTitle($title)
    {
        $this->Title = $title;

        return $this;
    }

    /**
     * Get title
     *
     * @return string
     */
    public function getTitle()
    {
        return $this->Title;
    }

    /**
     * Set onlineSince
     *
     * @param \DateTime $onlineSince
     *
     * @return DraftMetadata
     */
    public function setOnlineSince($onlineSince)
    {
        $this->OnlineSince = $onlineSince;

        return $this;
    }

    /**
     * Get onlineSince
     *
     * @return \DateTime
     */
    public function getOnlineSince()
    {
        return $this->OnlineSince;
    }


    /**
     * Set lastOnline
     *
     * @param \DateTime $lastOnline
     *
     * @return DraftMetadata
     */
    public function setLastOnline($lastOnline)
    {
        $this->LastOnline = $lastOnline;

        return $this;
    }

    /**
     * Get lastOnline
     *
     * @return \DateTime
     */
    public function getLastOnline()
    {
        return $this->LastOnline;
    }



    /**
     * Set lastOnlineUserId
     *
     * @param integer $lastOnlineUserId
     *
     * @return DraftMetadata
     */
    public function setLastOnlineUserId($lastOnlineUserId)
    {
        $this->LastOnlineUserId = $lastOnlineUserId;

        return $this;
    }

    /**
     * Get lastOnlineUserId
     *
     * @return integer
     */
    public function getLastOnlineUserId()
    {
        return $this->LastOnlineUserId;
    }

    /**
     * Set publicationDate
     *
     * @param string $publicationDate
     *
     * @return DraftMetadata
     */
    public function setPublicationDate($publicationDate)
    {
        $this->PublicationDate = $publicationDate;

        return $this;
    }

    /**
     * Get publicationDate
     *
     * @return string
     */
    public function getPublicationDate()
    {
        return $this->PublicationDate;
    }

    /**
     * Set abstract
     *
     * @param string $abstract
     *
     * @return DraftMetadata
     */
    public function setAbstract($abstract)
    {
        $this->Abstract = $abstract;

        return $this;
    }

    /**
     * Get abstract
     *
     * @return string
     */
    public function getAbstract()
    {
        return $this->Abstract;
    }

    /**
     * Set status
     *
     * @param string $status
     *
     * @return DraftMetadata
     */
    public function setStatus($status)
    {
        $this->Status = $status;

        return $this;
    }

    /**
     * Get status
     *
     * @return string
     */
    public function getStatus()
    {
        return $this->Status;
    }

    /**
     * Set authors
     *
     * @param string $authors
     *
     * @return DraftMetadata
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
     * Set coverageCaption
     *
     * @param string $coverageCaption
     *
     * @return DraftMetadata
     */
    public function setCoverageCaption($coverageCaption)
    {
        $this->CoverageCaption = $coverageCaption;

        return $this;
    }

    /**
     * Get coverageCaption
     *
     * @return string
     */
    public function getCoverageCaption()
    {
        return $this->CoverageCaption;
    }

    /**
     * Set periodCaption
     *
     * @param string $periodCaption
     *
     * @return DraftMetadata
     */
    public function setPeriodCaption($periodCaption)
    {
        $this->PeriodCaption = $periodCaption;

        return $this;
    }

    /**
     * Get periodCaption
     *
     * @return string
     */
    public function getPeriodCaption()
    {
        return $this->PeriodCaption;
    }

    /**
     * Set frequency
     *
     * @param string $frequency
     *
     * @return DraftMetadata
     */
    public function setFrequency($frequency)
    {
        $this->Frequency = $frequency;

        return $this;
    }

    /**
     * Get frequency
     *
     * @return string
     */
    public function getFrequency()
    {
        return $this->Frequency;
    }

    /**
     * Set groupId
     *
     * @param integer $groupId
     *
     * @return DraftMetadata
     */
    public function setGroupId($groupId)
    {
        $this->GroupId = $groupId;

        return $this;
    }

    /**
     * Get groupId
     *
     * @return integer
     */
    public function getGroupId()
    {
        return $this->GroupId;
    }

    /**
     * Set license
     *
     * @param string $license
     *
     * @return DraftMetadata
     */
    public function setLicense($license)
    {
        $this->License = $license;

        return $this;
    }

    /**
     * Get license
     *
     * @return string
     */
    public function getLicense()
    {
        return $this->License;
    }

    /**
     * Set type
     *
     * @param string $type
     *
     * @return DraftMetadata
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
     * Set abstractLong
     *
     * @param string $abstractLong
     *
     * @return DraftMetadata
     */
    public function setAbstractLong($abstractLong)
    {
        $this->AbstractLong = $abstractLong;

        return $this;
    }

    /**
     * Get abstractLong
     *
     * @return string
     */
    public function getAbstractLong()
    {
        return $this->AbstractLong;
    }


    /**
     * Set methods
     *
     * @param string $methods
     *
     * @return DraftMetadata
     */
    public function setMethods($methods)
    {
        $this->Methods = $methods;

        return $this;
    }

    /**
     * Get methods
     *
     * @return string
     */
    public function getMethods()
    {
        return $this->Methods;
    }


    /**
     * Set references
     *
     * @param string $references
     *
     * @return DraftMetadata
     */
    public function setReferences($references)
    {
        $this->References = $references;

        return $this;
    }

    /**
     * Get references
     *
     * @return string
     */
    public function getReferences()
    {
        return $this->References;
    }



    /**
     * Set language
     *
     * @param string $language
     *
     * @return DraftMetadata
     */
    public function setLanguage($language)
    {
        $this->Language = $language;

        return $this;
    }

    /**
     * Get language
     *
     * @return string
     */
    public function getLanguage()
    {
        return $this->Language;
    }

    /**
     * Set wiki
     *
     * @param string $wiki
     *
     * @return DraftMetadata
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
     * Set url
     *
     * @param string $url
     *
     * @return DraftMetadata
     */
    public function setUrl($url)
    {
        $this->Url = $url;

        return $this;
    }

    /**
     * Get url
     *
     * @return string
     */
    public function getUrl()
    {
        return $this->Url;
    }

    /**
     * Set create
     *
     * @param \DateTime $create
     *
     * @return DraftMetadata
     */
    public function setCreate($create)
    {
        $this->Create = $create;

        return $this;
    }

    /**
     * Get create
     *
     * @return \DateTime
     */
    public function getCreate()
    {
        return $this->Create;
    }

    /**
     * Set update
     *
     * @param \DateTime $update
     *
     * @return DraftMetadata
     */
    public function setUpdate($update)
    {
        $this->Update = $update;

        return $this;
    }

    /**
     * Get update
     *
     * @return \DateTime
     */
    public function getUpdate()
    {
        return $this->Update;
    }

    /**
     * Set contact
     *
     * @param \helena\entities\backoffice\DraftContact $contact
     *
     * @return DraftMetadata
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
     * @return DraftMetadata
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

