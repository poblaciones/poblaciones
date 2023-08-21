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

		$partition = $this->Get('p');

		$controller = new SummaryService();
		$metricId = $l;
		$metricVersionId = $v;

		$levelId = $a;
		$urbanity = App::SanitizeUrbanity($u);
		$frame = Frame::FromParams();

		$frame = new Frame();
		$frame->Zoom = $z;
		$frame->Envelope =  Envelope::TextDeserialize($e);
		// $frame->ClippingRegionIds = $r;
		// $frame->ClippingCircle = Circle::TextDeserialize($c);

		$denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId);
		$this->assertNull($denied);

		$ret = $controller->GetSummary($frame, $metricId, $metricVersionId, $levelId, 0, $urbanity, $partition);

	}
}

