<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpProtocolLog;

class McpProtocolLogTest extends TestCase
{
	private string $file;

	protected function setUp(): void
	{
		$this->file = sys_get_temp_dir() . '/mcp_protocol_' . uniqid() . '.log';
	}

	protected function tearDown(): void
	{
		if (file_exists($this->file))
			unlink($this->file);
	}

	public function testBuildsOneLinePerRequest()
	{
		$line = McpProtocolLog::BuildLine(mktime(10, 30, 5, 11, 17, 2026), 200, 'tools/call show_map apps=si');
		$this->assertSame(date('Y-m-d H:i:s', mktime(10, 30, 5, 11, 17, 2026)) . " 200 tools/call show_map apps=si\n", $line);
	}

	public function testAppendsLines()
	{
		McpProtocolLog::Append($this->file, "uno\n");
		McpProtocolLog::Append($this->file, "dos\n");
		$this->assertSame("uno\ndos\n", file_get_contents($this->file));
	}

	public function testStartsANewFileWhenTheLimitIsExceeded()
	{
		file_put_contents($this->file, str_repeat('x', McpProtocolLog::MAX_BYTES + 1));
		McpProtocolLog::Append($this->file, "nuevo\n");
		$this->assertSame("nuevo\n", file_get_contents($this->file));
	}
}
