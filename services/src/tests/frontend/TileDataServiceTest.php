<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\App;
use helena\classes\Session;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Frame;
use helena\services\frontend\TileDataService;
use minga\framework\tests\TestCaseBase;

class TileDataServiceTest extends TestCaseBase
{
	public function testGetTileData()
	{
		$l = 3401;
		$v = 201;
		$a = 8501;

		$u = 'N';
		$x = 86;
		$y = 156;
		$e = '-36.31489,-56.568096;-38.33281,-61.822308';
		$z = 8;
		$b = null;

		$controller = new TileDataService();
		$metricId = $l;
		$metricVersionId = $v;

		$denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId);
		$this->assertNull($denied);

		$this->markTestIncomplete('Falla en producción y desa con estos parámetros, revisarlos para terminar este test');

		$levelId = $a;
		$urbanity = App::SanitizeUrbanity('N');
		$frame = new Frame();
		$frame->Zoom = $z;
		$frame->Envelope =  Envelope::TextDeserialize($e);

		$ret = $controller->GetTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b);
	}
}
