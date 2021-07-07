<?php

namespace helena\classes;

use minga\framework\Str;
use minga\framework\Context;
use minga\framework\Profiling;
use minga\framework\Performance;
use minga\framework\PublicException;
use helena\services\backoffice\DbSession;

use Doctrine\ORM\Tools\Setup;
use Doctrine\ORM\EntityManager;
use Doctrine\DBAL\Types\Type;


class Orm
{
	private static $entityManager = null;

	function __construct()
	{
	}

	public function GetEntityManager()
	{
		if (self::$entityManager == null)
		{
			Profiling::BeginTimer();
			$isDevMode = Context::Settings()->Debug()->debug;
			$dir = Paths::GetDbEntitiesPath();
			Type::addType('geometry', 'CrEOF\Spatial\DBAL\Types\GeometryType');
			Type::addType('point', 'CrEOF\Spatial\DBAL\Types\Geometry\PointType');
			Type::addType('polygon', 'CrEOF\Spatial\DBAL\Types\Geometry\PolygonType');
			Type::addType('linestring', 'CrEOF\Spatial\DBAL\Types\Geometry\LineStringType');

			$proxyDir = Paths::GetDoctrineProxiesPath();
			$cache = null; // desde 2.9, cambia el comoprtamiento
			// Opciones: VoidCache, PhpFileCache, FilesystemCache
			$cache = new \Doctrine\Common\Cache\ArrayCache();
			$config = Setup::createAnnotationMetadataConfiguration(array($dir),
								$isDevMode, $proxyDir, $cache, false);

			$config->addCustomNumericFunction('area','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Area');
			$config->addCustomNumericFunction('asbinary','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\AsBinary');
			$config->addCustomNumericFunction('astext','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\AsText');
			$config->addCustomNumericFunction('buffer','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Buffer');
			$config->addCustomNumericFunction('centroid','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Centroid');
			$config->addCustomNumericFunction('contains','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Contains');
			$config->addCustomNumericFunction('crosses','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Crosses');
			$config->addCustomNumericFunction('dimension','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Dimension');
			$config->addCustomNumericFunction('distance','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Distance');
			$config->addCustomNumericFunction('disjoint','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Disjoint');
			$config->addCustomNumericFunction('distancefrommultyLine','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\DistanceFromMultyLine');
			$config->addCustomNumericFunction('endpoint','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\EndPoint');
			$config->addCustomNumericFunction('envelope','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Envelope');
			$config->addCustomNumericFunction('equals','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Equals');
			$config->addCustomNumericFunction('exteriorring','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\ExteriorRing');
			$config->addCustomNumericFunction('geodistpt','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\GeodistPt');
			$config->addCustomNumericFunction('geometrytype','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\GeometryType');
			$config->addCustomNumericFunction('geomfromtext','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\GeomFromText');
			$config->addCustomNumericFunction('glength','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\GLength');
			$config->addCustomNumericFunction('interiorringn','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\InteriorRingN');
			$config->addCustomNumericFunction('intersects','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Intersects');
			$config->addCustomNumericFunction('isclosed','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\IsClosed');
			$config->addCustomNumericFunction('isempty','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\IsEmpty');
			$config->addCustomNumericFunction('issimple','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\IsSimple');
			$config->addCustomNumericFunction('linestringfromwkb','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\LineStringFromWKB');
			$config->addCustomNumericFunction('linestring','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\LineString');
			$config->addCustomNumericFunction('mbrcontains','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\MBRContains');
			$config->addCustomNumericFunction('mbrdisjoint','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\MBRDisjoint');
			$config->addCustomNumericFunction('mbrequal','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\MBREqual');
			$config->addCustomNumericFunction('mbrintersects','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\MBRIntersects');
			$config->addCustomNumericFunction('mbroverlaps','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\MBROverlaps');
			$config->addCustomNumericFunction('mbrtouches','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\MBRTouches');
			$config->addCustomNumericFunction('mbrwithin','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\MBRWithin');
			$config->addCustomNumericFunction('numinteriorrings','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\NumInteriorRings');
			$config->addCustomNumericFunction('numpoints','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\NumPoints');
			$config->addCustomNumericFunction('overlaps','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Overlaps');
			$config->addCustomNumericFunction('pointfromwkb','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\PointFromWKB');
			$config->addCustomNumericFunction('pointn','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\PointN');
			$config->addCustomNumericFunction('point','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Point');
			$config->addCustomNumericFunction('srid','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\SRID');
			$config->addCustomNumericFunction('startpoint','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\StartPoint');
			$config->addCustomNumericFunction('st_buffer','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STBuffer');
			$config->addCustomNumericFunction('st_contains','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STContains');
			$config->addCustomNumericFunction('st_crosses','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STCrosses');
			$config->addCustomNumericFunction('st_disjoint','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STDisjoint');
			$config->addCustomNumericFunction('st_equals','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STEquals');
			$config->addCustomNumericFunction('st_intersects','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STIntersects');
			$config->addCustomNumericFunction('st_overlaps','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STOverlaps');
			$config->addCustomNumericFunction('st_touches','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STTouches');
			$config->addCustomNumericFunction('st_within','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\STWithin');
			$config->addCustomNumericFunction('touches','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Touches');
			$config->addCustomNumericFunction('within','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Within');
			$config->addCustomNumericFunction('x','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\X');
			$config->addCustomNumericFunction('y','CrEOF\Spatial\ORM\Query\AST\Functions\MySql\Y');

//			$config->setAutoGenerateProxyClasses(true);
			$config->addEntityNamespace('e', 'helena\entities\backoffice');

			self::$entityManager = EntityManager::create(App::Db()->db, $config);
			try
			{
				$connection = self::$entityManager->getConnection();
				$connection->getDatabasePlatform()->registerDoctrineTypeMapping('geometry', 'geometry');
				$connection->getDatabasePlatform()->registerDoctrineTypeMapping('point', 'point');
				$connection->getDatabasePlatform()->registerDoctrineTypeMapping('polygon', 'polygon');
				$connection->getDatabasePlatform()->registerDoctrineTypeMapping('linestring', 'linestring');
			}
			catch (\Doctrine\DBAL\Exception\ConnectionException $e)
			{
				if ($isDevMode)
					throw $e;
				else
					throw new PublicException('No hay disponible una conexión con el servidor de datos');
			}
			Profiling::EndTimer();
		}
		return self::$entityManager;
	}

	public function delete($obj)
	{
		App::Db()->ensureBegin();
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$this->GetEntityManager()->remove($obj);
		$this->GetEntityManager()->flush();
		Performance::EndDbWait();
		Profiling::EndTimer();
	}
	public function deleteById($className, $id)
	{
		App::Db()->ensureBegin();
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$obj = $this->find($className, $id);
		$this->GetEntityManager()->remove($obj);
		$this->GetEntityManager()->flush();
		Performance::EndDbWait();
		Profiling::EndTimer();
	}

	public function save($obj)
	{
		try {
			App::Db()->ensureBegin();
			Profiling::BeginTimer();
			Performance::BeginDbWait();
			$this->GetEntityManager()->persist($obj);
			$this->GetEntityManager()->flush();
			Performance::EndDbWait();
			Profiling::EndTimer();
		}
		catch(\Doctrine\DBAL\Exception\NotNullConstraintViolationException $e) {
			$message = $e->getMessage();
			$start = strpos($message, "Column '") + 8;
			$end = strpos($message, "'", $start);
			$field = substr($message, $start, $end - $start);
			throw new PublicException('Se ha omitido un valor requerido (' . $field . ')');
		}
	}

	public function flush()
	{
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$this->GetEntityManager()->flush();
		Performance::EndDbWait();
		Profiling::EndTimer();
	}
	public function getClassMetadata($class)
	{
		$em = $this->GetEntityManager();
		return $em->getClassMetadata($class);
	}

	public function getAllMetadata()
	{
		$em = $this->GetEntityManager();
		return $em->getMetadataFactory()->getAllMetadata();
	}

	private function repository($className)
	{
		$em = $this->GetEntityManager();
		return $em->getRepository($className);
	}

  public function find($classname, $id, $lockMode = null, $lockVersion = null)
  {
      return $this->repository($classname)->find($id, $lockMode, $lockVersion);
  }

	public function findAll($classname, $orderBy = null, $limit = null, $offset = null)
  {
		if ($orderBy !== null && !is_array($orderBy))
			$orderBy = array($orderBy => 'ASC');
		return $this->findManyBy($classname, array(), $orderBy, $limit, $offset);
  }

  public function findManyBy($classname, array $criteria, array $orderBy = null, $limit = null, $offset = null)
  {
      return $this->repository($classname)->findBy($criteria, $orderBy, $limit, $offset);
  }

  public function findBy($classname, array $criteria, array $orderBy = [])
  {
      return $this->repository($classname)->findOneBy($criteria, $orderBy);
  }

	private function preparePropertiesQuery($className, $filters, $sort = null)
	{
		$joins = "";
		$where = "";
		$suffix = "e";
		$paramCount = 1;
		foreach(array_keys($filters) as $property)
		{
			if ($where !== "") $where .= " AND ";
			$condition = ($filters[$property] === null ? 'is NULL' : '= :p' . $paramCount);
			if (Str::EndsWith($property, '.Id'))
			{
				$propertyOnly = substr($property, 0, strlen($property) - 3);
				$joins .= " JOIN d." . $propertyOnly ." " . $suffix;
				$where .= " " . $suffix . ".Id ". $condition;
				$suffix++;
			}
			else
			{
				$where .= " d.". $property ." " . $condition;
			}
			$paramCount++;
		}
		$dql = "SELECT d FROM " . $className . " d " . $joins . " WHERE " . $where;
		if ($sort !== null)
		{
			$dql .= " ORDER BY " . $this->sortToString('d', $sort);
		}
		return $dql;
	}

	private function sortToString($preffix, $sort)
	{
		$ret = '';
		if (is_array($sort) === false)
			$sort = array($sort => 'ASC');
		foreach(array_keys($sort) as $field)
		{
			if ($ret !== "") $ret .= ",";
			$ret .= $preffix . '.' . $field . " " . $sort[$field];
		}
		return $ret;
	}
	private function preparePropertyQuery($className, $property, $value, $sort = null)
	{
		return $this->preparePropertiesQuery($className, array($property => $value), $sort);
	}
  public function findByProperty($className, $property, $value)
  {
		$dql = $this->preparePropertyQuery($className, $property, $value);
		return $this->findByQuery($dql, array($value));
	}
	public function findByProperties($className, $filters)
  {
		$dql = $this->preparePropertiesQuery($className, $filters);
		return $this->findByQuery($dql, array_values($filters));
	}

	public function findManyByProperties($className, $filters, $orderProperty = null)
  {
		$dql = $this->preparePropertyQuery($className, $filters, $orderProperty);
		return $this->findManyByQuery($dql, array_values($filters));
	}
	public function findManyByProperty($className, $property, $value, $orderProperty = null)
  {
		$dql = $this->preparePropertyQuery($className, $property, $value, $orderProperty);
		return $this->findManyByQuery($dql, array($value));
	}
  public function findByQuery($dql, array $params = [])
  {
		$query = $this->GetEntityManager()->createQuery($dql);
		$n = 1;
		foreach($params as $p)
		{
			if ($p !== null)
				$query->setParameter('p' . $n, $p);
			$n++;
		}
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$ret = $query->getResult();
		Performance::EndDbWait();
		Profiling::EndTimer();

		if (sizeof($ret) == 0)
			return null;
		else if (sizeof($ret) > 1)
			throw new PublicException("La consulta devolvió varias filas, cuando se esperaba solamente una.");
		else
			return $ret[0];
  }

  public function findManyByQuery($dql, array $params = [])
  {
		$query = $this->GetEntityManager()->createQuery($dql);
		$n = 1;
		foreach($params as $p)
		{
			if ($p !== null)
				$query->setParameter('p' . $n, $p);
			$n++;
		}
		Profiling::BeginTimer();
		Performance::BeginDbWait();
		$ret = $query->getResult();
		Performance::EndDbWait();
		Profiling::EndTimer();

		return $ret;
  }

	public function Reconnect($className, $value)
	{
		// Este método, en base a una clase estándar (típicamente recibida desde el client) obtiene
		// si corresponde la entidad de la base de datos y le copia los valores de las propiedades recibidas.
		Profiling::BeginTimer();
		if ($value === null) return null;
		$db = new DbSession();
		$sessionEntity = $db->Synchronize($value, $className, true);
		Profiling::EndTimer();
		return $sessionEntity;
	}

	public function Rebuild($className, $value)
	{
		// Este método, en base a una clase estándar (típicamente recibida desde el client) genera
		// una instancia de la clase del ORM y le copia los valores de las propiedades recibidas.
		Profiling::BeginTimer();
		if ($value === null) return null;
		$db = new DbSession();
		$sessionEntity = $db->Synchronize($value, $className, true, true);
		Profiling::EndTimer();
		return $sessionEntity;
	}

	public function Clone($className, $class)
	{
		// Duplica una instancia de un objeto conectado, poniendo en nulo su id.
		$obj = $this->Disconnect($class);
		$obj->Id = null;
		return $this->Reconnect($className, $obj);
	}

	public function Disconnect($object)
	{
		return json_decode(App::OrmSerialize($object));
	}

}


