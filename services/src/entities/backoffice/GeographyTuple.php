<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;
use \JMS\Serializer\Annotation\VirtualProperty;
use \JMS\Serializer\Annotation\SerializedName;

/**
 * GeographyTuple
 *
 * @ORM\Table(name="geography_tuple", indexes={@ORM\Index(name="fk_geography_tuple_geography1_idx", columns={"gtu_geography_id"}), @ORM\Index(name="fk_geography_tuple_geography2_idx", columns={"gtu_previous_geography_id"}), @ORM\Index(name="fk_geography_tuple_geography3_idx", columns={"gtu_previous_lower_geography_id"})})
 * @ORM\Entity
 */
class GeographyTuple
{
    // Propiedad no almacenada en la base de datos: cantidad de
    // GeographyTupleItem ya calculados para esta tupla (0 si todavía no se
    // corrió 'Calcular').
    public $ChildCount = 0;

    /**
     * @var integer
     *
     * @ORM\Column(name="gtu_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $Id;

    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gtu_geography_id", referencedColumnName="geo_id", nullable=false)
     * })
     */
    private $Geography;

    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gtu_previous_geography_id", referencedColumnName="geo_id", nullable=false)
     * })
     */
    private $PreviousGeography;

    /**
     * @var \helena\entities\backoffice\Geography
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Geography")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gtu_previous_lower_geography_id", referencedColumnName="geo_id", nullable=true)
     * })
     */
    private $PreviousLowerGeography;

    /**
     * @var \helena\entities\backoffice\Metadata
     *
     * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\Metadata")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="gtu_metadata_id", referencedColumnName="met_id", nullable=false)
     * })
     */
    private $Metadata;

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
     * @return GeographyTuple
     */
    public function setId($id)
    {
        $this->Id = $id;

        return $this;
    }

    /**
     * Set geography
     *
     * @param \helena\entities\backoffice\Geography $geography
     *
     * @return GeographyTuple
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
     * Set previousGeography
     *
     * @param \helena\entities\backoffice\Geography $previousGeography
     *
     * @return GeographyTuple
     */
    public function setPreviousGeography(\helena\entities\backoffice\Geography $previousGeography = null)
    {
        $this->PreviousGeography = $previousGeography;

        return $this;
    }

    /**
     * Get previousGeography
     *
     * @return \helena\entities\backoffice\Geography
     */
    public function getPreviousGeography()
    {
        return $this->PreviousGeography;
    }

    /**
     * Set previousLowerGeography
     *
     * @param \helena\entities\backoffice\Geography $previousLowerGeography
     *
     * @return GeographyTuple
     */
    public function setPreviousLowerGeography(\helena\entities\backoffice\Geography $previousLowerGeography = null)
    {
        $this->PreviousLowerGeography = $previousLowerGeography;

        return $this;
    }

    /**
     * Get previousLowerGeography
     *
     * @return \helena\entities\backoffice\Geography
     */
    public function getPreviousLowerGeography()
    {
        return $this->PreviousLowerGeography;
    }

    /**
     * Set metadata
     *
     * @param \helena\entities\backoffice\Metadata $metadata
     *
     * @return GeographyTuple
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

    /**
     * @VirtualProperty
     * @SerializedName("MetadataId")
     */
    public function getMetadataIdForDisplay()
    {
        if ($this->Metadata !== null)
        {
            return $this->Metadata->getId();
        }
        return null;
    }
}
