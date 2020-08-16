<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;
use JMS\Serializer\Annotation\ExclusionPolicy;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * Revision
 *
 * @ORM\Table(name="revision", indexes={@ORM\Index(name="fk_draft_work_per", columns={"rev_metric_id"}), @ORM\Index(name="fk_draft_work_pe", columns={"rev_work_id"})})
 * @ORM\Entity
 */
class Revision
{
    /**
     * @var integer
     *
     * @ORM\Column(name="rev_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var \helena\entities\backoffice\DraftWork
     *
 		 * @ClientReadonly
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="rev_work_id", referencedColumnName="wrk_id", nullable=false)
     * })
     */
    private $Work;

		/**
     * @var \DateTime
     *
     * @ORM\Column(name="rev_submission_time", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $SubmissionDate;

		/**
     * @var \DateTime
     *
     * @ORM\Column(name="rev_resolution_time", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $ResolutionDate;

		/**
     * @var string
     *
     * @ORM\Column(name="rev_decision", type="string", length=1, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Decision;


		/**
     * @var string
     *
     * @ORM\Column(name="rev_reviewer_comments", type="string", length=2048, precision=0, scale=0, nullable=true, unique=false)
     */
    private $ReviewerComments;


		/**
     * @var string
     *
     * @ORM\Column(name="rev_editor_comments", type="string", length=2048, precision=0, scale=0, nullable=true, unique=false)
     */
    private $EditorComments;

		/**
     * @var string
     *
     * @ORM\Column(name="rev_extra_comments", type="string", length=2048, precision=0, scale=0, nullable=true, unique=false)
     */
    private $ExtraComments;

		 /**
     * @var \helena\entities\backoffice\User
		 * @ClientReadonly
     *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\User")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="rev_user_submission_id", referencedColumnName="usr_id", nullable=true)
     * })
     */
    private $UserSubmission;

		/**
     * @var string
		 * @ClientReadonly
     *
     * @ORM\Column(name="rev_user_submission_email", type="string", length=2048, precision=0, scale=0, nullable=true, unique=false)
     */
    private $UserSubmissionEmail;


		 /**
     * @var \helena\entities\backoffice\User
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\User")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="rev_user_decision_id", referencedColumnName="usr_id", nullable=true)
     * })
     */
    private $UserDecision;


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
     * @return Revision
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set work
     *
     * @param \helena\entities\backoffice\DraftWork $work
     *
     * @return Revision
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
     * Set submissionDate
     *
     * @param \DateTime $submissionDate
     *
     * @return Revision
     */
    public function setSubmissionDate($submissionDate)
    {
        $this->SubmissionDate = $submissionDate;

        return $this;
    }

    /**
     * Get submissionDate
     *
     * @return \DateTime
     */
    public function getSubmissionDate()
    {
        return $this->SubmissionDate;
    }


    /**
     * Set resolutionDate
     *
     * @param \DateTime $resolutionDate
     *
     * @return Revision
     */
    public function setResolutionDate($resolutionDate)
    {
        $this->ResolutionDate = $resolutionDate;

        return $this;
    }

    /**
     * Get resolutionDate
     *
     * @return \DateTime
     */
    public function getResolutionDate()
    {
        return $this->ResolutionDate;
    }


    /**
     * Set reviewerComments
     *
     * @param string $reviewerComments
     *
     * @return Revision
     */
    public function setReviewerComments($reviewerComments)
    {
        $this->ReviewerComments = $reviewerComments;

        return $this;
    }

    /**
     * Get reviewerComments
     *
     * @return string
     */
    public function getReviewerComments()
    {
        return $this->ReviewerComments;
    }


    /**
     * Set editorComments
     *
     * @param string $editorComments
     *
     * @return Revision
     */
    public function setEditorComments($editorComments)
    {
        $this->EditorComments = $editorComments;

        return $this;
    }

    /**
     * Get editorComments
     *
     * @return string
     */
    public function getEditorComments()
    {
        return $this->EditorComments;
    }

    /**
     * Set extraComments
     *
     * @param string $extraComments
     *
     * @return Revision
     */
    public function setExtraComments($extraComments)
    {
        $this->ExtraComments = $extraComments;

        return $this;
    }

    /**
     * Get extraComments
     *
     * @return string
     */
    public function getExtraComments()
    {
        return $this->ExtraComments;
    }


    /**
     * Set decision
     *
     * @param string $decision
     *
     * @return Revision
     */
    public function setDecision($decision)
    {
        $this->Decision = $decision;

        return $this;
    }

    /**
     * Get decision
     *
     * @return string
     */
    public function getDecision()
    {
        return $this->Decision;
    }


    /**
     * Set user
     *
     * @param \helena\entities\backoffice\User $user
     *
     * @return Revision
     */
    public function setUserSubmission(\helena\entities\backoffice\User $user = null)
    {
        $this->UserSubmission = $user;

        return $this;
    }

    /**
     * Get user
     *
     * @return \helena\entities\backoffice\User
     */
    public function getUserSubmission()
    {
        return $this->UserSubmission;
    }



    /**
     * Set decision
     *
     * @param string $email
     *
     * @return Revision
     */
    public function setUserSubmissionEmail($email)
    {
        $this->UserSubmissionEmail = $email;

        return $this;
    }

    /**
     * Get decisionEmail
     *
     * @return string
     */
    public function getUserSubmissionEmail()
    {
        return $this->UserSubmissionEmail;
    }


    /**
     * Set user
     *
     * @param \helena\entities\backoffice\User $user
     *
     * @return Revision
     */
    public function setUserDecision(\helena\entities\backoffice\User $user = null)
    {
        $this->UserDecision = $user;

        return $this;
    }

    /**
     * Get user
     *
     * @return \helena\entities\backoffice\User
     */
    public function getUserDecision()
    {
        return $this->UserDecision;
    }
}

