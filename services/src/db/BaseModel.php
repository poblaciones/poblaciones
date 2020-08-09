<?php

namespace helena\db;

use minga\framework\Str;
use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\ErrorException;

class BaseModel
{
	protected $tableName;
	protected $idField;
	protected $captionField;
	protected $fromDraft;

	public function GetCaptionById($id)
	{
		Profiling::BeginTimer();
		$sql = 'SELECT '.$this->EscapeColumn($this->captionField).' AS caption  FROM '.$this->EscapeTable($this->tableName).' WHERE '.$this->EscapeColumn($this->idField).' = ? LIMIT 1';
		$ret = App::Db()->fetchColumn($sql, array((int)$id));
		Profiling::EndTimer();
		return $ret;
	}
	protected function makeTableName($table, $fromDraft)
	{
		$this->fromDraft = $fromDraft;
		return $this->resolveTableName($table);
	}
	protected function resolveTableName($table)
	{
		if ($this->fromDraft === null)
		{
			throw new ErrorException('Debe indicarse el modo de trabajo (borrador/publicado)');
		}
		if ($this->fromDraft)
			return 'draft_' . $table;
		else
			return $table;
	}
	protected function ArrayToDictionary($list)
	{
		$ret = array();
		foreach($list as $item)
			$ret[$item[$this->idField]]=$item;
		return $ret;
	}

	public function GetById($id, $where = '', $params = array())
	{
		Profiling::BeginTimer();
		$where = trim($where);
		if($where != "" && Str::StartsWithI($where, 'AND ') == false)
			$where = 'AND ' . $where;

		$where = ' ' . $where . ' ';
		$params = array_merge(array((int)$id), $params);

		$sql = 'SELECT * FROM '.$this->EscapeTable($this->tableName).' WHERE '.$this->EscapeColumn($this->idField).' = ? '.$where.' LIMIT 1';

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function Exists($id)
	{
		Profiling::BeginTimer();
		$sql = 'SELECT COUNT(*) FROM '.$this->EscapeTable($this->tableName).' WHERE '.$this->EscapeColumn($this->idField).' = ? LIMIT 1';
		$ret = (bool)App::Db()->fetchColumn($sql, array((int)$id));
		Profiling::EndTimer();
		return $ret;
	}

	public function DeleteById($id)
	{
		Profiling::BeginTimer();
		$sql = 'DELETE FROM '.$this->EscapeTable($this->tableName).' WHERE '.$this->EscapeColumn($this->idField).' = ?';
		App::Db()->exec($sql, array((int)$id));
		Profiling::EndTimer();
	}

	public function ToCombo($items)
	{
		$ret = array();
		foreach($items as $item)
			$ret[$item['name']] = $item['id'];

		return $ret;
	}
	public function DbSave($entity)
	{
		$map = $entity->GetMap();
		if ($this->captionField)
		{
			$prop = $map[$this->captionField];
			if (!$entity->$prop)
				throw new ErrorException('El elemento debe tener una descripción.' . get_class($entity));
		}
		$params = $this->GetParamValuesFromMap($entity, $map);
		if ($entity->Id)
		{
			$sql = "UPDATE " . $this->EscapeTable($this->tableName) . " SET " .
					$this->GetSqlUpdateFromMap($entity, $map) . " WHERE " . $this->idField . " = ?";
			$params[] = $entity->Id;
			App::Db()->executeQuery($sql, $params);
		}
		else
		{
			$sql = "INSERT INTO " . $this->EscapeTable($this->tableName) . " " . $this->GetSqlInsertFromMap($entity, $map);
			App::Db()->executeQuery($sql, $params);
			$entity->Id = App::Db()->lastInsertId();
		}
		return $entity->Id;
	}
	private function GetParamValuesFromMap($entity, $map)
	{
		$params = array();
		foreach($map as $key => $value)
		{
			if ($key != $this->idField)
				$params[] = $entity->$value;
		}
		return $params;
	}
	private function GetSqlInsertFromMap($entity, $map)
	{
		$ret = "";
		$values = "";
		foreach($map as $key => $_)
		{
			if ($key != $this->idField)
			{
				if ($ret != '') { $ret .= ','; $values .= ','; }
				$ret .= $key;
				$values .= '?';
			}
		}
		return '(' . $ret . ') VALUES (' . $values . ')';
	}
	private function GetSqlUpdateFromMap($entity, $map)
	{
		$ret = "";
		foreach($map as $key => $_)
		{
			if ($key != $this->idField)
			{
				if ($ret != '') { $ret .= ','; }
				$ret .= $key . ' = ?';
			}
		}
		return $ret;
	}
	public function Where($id, array &$params, $field)
	{
		if($id != 0)
		{
			$params[] = (int)$id;
			return ' AND '.$this->EscapeColumn($field).' = ? ';
		}
		else
			return '';
	}

	public function EscapeTable($table)
	{
		return $this->EscapeColumn($table);
	}

	public function EscapeColumn($col)
	{
		if(trim($col) == '')
			return $col;

		$col = str_replace('`', '', $col);

		if(preg_match('/[a-z0-9_]/i', $col) !== 1)
			throw new ErrorException("Invalid column.");

		return '`'.$col.'`';
	}
}

