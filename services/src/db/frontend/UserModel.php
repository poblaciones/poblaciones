<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Str;
use minga\framework\Profiling;
use minga\framework\PublicException;
use minga\framework\MessageBox;
use helena\classes\enums\TokenTypeEnum;

class UserModel extends BaseModel
{
	const ValidTokens = 7; // en días
	public const DaysValid = 1;

	public function __construct()
	{
		$this->tableName = 'user';
		$this->idField = 'usr_id';
		$this->captionField = 'usr_email';
	}

	public function GetUserByEmail($email)
	{
		Profiling::BeginTimer();
		$params = array($email);

		$sql = 'SELECT * FROM user WHERE usr_email = ? LIMIT 1';

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
	public function InsertOrUpdate($user, $privileges, $firstName, $lastName)
	{
		Profiling::BeginTimer();
		$params = array($user, $privileges, $firstName, $lastName, $firstName, $lastName);
		$sql = 'INSERT INTO user (usr_email, usr_privileges, usr_firstname, usr_lastname)
			VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE usr_firstname=?, usr_lastname=?';

		App::Db()->executeQuery($sql, $params);
		Profiling::EndTimer();
	}
	public function CreateUser($user, $firstName = null, $lastName = null, $password = null)
	{
		Profiling::BeginTimer();
		$delete1 = "delete from user_link where lnk_user_id = (SELECT usr_id FROM user WHERE usr_email = ?)";
		App::Db()->executeQuery($delete1, array($user));
		$delete2 = "delete from user_session where ses_user_id = (SELECT usr_id FROM user WHERE usr_email = ?)";
		App::Db()->executeQuery($delete2, array($user));
		$delete3 = "delete from draft_work_permission where wkp_user_id = (SELECT usr_id FROM user WHERE usr_email = ?)";
		App::Db()->executeQuery($delete3, array($user));
		$delete4 = 'DELETE FROM user WHERE usr_email = ?';
		App::Db()->executeQuery($delete4, array($user));

		$params = array($user, $firstName, $lastName, $password);
		$sql = "INSERT INTO user (usr_email, usr_privileges, usr_firstname, usr_lastname, usr_password)
			VALUES(?, 'P', ?, ?, ?)";

		App::Db()->executeQuery($sql, $params);
		Profiling::EndTimer();
	}
	public function CreateUserLink($type, $user, $to, $message = null)
	{
		Profiling::BeginTimer();
		$userId = $this->GetUserId($user);
		$token = 0;
		while (Str::Length('' . $token) < 6)
			$token = random_int(100000, 999999);
		$params = array($type, $userId, $token, $to, $message);
		$sql = "INSERT INTO user_link (lnk_type, lnk_user_id, lnk_token, lnk_to, lnk_time, lnk_message)
			VALUES(?, ?, ?, ?, NOW(), ?)";
		App::Db()->exec($sql, $params);
		App::Db()->commit();
		Profiling::EndTimer();
		return $token;
	}
	private function GetUserId($user)
	{
		Profiling::BeginTimer();
		$userId = App::Db()->fetchScalarIntNullable("SELECT usr_id FROM user WHERE usr_email = ?", array($user));
		if ($userId === null)
			throw new PublicException("Usuario no encontrado.");
		Profiling::EndTimer();
		return $userId;
	}
	public function CheckUserLink($type, $user, $token)
	{
		$link = $this->GetUserLink($type, $user, $token);
		if ($link === null)
			MessageBox::ThrowMessage('El código es inválido o ha expirado.');
		return $link;
	}
	public function GetUserLink($type, $user, $token)
	{
		$ret = $this->GetUserLinkMessage($type, $user, $token);
		if ($ret === null)
			return null;
		else
			return $ret['to'];
	}

	public function GetUserLinkMessage($type, $user, $token)
	{
		Profiling::BeginTimer();
		$userId = $this->GetUserId($user);
		$delete = "DELETE FROM user_link WHERE DATE_ADD(lnk_time, INTERVAL " .  self::ValidTokens . " DAY) < NOW()
									AND lnk_user_id = ?";
		App::Db()->exec($delete, array($userId));

		$sql = "SELECT lnk_to `to`, lnk_message `message` FROM user_link WHERE lnk_user_id = ? AND lnk_token = ? AND lnk_type = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, array($userId, $token, $type));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetUserLinkDb(string $user, int $token) : ?array
	{
		Profiling::BeginTimer();
		$userId = $this->GetUserId($user);
		$this->ClearOldTokens($userId);

		$sql = "SELECT lnk_to `to`, lnk_message `message`, lnk_type `type` FROM user_link WHERE lnk_user_id = ? AND lnk_token = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, [$userId, $token]);
		Profiling::EndTimer();
		return $ret;
	}

	public function DeleteUserLink(string $user, int $token) : void
	{
		Profiling::BeginTimer();
		$userId = $this->GetUserId($user);
		$this->ClearOldTokens($userId);

		$sql = "DELETE FROM user_link WHERE lnk_user_id = ? AND lnk_token = ?";
		App::Db()->exec($sql, [$userId, $token]);

		Profiling::EndTimer();
	}

	private function ClearOldTokens(int $userId) : void
	{
		$this->ClearEmailNew($userId);
		$delete = "DELETE FROM user_link WHERE DATE_ADD(lnk_time, INTERVAL ? DAY) < NOW()";
		App::Db()->exec($delete, [self::DaysValid]);
		App::Db()->ensureCommit();
		App::Db()->ensureBegin();
	}

	private function ClearEmailNew(int $userId) : void
	{
		//Borra todos menos el último, no puede haber varias validaciones de cambio de mail pendientes.
		$delete = "DELETE FROM user_link WHERE lnk_user_id = ? AND lnk_type = ? AND lnk_id NOT IN (SELECT MAX(lnk_id) FROM (SELECT * FROM user_link) AS ul2 WHERE lnk_user_id = user_link.lnk_user_id AND lnk_type = user_link.lnk_type)";
		App::Db()->exec($delete, [$userId, TokenTypeEnum::ChangeEmail]);

		//Si es que queda uno y no es válido limpia el campo email new...
		$select = "SELECT lnk_user_id FROM user_link WHERE DATE_ADD(lnk_time, INTERVAL ? DAY) < NOW() AND lnk_user_id = ? AND lnk_type = ? LIMIT 1";
		$id = App::Db()->fetchScalarIntNullable($select, [self::DaysValid, $userId, TokenTypeEnum::ChangeEmail]);
		if($id === null)
			return;

		$update = "UPDATE user SET usr_email_new = NULL WHERE usr_id = ?";
		App::Db()->exec($update, [$id]);
	}

}

