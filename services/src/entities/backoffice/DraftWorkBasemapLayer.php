<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;
use \JMS\Serializer\Annotation\Exclude;

/**
 * DraftWorkBasemapLayer
 *
 * Estado de inicio de una capa base en una cartografía. La ausencia de fila
 * equivale al valor por defecto del tipo de capa (etiquetas activas, demás inactivas).
 *
 * @ORM\Table(name="draft_work_basemap_layer", uniqueConstraints={@ORM\UniqueConstraint(name="draft_work_basemap_layer_UNIQUE", columns={"wbl_work_id", "wbl_layer_id"})}, indexes={@ORM\Index(name="fk_draft_work_basemap_layer_layer", columns={"wbl_layer_id"}), @ORM\Index(name="fk_draft_work_basemap_layer_work", columns={"wbl_work_id"})})
 * @ORM\Entity
 */
class DraftWorkBasemapLayer
{
	/**
	 * @var integer
	 *
	 * @ORM\Column(name="wbl_id", type="integer", precision=0, scale=0, nullable=false, unique=false)
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="IDENTITY")
	 */
	private $Id;

	/**
	 * @var \helena\entities\backoffice\BasemapLayer
	 *
	 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\BasemapLayer")
	 * @ORM\JoinColumns({
	 *   @ORM\JoinColumn(name="wbl_layer_id", referencedColumnName="bml_id", nullable=false)
	 * })
	 */
	private $Layer;

	/**
	 * @var \helena\entities\backoffice\DraftWork
	 *
	 * @Exclude
	 *
	 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftWork")
	 * @ORM\JoinColumns({
	 *   @ORM\JoinColumn(name="wbl_work_id", referencedColumnName="wrk_id", nullable=false)
	 * })
	 */
	private $Work;

	/**
	 * @var boolean
	 *
	 * @ORM\Column(name="wbl_start_active", type="boolean", precision=0, scale=0, nullable=false, unique=false)
	 */
	private $StartActive;

	public function getId()
	{
		return $this->Id;
	}

	public function setId($id)
	{
		$this->Id = $id;
		return $this;
	}

	public function getStartActive()
	{
		return $this->StartActive;
	}

	public function setStartActive($startActive)
	{
		$this->StartActive = $startActive;
		return $this;
	}

	public function getLayer()
	{
		return $this->Layer;
	}

	public function setLayer(\helena\entities\backoffice\BasemapLayer $layer = null)
	{
		$this->Layer = $layer;
		return $this;
	}

	public function getWork()
	{
		return $this->Work;
	}

	public function setWork(\helena\entities\backoffice\DraftWork $work = null)
	{
		$this->Work = $work;
		return $this;
	}
}
