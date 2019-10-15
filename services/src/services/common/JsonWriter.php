<?php

namespace helena\services\common;

use minga\framework\IO;
use minga\framework\Log;
use minga\framework\ErrorException;
use minga\framework\Str;
use minga\framework\System;
use helena\classes\Paths;
use helena\classes\spss\Alignment;
use helena\classes\spss\Variable;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

use helena\classes\App;

class JsonWriter extends BaseWriter
{
	public function PageData()
	{
		$rows = $this->GetRowsAndIncrementSlice();
		if(count($rows) > 0)
		{
			$cols = $this->state->Cols();

			foreach($rows as &$row)
			{
				foreach($row as $k => &$valueFor)
				{
					if($this->model->wktIndex == $k)
					{
						$valueFor = $this->PrepareGeometry($this->state->Get('type'), $valueFor);
					}
					$cols[$k]['field_width'] = $this->GetFieldWitdh($valueFor, $cols[$k]);
					$this->SetIdLabels($valueFor, $cols[$k]);
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
			$this->state->SetStep(DownloadManager::STEP_CREATED, 'Consolidando archivo');
		}

		$this->state->Save();
	}
	

	private function FixDefaultWidths()
	{
		// Pone defaults para anchos no asignados (sólo ocurre en archivos sin filas)
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
}

