<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftFileChunk
 *
 * @ORM\Table(name="draft_file_chunk", indexes={@ORM\Index(name="draft_fk_file_chunk_file1_idx", columns={"chu_file_id"})})
 * @ORM\Entity
 */
class DraftFileChunk
{
    /**
     * @var integer
     *
     * @ORM\Column(name="chu_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="chu_content", type="blob", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Content;

    /**
     * @var \helena\entities\backoffice\DraftFile
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftFile")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="chu_file_id", referencedColumnName="fil_id", nullable=true)
     * })
     */
    private $File;


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
     * @return DraftFileChunk
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set content
     *
     * @param string $content
     *
     * @return DraftFileChunk
     */
    public function setContent($content)
    {
        $this->Content = $content;

        return $this;
    }

    /**
     * Get content
     *
     * @return string
     */
    public function getContent()
    {
        return $this->Content;
    }

    /**
     * Set file
     *
     * @param \helena\entities\backoffice\DraftFile $file
     *
     * @return DraftFileChunk
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
}

