<?php

namespace helena\classes;

use minga\framework\IO;

// Documentation: https://mpdf.github.io/
class MpdfMemory
{
	private $buffer = '';

	public function __construct()
	{
	}
	public function Output($filename)
	{
		IO::WriteAllText($filename, $this->buffer);
	}
	public function WriteHTML($text, $areStyles = 0)
	{
		if ($areStyles === 1)
		{
			$this->buffer .= "<style>" . $text . "</style>";
		}
		else 
		{
			$this->buffer .= $text;
		}
	}
}
