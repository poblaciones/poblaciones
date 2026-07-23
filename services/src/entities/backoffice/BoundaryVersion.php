<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\Type;

/**
 * Geography
 *
 * @ORM\Table(name="boundary_version")
 * @ORM\Entity
 */
class BoundaryVersion
{
		// Propiedades no almacenada en la base de datos. @Type explícito:
		// sin él, el serializer puede no inferir bien el tipo de una
		// propiedad pública sin anotación cuando el valor es un array de
		// arrays (a diferencia de un string simple, como VersionsSummary en
		// Boundary, que sí se ve). El default explícito (en vez de dejarla
		// sin inicializar) es una segunda red de seguridad para lo mismo.
		// ClippingRegionsSummary es puramente para diagnóstico: si el
		// listado la muestra bien pero ClippingRegions le sigue sin
		// llegar al popup, confirma que el problema es específico de
		// serializar el array, no de la consulta en sí.
		/**
		 * @Type("array")
		 */
		public $ClippingRegions = array();
		public $ClippingRegionsSummary = '';
		public $Level;

		/**
     * @var integer
     *
     * @ORM\Column(name="bvr_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var string
     *
     * @ORM\Column(name="bvr_caption", type="string", length=100, precision=0, scale=0, nullable=false, unique=false)
     */
    private $Caption;

    /**
     * @var \helena\entities\backoffice\Metadata
     * @Exclude
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
		 * @ORM\JoinColumns({
		 *   @ORM\JoinColumn(name="bvr_metadata_id", referencedColumnName="met_id", nullable=true)
		 * })
		 */
    private $Metadata;

    /**
		 * @var \helena\entities\backoffice\Geography
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
		 * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="bvr_geography_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $Geography;

		/**
		 * @var \helena\entities\backoffice\Boundary
		 *
		 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Boundary")
		 * @ORM\JoinColumns({
		 *   @ORM\JoinColumn(name="bvr_boundary_id", referencedColumnName="bou_id", nullable=false)
		 * })
		 */
	private $Boundary;



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
     * @return BoundaryVersion
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set caption
     *
     * @param string $caption
     *
     * @return BoundaryVersion
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
	 * Set geography
	 *
	 * @param \helena\entities\backoffice\Geography $geography
	 *
	 * @return BoundaryVersion
	 */
    public function setGeography(\helena\entities\backoffice\Geography $geography = null)
    {
			$this->Geography = $geography;

			return $this;
    }

    /**
		 * Get geography
		 *
		 * @return \helena\entities\backoffice\Geography
		 */
    public function getGeography()
    {
			return $this->Geography;
    }

    /**
		 * Set boundary
		 *
		 * @param \helena\entities\backoffice\Boundary $boundary
		 *
		 * @return BoundaryVersion
		 */
    public function setBoundary(\helena\entities\backoffice\Boundary $boundary = null)
    {
			$this->Boundary = $boundary;

			return $this;
    }

    /**
		 * Get boundary
		 *
	 * @return \helena\entities\backoffice\Boundary
		 */
    public function getBoundary()
    {
			return $this->Boundary;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return BoundaryVersion
     */
    public function setMetadata(\helena\entities\backoffice\Metadata $metadata = null)
    {
        $this->Metadata = $metadata;

        return $this;
    }

    /**
     * Get metadata
     *
     * @return \helena\entities\backoffice\Metadata
     */
    public function getMetadata()
    {
        return $this->Metadata;
    }
}

