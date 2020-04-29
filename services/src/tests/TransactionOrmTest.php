<?php declare(strict_types=1);

namespace helena\tests;

use helena\classes\App;
use helena\entities\backoffice\DraftContact;
use minga\framework\ErrorException;
use minga\framework\tests\TestCaseBase;

class TransactionOrmTest extends TestCaseBase
{
	public function testOrmTransaction()
	{
		$current = 0;
		$sql = "SELECT MAX(con_id) FROM draft_contact";
		try
		{
			$draftContact = new DraftContact();
			$draftContact->setPerson('Test');
			$draftContact->setEmail('test@test.com');
			$current = App::Db()->fetchScalarInt($sql);

			App::Orm()->save($draftContact);

			$new = App::Db()->fetchScalarInt($sql);
			$this->assertGreaterThan($current, $new);

			throw new ErrorException('revert');
		}
		catch(ErrorException $e)
		{
	  	}
	}
}

