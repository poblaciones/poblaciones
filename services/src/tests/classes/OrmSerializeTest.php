<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\App;
use helena\classes\TestCase;
use helena\entities\backoffice\DraftMetadata;
use helena\entities\backoffice\DraftWork;

class OrmSerializeTest extends TestCase
{
	public function testOrmSerialize()
	{
		$metadata = new DraftMetadata();

		$expected = [
			'Id' => null, 'Title' => null, 'PublicationDate' => null, 'Abstract' => null,
			'Status' => null,
			// 'Extents' => null,
		  	'Authors' => null, 'CoverageCaption' => null,
			'PeriodCaption' => null, 'Frequency' => null, 'GroupId' => null, 'License' => null,
			'Type' => null, 'AbstractLong' => null, 'Language' => null, 'Wiki' => null,
			'Url' => null, 'Contact' => null, 'Institution' => null, 'OnlineSince' => null,
			'LastOnline' => null,
		];

		$ret = App::OrmSerialize($metadata);
		$this->assertJsonStringEqualsJsonString($ret, json_encode($expected));
	}
}
