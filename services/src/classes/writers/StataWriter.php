<?php

namespace helena\classes\writers;

use minga\framework\IO;
use helena\classes\Python;

class StataWriter extends SpssWriter
{
	public function Flush()
	{
		parent::Flush();

		$file = $this->state->Get('outFile');
		$spss = $file . '.sav';
		IO::Move($file, $spss);

		self::SpssToStata($spss, $file);
	}

	public static function SpssToStata($spss, $file)
	{
		$args = array($spss, $file);
		Python::Execute('spss2stata3.py', $args);
	}
}

