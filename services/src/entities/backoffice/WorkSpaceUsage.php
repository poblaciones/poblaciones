<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;
use JMS\Serializer\Annotation\ExclusionPolicy;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * WorkSpaceUsage
 *
 * @ORM\Table(name="work_space_usage", indexes={@ORM\Index(name="fk_draft_work_permission_user1", columns={"wdu_user_id"}), @ORM\Index(name="fk_draft_work_permission_work1", columns={"wdu_work_id"})})
 * @ORM\Entity
 */
class WorkSpaceUsage
{
    /**
     * @var integer
     *
     * @ORM\Column(name="wdu_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;


    /**
     * @var \helena\entities\backoffice\DraftWork
     *
		 * @Exclude
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wdu_work_id", referencedColumnName="wrk_id", nullable=false)
     * })
     */
    private $Work;


		/**
     * @var integer
     *
     * @ORM\Column(name="wdu_draft_attachment_bytes", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DraftAttachmentBytes;


		/**
     * @var integer
     *
     * @ORM\Column(name="wdu_draft_data_bytes", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DraftDataBytes;


		/**
     * @var integer
     *
     * @ORM\Column(name="wdu_draft_index_bytes", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DraftIndexBytes;


		/**
     * @var integer
     *
     * @ORM\Column(name="wdu_attachment_bytes", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $AttachmentBytes;


		/**
     * @var integer
     *
     * @ORM\Column(name="wdu_data_bytes", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $DataBytes;


		/**
     * @var integer
     *
     * @ORM\Column(name="wdu_index_bytes", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $IndexBytes;


    /**
     * @var \DateTime
		 * @Exclude
		 * @ClientReadonly
     *
     * @ORM\Column(name="wdu_update_time", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $UpdateTime;


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
     * @return WorkSpaceUsage
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }


    /**
     * Get draftAttachmentBytes
     *
     * @return integer
     */
    public function getDraftAttachmentBytes()
    {
        return $this->DraftAttachmentBytes;
    }

		/**
     * Set draftAttachmentBytes
     *
     * @param integer $draftAttachmentBytes
     *
     * @return WorkSpaceUsage
     */
    public function setDraftAttachmentBytes($draftAttachmentBytes)
    {
        $this->Id = $draftAttachmentBytes;

        return $this;
    }


    /**
     * Get draftDataBytes
     *
     * @return integer
     */
    public function getDraftDataBytes()
    {
        return $this->DraftDataBytes;
    }

		/**
     * Set draftDataBytes
     *
     * @param integer $draftDataBytes
     *
     * @return WorkSpaceUsage
     */
    public function setDraftDataBytes($draftDataBytes)
    {
        $this->Id = $draftDataBytes;

        return $this;
    }

    /**
     * Get draftIndexBytes
     *
     * @return integer
     */
    public function getDraftIndexBytes()
    {
        return $this->DraftIndexBytes;
    }

		/**
     * Set draftIndexBytes
     *
     * @param integer $draftIndexBytes
     *
     * @return WorkSpaceUsage
     */
    public function setDraftIndexBytes($draftIndexBytes)
    {
        $this->Id = $draftIndexBytes;

        return $this;
    }


    /**
     * Get attachmentBytes
     *
     * @return integer
     */
    public function getAttachmentBytes()
    {
        return $this->AttachmentBytes;
    }

		/**
     * Set attachmentBytes
     *
     * @param integer $attachmentBytes
     *
     * @return WorkSpaceUsage
     */
    public function setAttachmentBytes($attachmentBytes)
    {
        $this->Id = $attachmentBytes;

        return $this;
    }


    /**
     * Get dataBytes
     *
     * @return integer
     */
    public function getDataBytes()
    {
        return $this->DataBytes;
    }

		/**
     * Set dataBytes
     *
     * @param integer $dataBytes
     *
     * @return WorkSpaceUsage
     */
    public function setDataBytes($dataBytes)
    {
        $this->Id = $dataBytes;

        return $this;
    }

    /**
     * Get indexBytes
     *
     * @return integer
     */
    public function getIndexBytes()
    {
        return $this->IndexBytes;
    }

		/**
     * Set indexBytes
     *
     * @param integer $indexBytes
     *
     * @return WorkSpaceUsage
     */
    public function setIndexBytes($indexBytes)
    {
        $this->Id = $indexBytes;

        return $this;
    }
    /**
     * Set work
     *
     * @param \helena\entities\backoffice\DraftWork $work
     *
     * @return WorkSpaceUsage
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


    /**
     * Set updateTime
     *
     * @param \DateTime $updateTime
     *
     * @return WorkSpaceUsage
     */
    public function setUpdateTime($updateTime)
    {
        $this->UpdateTime = $updateTime;

        return $this;
    }

    /**
     * Get updateTime
     *
     * @return \DateTime
     */
    public function getUpdateTime()
    {
        return $this->UpdateTime;
    }
}

