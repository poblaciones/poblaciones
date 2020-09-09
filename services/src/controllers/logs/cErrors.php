<?php

namespace helena\controllers\logs;

use helena\controllers\common\cController;
use minga\framework\Performance;

use helena\classes\Session;
use helena\classes\Menu;
use minga\framework\Str;
use helena\classes\App;
use minga\framework\Arr;
use helena\classes\Account;
use minga\framework\IO;
use minga\framework\Context;

class cErrors extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$account = Account::Current();
		// Pone atributos
		$this->templateValues = array();


		// se fija si muestra uno individual
		if (array_key_exists("deleteAll", $_GET))
		{
			$path = Context::Paths()->GetLogLocalPath() . '/errors';
			IO::EnsureExists($path);
			// Resuelve lo mensual
			$path .= '/' . cStatsSolver::AddMonthlyInfo($this->templateValues, $path, false);
			// borra todos
			IO::ClearDirectory($path);
		}

		$path = Context::Paths()->GetLogLocalPath() . '/errors';
		IO::EnsureExists($path);

		// Resuelve lo mensual
		$path .= '/' . cStatsSolver::AddMonthlyInfo($this->templateValues, $path, false);

		// se fija si muestra uno individual
		if (array_key_exists("error", $_GET))
		{
			$error = $_GET['error'];
			$this->templateValues['error'] = $error;
			$file = $path . '/' . $error . '.txt';
			if (!file_exists($file)) $file = $path . '/' . $error . '.@.txt';
			if (array_key_exists("deleteItem", $_GET))
			{
				// lo borra y sigue...
				IO::Delete($file);
			}
			else
			{
				// lo muestra
				$this->templateValues['error_text'] = str_replace("\r\n", "<br>" , IO::ReadAllText($file));
				// lo marca como leido
				if (!Str::EndsWith($error, ".@.txt"))
				{
					$target = $path . '/' . $error . '.@.txt';
					IO::Move($file, $target);
				}
				$this->templateValues['delete_item_url'] = "/logs/errors?deleteItem&error=" . urlencode($error);

				Menu::RegisterAdmin($this->templateValues);

				$this->templateValues['html_title'] = 'Errores';
				return $this->Render('errorsItem.html.twig');
			}
		}

		$errors_count = 0;
		$errors = array();

		// Recorre los prefijos
		IO::EnsureExists($path);
		foreach(IO::GetFiles($path, 'txt') as $error)
		{
			$current = array();
			$file = $path . '/' . $error;
			$lines = $this->Get20LinesKeys($file);

			if (sizeof($lines) > 0)
			{
				$current['date'] = substr($error, 0, 19);
				$current['user'] = Arr::SafeGet($lines, 'User');
				$current['url'] = $lines['Url'];
				$error_no_ext = IO::RemoveExtension($error);
				if (Str::EndsWith($error, ".@.txt"))
					$current['link'] = "class='dSoftLink'";
				else
					$current['link'] = "";
				$current['error_url'] = "/logs/errors?error=" . urlencode($error_no_ext);
				if (array_key_exists('Description', $lines))
					$current['description'] = $lines['Description'];
				else // legacy bugs fixing
					$current['description'] = '-';

				// lo agrega a la lista
				$errors[] = $current ;
				$errors_count++;
			}
		}

		uasort($errors, array("self", "myComparerErrors"));

		$this->templateValues['delete_all_url'] = '/logs/errors?deleteAll';
		$this->templateValues['errors'] = $errors;
		$this->templateValues['errors_count'] = $errors_count;

		$this->templateValues['html_title'] = 'Errores';

		Menu::RegisterAdmin($this->templateValues);

		return $this->Render('errors.html.twig');
	}
	private static function myComparerErrors($a, $b)
	{
		if ($a['date'] == $b['date'])
			return 0;
		else
			return ($a['date'] > $b['date']) ? -1 : 1;
	}

	function Get20LinesKeys($file)
	{
		$handle = fopen($file, 'r');
		$count = 0;
		$ret = array();
		// registra propiedades del perfil
		while (!feof($handle) && $count < 20)
		{
			$currentLine = fgets($handle) ;
			$count++;
			if (!Str::StartsWith($currentLine, "======"))
			{
				if (Str::StartsWith($currentLine, "=>"))
				{
					$n = strpos($currentLine, ":");
					if ($n !== false && $n > 0)
					{
						$currentLineKey = trim(substr($currentLine, 3, $n - 3));
						$currentLineValue = trim(substr($currentLine, $n + 1));
						if (Str::EndsWith($currentLineValue, '<br>'))
							$currentLineValue = substr($currentLineValue, 0, strlen($currentLineValue) - 4);
						$ret[$currentLineKey] = $currentLineValue;
					}
				}
			}
		}
		fclose($handle);
		return $ret;
	}
}
