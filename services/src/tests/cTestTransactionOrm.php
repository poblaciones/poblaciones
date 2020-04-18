<?php

namespace helena\tests;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use minga\framework\Params;
use helena\entities\backoffice as entities;
use minga\framework\ErrorException;

class cTestTransactionOrm extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		$draftContact = new entities\DraftContact();
		$draftContact->setPerson('Prueba');
		$current = App::Db()->fetchScalarInt("select max(con_id) from draft_contact");
		echo "Current: " . $current . "<br>";
		App::Orm()->save($draftContact);
		$current = App::Db()->fetchScalarInt("select max(con_id) from draft_contact");
		echo "Current: " . $current . "<br>";
		throw new ErrorException('failed' . $current);
		// return "Done!";
	}
}
