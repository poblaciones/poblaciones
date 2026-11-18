<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpRateLimiter;

class McpRateLimiterTest extends TestCase
{
	private string $file;

	protected function setUp(): void
	{
		$this->file = tempnam(sys_get_temp_dir(), 'mcp_calls_');
	}

	protected function tearDown(): void
	{
		unlink($this->file);
	}

	public function testRecognizesProtocolAndInternalPaths()
	{
		$this->assertTrue(McpRateLimiter::IsMcpPath('/mcp'));
		$this->assertTrue(McpRateLimiter::IsMcpPath('/mcp?x=1'));
		$this->assertTrue(McpRateLimiter::IsMcpPath('/services/mcp/summary?indicatorId=8'));
	}

	public function testIgnoresOtherPaths()
	{
		$this->assertFalse(McpRateLimiter::IsMcpPath('/mcpx'));
		$this->assertFalse(McpRateLimiter::IsMcpPath('/services/metrics/GetSummary'));
		$this->assertFalse(McpRateLimiter::IsMcpPath('/map/3501'));
		$this->assertFalse(McpRateLimiter::IsMcpPath('/'));
	}

	public function testRecognizesMcpHosts()
	{
		$this->assertTrue(McpRateLimiter::IsMcpHost('mcp.poblaciones.org'));
		$this->assertTrue(McpRateLimiter::IsMcpHost('MCP.Poblaciones.org'));
		$this->assertTrue(McpRateLimiter::IsMcpHost('mcp.localhost:8080'));
	}

	public function testIgnoresOtherHosts()
	{
		$this->assertFalse(McpRateLimiter::IsMcpHost('poblaciones.org'));
		$this->assertFalse(McpRateLimiter::IsMcpHost('next.poblaciones.org'));
		$this->assertFalse(McpRateLimiter::IsMcpHost('mcpx.poblaciones.org'));
		$this->assertFalse(McpRateLimiter::IsMcpHost('mcp.'));
		$this->assertFalse(McpRateLimiter::IsMcpHost('mcp'));
		$this->assertFalse(McpRateLimiter::IsMcpHost(''));
	}

	public function testEveryPathOfAnMcpHostIsAnMcpRequest()
	{
		$this->assertTrue(McpRateLimiter::IsMcpRequest('mcp.poblaciones.org', ''));
		$this->assertTrue(McpRateLimiter::IsMcpRequest('mcp.poblaciones.org', '/map/3501'));
		$this->assertTrue(McpRateLimiter::IsMcpRequest('poblaciones.org', '/mcp'));
		$this->assertFalse(McpRateLimiter::IsMcpRequest('poblaciones.org', ''));
	}

	public function testRootOfAnMcpHostSharesTheMcpController()
	{
		$this->assertTrue(McpRateLimiter::IsMcpRoot('mcp.poblaciones.org', ''));
		$this->assertTrue(McpRateLimiter::IsMcpRoot('mcp.poblaciones.org', '/'));
		$this->assertTrue(McpRateLimiter::IsMcpRoot('mcp.poblaciones.org', '/?x=1'));
		$this->assertFalse(McpRateLimiter::IsMcpRoot('mcp.poblaciones.org', '/mcp'));
		$this->assertFalse(McpRateLimiter::IsMcpRoot('mcp.poblaciones.org', '/map/3501'));
		$this->assertFalse(McpRateLimiter::IsMcpRoot('poblaciones.org', ''));
	}

	public function testCountsCallsWithinTheSameMinute()
	{
		$this->assertSame(1, McpRateLimiter::RegisterCall($this->file, 100));
		$this->assertSame(2, McpRateLimiter::RegisterCall($this->file, 100));
		$this->assertSame(3, McpRateLimiter::RegisterCall($this->file, 100));
	}

	public function testCounterRestartsOnANewMinute()
	{
		McpRateLimiter::RegisterCall($this->file, 100);
		McpRateLimiter::RegisterCall($this->file, 100);
		$this->assertSame(1, McpRateLimiter::RegisterCall($this->file, 101));
	}

	public function testParseCountIgnoresMalformedContent()
	{
		$this->assertSame(0, McpRateLimiter::ParseCount('', 5));
		$this->assertSame(0, McpRateLimiter::ParseCount('basura', 5));
		$this->assertSame(7, McpRateLimiter::ParseCount('5:7', 5));
		$this->assertSame(0, McpRateLimiter::ParseCount('4:7', 5));
	}
}
