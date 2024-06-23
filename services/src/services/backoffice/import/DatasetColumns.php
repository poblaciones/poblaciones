<?php

namespace helena\services\backoffice\import;

use helena\classes\App;
use helena\classes\spss\Variable;
use minga\framework\Str;
use helena\entities\backoffice\DraftDatasetColumn;
use helena\entities\backoffice\DraftDataset;

class DatasetColumns
{
	private $headers;

	function __construct($headers)
	{
       $this->headers = $headers;
	}

	public static function FixCaption($column)
	{
			if (Str::IsNullOrEmpty($column->getLabel()))
				$column->setCaption($column->getVariable());
			else
				$column->setCaption($column->getLabel());
	}

	public static function FixName($column)
	{
		$name = $column->getVariable();
		$newName = Variable::FixName($name);
		if ($newName !== $name)
				$column->setVariable($newName);
	}

  public function InsertColumnDescriptions($datasetId)
	{
		$dataset = App::Orm()->find(DraftDataset::class, $datasetId);
		$order = 1;
		// hacer el selectmax del columnid para luego saber donde comienzan las columnas nuevas y poder determinar como hacer el merge
		foreach($this->headers as $header){
			$column = new DraftDatasetColumn();
			$column->setLabel(Str::FixEncoding($header->GetLabel()));
			$column->setField($header->GetField());
			$column->setVariable($header->GetVariable());
			$column->setFieldWidth($header->GetFieldWidth());
			$column->setColumnWidth($header->GetColumnWidth());
			$column->setFormat($header->GetSpssType());
			$column->setMeasure($header->GetMeasureLevels());
			$column->setAlignment($header->GetAlignment());
			$column->setDecimals($header->GetDecimals());
			$column->setUseInSummary(true);
			$column->setUseInExport(true);
			$column->setValueLabelsAreDirty(false);
			$column->setOrder($order);
			$column->setDataset($dataset);

			self::FixCaption($column);

			App::Orm()->save($column);

			if (count($header->GetLabelValues()) > 0)
			{
				$this->SaveLabels($header->GetLabelValues(), $column);
			}
			$order++;
		}
	}

	private function SaveLabels($labelValues, $column)
	{
		$sql = "INSERT INTO draft_dataset_column_value_label (dla_value, dla_caption, dla_dataset_column_id) VALUES ";
		$values = "";
		foreach($labelValues as $key => $description)
		{
			 if ($values !== "") $values .= ",";
				$values .= "(" . floatval($key) . ","
										. Str::CheapSqlEscape(Str::FixEncoding($description)) . ", " .
				$column->getId() . ")";
		}
		App::Db()->exec($sql . $values);
	}
}

