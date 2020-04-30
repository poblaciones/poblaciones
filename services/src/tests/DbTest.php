<?php declare(strict_types=1);

namespace helena\tests;

use helena\classes\App;
use helena\db\admin\ContactModel;
use helena\entities\admin\Contact;
use minga\framework\tests\TestCaseBase;

class DbTest extends TestCaseBase
{
	public function testDbSave()
	{
		$contactModel = new ContactModel();
		$contactInfo = new Contact();
		$contactInfo->Person = 'test';
		$contactInfo->Email = 'test@test.com';
		App::Db()->begin();
		$res = $contactModel->DbSave($contactInfo);
		App::Db()->rollback();
		$this->assertGreaterThan(0, $res);
	}
}
