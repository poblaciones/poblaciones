<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\classes\Account;
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
		$licence = '{"licenseType":1,"licenseOpen":"always","licenseCommercial":1,"licenseVersion":"4.0\/deed.es"}';
		$metadata->setLicense($licence);
		$metadata->setLanguage('es; Español');
		$metadata->setType('C');
		$metadata->setCreate($now);
		$metadata->setUpdate($now);
		$metadata->setContact($contact);

		$now = new \DateTime();
		$metadata->setOnlineSince($now);

		self::UpdateMetadataTimeStamps($metadata);

		App::Orm()->Save($metadata);

		return $metadata;
	}

	public static function UpdateMetadataTimeStamps($metadata)
	{
		$now = new \DateTime();
		$userId = Account::Current()->GetUserId();
		$metadata->setLastOnlineUserId($userId);
		$metadata->setPublicationDate($now->format('Y'));
		$metadata->setLastOnline($now);
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

	// Borra un metadata si nadie más lo referencia todavía. $usageChecks
	// es una lista de [sql, params], cada uno debe devolver cuántas OTRAS
	// filas siguen usando ese mismo metadata; si cualquiera da más de
	// cero, no se toca. Se deja vacío cuando el modelo de datos ya
	// garantiza que nunca se comparte (BoundaryVersion, GeographyTuple:
	// siempre exclusivo). ClippingRegion sí puede compartirse
	// explícitamente entre varias regiones, así que pasa su propio check.
	public function DeleteMetadataIfNotUsedElsewhere($metadataId, $usageChecks = array())
	{
		if ($metadataId === null)
			return;
		foreach ($usageChecks as $check)
		{
			$count = App::Db()->fetchScalarInt($check[0], $check[1]);
			if ($count > 0)
				return;
		}
		$this->DeleteMetadataAndContact($metadataId);
	}

	// metadata_ibfk_1 (met_contact_id -> contact.con_id) tiene ON DELETE
	// CASCADE: borrar el contacto borra el metadata solo, y con él en
	// cascada también sus relaciones con instituciones o fuentes si las
	// tuviera (ver BoundaryService, de donde se trajo este mecanismo).
	// met_contact_id es NOT NULL: todo metadata tiene contacto, siempre
	// hay uno para borrar. Libera los adjuntos antes: metadata_file tiene
	// cascade desde metadata, pero metadata_file->file no tiene cascade
	// en esa dirección (solo file->metadata_file), así que sin este paso
	// el registro de file (y lo que tenga de contenido asociado) queda
	// huérfano.
	public function DeleteMetadataAndContact($metadataId)
	{
		$this->DeleteMetadataFiles($metadataId);

		$contactId = App::Db()->fetchScalarInt(
			"SELECT met_contact_id FROM metadata WHERE met_id = ?", array($metadataId));
		App::Db()->delete('contact', array('con_id' => $contactId));
	}

	private function DeleteMetadataFiles($metadataId)
	{
		$filesRes = App::Db()->fetchAll(
			"SELECT fil_id FROM file JOIN metadata_file ON mfi_file_id = fil_id WHERE mfi_metadata_id = ?",
			array($metadataId));
		App::Db()->delete('metadata_file', array('mfi_metadata_id' => $metadataId));
		foreach ($filesRes as $row)
		{
			App::Db()->delete('file', array('fil_id' => $row['fil_id']));
		}
	}
}

