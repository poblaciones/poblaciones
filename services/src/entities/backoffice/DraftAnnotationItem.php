<?php

namespace helena\entities\backoffice;

use Doctrine\ORM\Mapping as ORM;

/**
 * DraftAnnotationItem
 *
 * @ORM\Table(name="draft_annotation_item", indexes={
 *     @ORM\Index(name="fw_annotation_idx", columns={"ani_annotation_id"})
 * })
 * @ORM\Entity
 */
class DraftAnnotationItem
{
	/**
	 * @var int
	 *
	 * @ORM\Id
	 * @ORM\Column(name="ani_id", type="integer")
	 * @ORM\GeneratedValue(strategy="IDENTITY")
	 */
	private $Id;

	/**
	 * @var DraftAnnotation
	 *
	 * @ORM\ManyToOne(targetEntity="helena\entities\backoffice\DraftAnnotation")
	 * @ORM\JoinColumn(name="ani_annotation_id", referencedColumnName="ann_id")
	 */
	private $Annotation;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="ani_type", type="string", length=1, nullable=false)
	 */
	private $Type;

	/**
	 * @var resource
	 *
	 * @ORM\Column(name="ani_centroid", type="geometry", nullable=false)
	 */
	private $Centroid;

	/**
	 * @var resource
	 *
	 * @ORM\Column(name="ani_geometry", type="geometry", nullable=false)
	 */
	private $Geometry;

	/**
	 * @var int
	 *
	 * @ORM\Column(name="ani_order", type="integer", nullable=false)
	 */
	private $Order;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="ani_caption", type="string", length=255, nullable=false)
	 */
	private $Caption;

	/**
	 * @var string|null
	 *
	 * @ORM\Column(name="ani_description", type="text", nullable=true)
	 */
	private $Description;

	/**
	 * @var string|null
	 *
	 * @ORM\Column(name="ani_color", type="string", length=6, nullable=true)
	 */
	private $Color;

	/**
	 * @var string|null
	 *
	 * @ORM\Column(name="ani_image", type="blob", nullable=true)
	 */
	private $Image;

	/**
	 * @var float|null
	 *
	 * @ORM\Column(name="ani_length_m", type="float", nullable=true)
	 */
	private $Length;

	/**
	 * @var float|null
	 *
	 * @ORM\Column(name="ani_area_m2", type="float", nullable=true)
	 */
	private $Area;

	/**
	 * @var \DateTime
	 *
	 * @ORM\Column(name="ani_create", type="datetime", nullable=false)
	 */
	private $Create;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="ani_user", type="string", length=100, nullable=false)
	 */
	private $User;

	/**
	 * @var \DateTime
	 *
	 * @ORM\Column(name="ani_update", type="datetime", nullable=false)
	 */
	private $Update;

	// ---------- GETTERS Y SETTERS ----------

	public function getId(): ?int
	{
		return $this->Id;
	}

	public function setId(int $id): self
	{
		$this->Id = $id;
		return $this;
	}

	public function getAnnotation(): ?DraftAnnotation
	{
		return $this->Annotation;
	}

	public function setAnnotation(DraftAnnotation $annotation): self
	{
		$this->Annotation = $annotation;
		return $this;
	}

	public function getType(): ?string
	{
		return $this->Type;
	}

	public function setType(string $type): self
	{
		$this->Type = $type;
		return $this;
	}

	public function getCentroid()
	{
		return $this->Centroid;
	}

	public function setCentroid($centroid): self
	{
		$this->Centroid = $centroid;
		return $this;
	}

	public function getGeometry()
	{
		return $this->Geometry;
	}

	public function setGeometry($geometry): self
	{
		$this->Geometry = $geometry;
		return $this;
	}

	public function getOrder(): ?int
	{
		return $this->Order;
	}

	public function setOrder(int $order): self
	{
		$this->Order = $order;
		return $this;
	}

	public function getCaption(): ?string
	{
		return $this->Caption;
	}

	public function setCaption(string $caption): self
	{
		$this->Caption = $caption;
		return $this;
	}

	public function getDescription(): ?string
	{
		return $this->Description;
	}

	public function setDescription(?string $description): self
	{
		$this->Description = $description;
		return $this;
	}

	public function getColor(): ?string
	{
		return $this->Color;
	}

	public function setColor(?string $color): self
	{
		$this->Color = $color;
		return $this;
	}

	public function getImage()
	{
		return $this->Image;
	}

	public function setImage($image): self
	{
		$this->Image = $image;
		return $this;
	}

	public function getLength(): ?float
	{
		return $this->Length;
	}

	public function setLength(?float $length): self
	{
		$this->Length = $length;
		return $this;
	}

	public function getArea(): ?float
	{
		return $this->Area;
	}

	public function setArea(?float $area): self
	{
		$this->Area = $area;
		return $this;
	}

	public function getCreate(): \DateTime
	{
		return $this->Create;
	}

	public function setCreate(\DateTime $create): self
	{
		$this->Create = $create;
		return $this;
	}

	public function getUser(): string
	{
		return $this->User;
	}

	public function setUser(string $user): self
	{
		$this->User = $user;
		return $this;
	}

	public function getUpdate(): \DateTime
	{
		return $this->Update;
	}

	public function setUpdate(\DateTime $update): self
	{
		$this->Update = $update;
		return $this;
	}
}