<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\App;
use helena\classes\Session;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Frame;
use helena\services\frontend\SummaryService;
use minga\framework\tests\TestCaseBase;

class SummaryServiceTest extends TestCaseBase
{
	public function testGetSummary()
	{
		$l = 3401;
		$v = 201;
		$a = 8501;

		$u = 'N';
		$e = '-36.31489,-56.568096;-38.33281,-61.822308';
		$z = 8;


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

