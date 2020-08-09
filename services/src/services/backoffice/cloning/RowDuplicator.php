<?php

namespace helena\services\backoffice\cloning;

use helena\classes\App;
use helena\entities\backoffice as entities;
use minga\framework\Context;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\PublicException;


class RowDuplicator
{
	private static $varCounter = 0;

	public static function ResolveNewName($name, $table, $filterValue, $filterColumn, $captionColumn, $shortForm, $fieldWidth)
	{
		$sql = "SELECT count(*) FROM " . $table . " WHERE " . $filterColumn . " = ? AND " . $captionColumn . " = ?";
		$i = 1;
		$newName = $name;
		$params = array($filterValue, $newName);
		while(App::Db()->fetchScalarInt($sql, $params) != 0)
		{
			if ($shortForm)
				$suffix = "(" . $i . ")";
			else
				$suffix = "(copia" . ($i == 1 ? '' : ' ' . $i) . ")";
			if (strlen($name) + strlen($suffix) >= $fieldWidth)
			{
				$newName = substr($name, 0, $fieldWidth - strlen($suffix) - 1) . ' ' . $suffix;
			}
			else
			{
				$newName = $name . ' ' . $suffix;
			}
			$params = array($filterValue, $newName);
			$i++;
		}
		return $newName;
	}

	public static function CreatePairingQuery($parentTable, $parentSourceId, $parentTargetId,
																								$parentFilterField, $parentIdentifier, $childFilterField)
	{
		$query1 = self::CreateNumberedQuery($parentTable, $parentSourceId, $parentFilterField, $parentIdentifier);
		$query2 = self::CreateNumberedQuery($parentTable, $parentTargetId, $parentFilterField, $parentIdentifier);
		$staticQuery = "(SELECT g2." . $parentIdentifier . " FROM " . $query1 . " AS g1, " . $query2 . " AS g2
												WHERE g1.rowNum = g2.rowNum AND g1." . $parentIdentifier . "=" . $childFilterField . ")";
		return $staticQuery;
	}

	public static function DuplicateParentedRows($parentInfo, $childClass, $staticColumns = array())
	{
		$parentClass = $parentInfo[0];
		$parentSourceId = $parentInfo[1];
		$parentTargetId = $parentInfo[2];
		$parentFilterField = $parentInfo[3];
		$childFilterField = $parentInfo[4];
		// Trae metadatos
		$metadata = App::Orm()->getClassMetadata($parentClass);
		$parentTable = $metadata->GetTableName();
		$parentIdentifier = $metadata->getColumnName($metadata->identifier[0]);
		// Arma los select
		$filter = self::GetFilter($parentFilterField, $parentSourceId);
		$sourceRows = "SELECT " . $parentIdentifier . " FROM " . $parentTable . " WHERE " . $filter . " ORDER BY " . $parentIdentifier;
		//
		$staticQuery = self::CreatePairingQuery($parentTable, $parentSourceId, $parentTargetId,
																								$parentFilterField, $parentIdentifier, $childFilterField);
		$staticColumns[$childFilterField] = array($staticQuery);
		// Pone el filtro
		$filterColumn = $childFilterField . ' IN';
		$filterValue = ' (' . $sourceRows . ')';
		// Duplica
		self::DuplicateRows($childClass, $filterValue, $staticColumns, $filterColumn);
	}

	private static function CreateNumberedQuery($table, $filterValue, $filterColumn, $identifier)
	{
		$varNumber = "@row_number" . self::$varCounter++;
		$filter = self::GetFilter($filterColumn, $filterValue);

		return "(SELECT (" . $varNumber . ":=" . $varNumber . " + 1) AS rowNum, " . $identifier . "
									FROM " . $table . ", (SELECT " . $varNumber . ":=0) AS t
									WHERE " . $filter . " ORDER BY " . $identifier . ")";
	}

	private static function GetFilter($filterColumn, $filterValue)
	{
		if (Str::EndsWith($filterColumn, ' IN'))
			return $filterColumn . " " . $filterValue;
		else
			return $filterColumn . " = " . SqlBuilder::FormatValue($filterValue);
	}
	public static function DuplicateRows($entity1, $filterValue, $staticColumns = array(), $filterColumn = null, $showDebug = false)
	{
		$metadata = App::Orm()->getClassMetadata($entity1);
		$identifier = $metadata->getColumnName($metadata->identifier[0]);
		if (array_key_exists($identifier, $staticColumns) == false)
			$staticColumns[$identifier] = null;
		//
		if ($filterColumn == null) $filterColumn = $identifier;
		$filter = self::GetFilter($filterColumn, $filterValue);
		$sqlParts = self::GetMigrateSqlQueries($entity1, $entity1, false, $staticColumns);
		$table = $metadata->GetTableName();
		$insertInto = "INSERT INTO " . $table . " (" . $sqlParts['insert'] . ") ";
		$select = "SELECT " . $sqlParts['select'] . " FROM " . $table . " WHERE " .  $filter . " ORDER BY " . $identifier;
		if ($showDebug)
			echo $select;
		App::Db()->exec($insertInto . $select);
		return App::Db()->lastInsertId();
	}

	public static function GetMigrateSqlQueries($entity1, $entity2, $shardifyIds = false, $staticColumns = array())
	{
		$metadata1 = App::Orm()->getClassMetadata($entity1);
		if ($entity2 == null)
		{
			$entity2 = $entity1;
			$metadata2 = $metadata1;
		}
		else
		{
			$metadata2 = App::Orm()->getClassMetadata($entity2);
		}
		$retInsert = '';
		$retSelect = '';
		$retUpdate = '';
		$shard = Context::Settings()->Shard()->CurrentShard;

		$columnsList = self::BuildColumnsList($metadata1, $metadata2, $shardifyIds);

		foreach($staticColumns as $key=>$value)
			if (self::NotInMetadata($key, $columnsList)) {
				throw new PublicException("La columna no existe en la definición de metadatos (" . $key . ")");
			}

		foreach($columnsList as $column)
		{
			$col = $column['field'];
			$shardify = $column['shardify'];
			if ($retInsert != '') { $retInsert .= ', '; $retSelect .= ', '; $retUpdate .= ', '; }
			$retInsert .= '`' . $col . '`';
			if (array_key_exists($col, $staticColumns))
			{
				$retSelect .= SqlBuilder::FormatValue($staticColumns[$col]);
				$retUpdate .=  '`' . $col . '`=' . SqlBuilder::FormatValue($staticColumns[$col]);
			}
			else
			{
				$retUpdate .= '`' . $col . '`=VALUES(`' . $col . '`)';
				if ($shardify === false)
					$retSelect .= '`' . $col . '`';
				else
					$retSelect .= '`' . $col . '` * 100 + ' . $shard;
			}
		}
		return array('insert' => $retInsert, 'select' => $retSelect, 'update' => $retUpdate);
	}
	private static function BuildColumnsList($metadata1, $metadata2, $shardifyIds)
	{
		$ret = array();

		foreach($metadata1->getReflectionProperties() as $property)
		{
			$prop = $property->getName();
			$col = $metadata1->getColumnName($prop);
			if ($metadata2->hasField($prop))
			{
				$column = array();
				$column['field'] = $col;
				$column['property'] = $prop;
				$column['shardify'] = ($shardifyIds && $metadata1->identifier[0] === $prop);
				$ret[] = $column;
			}
		}
		foreach($metadata2->getAssociationMappings() as $assoc)
		{
			$prop = $assoc['fieldName'];
			if ($metadata1->hasAssociation($prop))
			{
				$col = $assoc['joinColumns'][0]['name'];
				$type = $assoc['targetEntity'];

				$column = array();
				$column['field'] = $col;
				$column['property'] = $prop;
				$column['shardify'] = ($shardifyIds && ($metadata1->identifier[0] === $prop ||
																				Str::Contains($type, "\\Draft")));
				$ret[] = $column;
			}
		}
		return $ret;
	}

	private static function NotInMetadata($columnField, $columnsList)
	{
		foreach($columnsList as $column)
		{
			if ($column['field'] == $columnField)
				return false;
		}
		return true;
	}
}

