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

use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StArea;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StAsBinary;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StAsText;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StBoundary;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StBuffer;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StCentroid;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StContains;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StConvexHull;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StCrosses;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StDifference;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StDimension;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StDisjoint;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StDistance;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StEndPoint;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StEnvelope;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StEquals;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StExteriorRing;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StGeometryN;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StGeometryType;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StGeomFromText;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StGeomFromWkb;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StInteriorRingN;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StIntersection;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StIntersects;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StIsClosed;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StIsEmpty;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StIsRing;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StIsSimple;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StLength;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StLineStringFromWkb;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StMLineFromWkb;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StMPointFromWkb;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StMPolyFromWkb;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StNumGeometries;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StNumInteriorRing;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StNumPoints;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StOverlaps;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StPerimeter;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StPoint;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StPointFromWkb;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StPointN;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StPointOnSurface;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StPolyFromWkb;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StRelate;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StSetSRID;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StSrid;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StStartPoint;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StSymDifference;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StTouches;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StUnion;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StWithin;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StX;
use LongitudeOne\Spatial\ORM\Query\AST\Functions\Standard\StY;

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
			Type::addType('geometry', 'LongitudeOne\Spatial\DBAL\Types\GeometryType');
			Type::addType('point', 'LongitudeOne\Spatial\DBAL\Types\Geometry\PointType');
			Type::addType('polygon', 'LongitudeOne\Spatial\DBAL\Types\Geometry\PolygonType');
			Type::addType('linestring', 'LongitudeOne\Spatial\DBAL\Types\Geometry\LineStringType');

			$proxyDir = Paths::GetDoctrineProxiesPath();
			$cache = null; // desde 2.9, cambia el comoprtamiento
			// Opciones: VoidCache, PhpFileCache, FilesystemCache
			$cache = new ArrayCache();
			$config = Setup::createAnnotationMetadataConfiguration(array($dir),
								$isDevMode, $proxyDir, $cache, false);


//			$config->setAutoGenerateProxyClasses(true);
			$config->addEntityNamespace('e', 'helena\entities\backoffice');

			$config->addCustomNumericFunction('ST_Area', StArea::class);
			$config->addCustomStringFunction('ST_AsBinary', StAsBinary::class);
			$config->addCustomStringFunction('ST_AsText', StAsText::class);
			$config->addCustomStringFunction('ST_Boundary', StBoundary::class);
			$config->addCustomNumericFunction('ST_Buffer', StBuffer::class);
			$config->addCustomStringFunction('ST_Centroid', StCentroid::class);
			$config->addCustomNumericFunction('ST_Contains', StContains::class);
			$config->addCustomStringFunction('ST_ConvexHull', StConvexHull::class);
			$config->addCustomNumericFunction('ST_Crosses', StCrosses::class);
			$config->addCustomStringFunction('ST_Difference', StDifference::class);
			$config->addCustomNumericFunction('ST_Dimension', StDimension::class);
			$config->addCustomNumericFunction('ST_Disjoint', StDisjoint::class);
			$config->addCustomNumericFunction('ST_Distance', StDistance::class);
			$config->addCustomNumericFunction('ST_Equals', StEquals::class);
			$config->addCustomNumericFunction('ST_Intersects', StIntersects::class);
			$config->addCustomStringFunction('ST_Intersection', StIntersection::class);
			$config->addCustomNumericFunction('ST_IsClosed', StIsClosed::class);
			$config->addCustomNumericFunction('ST_IsEmpty', StIsEmpty::class);
			$config->addCustomNumericFunction('ST_IsRing', StIsRing::class);
			$config->addCustomNumericFunction('ST_IsSimple', StIsSimple::class);
			$config->addCustomStringFunction('ST_EndPoint', StEndPoint::class);
			$config->addCustomStringFunction('ST_Envelope', StEnvelope::class);
			$config->addCustomStringFunction('ST_ExteriorRing', StExteriorRing::class);
			$config->addCustomStringFunction('ST_GeometryN', StGeometryN::class);
			$config->addCustomStringFunction('ST_GeometryType', StGeometryType::class);
			$config->addCustomStringFunction('ST_GeomFromWkb', StGeomFromWkb::class);
			$config->addCustomStringFunction('ST_GeomFromText', StGeomFromText::class);
			$config->addCustomStringFunction('ST_InteriorRingN', StInteriorRingN::class);
			$config->addCustomNumericFunction('ST_Length', StLength::class);
			$config->addCustomStringFunction('ST_LineStringFromWkb', StLineStringFromWkb::class);
			$config->addCustomStringFunction('ST_MPointFromWkb', StMPointFromWkb::class);
			$config->addCustomStringFunction('ST_MLineFromWkb', StMLineFromWkb::class);
			$config->addCustomStringFunction('ST_MPolyFromWkb', StMPolyFromWkb::class);
			$config->addCustomStringFunction('ST_NumInteriorRing', StNumInteriorRing::class);
			$config->addCustomStringFunction('ST_NumGeometries', StNumGeometries::class);
			$config->addCustomNumericFunction('ST_NumPoints', StNumPoints::class);
			$config->addCustomStringFunction('ST_Overlaps', StOverlaps::class);
			$config->addCustomNumericFunction('ST_Perimeter', StPerimeter::class);
			$config->addCustomStringFunction('ST_Point', StPoint::class);
			$config->addCustomStringFunction('ST_PointFromWkb', StPointFromWkb::class);
			$config->addCustomStringFunction('ST_PointN', StPointN::class);
			$config->addCustomStringFunction('ST_PointOnSurface', StPointOnSurface::class);
			$config->addCustomStringFunction('ST_PolyFromWkb', StPolyFromWkb::class);
			$config->addCustomStringFunction('ST_Relate', StRelate::class);
			$config->addCustomStringFunction('ST_SymDifference', StSymDifference::class);
			$config->addCustomNumericFunction('ST_SetSRID', StSetSRID::class);
			$config->addCustomNumericFunction('ST_SRID', StSrid::class);
			$config->addCustomNumericFunction('ST_StartPoint', StStartPoint::class);
			$config->addCustomNumericFunction('ST_Touches', StTouches::class);
			$config->addCustomStringFunction('ST_Union', StUnion::class);
			$config->addCustomNumericFunction('ST_Within', StWithin::class);
			$config->addCustomNumericFunction('ST_X', StX::class);
			$config->addCustomNumericFunction('ST_Y', StY::class);

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
		$dql = $this->preparePropertiesQuery($className, $filters, $orderProperty);
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


