<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * Metadata
 *
 * @ORM\Table(name="metadata", indexes={@ORM\Index(name="metadata_ibfk_1", columns={"met_contact_id"}), @ORM\Index(name="metadata_ibfk_2", columns={"met_institution_id"})})
 * @ORM\Entity
 */
class Metadata
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
     * @ORM\Column(name="met_title", type="string", length=200, precision=0, scale=0, nullable=false, unique=false)
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
     * @ORM\Column(name="met_abstract", type="string", length=4096, precision=0, scale=0, nullable=false, unique=false)
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
     * @var geometry
     *
     * @ORM\Column(name="met_extents", type="geometry", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Extents;

    /**
     * @var \DateTime
		 * @ClientReadonly
		*
     * @ORM\Column(name="met_create", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Create;

    /**
     * @var \DateTime
		* @ClientReadonly
		* @ORM\Column(name="met_update", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Update;

    /**
     * @var \DateTime
		 * @Exclude
     *
     * @ORM\Column(name="met_schedule_next_update", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $ScheduleNextUpdate;

    /**
     * @var \helena\entities\backoffice\Contact
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Contact")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="met_contact_id", referencedColumnName="con_id", nullable=true)
     * })
     */
    private $Contact;

    /**
     * @var \helena\entities\backoffice\Institution
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Institution")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="met_institution_id", referencedColumnName="ins_id", nullable=true)
     * })
     */
    private $Institution;


    /**
     * @var \DateTime
		 * @Exclude
     *
     * @ORM\Column(name="met_online_since", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $OnlineSince;


    /**
     * @var \DateTime
		 * @Exclude
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
     * @return Metadata
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
     * @return Metadata
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
     * Set publicationDate
     *
     * @param string $publicationDate
     *
     * @return Metadata
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
     * Set onlineSince
     *
     * @param string $onlineSince
     *
     * @return Metadata
     */
    public function setOnlineSince($onlineSince)
    {
        $this->OnlineSince = $onlineSince;

        return $this;
    }

    /**
     * Get onlineSince
     *
     * @return string
     */
    public function getOnlineSince()
    {
        return $this->OnlineSince;
    }


    /**
     * Set lastOnline
     *
     * @param string $lastOnline
     *
     * @return Metadata
     */
    public function setLastOnline($lastOnline)
    {
        $this->LastOnline = $lastOnline;

        return $this;
    }

    /**
     * Get lastOnline
     *
     * @return string
     */
    public function getLastOnline()
    {
        return $this->LastOnline;
    }

    /**
     * Set abstract
     *
     * @param string $abstract
     *
     * @return Metadata
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
     * Set extents
     *
     * @param geometry $extents
     *
     * @return Metadata
     */
    public function setExtents($extents)
    {
        $this->Extents = $extents;

        return $this;
    }

    /**
     * Get extents
     *
     * @return geometry
     */
    public function getExtents()
    {
        return $this->Extents;
    }


    /**
     * Set status
     *
     * @param string $status
     *
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * Set language
     *
     * @param string $language
     *
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * @return Metadata
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
     * Set scheduleNextUpdate
     *
     * @param \DateTime $scheduleNextUpdate
     *
     * @return Metadata
     */
    public function setScheduleNextUpdate($scheduleNextUpdate)
    {
        $this->ScheduleNextUpdate = $scheduleNextUpdate;

        return $this;
    }

    /**
     * Get scheduleNextUpdate
     *
     * @return \DateTime
     */
    public function getScheduleNextUpdate()
    {
        return $this->ScheduleNextUpdate;
    }

    /**
     * Set contact
     *
     * @param \helena\entities\backoffice\Contact $contact
     *
     * @return Metadata
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
     * @return Metadata
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

