<?php

namespace helena\controllers\common;

use helena\classes\App;
use helena\classes\Session;

abstract class cController
{
	public $templateValues = array();
	public $content = NULL;
	public $title = NULL;
	public $showPrivate = false;
	public $message = null;
	public $isSelf = false;
	public $isEditing = false;
	public $useSearchBar = NULL;

	function __construct()
	{
		$this->AddValue('showMessage', false);
	}


	// Identifica el item
	public function AddValues($values)
	{
		$this->templateValues = array_merge($this->templateValues, $values);
	}
	// Identifica el item
	public function AddValueIfNotNull($key, $value)
	{
		if ($value !== null)
			$this->AddValue($key, $value);
	}

	public function AddValue($key, $value)
	{
		$this->templateValues[$key] = $value;
	}
	public function GetValue($key)
	{
		if(isset($this->templateValues[$key]))
			return $this->templateValues[$key];
		else
			return null;
	}
	public function RenderEdit($template)
	{
		$this->isEditing = true;
		$this->Render($template);
	}
	public function RenderPopup($template)
	{
		$this->AddValue('popup', true);
		$this->Render($template);
	}
	public function RenderPopupEdit($template)
	{
		$this->isEditing = true;
		$this->RenderPopup($template);
	}

	public function ProcessVs()
	{
		if (array_key_exists("vs", $_GET))
			$this->AddValue('process_vs',  intval($_GET["vs"]));
	}
	public function Render($template)
	{
		$this->RegisterBar();

		$this->AddValue('html_title',  $this->title);
		$this->AddValue('success',  $this->message);
		$this->AddValue('isMegaUser',  Session::IsMegaUser());
		$user = Session::GetCurrentUser()->user;
		$this->AddValue('current_user',  $user);

		return App::Render($template, $this->templateValues);
	}

	private function RegisterBar()
	{

	}
}
