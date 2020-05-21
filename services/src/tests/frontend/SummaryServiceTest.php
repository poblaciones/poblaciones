<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\App;
use helena\classes\Session;
use helena\classes\TestCase;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Frame;
use helena\services\frontend\SummaryService;

class SummaryServiceTest extends TestCase
{
	public function testGetSummary()
	{
		$l = $this->Get('l');
		$v = $this->Get('v');
		$a = $this->Get('a');

		$u = $this->Get('u');
		$e = $this->Get('e');
		$z = $this->Get('z');

		$controller = new SummaryService();
		$metricId = $l;
		$metricVersionId = $v;

		$levelId = $a;
		$urbanity = App::SanitizeUrbanity($u);
		$frame = Frame::FromParams();

		$frame = new Frame();
		$frame->Zoom = $z;
		$frame->Envelope =  Envelope::TextDeserialize($e);
		// $frame->ClippingRegionId = $r;
		// $frame->ClippingCircle = Circle::TextDeserialize($c);
		// $frame->ClippingFeatureId = $f;

		$denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId);
		$this->assertNull($denied);

		$this->markTestIncomplete('Falla en producción y desa con estos parámetros, revisarlos para terminar este test');

		$ret = $controller->GetSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity);

	}
}

