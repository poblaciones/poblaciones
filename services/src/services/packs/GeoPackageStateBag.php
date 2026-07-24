<?php

namespace helena\services\packs;

use helena\classes\StateBag;

// Estado compartido por los procesos de alta con GeoPackage (ClippingRegion
// y Geography): comparten el mismo pipeline (parsear el .gpkg ya subido,
// generar niveles de simplificación, insertar los ítems, resolver el
// padre por código). Reutiliza el 'folder' del bucket ya creado por
// GeoPackageUpload (mismo criterio que ImportStateBag).
class GeoPackageStateBag extends StateBag
{
	public static function Create($bucketId)
	{
		$ret = new GeoPackageStateBag();
		$ret->Initialize($bucketId);
		return $ret;
	}

	public function GetFileFolder()
	{
		return $this->GetFolder();
	}

	public function GetHeaderFilename()
	{
		return $this->GetFileFolder() . '/header.json';
	}

	public function SetMapping($mapping)
	{
		$this->Set('mapping', $mapping);
	}

	public function GetMapping()
	{
		return $this->Get('mapping');
	}

	public function SetTargetId($id)
	{
		$this->Set('targetId', $id);
	}

	public function GetTargetId()
	{
		return $this->Get('targetId');
	}

	public function SetParentId($id)
	{
		$this->Set('parentId', $id);
	}

	public function GetParentId()
	{
		return $this->Get('parentId');
	}

	// Cuando la categoría padre es la región raíz ('Países'), los ítems no
	// se vinculan por código de fila: todos cuelgan directo del mismo
	// ítem país (ver ClippingRegionService::StartImportClippingRegion).
	public function SetFixedParentItemId($id)
	{
		$this->Set('fixedParentItemId', $id);
	}

	public function GetFixedParentItemId()
	{
		return $this->Get('fixedParentItemId', null);
	}

	public function IncrementSkipped()
	{
		$this->Increment('skipped');
	}

	public function GetSkipped()
	{
		return $this->Get('skipped', 0);
	}
}
