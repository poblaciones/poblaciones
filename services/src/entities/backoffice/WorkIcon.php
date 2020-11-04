<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;
use JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * WorkIcon
 *
 * @ORM\Table(name="work_icon", indexes={@ORM\Index(name="fk__work_per", columns={"wic_file_id"}), @ORM\Index(name="fk__work_pe", columns={"wic_work_id"})})
 * @ORM\Entity
 */
class WorkIcon
{
    /**
     * @var integer
     *
     * @ORM\Column(name="wic_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var \helena\entities\backoffice\File
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\File")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wic_file_id", referencedColumnName="fil_id", nullable=false)
     * })
     */
    private $File;

    /**
     * @var \helena\entities\backoffice\Work
     *
		 * @Exclude
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Work")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wic_work_id", referencedColumnName="wrk_id", nullable=false)
     * })
     */
    private $Work;


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
     * @return WorkIcon
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }


    /**
     * Set file
     *
     * @param \helena\entities\backoffice\File $file
     *
     * @return WorkIcon
     */
    public function setFile(\helena\entities\backoffice\File $file = null)
    {
        $this->File = $file;

        return $this;
    }

    /**
     * Get file
     *
     * @return \helena\entities\backoffice\File
     */
    public function getFile()
    {
        return $this->File;
    }

    /**
     * Set work
     *
     * @param \helena\entities\backoffice\Work $work
     *
     * @return WorkIcon
     */
    public function setWork(\helena\entities\backoffice\Work $work = null)
    {
        $this->Work = $work;

        return $this;
    }

    /**
     * Get work
     *
     * @return \helena\entities\backoffice\Work
     */
    public function getWork()
    {
        return $this->Work;
    }
}

