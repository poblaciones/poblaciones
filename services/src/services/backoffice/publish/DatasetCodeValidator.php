<?php

namespace helena\services\backoffice\publish;

use helena\classes\App;
use helena\classes\DatasetTypeEnum;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use minga\framework\PublicException;
use minga\framework\Profiling;

// Verifica antes de publicar que la columna de código de cada dataset identifique a un único
// elemento: un código repetido haría ambigua la tabla de comparación entre series.
class DatasetCodeValidator
{
	const MAX_REPORTED_VALUES = 20;

	public function Validate(int $workId): void
	{
		Profiling::BeginTimer();
		$datasets = $this->GetDatasetsWithCode($workId);
		foreach($datasets as $dataset)
		{
			$this->ValidateDataset($dataset);
		}
		Profiling::EndTimer();
	}

	private function GetDatasetsWithCode(int $workId): array
	{
		$sql = "SELECT dat_id, dat_caption, dat_table, dco_field, dco_caption
						FROM draft_dataset
						JOIN draft_dataset_column ON dco_id = dat_code_column_id
						WHERE dat_work_id = ? AND dat_type IN (?, ?) AND dat_table IS NOT NULL
						ORDER BY dat_caption";
		$params = array($workId, DatasetTypeEnum::Locations, DatasetTypeEnum::Shapes);
		return App::Db()->fetchAll($sql, $params);
	}

	private function ValidateDataset(array $dataset): void
	{
		if (!App::Db()->tableExists($dataset['dat_table']))
		{
			return;
		}
		$repeated = $this->GetRepeatedCodes($dataset);
		if (sizeof($repeated) > 0)
		{
			throw new PublicException($this->BuildMessage($dataset, $repeated));
		}
	}

	// Pide un valor más que el máximo informado para saber si hay más repetidos que los que se listan.
	private function GetRepeatedCodes(array $dataset): array
	{
		$code = SnapshotByDatasetModel::CodeExpression($dataset['dco_field']);
		$sql = "SELECT code, COUNT(*) AS total
						FROM (SELECT " . $code . " AS code FROM " . $dataset['dat_table'] . ") codes
						WHERE code IS NOT NULL
						GROUP BY code
						HAVING COUNT(*) > 1
						ORDER BY code
						LIMIT " . (self::MAX_REPORTED_VALUES + 1);
		return App::Db()->fetchAll($sql);
	}

	private function BuildMessage(array $dataset, array $repeated): string
	{
		$reportedCount = min(sizeof($repeated), self::MAX_REPORTED_VALUES);
		$items = array();
		for($n = 0; $n < $reportedCount; $n++)
		{
			$items[] = "'" . $repeated[$n]['code'] . "' (" . $repeated[$n]['total'] . " veces)";
		}
		$text = "El dataset '" . $dataset['dat_caption'] . "' tiene valores repetidos en la columna de código '" .
						$dataset['dco_caption'] . "'. Cada código debe identificar a un único elemento para poder comparar las series.\n\n";
		if (sizeof($repeated) > self::MAX_REPORTED_VALUES)
		{
			$text .= "Primeros " . self::MAX_REPORTED_VALUES . " valores repetidos: ";
		}
		else
		{
			$text .= "Valores repetidos: ";
		}
		$text .= implode(', ', $items) . ".\n\n";
		$text .= "Corrija los datos, o quite la columna de código del dataset, e intente publicar nuevamente.";
		return $text;
	}
}
