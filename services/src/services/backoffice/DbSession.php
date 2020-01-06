<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;
use minga\framework\ErrorException;
use minga\framework\Str;
use helena\db\backoffice\annotations\ClientReadonly;


class DbSession extends BaseService
{
	public function Save($className, &$entity)
	{
		$em = App::Db()->GetEntityManager();
		$sessionEntity = $this->Synchronize($entity, $className, true);
		$entity = $sessionEntity;
		$em->persist($entity);
		$em->flush();
		return $sessionEntity;
	}

	public function Synchronize($entity, $className, $updateProperties = false, $forceTreatAsNew = false)
	{
		if (is_array($entity)) throw new ErrorException('Synchronize requires object, not arrays.');

		// 1) chequeo si es un proxy de doctrine -> no tengo que hacer nada
		if ($entity instanceof \Doctrine\Common\Persistence\Proxy ||
					(get_class($entity) !== 'stdClass'))
		{
			return $entity;
		}
		$em = App::Orm()->GetEntityManager();
		// 2) reviso si es nuevo o un objeto a leer de la base de datos
		if ($entity->Id && $forceTreatAsNew === false)
		{
			$sessionEntity = $em->find($className, $entity->Id);
			if (!$updateProperties)
			{
				return $sessionEntity;
			}
		}
		else
		{
			$sessionEntity = new $className();
		}

		$metadata = $this->GetClassMetadata($className);

		$this->UpdateFields($className, $metadata, $sessionEntity, $entity);
		$this->UpdateAssociations($className, $metadata, $sessionEntity, $entity);

		return $sessionEntity;
	}

	function UpdateFields($className, $metadata, $sessionEntity, $entity)
	{
		foreach($metadata->getReflectionProperties() as $property)
		{
			$propertyName = $property->getName();
			if (!$metadata->hasAssociation($propertyName))
			{
				$readonlyAnnotation = $this->GetPropertyAnnotation($className, $propertyName, ClientReadonly::class);
				$isIdentifier = $metadata->identifier[0] == $propertyName;
				// id is readonly property
				if (!$isIdentifier && $readonlyAnnotation === null)
				{
					if (property_exists($entity, $propertyName))
					{
						$setterName = "set" . $propertyName;
						$getterName = "get" . $propertyName;

						if (property_exists($entity, $propertyName))
						{
							$currentValue = $entity->$propertyName;

							$doc = $property->getDocComment();
							if (Str::Contains($doc, "@var \\DateTime"))
								$currentObjectValue = ($currentValue === null ? null : new \DateTime($currentValue));
							else if (Str::Contains($doc, "@var point") && $currentValue !== null)
								$currentObjectValue = new \CrEOF\Spatial\PHP\Types\Geometry\Point($currentValue->x, $currentValue->y);
							else
								$currentObjectValue = $currentValue;

							if ($sessionEntity->$getterName() !== $currentObjectValue)
							{
								$sessionEntity->$setterName($currentObjectValue);
							}
						}
					}
				}
			}
		}
	}

	function UpdateAssociations($className, $metadata, $sessionEntity, $entity)
	{
		foreach($metadata->getAssociationMappings() as $fieldName => $mapping)
		{
			$propertyName = $fieldName;
			$readonlyAnnotation = $this->GetPropertyAnnotation($className, $propertyName, ClientReadonly::class);

			if (property_exists($entity, $propertyName) && $readonlyAnnotation === null)
			{
				$subEntityClass = $mapping['targetEntity'];
				$propertyValue = $entity->$propertyName;
				if ($propertyValue === null)
				{
					$subEntity = null;
				}
				else
				{
					$subUpdateProperties = true;
					$subEntity = $this->Synchronize($propertyValue, $subEntityClass, $subUpdateProperties);
				}

				$setterName = "set" . $fieldName;
				$sessionEntity->$setterName($subEntity);
			}
    }
	}

	function GetClassMetadata($class)
	{
		$em = App::Db()->GetEntityManager();
		return $em->getClassMetadata($class);
	}

	function GetClassAnnotations($class)
	{
		$reflClass = new \ReflectionClass($class);
		$reader = new \Doctrine\Common\Annotations\AnnotationReader();
		return $reader->getClassAnnotations($reflClass);
	}

	function GetPropertyAnnotations($class, $property)
	{
		$reflProperty = new \ReflectionProperty($class, $property);
		$reader = new \Doctrine\Common\Annotations\AnnotationReader();
		return $reader->getPropertyAnnotations($reflProperty);
	}

	function GetPropertyAnnotation($class, $property, $annotation)
	{
		$reflProperty = new \ReflectionProperty($class, $property);
		$reader = new \Doctrine\Common\Annotations\AnnotationReader();
		return $reader->getPropertyAnnotation($reflProperty, $annotation);
	}
}

