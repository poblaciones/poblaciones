<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * GradientItem
 *
 * @ORM\Table(name="gradient_item", indexes={@ORM\Index(name="fk_gradient_item_idx", columns={"gri_gradient_id"})})
 * @ORM\Entity
 */
class GradientItem
{
    /**
     * @var integer
     *
     * @ORM\Column(name="gri_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="gri_content", type="blob", precision=0, scale=0, nullable=true, unique=false)
     */
    private $Content;


    /**
     * @var integer
     *
     * @ORM\Column(name="gri_x", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $X;


    /**
     * @var integer
     *
     * @ORM\Column(name="gri_y", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Y;


    /**
     * @var integer
     *
     * @ORM\Column(name="gri_z", type="integer", precision=0, scale=0, nullable=false, unique=false)
     */
    private $Z;


    /**
     * @var \helena\entities\backoffice\Gradient
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Gradient")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gri_gradient_it", referencedColumnName="grd_id", nullable=false)
     * })
     */
    private $Gradient;

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
     * @return GradientItem
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
     * @return GradientItem
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
     * Set x
     *
     * @param integer $x
     *
     * @return GradientItem
     */
    public function setX($x)
    {
        $this->X = $x;

        return $this;
    }

    /**
     * Get x
     *
     * @return integer
     */
    public function getX()
    {
        return $this->X;
    }

		  /**
     * Set y
     *
     * @param integer $y
     *
     * @return GradientItem
     */
    public function setY($y)
    {
        $this->Y = $y;

        return $this;
    }

    /**
     * Get y
     *
     * @return integer
     */
    public function getY()
    {
        return $this->Y;
    }

		  /**
     * Set z
     *
     * @param integer $z
     *
     * @return GradientItem
     */
    public function setZ($z)
    {
        $this->Z = $z;

        return $this;
    }

    /**
     * Get z
     *
     * @return integer
     */
    public function getZ()
    {
        return $this->Z;
    }

    /**
     * Set gradient
     *
     * @param \helena\entities\backoffice\Gradient $gradient
     *
     * @return GradientItem
     */
    public function setGradient(\helena\entities\backoffice\Gradient $gradient = null)
    {
        $this->Gradient = $gradient;

        return $this;
    }

    /**
     * Get gradient
     *
     * @return \helena\entities\backoffice\Gradient
     */
    public function getGradient()
    {
        return $this->Gradient;
    }

}

