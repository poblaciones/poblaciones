<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * DraftAnnotation
 *
 * @ORM\Table(name="draft_annotation")
 * @ORM\Entity
 */
class DraftAnnotation
{
	/**
	 * @var integer
	 *
	 * @ORM\Column(name="ann_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
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
	 *   @ORM\JoinColumn(name="ann_work_id", referencedColumnName="wrk_id", nullable=false)
	 * })
	 */
	private $Work;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="ann_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Caption;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="ann_guest_access", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
	 */
	private $GuestAccess;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="ann_allowed_types", type="string", length=10, precision=0, scale=0, nullable=false, unique=false)
	 */
	private $AllowedTypes;


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


	/**
	 * Set caption
	 *
	 * @param string $caption
	 *
	 * @return DraftDataset
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
	 * Set guestAccess
	 *
	 * @param string $guestAccess
	 *
	 * @return DraftAnnotation
	 */
	public function setGuestAccess($guestAccess)
	{
		$this->GuestAccess = $guestAccess;

		return $this;
	}

	/**
	 * Get guestAccess
	 *
	 * @return string
	 */
	public function getGuestAccess()
	{
		return $this->GuestAccess;
	}


	/**
	 * Set allowedTypes
	 *
	 * @param string $allowedTypes
	 *
	 * @return DraftAnnotation
	 */
	public function setAllowedTypes($allowedTypes)
	{
		$this->AllowedTypes = $allowedTypes;

		return $this;
	}

	/**
	 * Get allowedTypes
	 *
	 * @return string
	 */
	public function getAllowedTypes()
	{
		return $this->AllowedTypes;
	}
}