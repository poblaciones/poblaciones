<?php

namespace helena\classes\writers;

use minga\framework\IO;
use helena\classes\Python;

class RWriter extends SpssWriter
{
	public function Flush()
	{
		parent::Flush();

		$file = $this->state->Get('outFile');
		$spss = $file . '.sav';
		IO::Move($file, $spss);

		self::SpssToR($spss, $file);
	}

	public static function SpssToR($spss, $file)
	{
		$args = array($spss, $file);
		Python::Execute('spss2r3.py', $args);
	}
}

