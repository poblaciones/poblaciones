<?php

namespace helena\classes;

use minga\framework\Context;
use minga\framework\Profiling;
use minga\framework\Performance;
use minga\framework\Log;

use minga\framework\PublicException;

use Doctrine\ORM\Tools\Setup;
use Doctrine\ORM\EntityManager;
use Doctrine\DBAL\Types\Type;


class Db
{
	public $db;
	private $entityManager = null;
	private $isInTransaction;
	private $lastRows = -1;

	function __construct($db)
	{
		$this->db = $db;
		if (Context::Settings()->Db()->ForceStrictTables)
			$this->db->executeQuery("SET sql_mode =(SELECT CONCAT(@@session.sql_mode,',STRICT_TRANS_TABLES'));");
		if (Context::Settings()->Db()->ForceOnlyFullGroupBy)
			$this->db->executeQuery("SET sql_mode =(SELECT CONCAT(@@session.sql_mode,',ONLY_FULL_GROUP_BY'));");
		/*else
			$this->db->executeQuery("SET sql_mode=(SELECT REPLACE(@@session.sql_mode,'ONLY_FULL_GROUP_BY',''));");
		*/
		if (Profiling::IsProfiling())
		{
			$profiler = new SqlLogger();
			$db->getConfiguration()->setSQLLogger($profiler);
		}
	}

	public function GetEntityManager()
	{
		return App::Orm()->GetEntityManager();
	}

	public function IsInTransaction()
	{
		return $this->isInTransaction;
	}

	public function begin()
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$this->isInTransaction = true;
		$this->db->beginTransaction();
		Performance::EndDbWait();
		Profiling::EndTimer();
	}
	public function commit()
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$this->isInTransaction = false;
		$this->db->commit();
		Performance::EndDbWait();
		Profiling::EndTimer();
	}

	public function rollback()
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$this->isInTransaction = false;
		$this->db->rollBack();
		Performance::EndDbWait();
		Profiling::EndTimer();
	}
	public function ensureBegin()
	{
		if ($this->isInTransaction == false)
		{
			$this->begin();
		}
	}
	public function ensureCommit()
	{
		if ($this->isInTransaction)
		{
			$this->commit();
		}
	}
	public function ensureRollback()
	{
		if ($this->isInTransaction)
		{
			$this->rollback();
		}
	}
	public function dropTable($table)
	{
		if ($table == null)
			return;
		Profiling::BeginTimer();
		$this->ensureBegin();
		$sql = "DROP TABLE IF EXISTS `" . $table . "`";
		$this->execDDL($sql);
		Profiling::EndTimer();
	}

	public function tableExists($table)
	{
		if ($table == null)
			return;
		Profiling::BeginTimer();
		$sql = "SHOW TABLES LIKE '" . $table . "'";
		$ret = $this->fetchAll($sql);
		Profiling::EndTimer();
		return sizeof($ret) > 0;
	}

	public function renameTable($tableSource, $tableTarget)
	{
		Profiling::BeginTimer();
		$this->ensureBegin();
		$sql = "RENAME TABLE `" . $tableSource . "` TO `" . $tableTarget . "`";
		$this->execDDL($sql);
		Profiling::EndTimer();
	}

	public function fetchAssoc($sql, array $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$ret = $this->db->fetchAssoc($sql, $params);
		Performance::EndDbWait();
		Profiling::EndTimer();
		return $ret;
	}

	public function fetchScalarInt($sql, array $params = array())
	{
		return intval($this->fetchScalar($sql, $params));
	}

	public function fetchScalarIntNullable($sql, array $params = array())
	{
		$ret = $this->fetchScalarNullable($sql, $params);
		if ($ret === null)
			return null;
		else
			return intval($ret);
	}
	public function fetchScalarNullable($sql, array $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$ret = $this->db->fetchAssoc($sql, $params);
		Performance::EndDbWait();
		Profiling::EndTimer();
		if ((is_array($ret) && sizeof($ret) == 0) || $ret == null)
			return null;
		return $ret[array_keys($ret)[0]];
	}

	public function fetchScalar($sql, array $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$ret = $this->db->fetchAssoc($sql, $params);
		Performance::EndDbWait();
		Profiling::EndTimer();
		if ((is_array($ret) && sizeof($ret) == 0) || $ret == null)
			throw new PublicException("No se ha obtenido ningún resultado en la consulta cuando se esperaba uno.");
		return $ret[array_keys($ret)[0]];
	}

	public function fetchAllByPos($sql, array $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$stmt = $this->db->prepare($sql);
		$stmt->execute($params);
		$ret = $stmt->fetchAll(\PDO::FETCH_NUM);
		Performance::EndDbWait();
		Profiling::EndTimer();
		return $ret;
	}

	public function fetchAll($sql, array $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$ret = $this->db->fetchAll($sql, $params);
		Performance::EndDbWait();
		Profiling::EndTimer();
		return $ret;
	}
	public function lastInsertId()
	{
		return $this->db->lastInsertId();
	}
	public function lastRowsAffected()
	{
		return $this->lastRows;
	}
	public function fetchColumn($sql, array $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$ret = $this->db->fetchColumn($sql, $params);
		Performance::EndDbWait();
		Profiling::EndTimer();
		return $ret;
	}
	public function execDDL($sql, $params = array())
	{
		// Los cambios de estructura finalizan la transacción activa
		$wasInTransaction = $this->isInTransaction;
		if ($wasInTransaction) {
			// Cierra si había una
			$this->commit();
		}
		$ret = $this->executeQuery($sql, $params);
		if ($wasInTransaction) {
			$this->commit();
			// Reabre
			$this->ensureBegin();
		}
		return $ret;
	}
	public function exec($sql, $params = array())
	{
		return $this->executeQuery($sql, $params);
	}
	public function executeQuery($sql, $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$this->ensureBegin();
		$ret = $this->db->executeQuery($sql, $params)->rowCount();
		$this->lastRows = $ret;
		Performance::EndDbWait();
		Profiling::EndTimer();
		return $ret;
	}
	public function execRead($sql, $params = array())
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$this->db->executeQuery($sql, $params);
		Performance::EndDbWait();
		Profiling::EndTimer();
	}
	public function setFetchMode($mode)
	{
		$this->db->setFetchMode($mode);
	}

	public function GetTableSize($table)
	{
		try
		{
			Profiling::BeginTimer();

			$sql = "SELECT
				data_length `data`,
				index_length `index`,
				data_length + index_length `total`,
				table_rows `rows`
				FROM information_schema.tables
				WHERE table_schema = ?
				AND table_name = ?";

			$data = $this->fetchAssoc($sql,
				array(Context::Settings()->Db()->Name, $table));

			Profiling::EndTimer();

			return $data;
		}
		catch(\Exception $e)
		{
			Profiling::EndTimer();
			Log::HandleSilentException($e);
			return '-';
		}
	}

	public function GetDBSize()
	{
		try
		{
			$sql = "SELECT
				SUM(data_length) AS data, SUM(index_length) AS `index`
				FROM information_schema.tables
				WHERE table_schema = ?
				GROUP BY table_schema";
			$data = $this->fetchAssoc($sql,
				array(Context::Settings()->Db()->Name));
			return $data;
		}
		catch(\Exception $e)
		{
			Log::HandleSilentException($e);
			return '-1';
		}
	}

}


