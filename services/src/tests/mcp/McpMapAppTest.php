<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpMapApp;

class McpMapAppTest extends TestCase
{
	public function testHtmlResolvesItsPlaceholders()
	{
		$html = McpMapApp::BuildHtml();
		$this->assertStringNotContainsString('%HEIGHT%', $html);
		$this->assertStringNotContainsString('%PROTOCOL_VERSION%', $html);
		$this->assertStringContainsString("protocolVersion: '2026-01-26'", $html);
		$this->assertStringContainsString('var HEIGHT = 460;', $html);
	}

	public function testHtmlFollowsTheAppsHandshake()
	{
		$html = McpMapApp::BuildHtml();
		$this->assertStringContainsString("method: 'ui/initialize'", $html);
		$this->assertStringContainsString("'ui/notifications/initialized'", $html);
		$this->assertStringContainsString("'ui/notifications/tool-result'", $html);
		$this->assertStringContainsString('structuredContent', $html);
		$this->assertStringContainsString('ui/notifications/size-changed', $html);
	}

	public function testHtmlFallsBackToAnExternalLinkWhenTheHostBlocksTheViewer()
	{
		$html = McpMapApp::BuildHtml();
		$this->assertStringContainsString('hostCapabilities.sandbox.csp', $html);
		$this->assertStringContainsString("method: 'ui/open-link'", $html);
		$this->assertStringContainsString('El cliente no permite mostrar el mapa dentro de la conversación.', $html);
	}

	public function testReadDeclaresTheViewerAsFrameDomain()
	{
		$content = McpMapApp::Read('https://mapa.test:8000')['contents'][0];
		$this->assertSame('ui://poblaciones/mapa', $content['uri']);
		$this->assertSame('text/html;profile=mcp-app', $content['mimeType']);
		$this->assertSame(['https://mapa.test:8000'], $content['_meta']['ui']['csp']['frameDomains']);
		$this->assertSame(McpMapApp::BuildHtml(), $content['text']);
	}

	public function testStructuredContentOnlyCarriesTheLinks()
	{
		$source = ['mapUrl' => 'https://mapa.test/map/1/#/l=2', 'embedUrl' => 'https://mapa.test/map/1/?emb=1&co=1#/l=2', 'work' => 'No va'];
		$this->assertSame(['embedUrl' => 'https://mapa.test/map/1/?emb=1&co=1#/l=2', 'mapUrl' => 'https://mapa.test/map/1/#/l=2'],
			McpMapApp::BuildStructuredContent($source));
	}

	public function testToolMetaPointsToTheResourceInBothKeyShapes()
	{
		$meta = McpMapApp::GetToolMeta();
		$this->assertSame('ui://poblaciones/mapa', $meta['ui']['resourceUri']);
		$this->assertSame('ui://poblaciones/mapa', $meta['ui/resourceUri']);
	}

	public function testHiddenElementsStayHiddenWhateverTheirDisplayRule()
	{
		$this->assertStringContainsString('[hidden] { display: none !important; }', McpMapApp::BuildHtml());
	}

	public function testHtmlReportsItsSizeRightAfterTheHandshake()
	{
		$pattern = "/method: 'ui\\/notifications\\/initialized', params: \\{\\} \\}\\);\\s*reportSize\\(\\);/";
		$this->assertMatchesRegularExpression($pattern, McpMapApp::BuildHtml());
	}
}
