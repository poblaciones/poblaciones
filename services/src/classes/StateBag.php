<?php

namespace helena\classes;

use minga\framework\IO;
use minga\framework\Log;
use minga\framework\Str;
use minga\framework\PhpSession;
use minga\framework\Context;
use minga\framework\ErrorException;
use minga\framework\FileBucket;

class StateBag
{
	const STEP_BEGIN = 0;
	const STATE_FILE = 'state.json';

	private $start = 0.0;
	public $state = array();

	function __construct()
	{
			$this->start = microtime(true);
	}

	protected function Initialize($defaultBucketId = null)
	{
		$bucket = FileBucket::Create($defaultBucketId);

		$this->state = array(
			'folder' => $bucket->GetBucketFolder(),
			'initialUrl' => Context::CurrentUrl(),
			'sid' => PhpSession::SessionId(),
			'key' => $bucket->id,
			'step' => self::STEP_BEGIN,
			'slice' => 0,
			'visitUrl' => '',
			'visitCaption' => '',
			'totalSteps' => 0,
			'totalSlices' => 0,
			'progressLabel' => 'Iniciando'
		);
		Log::$extraErrorTarget = $this->ErrorFile();
	}

	public function Save()
	{
		Log::AppendExtraInfo($this->state);
		IO::WriteJson($this->state['folder'] . '/' . self::STATE_FILE, $this->state, true);
	}

	public function LoadFromKey($key)
	{
		if ($key == "")
			throw new ErrorException('Key cannot be null.');
		if (Str::Contains($key, "..") || Str::Contains($key, "/") || Str::Contains($key, "\\") || Str::Contains($key, " "))
			throw new ErrorException('Invalid key.');
		$bucket = FileBucket::Load($key);
		$folder = $bucket->GetBucketFolder();
		if(is_dir($folder) == false)
			throw new ErrorException('El proceso está finalizado. Por favor, recomience nuevamente la operación.');

		$this->state = IO::ReadJson($folder . '/' . self::STATE_FILE);
		Log::AppendExtraInfo($this->state);

		IO::Delete($this->ErrorFile());

		Log::$extraErrorTarget = $this->ErrorFile();
//		if ($this->state['sid'] !== PhpSession::SessionId() && $this->state['sid'] != "")
	//	{
		//	throw new ErrorException('Session mismatched in stateBag.');
	//	}
	}
	private function ErrorFile()
	{
		return $this->state['folder'] . '/lastError.txt';
	}
	public function NextSlice()
	{
		$this->SetSlice($this->Slice() + 1);
	}
	public function NextStep($caption = -1)
	{
		$this->SetStep($this->Step() + 1, $caption);
	}
	public function Slice()
	{
		return $this->state['slice'];
	}
	public function SetSlice($slice)
	{
		$this->state['slice'] = $slice;
	}
	public function SetTotalSteps($total)
	{
		if ($this->state['totalSteps'] != $total)
		{
			$this->SetTotalSlices(0);
		}
		$this->state['totalSteps'] = $total;
	}
	public function SetTotalSlices($total)
	{
		if ($this->state['totalSlices'] != $total)
			$this->state['slice'] = 0;
		$this->state['totalSlices'] = $total;
	}
	public function SetVisitUrl($url, $caption)
	{
		$this->state['visitUrl'] = $url;
		$this->state['visitCaption'] = $caption;
	}
	public function GetTotalSteps()
	{
		return $this->state['totalSteps'];
	}
	public function GetTotalSlices()
	{
		return $this->state['totalSlices'];
	}
	public function SetStep($step, $caption = -1)
	{
		$this->state['step'] = $step;
		$this->SetSlice(0);
		if ($caption !== -1)
		{
			$this->state['progressLabel'] = $caption;
		}
	}

	public function ReturnState($done, $extraKeys = array())
	{
		$this->Save();
		$key = $this->Key();
		$status = $this->GetProgressLabel();
		$ret = array('done' => $done, 'key' => $key, 'status' => $status, 'step' => $this->Step(),
									'slice' => $this->Slice(), 'ellapsed' => round(microtime(true) - $this->start, 2));
		if ($this->state['visitUrl'] != '')
		{
			$ret['visitUrl']  = $this->state['visitUrl'];
			$ret['visitCaption']  = $this->state['visitCaption'];
		}
		if ($this->state['totalSteps'] != 0)
		{
			$ret['totalSteps']  = $this->state['totalSteps'];
		}
		if (array_key_exists('errorsFound', $this->state))
		{
			$ret['errorsFound']  = $this->state['errorsFound'];
		}
		if ($this->state['totalSlices'] != 0)
		{
			$ret['totalSlices']  = $this->state['totalSlices'];
		}
		foreach($extraKeys as $key)
			$ret[$key]  = $this->state[$key];

		if ($done && !file_exists($this->ErrorFile()))
			$this->Cleanup();
		return $ret;
	}

	public function Get($key, $default = '')
	{
		if (isset($this->state[$key]))
			return $this->state[$key];
		else
			return $default;
	}

	public function SetArray($valueArray)
	{
		$this->state = array_merge($this->state, $valueArray);
	}

	public function Set($key, $value)
	{
		$this->state[$key] = $value;
	}

	public function GetFolder()
	{
		return $this->Get('folder');
	}
	public function GetProgressLabel()
	{
		return $this->Get('progressLabel');
	}
	public function SetProgressLabel($value)
	{
		$this->Set('progressLabel', $value);
	}
	public function Key()
	{
		return $this->Get('key');
	}
	public function Cleanup()
	{
		IO::RemoveDirectory($this->state['folder']);
	}

	public function Increment($key, $value = 1)
	{
		$this->state[$key] += $value;
	}

	public function Step()
	{
		return $this->state['step'];
	}
}

