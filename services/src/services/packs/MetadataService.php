<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\entities\admin\structs\MetadataInfo;
use minga\framework\PublicException;
use minga\framework\Profiling;
use minga\framework\Performance;
use helena\services\backoffice as services;


class MetadataService extends BaseService
{
	public function GetNextId($className)
	{
		Profiling::BeginTimer();
		$metadata = App::Orm()->getClassMetadata($className);
		$table = $metadata->GetTableName();
		$id = $metadata->GetColumnName("Id");

		$sql = "SELECT IFNULL(MAX(" . $id . ") + 100, 100) FROM " . $table . " WHERE " . $id . " % 100 = 0";

		$ret = App::Db()->fetchScalarInt($sql);
		Profiling::EndTimer();

		return $ret;
	}

	public function EnsureId($className, $object)
	{
		$currentId = $object->getId();
		if (!$currentId) {
			$nextId = $this->GetNextId($className);
			$object->setId($nextId);
		}
	}

	// Se llama al dar de alta una región o geografía sin metadata propia
	// todavía: crea un registro mínimo (y su contacto asociado, obligatorio
	// por clave foránea) para que la entidad tenga algo que editar, en vez
	// de quedar sin metadata hasta que alguien lo cree a mano. met_id,
	// con_id no son autonuméricos (EnsureId antes de guardar). Los campos
	// NOT NULL sin default de metadata que no tienen un valor razonable
	// todavía se completan con un espacio, salvo met_title (con
	// "Caption, Version" o solo "Caption" si no hay versión) y
	// met_period_caption (con la versión, si existe): son los dos casos
	// donde silenciar el campo con un espacio dejaría el registro más
	// confuso de lo necesario para quien lo complete después.
	public function CreateMinimalMetadata($caption, $version)
	{
		$contact = new entities\Contact();
		$this->EnsureId(entities\Contact::class, $contact);
		App::Orm()->Save($contact);

		$title = $caption;
		if ($version)
		{
			$title .= ', ' . $version;
		}

		$now = new \DateTime();
		$metadata = new entities\Metadata();
		$this->EnsureId(entities\Metadata::class, $metadata);
		$metadata->setTitle($title);
		$metadata->setAbstract(' ');
		$metadata->setStatus('B');
		$metadata->setAuthors(' ');
		$metadata->setCoverageCaption(' ');
		$metadata->setPeriodCaption($version);
		$metadata->setLicense(' ');
		$metadata->setType('C');
		$metadata->setCreate($now);
		$metadata->setUpdate($now);
		$metadata->setContact($contact);
		App::Orm()->Save($metadata);

		return $metadata;
	}

	public function GetMetadata($metadataId)
	{
		$ret = new MetadataInfo();
		$ret->Metadata = App::Orm()->find(entities\Metadata::class, $metadataId);
		if ($ret->Metadata === null)
			throw new PublicException('El elemento no existe en la base de datos.');

		// Colecciones de metadatos
		$metadataService = new services\MetadataService(false);
		$ret->Sources = $metadataService->GetSources($metadataId);
		$ret->Institutions = $metadataService->GetInstitutions($metadataId);
		$ret->Files = $metadataService->GetFiles($metadataId);

		return $ret;
	}
}

