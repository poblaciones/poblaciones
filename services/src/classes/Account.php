<?php

namespace helena\classes;

use helena\db\frontend\UserModel;
use helena\services\backoffice\notifications\NotificationManager;
use minga\framework\PhpSession;
use minga\framework\TemplateMessage;
use minga\framework\Mail;
use minga\framework\Str;
use minga\framework\MessageBox;
use minga\framework\Context;
use minga\framework\PublicException;
use helena\services\common\BaseService;
use helena\classes\enums\TokenTypeEnum;

class Account
{
	public $user = '';
	public $password = '';
	public $userId = '';
	public $firstName = '';
	public $lastName = '';
	public $privileges = '';
	public $facebookOauthId = '';
	public $googleOauthId = '';

	public $isActive = false;
	protected $geographies = NULL;

	const ValidTokens = 1; // en días

	public function IsEmpty()
	{
		return (strlen($this->user) == 0);
	}

	private static $current = NULL;

	public static function ClearCurrent()
	{
		self::$current = NULL;
	}
	public static function Current()
	{
		if (self::$current == NULL)
		{
			$accountId = PhpSession::GetSessionValue('user');
			self::$current = new Account();
			if (strlen($accountId) > 0)
			{
				self::$current->user = $accountId;
			}
		}
		return self::$current;
	}
	public static function GetMasterUser()
	{
		return PhpSession::GetSessionValue('masteruser');
	}
	public function IsMegaUser()
	{
		return $this->CheckGlobalRole('A');
	}
	public function IsSiteEditor()
	{
		return $this->CheckGlobalRole('E') || self::IsMegaUser();
	}
	public function IsSiteReader()
	{
		return $this->CheckGlobalRole('L') || self::IsSiteEditor();
	}
	public function CheckGlobalRole($key)
	{
		if ($this->IsActive() == false)
			return false;
		else
			return $this->privileges === $key;
	}

	public function GetFullName()
	{
		return trim($this->GetFirstName() . " " . $this->GetLastName());
	}
	public function GetOauthId($provider)
	{
		$this->EnsureDbInfo();
		if ($provider === 'google')
			return $this->googleOauthId;
		else if ($provider === 'facebook')
			return $this->facebookOauthId;
		else throw new PublicException("Proveedor de autenticación no reconocido");
	}
	public function SetOauthId($provider, $id)
	{
		$this->EnsureDbInfo();
		if ($provider === 'google')
			$this->googleOauthId = $id;
		else if ($provider === 'facebook')
			$this->facebookOauthId = $id;
		else throw new PublicException("Proveedor de autenticación no reconocido");
	}

	public function GetFirstName()
	{
		$this->EnsureDbInfo();
		return $this->firstName;
	}
	public function GetLastName()
	{
		$this->EnsureDbInfo();
		return $this->lastName;
	}
	public function GetEmail()
	{
		$this->EnsureDbInfo();
		return $this->user;
	}
	public function GetUserId()
	{
		$this->EnsureDbInfo();
		return $this->userId;
	}

	public function GetUserIdOrNull()
	{
		if ($this->IsEmpty())
		{
			return null;
		}
		else
		{
			return $this->GetUserId();
		}
	}

	public function GetSettings() : array
	{
		$this->EnsureDbInfo();
		$sql = "SELECT `ust_key`, `ust_value` FROM user_setting WHERE ust_user_id = ?";
		$rows = App::Db()->fetchAll($sql, [$this->userId]);
		$ret = [];
		foreach($rows as $row)
			$ret[$row['ust_key']] = json_decode($row['ust_value'], true);
		return $ret;
	}

	public function SetSetting(string $key, $value) : void
	{
		$this->EnsureDbInfo();
		$update = "REPLACE INTO user_setting (ust_user_id, `ust_key`, `ust_value`) VALUES (?, ?, ?)";
		App::Db()->exec($update, [$this->userId, $key, json_encode($value)]);
	}

	private function RefreshDbInfo()
	{
		$this->privileges = '';
		$this->EnsureDbInfo();
	}

	private function EnsureDbInfo($throwException = true)
	{
		if ($this->privileges === '')
		{
			if ($this->user === '')
			{
				if ($throwException)
					throw new PublicException("No se ha iniciado sesión.");
				else
					return false;
			}
			$users = new UserModel();
			$attrs = $users->GetUserByEmail($this->user);
			if ($attrs == null)
			{
				if ($throwException)
					throw new PublicException("Usuario no encontrado en la base de datos ('" . $this->user . "').");
				else
					return false;
			}
			$this->userId = $attrs['usr_id'];
			$this->privileges = $attrs['usr_privileges'];
			$this->firstName = $attrs['usr_firstname'];
			$this->lastName = $attrs['usr_lastname'];
			$this->facebookOauthId = $attrs['usr_facebook_oauth_id'];
			$this->googleOauthId = $attrs['usr_google_oauth_id'];
			$this->isActive = $attrs['usr_is_active'];
			$this->password = $attrs['usr_password'];
		}
		return true;
	}

	private function BuildFullName($first, $last)
	{
		return trim($first . ' ' . $last);
	}

	public function Exists()
	{
		if ($this->EnsureDbInfo(false) == false)
			return false;
		else
			return true;
	}

	public function IsActive()
	{
		if ($this->EnsureDbInfo(false) == false)
			return false;
		else
			return $this->isActive != 0;
	}

	public function Login($password)
	{
		Session::CheckReadonlyForMaintenance();

		if ($this->EnsureDbInfo(false) == false)
			return false;
		else
		{
			$ret = password_verify($password, $this->password);
			if ($ret)
				$this->Begin();
			return $ret;
		}
	}

	public function BeginActivation(string $to) : array
	{
		Session::CheckReadonlyForMaintenance();

		if ($this->IsActive())
			return ['status' => BaseService::ERROR, 'message' => ('La cuenta de correo electrónico ya se encuentra utilizada.')];

		// La pone en activación
		$model = new UserModel();
		$model->CreateUser($this->user);
		$token = $model->CreateUserLink('A', $this->user, $to);
		$url = App::AbsoluteUrl('/cr#/activate?email=' . urlencode($this->user) . '&code=' . $token);

		// Manda email....
		$message = new TemplateMessage();
		$message->title = ('Activación en Poblaciones');
		$message->to = $this->user;
		$message->footer = 2;
		$message->skipNotify = true;
		$message->AddViewAction($url, ('Activar'), ('Activar'));
		$message->SetValue('token', $token);
		$message->Send('activate.html.twig');
		// Manda notificación
		$nm = new NotificationManager();
		$nm->NotifyCreateUser($this->user);
		return ['status' => BaseService::OK];
	}

	public function BeginActivationOld($password, $firstName, $lastName, $to)
	{
		Session::CheckReadonlyForMaintenance();

		if ($password == '')
			MessageBox::ThrowBackMessage('La contraseña no puede ser nula.');
		if ($firstName == '')
			MessageBox::ThrowBackMessage('El nombre no puede ser nulo.');
		if ($lastName == '')
			MessageBox::ThrowBackMessage('El apellido no puede ser nulo.');
		if ($this->IsActive())
			MessageBox::ThrowBackMessage("La cuenta de correo electrónico indicada ya se encuentra registrada en el sistema. En caso de haber perdido su contraseña, debe acceder <a href='lostPassword'>aquí</a> para recuperarla.");

		$passwordHashed = Str::SecurePasswordHash($password);

		// La pone en activación
		$model = new UserModel();
		$model->CreateUser($this->user, $firstName, $lastName, $passwordHashed);
		$token = $model->CreateUserLink('A', $this->user, $to);
		$activation = App::AbsoluteUrl('linkActivation?username=' . urlencode($this->user));
		$url = $activation . '&id=' . $token;

		// Manda email....
		$message = new TemplateMessage();
		$message->title = 'Activación en Poblaciones';
		$message->to = $this->user;
		$fullName = $this->BuildFullName($firstName, $lastName);
		$message->toCaption = $fullName;
		$message->footer = 2;
		$message->skipNotify = true;
		$message->AddViewAction($url, 'Activar', 'Activar');
		$message->SetValue('token', $token);
		$message->Send('activate.html.twig');
		// Manda notificación
		$nm = new NotificationManager();
		$nm->NotifyCreateUser($this->user);
		return $activation;
	}

	public function Activate(int $code, string $password = '', string $firstname = '', string $lastname = '', string $type = TokenTypeEnum::Activation) : array
	{
		$model = new UserModel();
		if ($this->IsActive())
				return ['status' => BaseService::ERROR, ('La cuenta ya ha sido activada. Para acceder puede ingresar con su usuario y contraseña.')];

		//Puede ser activación o permiso...
		$target = $model->GetUserLink($type, $this->user, $code);
		if($target == null)
			return ['status' => BaseService::ERROR, ('El código es inválido o ha expirado.')];

		// Activa la cuenta
		$this->ActivateDb($password, $firstname, $lastname);
		$this->isActive = true;

		return ['status' => BaseService::OK, 'target' => $target];
	}

	private function ActivateDb(string $password = '', string $firstname = '', string $lastname = '') : void
	{
		$setters = "usr_is_active = 1";

		if ($password != '')
		{
			$passwordHashed = Str::SecurePasswordHash($password);
			$setters .= ", usr_password = ?";
			$args[] = $passwordHashed;
		}
		if ($firstname != '' || $lastname != '')
		{
			$setters .= ", usr_firstname = ?, usr_lastname = ?";
			$args[] = $firstname;
			$args[] = $lastname;
		}
		$update = "UPDATE user SET " . $setters . " WHERE usr_id = ?";
		$args[] = $this->userId;
		App::Db()->exec($update, $args);
	}
	public function ActivateOld($id)
	{
		if (strlen($id) == 0)
			MessageBox::ThrowMessage('No se indicó un número de activación.');

		// busca la carpeta correspondiente
		if ($this->IsActive())
			MessageBox::ThrowMessage('La cuenta ya ha sido activada. Para acceder puede ingresar con su usuario y contraseña.', '/');

		$model = new UserModel();
		$link = $model->CheckUserLink('A', $this->user, $id);

		// Activa la cuenta
		$update = "UPDATE user SET usr_is_active = 1 WHERE usr_id = ?";
		App::Db()->exec($update, array($this->userId));
		$this->isActive = 1;

		return $link;
	}

	public function LoadOrCreate()
	{
		if ($this->Exists() == false) {
			$model = new UserModel();
			$model->CreateUser($this->user);
		} else {
			$this->EnsureDbInfo();
		}
	}
	public function BeginLostPassword($target)
	{
		// busca la carpeta correspondiente
		if ($this->IsActive() == false)
			return ['status' => BaseService::ERROR, 'message' => 'El correo electrónico indicado no corresponde a una cuenta activa.'];

		// La pone en el id
		$model = new UserModel();
		$token = $model->CreateUserLink(TokenTypeEnum::LostPassword, $this->user, $target);
		$url = App::AbsoluteUrl('/cr#/newPassword?email=' . urlencode($this->user) . '&code=' . $token);

		$this->SendLostPasswordEmail($url, $token);
		return ['status' => BaseService::OK];
	}

	public function SendLostPasswordEmail($url, $token)
	{
		// Manda email....
		$message = new TemplateMessage();
		$message->title = 'Restablecer contraseña en Poblaciones';
		$message->to = $this->user;
		$this->EnsureDbInfo();
		$fullname = $this->BuildFullname($this->firstName, $this->lastName);
		$message->toCaption = $fullname;
		$message->footer = 2;
		$message->skipNotify = !Context::Settings()->Notifications()->NotifyLostPassword;
		$message->AddViewAction($url, 'Continuar', 'Continuar');
		$message->SetValue('token', $token);
		$message->Send('lostPassword.html.twig');
	}

	public function SavePassword($password)
	{
		$this->EnsureDbInfo();
		$passwordHashed = Str::SecurePasswordHash($password);
		$sql = "UPDATE user SET usr_password = ? WHERE usr_id = ?";
		App::Db()->exec($sql, array($passwordHashed, $this->userId));
	}

	public function SaveActivation($firstName, $lastName, $passwordHashed)
	{
		$sql = "UPDATE user SET usr_firstname = ?, usr_lastname = ?, usr_password = ?, usr_is_active = 1 WHERE usr_id = ?";
		App::Db()->exec($sql, array($firstName, $lastName, $passwordHashed, $this->userId));
		$this->RefreshDbInfo();
	}

	public function SaveOauthActivation($data, $isCreate = true)
	{
		$this->EnsureDbInfo();
		if($isCreate)
		{
			$this->firstName = $data->firstname;
			$this->lastName = $data->lastname;
		}
		$this->SetOauthId($data->provider, $data->id);
		$this->isActive = true;
		$sql = "UPDATE user SET usr_firstname = ?, usr_lastname = ?, usr_facebook_oauth_id = ?,
												usr_google_oauth_id = ?, usr_is_active = 1 WHERE usr_id = ?";
		App::Db()->exec($sql, array($this->firstName, $this->lastName, $this->facebookOauthId, $this->googleOauthId, $this->userId));
	}
	public function LostPasswordActivate($id)
	{
		if (strlen($id) == 0)
			MessageBox::ThrowMessage('El número de identificación no puede ser nulo.');
		// busca la carpeta correspondiente
		if (!$this->IsActive())
			MessageBox::ThrowMessage('La cuenta no se encuentra activada.');

		$model = new UserModel();
		$link = $model->CheckUserLink('L', $this->user, $id);

		// Activa la sesión
		$this->Begin();

		return $link;
	}

	public static function Impersonate($user)
	{
		$current = Account::Current()->user;
		$account = new Account();
		$account->user = $user;
		$account->Begin($current);
	}

	public static function RevertImpersonate()
	{
		$user = self::GetMasterUser();
		$account = new Account();
		$account->user = $user;
		$account->Begin(null);
	}

	public function Begin($masterUser = null)
	{
		if($this->IsActive() == false)
		{
			throw new PublicException('La cuenta debe ser activada antes de poder ser utilizada');
		}
		self::$current = $this;
		if ($masterUser !== null)
			PhpSession::SetSessionValue('masteruser', $masterUser);
		else
			PhpSession::SetSessionValue('masteruser', '');
		PhpSession::SetSessionValue('user', $this->user);
	}
}


