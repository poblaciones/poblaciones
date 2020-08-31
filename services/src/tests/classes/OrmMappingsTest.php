<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\App;
use helena\classes\TestCase;
use helena\entities\backoffice\DraftContact;
use minga\framework\ErrorException;

class OrmMappingsTest extends TestCase
{
	public function testOrmMappings()
	{
		$metadata = App::Orm()->getAllMetadata();
		foreach($metadata as $class)
		{
			$rows = App::Orm()->findAll($class->name, null, 1);
			$this->assertEquals(1, sizeof($rows), 'Filas de ' . $class->name);
		}
	}
}

