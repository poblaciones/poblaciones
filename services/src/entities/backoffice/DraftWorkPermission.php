<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Exclude;
use JMS\Serializer\Annotation\ExclusionPolicy;

/**
 * DraftWorkPermission
 *
 * @ORM\Table(name="draft_work_permission", indexes={@ORM\Index(name="fk_draft_work_permission_user1", columns={"wkp_user_id"}), @ORM\Index(name="fk_draft_work_permission_work1", columns={"wkp_work_id"})})
 * @ORM\Entity
 */
class DraftWorkPermission
{
    /**
     * @var integer
     *
     * @ORM\Column(name="wkp_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="wkp_permission", type="string", length=1, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Permission;

    /**
     * @var \helena\entities\backoffice\User
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\User")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wkp_user_id", referencedColumnName="usr_id", nullable=true)
     * })
     */
    private $User;

    /**
     * @var \helena\entities\backoffice\DraftWork
     *
		 * @Exclude
		 *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="wkp_work_id", referencedColumnName="wrk_id", nullable=true)
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
     * @return DraftWorkPermission
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }
    /**
     * Set permission
     *
     * @param string $permission
     *
     * @return DraftWorkPermission
     */
    public function setPermission($permission)
    {
        $this->Permission = $permission;

        return $this;
    }

    /**
     * Get permission
     *
     * @return string
     */
    public function getPermission()
    {
        return $this->Permission;
    }

    /**
     * Set user
     *
     * @param \helena\entities\backoffice\User $user
     *
     * @return DraftWorkPermission
     */
    public function setUser(\helena\entities\backoffice\User $user = null)
    {
        $this->User = $user;

        return $this;
    }

    /**
     * Get user
     *
     * @return \helena\entities\backoffice\User
     */
    public function getUser()
    {
        return $this->User;
    }

    /**
     * Set work
     *
     * @param \helena\entities\backoffice\DraftWork $work
     *
     * @return DraftWorkPermission
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

