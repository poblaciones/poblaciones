<?php

namespace helena\services\backoffice\import;

use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

use minga\framework\Profiling;
use helena\classes\App;
use minga\framework\Str;
use minga\framework\ErrorException;

use helena\services\backoffice\cloning\SqlBuilder;

class DatasetTable
{
	const BATCH_SIZE = 50;

	public function CreateTable($headers)
	{
		$tableName = self::CreateNewTableName();
		$this->RegisterTable($tableName);
		$creationQuery = $this->SqlCreateTable($tableName, $headers);
		App::Db()->execDDL($creationQuery);
		$this->CreateFk($tableName);
		return $tableName;
	}

	public function InsertDatafile($tableName, $headers, $dataFileName)
	{
		$content = file_get_contents($dataFileName);
		$items = json_decode($content, TRUE);

		$begin = 'INSERT INTO ' . $tableName . ' (r,';
		foreach($headers as $header){
			$begin .= $header->GetField() . ',';
		}
		$begin = Str::ReplaceLast($begin, ',', '') . ') values ';
		$batch = array();
		foreach($items as $item)
		{
			$sql = "(" . mt_rand( 0, 1000000 );
			$c = 0;
			foreach($item as $value)
			{
				if ($value === '' && $headers[$c]->IsNumeric()) $value = null;
				$sql .=	',' . SqlBuilder::FormatValue($value);
				$c++;
			}
			$sql .= ')';
			$batch[] = $sql;
			if (sizeof($batch) > self::BATCH_SIZE)
			{
				$this->executeBatch($begin, $batch);
				$batch = array();
			}
		}
		$this->executeBatch($begin, $batch);
	}
	private function executeBatch($begin, $batch)
	{
		if (sizeof($batch) > 0)
		{
			$query = $begin . join(',', $batch);
			App::Db()->exec($query);
		}
	}
	public function PromoteFromTemp($table)
	{
		$tableTarget = self::GetNonTemporaryName($table);
		$this->RegisterTable($tableTarget);
		App::Db()->renameTable($table, $tableTarget);
		$this->UnregisterTable($table);
	}
	public static function GetNonTemporaryName($tableName)
	{
		return $tableName = Str::Replace($tableName, 'tmp_', '');
	}
	public function CopyTables($table, $tableTarget)
	{
		$this->RegisterTable($tableTarget);
		$this->doCopyTable($table, $tableTarget);
	}

	private function doCopyTable($table, $target)
	{
		Profiling::BeginTimer();
		// Crea la tabla
		App::Db()->dropTable($target);
		$create = "CREATE TABLE " . $target . " LIKE " . $table;
		App::Db()->execDDL($create);
		// Hace el insert
		$insert = "INSERT " . $target . " SELECT * FROM " . $table;
		App::Db()->exec($insert);
		Profiling::EndTimer();
	}

	private function CreateFk($tableName){
		$query = "ALTER TABLE " . $tableName
				. " ADD FOREIGN KEY(geography_item_id)"
				. " REFERENCES geography_item(gei_id);";

		App::Db()->execDDL($query);
	}
	public function RegisterTable($table)
	{
		$sql = "INSERT INTO work_dataset_draft (wdd_table, wdd_created) VALUES (?, NOW())";
		App::Db()->exec($sql, array($table));
	}
	public function UnregisterTable($table)
	{
		$sql = "DELETE FROM work_dataset_draft WHERE wdd_table = ?";
		App::Db()->exec($sql, array($table));
	}
	public static function CreateNewTableName()
	{
		$query ="SELECT max(t) FROM (
							SELECT replace(wdd_table, 'tmp_', '') t
								FROM work_dataset_draft WHERE wdd_table LIKE 'work_dataset_draft_%'
										OR wdd_table LIKE 'tmp_work_dataset_draft_%'
							UNION
									SELECT dat_table t FROM draft_dataset) l";
		$currentTableName =  App::Db()->fetchScalar($query);
		$n = self::GetNumberPart($currentTableName);

		return "tmp_work_dataset_draft_" . str_pad('' . ($n + 1), 6, '0', STR_PAD_LEFT);
	}

	private static function GetNumberPart($currentTableName)
	{
		if (Str::IsNullOrEmpty($currentTableName))
			return 1;

		$last = explode('_', $currentTableName)[3];
		return intval($last);
	}

	private function SqlCreateTable($tableName, $headers)
	{
		if (Str::IsNullOrEmpty($tableName))
			throw new ErrorException("Must set TableName.");

		$sql = "CREATE TABLE " . $tableName . " (id INT NOT NULL AUTO_INCREMENT, n INT NOT NULL DEFAULT 1,
																							r INT NOT NULL DEFAULT 0, ommit BIT(1) NOT NULL DEFAULT 0,
																							modified BIT(1) NOT NULL DEFAULT 0,
																							geography_item_id INT NULL,";
		foreach ($headers as $header) {
			$sql .= $header->GetField() . " " . $header->GetSqlType() . "  NULL,";
		}

		foreach ($this->GetExtraHeader() as $extra) {
			$sql .= $extra->GetField() . " " . $extra->GetSqlType() . "  NULL,";
		}

		$sql .= " INDEX tbl_rand(r),  INDEX tbl_ommit(ommit),
							PRIMARY KEY (id)) ENGINE = InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;";
		return $sql;
	}

	private function GetExtraHeader() {
		$array = [
			new FileTableHeader("geometry", "geometry", "GEOMETRY"),
			new FileTableHeader("geometry_r1", "geometry_r1", "GEOMETRY"),
			new FileTableHeader("geometry_r2", "geometry_r2", "GEOMETRY"),
			new FileTableHeader("geometry_r3", "geometry_r3", "GEOMETRY"),
			new FileTableHeader("geometry_r4", "geometry_r4", "GEOMETRY"),
			new FileTableHeader("geometry_r5", "geometry_r5", "GEOMETRY"),
			new FileTableHeader("geometry_r6", "geometry_r6", "GEOMETRY"),
			new FileTableHeader("area_m2", "area_m2", "NUMERIC(28,8)"),
			new FileTableHeader("centroid", "centroid", "POINT")
		];

		return $array;
	}

	public static function ReadHeadersFromJson($headerFileName){
		$content = file_get_contents($headerFileName);
		$header = json_decode($content, TRUE);
		$array = [];
		if ($header === null || sizeof($header) === 0){
			throw new ErrorException('Las columnas del archivo no pudieron ser reconocidas.');
		}
		foreach($header["varNames"] as $varName){
			$varType = $header["varTypes"][$varName];
			$columnWidth = $header["columnWidths"][$varName];
			$label = $header["varLabels"][$varName];
			$measureLevels = Measurement::GetCode($header["measureLevels"][$varName]);
			$alignment = Alignment::GetCode($header["alignments"][$varName]);

			// PARSEA format F1.0, A20 -> type, width, decimals
			$first = '';
			$last = '';
			$format = $header["varFormats"][$varName];
			Str::TwoSplit($format, '.', $first, $last);
			$decimals = '0';
			if (!Str::IsNullOrEmpty($last))
			{
				$decimals = $last;
			}
			$spssType = Format::GetCode(substr($format, 0, 1));
			$fieldWith = intval(substr($first, 1));
			///

			$sqlType = self::SpssToMySqlDataType($spssType, $fieldWith);
			$fieldName = "dt_col" . (sizeof($array) + 1);

			$fileTableHeader = new FileTableHeader($varName, $fieldName, $sqlType, $spssType, $fieldWith, $columnWidth, $label, $measureLevels, $alignment, $decimals);

			if (array_key_exists($varName, $header["varLabels"]))
			{
				$label = $header["varLabels"][$varName];
				$labelValues = [];
				if (array_key_exists($varName, $header["valueLabels"]))
				{
					$labelValues = $header["valueLabels"][$varName];
				}

				$fileTableHeader->AddLabelValues($labelValues);
			}

			array_push($array, $fileTableHeader);
		}

		return $array;
	}

	private static function SpssToMySqlDataType($varType, $fieldWidth)
	{
		// 5 = float
		// 13 = point
		// 14 = geomertry
		if ($varType == 5)
			return "NUMERIC(28,8)";
		if ($varType == 13)
			return "POINT";
		else if ($varType == 14)
			return "GEOMETRY";
		else
		{	// TEXTO
			if ($fieldWidth > 255)
				return "TEXT";
			else
				return "VARCHAR(" . $fieldWidth . ")";
		}
	}
}

