<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\App;
use helena\classes\TestCase;
use helena\entities\backoffice\DraftContact;
use minga\framework\ErrorException;

class TransactionOrmTest extends TestCase
{
	public function testOrmTransaction()
	{
		try
		{
			$sql = "SELECT MAX(con_id) FROM draft_contact";
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

