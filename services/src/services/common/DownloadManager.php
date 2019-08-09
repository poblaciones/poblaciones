<?php

namespace helena\services\common;

use minga\framework\IO;
use minga\framework\Log;
use minga\framework\ErrorException;
use minga\framework\Str;
use minga\framework\System;

use helena\classes\DownloadStateBag;
use helena\classes\Paths;
use helena\db\frontend\DatasetModel;
use helena\db\frontend\ClippingRegionItemModel;
use helena\caches\DownloadCache;
use helena\caches\BackofficeDownloadCache;


use helena\classes\spss\Alignment;
use helena\classes\spss\Variable;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

use helena\classes\App;
use helena\classes\GeoJson;


class DownloadManager
{
	const STEP_BEGIN = 0;
	const STEP_ADDING_ROWS = 1;
	const STEP_CREATED = 2;
	const STEP_DATA_COMPLETE = 3;
	const STEP_CACHED = 4;

	const OUTPUT_LATIN3_WINDOWS_ISO = false;

	const MAX_ROWS = 5000;
	const MAX_DECIMALS = 6;

	private $start = 0.0;
	private $model;
	private $state;

	function __construct()
	{
			$this->start = microtime(true);
	}

	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId, $fromDraft = false)
	{
		self::ValidateType($type);
		self::ValidateClippingItem($clippingItemId);

		// Si está cacheado, sale
		if(self::IsCached($type, $datasetId, $clippingItemId, $fromDraft))
			return array('done' => true);

		// Crea la estructura para la creación en varios pasos del archivo a descargar
		$this->PrepareNewModel($type, $datasetId, $clippingItemId, $fromDraft);
		$this->PrepareNewState($type, $datasetId, $clippingItemId, $fromDraft);
		return $this->GenerateNextFilePart();
	}

	public function StepMultiRequestFile($key)
	{
		// Carga los estados
		$this->LoadState($key);
		$this->LoadModel();
		// Avanza
		switch($this->state->Step())
		{
			case self::STEP_DATA_COMPLETE:
				return $this->PutFileToCache();
			case self::STEP_CACHED:
				return $this->state->ReturnState(true);
			default:
				return $this->GenerateNextFilePart();
		}
	}

	private function GenerateNextFilePart()
	{
		// Continúa creando el archivo
		$this->CreateNextFilePart();
		if($this->state->Step() == self::STEP_DATA_COMPLETE)
			return $this->PutFileToCache();
		else
			return $this->state->ReturnState(false);
	}

	private static function IsCached($type, $datasetId, $clippingItemId, $fromDraft)
	{
		$cacheKey = self::createKey($fromDraft, $type, $clippingItemId);
		$filename = null;
		return self::getCache($fromDraft)->HasData($datasetId, $cacheKey, $filename);
	}

	public static function GetFileBytes($type, $datasetId, $clippingItemId, $fromDraft = false)
	{
		self::ValidateType($type);

		if (!$fromDraft)
		{
			self::ValidateClippingItem($clippingItemId);
		}
		$cacheKey = self::createKey($fromDraft, $type, $clippingItemId);
		$friendlyName = self::GetFileName($datasetId, $clippingItemId, $type);
		$cache = self::getCache($fromDraft);
		// Lo devuelve desde el cache
		$filename = null;
		if ($cache->HasData($datasetId, $cacheKey, $filename, true))
			return App::StreamFile($filename, $friendlyName);
		else
			throw new ErrorException('File must be created before.');
	}
	private static function createKey($fromDraft, $type, $clippingItemId)
	{
		if ($fromDraft)
			return BackofficeDownloadCache::CreateKey($type);
		else
			return DownloadCache::CreateKey($type, $clippingItemId);
	}
	private static function getCache($fromDraft)
	{
		if ($fromDraft)
			return BackofficeDownloadCache::Cache();
		else
			return DownloadCache::Cache();
	}
	private function PutFileToCache()
	{
		if($this->state->Step() == self::STEP_CACHED)
			return $this->state->ReturnState(false);

		if (!file_exists($this->state->Get('outFile')) || filesize($this->state->Get('outFile')) == 0)
			throw new ErrorException("No fue posible generar el archivo (" . $this->state->Get('cacheKey') . ").");

		$cache = self::getCache($this->state->FromDraft());
		$cache->PutData($this->state->Get('datasetId'), $this->state->Get('cacheKey'), $this->state->Get('outFile'));
		unlink($this->state->Get('outFile'));

		$this->state->SetStep(self::STEP_CACHED);
		return $this->state->ReturnState(true);
	}

	private static function ValidateType($type)
	{
		if($type != 's' && $type != 'sw' && $type != 'sg' && $type != 'c' && $type != 'cw' && $type != 'cg' && $type != 'zw' && $type != 'zg')
			throw new ErrorException('Tipo de descarga inválido');
	}

	private static function ValidateClippingItem($clippingItemId)
	{
		if($clippingItemId != 0)
		{
			$model = new ClippingRegionItemModel();
			if(is_numeric($clippingItemId) == false || $model->Exists($clippingItemId) == false)
				throw new ErrorException('ClippingRegionItem no encontrada');
		}
	}

	private function LoadState($key)
	{
		$this->state = new DownloadStateBag();
		$this->state->LoadFromKey($key);
	}

	private function LoadModel()
	{
		$this->model = new DatasetModel($this->state->Get('fullQuery'), $this->state->Get('countQuery'),
								$this->state->Cols(), $this->state->Get('fullParams'), $this->state->Get('wktIndex'));
		$this->model->fromDraft = $this->state->FromDraft();
	}

	private function PrepareNewModel($type, $datasetId, $clippingItemId, $fromDraft)
	{
		$this->model = new DatasetModel();
		$this->model->fromDraft = $fromDraft;
		$this->model->PrepareFileQuery($datasetId, $clippingItemId, $this->GetPolygon($type));
	}

	private function PrepareNewState($type, $datasetId, $clippingItemId, $fromDraft)
	{
		$this->state = DownloadStateBag::Create($type, $datasetId, $clippingItemId, $this->model, $fromDraft);
		$this->state->SetStep(self::STEP_BEGIN);
		$this->state->SetTotalSteps(2);
		$this->state->Set('totalRows', $this->model->GetCountRows());
		$this->state->Save();
	}

	private function CreateNextFilePart()
	{
		if($this->state->Get('type')[0] == 's' || $this->state->Get('type')[0] == 'z')
		{
			if($this->state->Step() == self::STEP_BEGIN)
				$this->state->SetStep(self::STEP_ADDING_ROWS, 'Anexando filas');
			else if($this->state->Step() == self::STEP_ADDING_ROWS)
				$this->PageDataSPSS();
			else if($this->state->Step() == self::STEP_CREATED)
				$this->SaveSPSS();
		}
		elseif($this->state->Get('type')[0] == 'c')
		{
			if($this->state->Step() == self::STEP_BEGIN)
				$this->SaveHeaderCSV();
			else if($this->state->Step() == self::STEP_ADDING_ROWS)
				$this->PageDataCSV();
		}
		else
			throw new ErrorException('Tipo de descarga inválido');
	}

	private function GetPolygon($type)
	{
		if ($type == 'cw' || $type == 'sw' || $type == 'zw')
			return 'wkt';
		if ($type == 'cg' || $type == 'sg' || $type == 'zg')
			return 'geojson';
		return null;
	}

	private function PrepareGeometry($type, $value)
	{
		if ($value == null)
			return null;
		if ($type[1] == 'g')
		{
			$geoJson = new GeoJson();
			$jsonArray = $geoJson->GenerateFeatureFromBinary(array('name'=>'', 'value' => $value));
			$value = json_encode($jsonArray['geometry']);
		}
		return $this->RoundWktValue($value);
	}

	private function RoundWktValue($value)
	{
		// \. = caracter de punto (.)
		// \d = dígito de 0 a 9
		//    {n} = cantidad de ocurrencias n
		// \d* = digitos cantidad de ocurrencias mayor igual a cero
		// [ ,\)] = alguno de los caracteres entre corchetes: espacio, coma o cierra paréntesis
		// Entre paréntesis los grupos para el replace $1, $2 (se borra), $3
		return preg_replace('/(\.\d{'.self::MAX_DECIMALS.'})(\d*)([ ,\)\]])/', '$1$3', $value);
	}

	private function SaveSPSS()
	{
		// Creo el archivo de datos vacío por
		// consistencia de SafeName con hFile.
		touch($this->state->Get('dFile'));

		$head = array();
		foreach($this->state->Cols() as $col)
			$head = $this->ProcessColumn($col, $head);

		// Si no tiene value labels crea el valor
		// vacío para que esté en el json para python.
		if(isset($head['valueLabels']) == false)
			$head['valueLabels'] = new \stdClass();

		$hFile = $this->state->Get('outFile') . '_head.json';
		IO::WriteJson($hFile, $head, true);
		/*
		echo($this->state->Get('outFile') . '_head.json');
			throw new \Exception("aa");
		*/
		$lines = array();
		$ret = System::Execute(App::GetSetting('python'), array(
			Paths::GetPythonScriptsPath() .'/json2spss.py',
			$hFile,
			$this->state->Get('dFile'),
			$this->state->Get('outFile'),
		), $lines);

		if($ret !== 0)
		{
			$err = '';
			$detail = "\nHeader: " . $hFile
				. "\nData: " . $this->state->Get('dFile') . ' (' . $this->state->Get('index') . ')'
				. "\n" . implode("\n", $lines);
			if(App::Debug())
				$err = $detail;
			else {
				Log::HandleSilentException(new ErrorException($detail));
			}
			throw new ErrorException('Error en creación de archivo spss.' . $err);
		}

		$this->state->SetStep(self::STEP_DATA_COMPLETE, 'Descargando archivo');
		$this->state->Save();
	}

	private function PageDataSPSS()
	{
		$rows = $this->GetRowsAndIncrementSlice();

		if(count($rows) > 0)
		{
			$cols = $this->state->Cols();

			foreach($rows as &$row)
			{
				foreach($row as $k => &$value)
				{
					if($this->model->wktIndex == $k)
						$value = $this->PrepareGeometry($this->state->Get('type'), $value);
					$cols[$k]['field_width'] = $this->GetFieldWitdh($value, $cols[$k]);
					$this->SetIdLabels($value, $cols[$k]);
				}
			}
			// Itera para ponerlo en el array
			foreach($cols as $k => $value)
			{
				$this->state->SetColWidth($k, $value['field_width']);
			}
			IO::WriteJson(IO::GetSequenceName($this->state->Get('dFile'), $this->state->Get('index')), $rows);
			$this->state->Increment('index');
		}
		else
		{
			$this->FixDefaultWidths();
			// Finaliza
			$this->state->SetStep(self::STEP_CREATED, 'Consolidando archivo');
		}

		$this->state->Save();
	}
	private function FixDefaultWidths()
	{
		// Pone defaults para anchos no asignados
		// (sólo ocurre en archivos sin filas)
		$cols = $this->state->Cols();
		foreach($cols as $k => $value)
			if ($value['field_width'] == null)
				$this->state->SetColWidth($k, 10);
	}
	private function SetIdLabels($item, &$col)
	{
		if($col['measure'] != Measurement::Scale && $col['id'] !== null)
		{
			if(isset($col['label_ids']) == false)
				$col['label_ids'] = array();
			$col['label_ids'][$item] = null;
		}
	}

	private function GetFieldWitdh($item, $col)
	{
		if(isset($col['field_width']) == false)
			return min(max(1, strlen($item)), 32767);
		else
			return min(max(1, $col['field_width'], strlen($item)), 32767);
	}

	private function SaveHeaderCSV()
	{
		$file = fopen($this->state->Get('outFile'), 'a');
		if($file === false)
			throw new ErrorException('Error en creación de archivo');

		$count = count($this->state->Cols());

		$labels = $this->writeCSVheader($file, $count);

		fclose($file);

		$this->state->Set('labels', $labels);
		$this->state->SetStep(self::STEP_ADDING_ROWS, 'Anexando filas');
		$this->state->Save();
	}

	private function GetRowsAndIncrementSlice()
	{
		$this->state->SetTotalSlices($this->state->Get("totalRows"));
		$start = $this->state->Get('start');
		$this->state->SetSlice($start);
		$rows = $this->model->GetPagedRows($start, self::MAX_ROWS);
		$this->state->Increment('start', self::MAX_ROWS);
		return $rows;
	}

	private function PageDataCSV()
	{
		$rows = $this->GetRowsAndIncrementSlice();


		if(count($rows) > 0)
		{
			$file = fopen($this->state->Get('outFile'), 'a');
			if($file === false)
				throw new ErrorException('Error en creación de archivo');
			$cols = $this->state->Cols();
			$count = count($cols);

			foreach($rows as $row)
			{
				$rowText = '';
				$c = 0;
				foreach($row as $k => $value)
				{
					if($this->model->wktIndex == $k)
						$value = $this->PrepareGeometry($this->state->Get('type'), $value);
					$isNumericColumn = $cols[$c]['format'] == Format::F;
					if($isNumericColumn)
					{
						if (Str::Contains($value, '.'))
						{
							$value = rtrim($value, '0');
							$value = rtrim($value, '.');
						}
					}
					$text = $this->GetCSVField($k, $value, $isNumericColumn, $this->state->Get('labels'), ($k + 1 == $count));
					$text = $this->MakeOutputEncoding($text);
					$rowText .= $text;
					$c++;
				}
				if(fwrite($file, $rowText) === false)
					throw new ErrorException('Error en creación de archivo');
			}
			fclose($file);
		}
		else
		{
			$this->state->SetStep(self::STEP_DATA_COMPLETE, 'Descargando archivo');
		}

		$this->state->Save();
	}
	private function MakeOutputEncoding($utf8text)
	{
		if (self::OUTPUT_LATIN3_WINDOWS_ISO)
			return mb_convert_encoding($utf8text, 'ISO-8859-1', 'UTF-8');
		else
			return $utf8text;
	}
	private function writeCSVheader($file, $count)
	{
		$labels = array();
		foreach($this->state->Cols() as $k => $col)
		{
			$text = $this->FormatCSVField($col['caption'], ($k + 1 == $count));
			$text = $this->MakeOutputEncoding($text);
			if(fwrite($file, $text) === false)
				throw new ErrorException('Error en creación de archivo');

			$res = $this->GetValueLabels($col);
			if(count($res) > 0)
				$labels[$k] = $res;
		}
		return $labels;
	}

	private function GetCSVField($k, $value, $isNumericColumn, $labels, $last)
	{
		if(isset($labels[$k][$value]))
			return $this->FormatCSVField($labels[$k][$value], $last, false);
		else
			return $this->FormatCSVField($value, $last, $isNumericColumn);
	}

	private function FormatCSVField($value, $last = false, $isNumericColumn = false)
	{
		$end = ',';
		if($last)
			$end = "\r\n";

		if ($isNumericColumn)
			return $value . $end;
		else
			return '"' . str_replace('"', '""', $value) . '"' . $end;
	}

	private static function GetFileName($datasetId, $clippingItemId, $type)
	{
		if($type[0] == 's')
			$ext = 'sav';
		elseif($type[0] == 'z')
			$ext = 'zsav';
		elseif($type[0] == 'c')
			$ext = 'csv';
		else
			throw new ErrorException('Tipo de descarga inválido');

		$name = 'dataset' . $datasetId . $type;
		if($clippingItemId != 0)
			$name .= 'r'.$clippingItemId;

		return $name . '.' . $ext;
	}

	private function GetValueLabels($col)
	{
		if($col['measure'] != Measurement::Scale && $col['id'] !== null)
		{
			$ids = array();
			if(isset($col['label_ids']))
				$ids = array_keys($col['label_ids']);
			return $this->model->GetColumnLabels($col['id'], $ids);
		}
		return array();
	}
	private function ProcessColumn(array $col, array $head)
	{
		$col['variable'] = Variable::FixName($col['variable']);

		$head['varNames'][] = $col['variable'];

		$labels = $this->GetValueLabels($col);
		if(count($labels) > 0)
			$head['valueLabels'][$col['variable']] = $labels;

		$head['varFormats'][$col['variable']] = Format::GetName($col['format']).$col['field_width'];

		if($col['format'] == Format::F)
		{
			$head['varTypes'][$col['variable']] = 0;
			$head['varFormats'][$col['variable']] .= '.'.$col['decimals'];
		}
		else
			$head['varTypes'][$col['variable']] = (int)$col['field_width'];

		$head['varLabels'][$col['variable']] = $col['caption'];

		$head['measureLevels'][$col['variable']] = Measurement::GetName($col['measure']);
		$head['columnWidths'][$col['variable']] = (int)$col['column_width'];
		$head['alignments'][$col['variable']] = Alignment::GetName($col['align']);

		return $head;
	}

}

