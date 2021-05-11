<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\App;
use helena\classes\Session;
use helena\classes\TestCase;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Frame;
use helena\services\frontend\TileDataService;

class TileDataServiceTest extends TestCase
{
	public function testGetTileData()
	{
		$l = $this->Get('l');
		$v = $this->Get('v');
		$a = $this->Get('a');

		$u = $this->Get('u');
		$x = $this->Get('x');
		$y = $this->Get('y');
		$e = $this->Get('e');
		$z = $this->Get('z');

		$controller = new TileDataService();
		$metricId = $l;
		$metricVersionId = $v;

		$denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId);
		$this->assertNull($denied);

		$levelId = $a;
		$urbanity = App::SanitizeUrbanity('N');
		$frame = new Frame();
		$frame->Zoom = $z;
		$frame->Envelope =  Envelope::TextDeserialize($e);

		$ret = $controller->GetTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z);
	}
}
