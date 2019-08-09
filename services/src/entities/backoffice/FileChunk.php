<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * FileChunk
 *
 * @ORM\Table(name="file_chunk", indexes={@ORM\Index(name="fk_file_chunk_file1_idx", columns={"chu_file_id"})})
 * @ORM\Entity
 */
class FileChunk
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
     * @var \helena\entities\backoffice\File
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\File")
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
     * @return FileChunk
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
     * @return FileChunk
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
     * @param \helena\entities\backoffice\File $file
     *
     * @return FileChunk
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
}

