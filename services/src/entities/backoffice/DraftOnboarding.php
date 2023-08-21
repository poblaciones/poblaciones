<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * DraftOnboarding
 *
 * @ORM\Table(name="draft_onboarding")
 * @ORM\Entity
 */
class DraftOnboarding
{
	public $Steps = [];

	/**
	 * @var integer
	 *
	 * @ORM\Column(name="onb_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="IDENTITY")
	 */
    private $Id;

    /**
     * @var boolean
     *
     * @ORM\Column(name="onb_enabled", type="boolean", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Enabled;

	/**
	 * @var \helena\entities\backoffice\DraftWork
	 *
	 * @ClientReadonly
	 *
	 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
	 * @ORM\JoinColumns({
	 *   @ORM\JoinColumn(name="onb_work_id", referencedColumnName="wrk_id", nullable=false)
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
     * @return DraftOnboarding
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

	/**
     * Set enabled
     *
     * @param boolean $enabled
     *
     * @return DraftOnboarding
     */
    public function setEnabled($enabled)
    {
        $this->Enabled = $enabled;

        return $this;
    }

    /**
     * Get enabled
     *
     * @return boolean
     */
    public function getEnabled()
    {
        return $this->Enabled;
    }


	/**
	 * Set work
	 *
	 * @param \helena\entities\backoffice\DraftWork $work
	 *
	 * @return DraftOnboarding
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

