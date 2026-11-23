<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\frontend\SelectedMetricService;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;
use minga\framework\Profiling;

// Informe para el autor de una cartografía sobre qué variables de un indicador publicado se pueden
// comparar entre series, y por qué las demás no. Es de uso exclusivo del backoffice: no forma parte
// de GetSelectedMetric, que usa el visor en cada consulta.
class MetricComparabilityService extends BaseService
{
	const COMPARABLE = 'Comparable.';

	// Devuelve una fila por combinación de nivel, variable y diagnóstico, con las ediciones que la comparten.
	public function GetReport(int $metricId): array
	{
		Profiling::BeginTimer();
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric(PublishDataTables::Shardified($metricId), false);
		$ret = [];
		// Con una única serie no hay con qué comparar: no hay nada para explicar
		if ($metric !== null && sizeof($metric->Versions) > 1)
		{
			$ret = $this->BuildRows($metric, $selectedService->GetDatasetIdsWithCode($metric));
		}
		Profiling::EndTimer();
		return $ret;
	}

	private function BuildRows($metric, array $datasetIdsWithCode): array
	{
		$rows = [];
		foreach($metric->Versions as $version)
		{
			foreach($version->Levels as $level)
			{
				foreach($level->Variables as $variable)
				{
					$message = $this->Diagnose($metric, $level, $variable, $datasetIdsWithCode);
					$this->AddToRows($rows, $version->Version->Name, $level->Name, $this->VariableCaption($variable), $message);
				}
			}
		}
		return $this->FormatRows($rows);
	}

	private function VariableCaption($variable): string
	{
		if ($variable->Name === '')
		{
			return 'Conteo';
		}
		return $variable->Name;
	}

	private function AddToRows(array &$rows, string $versionName, string $levelName, string $variableName, string $message): void
	{
		$key = $levelName . '|' . $variableName . '|' . $message;
		if (!array_key_exists($key, $rows))
		{
			$rows[$key] = ['Level' => $levelName, 'Variable' => $variableName, 'Message' => $message,
										 'Comparable' => ($message === self::COMPARABLE), 'Versions' => []];
		}
		$rows[$key]['Versions'][] = $versionName;
	}

	private function FormatRows(array $rows): array
	{
		$ret = [];
		foreach($rows as $row)
		{
			$row['Versions'] = implode(', ', $row['Versions']);
			$ret[] = $row;
		}
		return $ret;
	}

	private function Diagnose($metric, $level, $variable, array $datasetIdsWithCode): string
	{
		if ($level->Partitions !== null)
		{
			return 'No comparable por tener particiones.';
		}
		if ($level->Dataset->Type === 'D')
		{
			return $this->DiagnoseStandard($metric, $level, $variable);
		}
		return $this->DiagnoseByCode($metric, $level, $variable, $datasetIdsWithCode);
	}

	private function DiagnoseStandard($metric, $level, $variable): string
	{
		$candidates = $this->GetOtherSeriesLevels($metric, $level, 'D');
		if (sizeof($candidates) === 0)
		{
			return 'No comparable por no haber otra serie con el mismo nivel geográfico.';
		}
		$related = $this->GetCandidatesWithGeographyRelation($level, $candidates);
		if (sizeof($related) === 0)
		{
			return 'No comparable por no haber equivalencias geográficas.';
		}
		if (!$variable->Comparable)
		{
			return 'No comparable por fórmula diferente.';
		}
		return self::COMPARABLE;
	}

	private function DiagnoseByCode($metric, $level, $variable, array $datasetIdsWithCode): string
	{
		if (!in_array((int)$level->Dataset->Id, $datasetIdsWithCode, true))
		{
			if ($level->Dataset->Type === 'L')
			{
				return 'No comparable por ser ubicaciones sin una columna de código.';
			}
			return 'No comparable por ser zonas sin una columna de código.';
		}
		$candidates = $this->GetOtherSeriesLevels($metric, $level, $level->Dataset->Type);
		$candidatesWithCode = [];
		foreach($candidates as $candidate)
		{
			if (in_array((int)$candidate->Dataset->Id, $datasetIdsWithCode, true))
			{
				$candidatesWithCode[] = $candidate;
			}
		}
		if (sizeof($candidatesWithCode) === 0)
		{
			return 'No comparable porque ninguna otra serie declara una columna de código.';
		}
		if (!$variable->Comparable)
		{
			return 'No comparable por fórmula diferente.';
		}
		return self::COMPARABLE;
	}

	// Niveles de otras series, del mismo tipo, en otro dataset y sin particiones (los que MarkComparableVariables considera).
	private function GetOtherSeriesLevels($metric, $level, string $type): array
	{
		$ret = [];
		foreach($metric->Versions as $version)
		{
			foreach($version->Levels as $other)
			{
				if ($this->IsComparisonCandidate($level, $other, $type))
				{
					$ret[] = $other;
				}
			}
		}
		return $ret;
	}

	private function IsComparisonCandidate($level, $other, string $type): bool
	{
		if ($other->Dataset->Type !== $type || $other->Partitions !== null)
		{
			return false;
		}
		if ($other->Dataset->Id === $level->Dataset->Id)
		{
			return false;
		}
		// Los datasets estándar se comparan nivel contra nivel; ubicaciones y zonas, sin importar su geografía
		if ($type === 'D')
		{
			return $other->ShortName === $level->ShortName;
		}
		return true;
	}

	private function GetCandidatesWithGeographyRelation($level, array $candidates): array
	{
		$ret = [];
		foreach($candidates as $candidate)
		{
			if (MergeSnapshotsByDatasetModel::HasGeographyRelation($level->GeographyId, $candidate->GeographyId))
			{
				$ret[] = $candidate;
			}
		}
		return $ret;
	}
}
