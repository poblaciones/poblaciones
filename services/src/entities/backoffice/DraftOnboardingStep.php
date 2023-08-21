<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use helena\db\backoffice\annotations\ClientReadonly;

/**
 * DraftOnboardingStep
 *
 * @ORM\Table(name="draft_onboarding_step")
 * @ORM\Entity
 */
class DraftOnboardingStep
{
	/**
     * @var integer
     *
     * @ORM\Column(name="obs_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="obs_caption", type="string", length=50, precision=0, scale=0, nullable=true, unique=false)
     */
    private $Caption;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="obs_content", type="string", length=600, precision=0, scale=0, nullable=true, unique=false)
	 */
	private $Content;


	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="obs_enabled", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Enabled;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="obs_image_alignment", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
	 */
    private $ImageAlignment;

	/**
	 * @var integer
	 *
	 * @ORM\Column(name="obs_order", type="integer", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $Order;


	/**
	 * @var \helena\entities\backoffice\DraftOnboarding
	 *
	 * @ClientReadonly
     *
	 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftOnboarding")
	 * @ORM\JoinColumns({
	 *   @ORM\JoinColumn(name="obs_onboarding_id", referencedColumnName="onb_id", nullable=false)
	 * })
	 */
	private $Onboarding;

	/**
	 * @var \helena\entities\backoffice\DraftFile
	 *
	 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftFile", cascade={"persist", "remove"}, fetch="EAGER")
	 * @ORM\JoinColumns({
	 *   @ORM\JoinColumn(name="obs_image_id", referencedColumnName="fil_id", nullable=true)
	 * })
	 */
	private $Image;


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
     * @return DraftOnboardingStep
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
	 * @return DraftOnboardingStep
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
	 * Set caption
	 *
	 * @param string $caption
	 *
	 * @return DraftOnboardingStep
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
     * Set imageAlignment
     *
     * @param string $imageAlignment
     *
     * @return DraftOnboardingStep
     */
    public function setImageAlignment($imageAlignment)
    {
        $this->ImageAlignment = $imageAlignment;

        return $this;
    }

    /**
     * Get imageAlignment
     *
     * @return string
     */
    public function getImageAlignment()
    {
        return $this->ImageAlignment;
    }

	/**
     * Set enabled
     *
     * @param boolean $enabled
     *
     * @return DraftOnboardingStep
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
	 * Set image
	 *
	 * @param \helena\entities\backoffice\DraftFile $image
	 *
	 * @return DraftOnboardingStep
	 */
	public function setImage(\helena\entities\backoffice\DraftFile $image = null)
	{
		$this->Image = $image;

		return $this;
	}

	/**
	 * Get onboarding
	 *
	 * @return \helena\entities\backoffice\DraftOnboarding
	 */
	public function getOnboarding()
	{
		return $this->Onboarding;
	}

	/**
	 * Set onboarding
	 *
	 * @param \helena\entities\backoffice\DraftOnboarding $onboarding
	 *
	 * @return DraftOnboardingStep
	 */
    public function setOnboarding(\helena\entities\backoffice\DraftOnboarding $onboarding = null)
    {
        $this->Onboarding = $onboarding;

        return $this;
    }

    /**
     * Get image
     *
     * @return \helena\entities\backoffice\DraftFile
     */
    public function getImage()
    {
        return $this->Image;
	}


	/**
	 * Set order
	 *
	 * @param integer $order
	 *
	 * @return DraftOnboardingStep
	 */
	public function setOrder($order)
	{
		$this->Order = $order;

		return $this;
	}

	/**
	 * Get order
	 *
	 * @return integer
	 */
	public function getOrder()
	{
		return $this->Order;
	}
}

