<?php
namespace helena\controllers\admin;

use helena\controllers\common\cController;
use minga\framework\Context;

use helena\classes\Session;
use helena\classes\Menu;

use minga\framework\System;

class cPlatform extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$this->templateValues = array();
		$this->templateValues['isSelf'] = true;
		$this->templateValues['admin_url'] = ('/admin/');
		$this->templateValues['serverInfo'] = System::GetServerInfo();
		$this->templateValues['results'] = array();
		if(!System::IsOnIIS())
		{
			$this->templateValues['results'][] = $this->RunCommand('uname -a');
			$this->templateValues['results'][] = $this->RunCommand('cat /etc/*-release');
			$this->templateValues['results'][] = $this->RunCommand('lsb_release -a');
			$this->templateValues['results'][] = $this->RunCommand('cat /proc/version');
		}

		Menu::RegisterAdmin($this->templateValues);

		$this->templateValues['architecture'] = System::GetArchitecture();
		$this->templateValues['html_title'] = 'Plataforma';

		$this->templateValues['dbItems'] = System::GetDbInfo();

		return $this->Render('platform.html.twig');
	}

	private function RunCommand($command)
	{
		$output = array();
		$return = '';
		/* $lastLine =''; */
		$lastLine = exec($command, $output, $return);
		/* var_dump($output); */
		/* var_dump($lastLine); */
		/* var_dump($return); */
		/* die; */
		return array('command' => $command, 'output' => implode("\n", $output), 'lastLine' => $lastLine, 'return' => $return);
	}

}
