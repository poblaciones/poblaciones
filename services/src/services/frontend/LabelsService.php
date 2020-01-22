<?php

namespace helena\services\frontend;

use helena\classes\App;
use helena\classes\GlobalTimer;
use helena\caches\LabelsCache;
use helena\services\common\BaseService;

use helena\db\frontend\SnapshotSearchModel;
use helena\entities\frontend\clipping\LabelsDataInfo;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Coordinate;


class LabelsService extends BaseService
{
	public function GetLabels($x, $y, $z, $b)
	{
		$data = null;
		$this->CheckNotNullNumeric($x);
		$this->CheckNotNullNumeric($y);
		$this->CheckNotNullNumeric($z);

		$key = LabelsCache::CreateKey($x, $y, $z, $b);

		if (LabelsCache::Cache()->HasData($key, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateLabels($x, $y, $z, $b);

		LabelsCache::Cache()->PutData($key, $data);
		return $data;
	}

	private function CalculateLabels($x, $y, $z, $b)
	{
		$table = new SnapshotSearchModel();

		if ($b != null)
		{
			$envelope = Envelope::TextDeserialize($b);
		}
		else
		{
			$envelope = Envelope::FromXYZ($x, $y, $z);
		}

		$size = $envelope->Size();
		$extendedEnvelope = new Envelope(
									new Coordinate($envelope->Min->Lat - $size->Height / 2,
																 $envelope->Min->Lon - $size->Width / 2),
									new Coordinate($envelope->Max->Lat + $size->Height / 2,
																 $envelope->Max->Lon + $size->Width / 2));

		$rows = $table->GetLabelsByEnvelope($extendedEnvelope, $z);

		$rows = $this->CalculateVisibility($rows, $z, $envelope);

		$data = $this->CreateLabelsDataInfo($rows, $z);

		return $data;
	}


	private function CalculateVisibility($rows, $z, $envelope)
	{
		$size = $envelope->Size();
		$scaleX = $size->Width / TileDataService::TILE_SIZE;
		$scaleY = $size->Height / TileDataService::TILE_SIZE;
		$used = array();
		$usedIds = array();
		$ret = array();

		foreach($rows as $row)
		{
			if (in_array($row['FIDs'], $usedIds) === false && $envelope->Contains($row['Lat'], $row['Lon']))
			{
				$row['Size'] = $this->CalculateSize($z, $row['Population']);
				$rect = $this->MeasureLabelRectangle($row, $scaleX, $scaleY);
				if ($this->Overlaps($used, $rect) === false)
				{
					$used[] = $rect;
					if ($row['FIDs'] !== null)
						$usedIds[] = $row['FIDs'];

					$row['Show'] = 1;
					$ret[] = $row;
				}
				else
				{
					if ($row['FIDs'] !== null)
					{
						// Lo agrega como no visible para la semaforización por ejemplo de escuelas, que llegan
						// desde Labels y luego se cargan con información que se prende o se apaga.
						$ret[] = array('type' => $row['type'], 'Show' => 0, 'FIDs' => $row['FIDs'], 'Lat' => $row['Lat'], 'Lon' => $row['Lon']);
					}
				}
			}
		}
		return $ret;
	}

	private function Overlaps($usedList, $rect)
	{
		foreach($usedList as $used)
		{
			if (($rect['y2'] < $used['y1'] || $rect['y1'] > $used['y2'] || $rect['x2'] < $used['x1'] || $rect['x1'] > $used['x2']) === false)
				return true;
		}
		return false;
	}

	private function MeasureLabelRectangle($row, $scaleX, $scaleY)
	{
		$boxWidth = ($row['Size'] < 3 ? 200 : 100);
		$boxLine =  $boxWidth * 0.5 * $scaleY;
		$lines = intval(strlen($row['Caption']) / 16) + 1;
		if ($lines > 3) $lines = 3;

		$widthHalf = ($boxWidth * $scaleX) / 2;
		return array('x1' => $row['Lon'] - $widthHalf, 'x2' => $row['Lon'] + $widthHalf,
									'y1' => $row['Lat'] - $boxLine * $lines, 'y2' => $row['Lat']);
	}

	private function CreateLabelsDataInfo($rows, $z)
	{
		$z = 0 + $z;
		$ret = new LabelsDataInfo();
		foreach($rows as &$row)
		{
			if ($row['FIDs'] !== null)
			{
				$row['FIDs'] = explode(",", $row['FIDs']);
			}
			unset($row['Population']);
		}
		$ret->Data = $rows;

		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		return $ret;
	}

	private function CalculateSize($z, $size)
	{
		// Se establece tamaños iniciales en base a tamaños poblacionales
		if ($z === 4 || $z === 5 || $z === 6) {
			$t = 4 - ($z - 5);
			if ($size > 20000)
				// 20 millones
				$t -= 2	;
		} else if ($size > 1000) { // 1 millón
			$t = 1;
		} else if ($size > 500) {
			$t = 2;
		} else if ($size > 50) {
			$t = 3;
		} else {
			$t = 4;
		}
		// Cuando el zoom es mayor a 12, se amplian las etiquetas
		if ($z > 12 && $t > 1) {
			$t--;
		}
		// Cuando el zoom es amplio, las localidades (size > 0) deben destacar respecto a los
		// labels de comercios y cosas locales
		if ($z > 15 && $t > 1 && $size > 0) {
			$t--;
		}
		// Las etiquetas de features llegan con 0 y se ven desde nivel 15 a tamaño chico
		if ($z >= 15 && $t < 4 && $size == 0) {
			$t++;
		}

		return $t;
	}
}

