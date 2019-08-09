<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * Work
 *
 * @ORM\Table(name="work", indexes={@ORM\Index(name="fk_work_file1_idx", columns={"wrk_image_id"}), @ORM\Index(name="wk_type", columns={"wrk_type"}), @ORM\Index(name="wrk_type", columns={"wrk_type"}), @ORM\Index(name="work_ibfk_1", columns={"wrk_metadata_id"})})
 * @ORM\Entity
 */
class Work
{
    /**
     * @var integer
     *
     * @ORM\Column(name="wrk_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Type;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_uri", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Uri;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_start_args", type="string", length=500, precision=0, scale=0, nullable=true, unique=false)
     */
    private $StartArgs;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_image_type", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $ImageType;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_comments", type="string", length=4096, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Comments;

    /**
     * @var string
     *
     * @ORM\Column(name="wrk_published_by", type="string", length=200, precision=0, scale=0, nullable=true, unique=false)
     */
    private $PublishedBy;

    /**
     * @var boolean
     *
     * @ORM\Column(name="wrk_shard", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Shard;

    /**
     * @var \helena\entities\backoffice\File
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\File")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wrk_image_id", referencedColumnName="fil_id", nullable=true)
     * })
     */
    private $Image;

    /**
     * @var \helena\entities\backoffice\Metadata
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wrk_metadata_id", referencedColumnName="met_id", nullable=true)
     * })
     */
    private $Metadata;


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
     * @return Work
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set type
     *
     * @param string $type
     *
     * @return Work
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
     * Set uri
     *
     * @param string $uri
     *
     * @return Work
     */
    public function setUri($uri)
    {
        $this->Uri = $uri;

        return $this;
    }

    /**
     * Get uri
     *
     * @return string
     */
    public function getUri()
    {
        return $this->Uri;
    }

    /**
     * Set startArgs
     *
     * @param string $startArgs
     *
     * @return Work
     */
    public function setStartArgs($startArgs)
    {
        $this->StartArgs = $startArgs;

        return $this;
    }

    /**
     * Get startArgs
     *
     * @return string
     */
    public function getStartArgs()
    {
        return $this->StartArgs;
    }

    /**
     * Set imageType
     *
     * @param string $imageType
     *
     * @return Work
     */
    public function setImageType($imageType)
    {
        $this->ImageType = $imageType;

        return $this;
    }

    /**
     * Get imageType
     *
     * @return string
     */
    public function getImageType()
    {
        return $this->ImageType;
    }

    /**
     * Set comments
     *
     * @param string $comments
     *
     * @return Work
     */
    public function setComments($comments)
    {
        $this->Comments = $comments;

        return $this;
    }

    /**
     * Get comments
     *
     * @return string
     */
    public function getComments()
    {
        return $this->Comments;
    }

    /**
     * Set publishedBy
     *
     * @param string $publishedBy
     *
     * @return Work
     */
    public function setPublishedBy($publishedBy)
    {
        $this->PublishedBy = $publishedBy;

        return $this;
    }

    /**
     * Get publishedBy
     *
     * @return string
     */
    public function getPublishedBy()
    {
        return $this->PublishedBy;
    }


    /**
     * Set shard
     *
     * @param boolean $shard
     *
     * @return Work
     */
    public function setShard($shard)
    {
        $this->Shard = $shard;

        return $this;
    }

    /**
     * Get shard
     *
     * @return boolean
     */
    public function getShard()
    {
        return $this->Shard;
    }

    /**
     * Set image
     *
     * @param \helena\entities\backoffice\File $image
     *
     * @return Work
     */
    public function setImage(\helena\entities\backoffice\File $image = null)
    {
        $this->Image = $image;

        return $this;
    }

    /**
     * Get image
     *
     * @return \helena\entities\backoffice\File
     */
    public function getImage()
    {
        return $this->Image;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return Work
     */
    public function setMetadata(\helena\entities\backoffice\Metadata $metadata = null)
    {
        $this->Metadata = $metadata;

        return $this;
    }

    /**
     * Get metadata
     *
     * @return \helena\entities\backoffice\Metadata
     */
    public function getMetadata()
    {
        return $this->Metadata;
    }
}

