<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\TestCase;
use helena\entities\frontend\clipping\ClippingInfo;
use helena\entities\frontend\clipping\ClippingLevelInfo;
use helena\entities\frontend\clipping\SelectionInfo;
use helena\entities\frontend\geometries\Circle;
use helena\entities\frontend\geometries\Coordinate;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Frame;
use helena\services\frontend\ClippingService;

class ClippingServiceTest extends TestCase
{
	public function testGetDefaultFrame()
	{
		$controller = new ClippingService();
		$ret = $controller->GetDefaultFrame();
		$this->assertInstanceOf(Frame::class, $ret);
	}

	/**
	 * @dataProvider ParamProvider
	 */
	public function testCreateClipping($a, $e, $z, $r, $c,
		$retHasCanvas, $retHasEnvelope, $retHasLevels)
	{
		$controller = new ClippingService();

		$frame = new Frame();
		$frame->Zoom = $z;
		$frame->Envelope =  Envelope::TextDeserialize($e);
		$frame->ClippingRegionIds = ($r !== null ? array($r) : null);
		$frame->ClippingCircle = Circle::TextDeserialize($c);
		$frame->ClippingFeatureId = null;

		$levelId = $a;
		$levelName = null;
		$urbanity = null;
		$ret = $controller->CreateClipping($frame, $levelId, $levelName, $urbanity);

		$this->assertInstanceOf(ClippingInfo::class, $ret);
		$this->assertNotEmpty($ret->EllapsedMs);
		$this->assertInstanceOf(SelectionInfo::class, $ret->Summary);
		$this->assertIsInt($ret->Summary->Population);

		if($retHasCanvas)
		{
			$this->assertIsArray($ret->Canvas);
			$this->assertArrayHasKey('type', $ret->Canvas[0]);
			$this->assertIsArray($ret->Canvas[0]['features']);
		}

		if($retHasEnvelope)
		{
			$this->assertInstanceOf(Envelope::class, $ret->Envelope);
			$this->assertInstanceOf(Coordinate::class, $ret->Envelope->Min);
			$this->assertInstanceOf(Coordinate::class, $ret->Envelope->Max);
		}

		if($retHasLevels)
		{
			$this->assertIsArray($ret->Levels);
			$this->assertInstanceOf(ClippingLevelInfo::class, $ret->Levels[0]);
			$this->assertGreaterThan(0, $ret->Levels[0]->Id);
		}
	}

	public function ParamProvider()
	{
		return $this->Get();
	}
}
