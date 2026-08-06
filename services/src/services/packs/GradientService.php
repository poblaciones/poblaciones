<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\classes\StateBag;
use minga\framework\PublicException;
use minga\framework\FileBucket;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;

class GradientService extends BaseService
{
	const STEP_INSERTING = 0;
	const STEP_END = 1;
	const TILES_PER_SLICE = 500;

	public function GetNewGradient()
	{
		$entity = new entities\Gradient();
		$entity->setImageType('image/png');
		$entity->setMaxZoomLevel(0);
		return $entity;
	}

	public function GetGradients()
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findAll(entities\Gradient::class, array('Caption' => 'ASC'));
		Profiling::EndTimer();
		return $ret;
	}

	public function UpdateGradient($gradient)
	{
		Profiling::BeginTimer();
		App::Orm()->Save($gradient);
		Profiling::EndTimer();
		return self::OK;
	}

	public function DeleteGradient($gradient)
	{
		Profiling::BeginTimer();
		App::Db()->delete('gradient_item', array('gri_gradient_id' => $gradient->getId()));
		App::Orm()->delete($gradient);
		Profiling::EndTimer();
		return self::OK;
	}

	// ---------------------------------------------------------------
	// Alta con GeoPackage de teselas
	// ---------------------------------------------------------------

	// A diferencia de ClippingRegion/Geography (capas vectoriales, leídas
	// con GpkgReader), acá el .gpkg es una grilla de teselas: se lee
	// directo como base SQLite, sin pasar por el pipeline de conversión a
	// JSON. No hay mapeo de columnas de negocio: el archivo ya tiene la
	// estructura fija tile_column/tile_row/zoom_level/tile_data del
	// estándar GeoPackage.
	public function VerifyGradientPackage($bucketId)
	{
		Profiling::BeginTimer();
		$bucket = FileBucket::Load($bucketId);
		$db = $this->OpenTileDatabase($bucket->path);
		try
		{
			$tables = $this->GetTileTableNames($db);
			if (count($tables) === 0)
			{
				return array('Error' => 'El archivo no contiene capas de tipo teselas (tiles).');
			}
			if (count($tables) > 1)
			{
				return array('Error' => 'El GeoPackage debe contener una única capa. Se encontraron: ' . implode(', ', $tables) . '.');
			}
			return array('MaxZoomLevel' => $this->GetMaxZoomLevel($db, $tables[0]));
		}
		finally
		{
			$db->close();
			Profiling::EndTimer();
		}
	}

	public function StartImportGradient($gradient, $bucketId)
	{
		Profiling::BeginTimer();

		$countryId = App::Settings()->Map()->CurrentCountryId;
		$country = App::Orm()->find(entities\ClippingRegionItem::class, $countryId);
		$gradient->setCountry($country);

		$bucket = FileBucket::Load($bucketId);
		$db = $this->OpenTileDatabase($bucket->path);
		$tables = $this->GetTileTableNames($db);
		if (count($tables) !== 1)
		{
			$db->close();
			throw new PublicException('El GeoPackage debe contener una única capa de teselas.');
		}
		$table = $tables[0];
		$gradient->setMaxZoomLevel($this->GetMaxZoomLevel($db, $table));
		$totalTiles = $this->CountTiles($db, $table);
		$db->close();

		App::Orm()->Save($gradient);

		$state = CalculationStateBag::Create($bucketId);
		$state->Set('gradientId', $gradient->getId());
		$state->Set('table', $table);
		$state->Set('offset', 0);
		$state->SetTotalSteps(1);
		$totalSlices = 0;
		if ($totalTiles > 0)
		{
			$totalSlices = (int)ceil($totalTiles / self::TILES_PER_SLICE);
		}
		$state->SetTotalSlices($totalSlices);
		$state->SetStep(self::STEP_INSERTING, 'Insertando teselas');

		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	public function StepImportGradient($key)
	{
		$state = new StateBag();
		$state->LoadFromKey($key);
		switch ($state->Step())
		{
			case self::STEP_INSERTING:
				return $this->InsertGradientTiles($state);
			default:
				throw new PublicException('Paso inválido.');
		}
	}

	private function InsertGradientTiles($state)
	{
		Profiling::BeginTimer();
		$db = $this->OpenTileDatabase($state->GetFolder());
		$table = $state->Get('table');
		$offset = $state->Get('offset');
		$safeTable = str_replace('"', '""', $table);

		$result = $db->query("SELECT tile_column, tile_row, zoom_level, tile_data FROM \"" . $safeTable
			. "\" LIMIT " . self::TILES_PER_SLICE . " OFFSET " . intval($offset));
		$gradientId = $state->Get('gradientId');
		$count = 0;
		while ($row = $result->fetchArray(SQLITE3_ASSOC))
		{
			App::Db()->insert('gradient_item', array(
				'gri_x' => $row['tile_column'],
				'gri_y' => $row['tile_row'],
				'gri_z' => $row['zoom_level'],
				'gri_content' => $row['tile_data'],
				'gri_gradient_id' => $gradientId,
			));
			$count++;
		}
		$db->close();

		$state->Set('offset', $offset + $count);
		$state->NextSlice();

		if ($count < self::TILES_PER_SLICE)
		{
			Profiling::EndTimer();
			return $this->FinishGradientImport($state);
		}
		Profiling::EndTimer();
		return $state->ReturnState(false);
	}

	private function FinishGradientImport($state)
	{
		Profiling::BeginTimer();
		$gradientId = $state->Get('gradientId');
		$gradient = App::Orm()->find(entities\Gradient::class, $gradientId);

		$state->SetResult(json_decode(App::OrmSerialize($gradient)));
		$state->SetStep(self::STEP_END, 'Completado exitosamente');
		Profiling::EndTimer();
		return $state->ReturnState(true);
	}

	// ---------------------------------------------------------------
	// SQLite / GeoPackage
	// ---------------------------------------------------------------

	private function OpenTileDatabase($folder)
	{
		try
		{
			return new \SQLite3($folder . '/file.dat', SQLITE3_OPEN_READONLY);
		}
		catch (\Exception $e)
		{
			throw new PublicException('No pudo abrirse el archivo GeoPackage: ' . $e->getMessage());
		}
	}

	private function GetTileTableNames($db)
	{
		$result = $db->query("SELECT table_name FROM gpkg_contents WHERE data_type = 'tiles'");
		$ret = array();
		while ($row = $result->fetchArray(SQLITE3_ASSOC))
		{
			$ret[] = $row['table_name'];
		}
		return $ret;
	}

	private function GetMaxZoomLevel($db, $table)
	{
		$safeTable = str_replace('"', '""', $table);
		$row = $db->query("SELECT MAX(zoom_level) AS MaxZoom FROM \"" . $safeTable . "\"")->fetchArray(SQLITE3_ASSOC);
		if ($row === false || $row['MaxZoom'] === null)
		{
			return 0;
		}
		return intval($row['MaxZoom']);
	}

	private function CountTiles($db, $table)
	{
		$safeTable = str_replace('"', '""', $table);
		$row = $db->query("SELECT COUNT(*) AS Total FROM \"" . $safeTable . "\"")->fetchArray(SQLITE3_ASSOC);
		if ($row === false)
		{
			return 0;
		}
		return intval($row['Total']);
	}
}
