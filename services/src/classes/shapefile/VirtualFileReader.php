<?php

namespace helena\classes\shapefile;

use helena\classes\App;
use minga\framework\PublicException;

class VirtualFileReader
{
	private $handle = false;
	private $pages = [];
	private $pos = 0;

	private $pageSize;
	private $currentData;
	private $currentPage;
	private $filesize;

	public function fopen($filename, $pageSize = 50000)
	{
		$this->filesize = filesize($filename);
		$this->handle = fopen($filename, 'r');
		$this->pageSize = $pageSize ;
		$this->currentPage = -1;
	}

	public function isOpen()
	{
		return $this->handle !== false;
	}

	public function fclose()
	{
		if ($this->handle)
			fclose($this->handle);
	}
	public function fsize()
	{
		return $this->filesize;
	}
	public function fread($length)
	{
		if (!$this->handle)
			throw new \Exception('File is not open');
		$start = $this->pos;
		$ret = '';
		if ($this->pos === $this->filesize && $length > 0)
			return false;
		if ($this->pos + $length > $this->filesize)
			$length -= ($this->pos + $length) - $this->filesize;
		$lengthToRead = $length;

		while($lengthToRead)
		{
			$page = intdiv($start, $this->pageSize);
			$inpagestart = $start % $this->pageSize;
			// si no la tiene, la pide
			$this->setPage($page);
			// lectura posible en la página actual
			if ($inpagestart + $lengthToRead > $this->pageSize)
				$excessBytes = ($inpagestart + $lengthToRead) - $this->pageSize;
			else
				$excessBytes = 0;
			// lee lo que puede leer en la actual
			$ret .= substr($this->currentData, $inpagestart, $lengthToRead - $excessBytes);

			// se fija si tiene que leer más que esa página...
			if ($excessBytes > 0)
			{
				$start = ($page + 1) * $this->pageSize;
				$lengthToRead = $excessBytes;
			}
			else
			{
				$lengthToRead = 0;
			}
		}
		$this->pos += $length;

		return $ret;
	}

	private function setPage($page)
	{
		if ($page !== $this->currentPage)
		{
			fseek($this->handle, $page * $this->pageSize, SEEK_SET);
			$this->currentData = fread($this->handle, $this->pageSize);
			$this->currentPage = $page;
		}
	}

	public function ftell()
	{
		if (!$this->handle)
			throw new \Exception('File is not open');

		return $this->pos;
	}
	public function fseek(int $offset, int $whence = SEEK_SET)
	{
		if (!$this->handle)
			throw new \Exception('File is not open');

		$newval = 0;
		switch($whence)
		{
			case SEEK_SET:
				$newval = $offset;
				break;
			case SEEK_CUR:
				$newval = $this->pos + $offset;
				break;
			case SEEK_END:
				$newval = $this->filesize + $offset;
				break;
			default:
				return -1;
		}
		if ($newval <= $this->filesize && $newval >= 0)
		{
			$this->pos = $newval;
			return 0;
		}
		else
			return -1;
	}
}
