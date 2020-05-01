<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\entities\frontend\clipping\ClippingInfo;
use helena\entities\frontend\clipping\ClippingLevelInfo;
use helena\entities\frontend\clipping\SelectionInfo;
use helena\entities\frontend\geometries\Circle;
use helena\entities\frontend\geometries\Coordinate;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Frame;
use helena\services\frontend\ClippingService;
use minga\framework\tests\TestCaseBase;

class ClippingServiceTest extends TestCaseBase
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
		$frame->ClippingRegionId = $r;
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
			$this->assertIsArray($ret->Canvas);
			$this->assertArrayHasKey('type', $ret->Canvas);
			$this->assertIsArray($ret->Canvas['features']);
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
		return [
			[
				'a' => 86,
				'e' => '-36.321756,-56.568096;-38.339494,-61.822308',
				'z' => 8,
				'r' => 13903,
				'c' => null,
				'retHasCanvas' => true,
				'retHasEnvelope' => true,
				'retHasLevels' => true,
			],
		  	[
				'a' => 90,
				'e' => '-36.321756,-56.568096;-38.339494,-61.822308',
				'z' => 8,
				'r' => null,
				'c' => null,
				'retHasCanvas' => false,
				'retHasEnvelope' => false,
				'retHasLevels' => true,
			],
		  	[
				'a' => 90,
				'e' => '-37.359188,-59.742139;-37.374946,-59.783188',
				'z' => 15,
				'r' => 19517,
				'c' => '-37.366931,-59.761601;0.005383,0.006773',
				'retHasCanvas' => true,
				'retHasEnvelope' => true,
				'retHasLevels' => true,
			],
		];
	}
}
