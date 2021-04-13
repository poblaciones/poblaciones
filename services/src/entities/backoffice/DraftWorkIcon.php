<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * DraftWorkIcon
 *
 * @ORM\Table(name="draft_work_icon", indexes={@ORM\Index(name="fk_draft_work_per", columns={"wic_file_id"}), @ORM\Index(name="fk_draft_work_pe", columns={"wic_work_id"})})
 * @ORM\Entity
 */
class DraftWorkIcon
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
     * @var \helena\entities\backoffice\DraftFile
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftFile", fetch="EAGER")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wic_file_id", referencedColumnName="fil_id", nullable=false)
     * })
     */
    private $File;

    /**
     * @var \helena\entities\backoffice\DraftWork
     *
		 * @Exclude
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
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
     * @return DraftWorkIcon
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }


    /**
     * Set file
     *
     * @param \helena\entities\backoffice\DraftFile $file
     *
     * @return DraftWorkIcon
     */
    public function setFile(\helena\entities\backoffice\DraftFile $file = null)
    {
        $this->File = $file;

        return $this;
    }

    /**
     * Get file
     *
     * @return \helena\entities\backoffice\DraftFile
     */
    public function getFile()
    {
        return $this->File;
    }

    /**
     * Set work
     *
     * @param \helena\entities\backoffice\DraftWork $work
     *
     * @return DraftWorkIcon
     */
    public function setWork(\helena\entities\backoffice\DraftWork $work = null)
    {
        $this->Work = $work;

        return $this;
    }

    /**
     * Get work
     *
     * @return \helena\entities\backoffice\DraftWork
     */
    public function getWork()
    {
        return $this->Work;
    }
}

