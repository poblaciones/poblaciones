<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\classes\Links;
use helena\services\mcp\McpMapRoute;

class McpMapRouteTest extends TestCase
{
	public function testIndicatorAloneIsJustItsId()
	{
		$this->assertSame('6301', McpMapRoute::BuildMetric(6301, null, null, null, false));
	}

	public function testVersionAndLevelAreWrittenAsPositions()
	{
		$this->assertSame('6301!v2!a1', McpMapRoute::BuildMetric(6301, 2, 1, null, false));
	}

	public function testZeroPositionsAreKept()
	{
		$this->assertSame('6301!v0!a0', McpMapRoute::BuildMetric(6301, 0, 0, null, false));
	}

	public function testPinnedLevelAndPartition()
	{
		$this->assertSame('6301!v1!a2!l1!x3', McpMapRoute::BuildMetric(6301, 1, 2, 3, true));
	}

	public function testPinningNeedsALevel()
	{
		$this->assertSame('6301!v1', McpMapRoute::BuildMetric(6301, 1, null, null, true));
	}

	public function testViewerUrlWithOneRegionUsesTheClippingBlock()
	{
		$route = McpMapRoute::BuildMetric(6301, 2, 1, null, true);
		$this->assertSame('/map/3501/#/&!r19166/l=6301!v2!a1!l1', Links::GetWorkMetricUrl(3501, $route, '19166'));
	}

	public function testViewerUrlWithSeveralRegionsAddsAnEmptyFrameBlock()
	{
		$route = McpMapRoute::BuildMetric(6301, 0, 0, null, false);
		$this->assertSame('/map/3501/#/@&!r1,2/l=6301!v0!a0', Links::GetWorkMetricUrl(3501, $route, McpMapRoute::JoinRegionIds([1, 2])));
	}

	public function testViewerUrlKeepsItsPreviousShape()
	{
		$this->assertSame('/map/3501/#/l=6301', Links::GetWorkMetricUrl(3501, 6301));
		$this->assertSame('/map/#/l=2!tb', Links::GetWorkMetricUrl(null, '2!tb'));
	}

	public function testRegionIdsAreJoinedWithCommas()
	{
		$this->assertSame('19166', McpMapRoute::JoinRegionIds([19166]));
		$this->assertSame('1,2,3', McpMapRoute::JoinRegionIds([1, '2', 3]));
		$this->assertSame('', McpMapRoute::JoinRegionIds([]));
	}
}
