<?php

namespace helena\services\mcp;

/**
 * Aplicación de MCP Apps que muestra el visor de Poblaciones dentro de la conversación.
 *
 * Es un recurso ui:// con una página mínima, sin dependencias, que recibe el resultado de la herramienta
 * (structuredContent.embedUrl) y lo carga en un iframe del visor. El cliente la aloja en su propio iframe aislado,
 * de modo que el origen del visor debe declararse en csp.frameDomains. El cliente informa en ui/initialize qué orígenes
 * permite realmente (hostCapabilities.sandbox.csp.frameDomains): si no cubren el visor, la página no intenta
 * incrustarlo y ofrece abrir el mapa en una pestaña (ui/open-link). No depende del framework.
 */
class McpMapApp
{
	const URI = 'ui://poblaciones/mapa';

	const MIME_TYPE = 'text/html;profile=mcp-app';

	const PROTOCOL_VERSION = '2026-01-26';

	const MAP_HEIGHT = 460;

	const EXTENSION_ID = 'io.modelcontextprotocol/ui';

	/**
	 * Declaración que asocia una herramienta con la aplicación. Además de la forma vigente (ui.resourceUri) lleva la
	 * clave plana ui/resourceUri, que algunos clientes todavía leen y que las bibliotecas oficiales también emiten.
	 */
	public static function GetToolMeta(): array
	{
		return ['ui' => ['resourceUri' => self::URI], 'ui/resourceUri' => self::URI];
	}

	public static function GetResourceDescription(): array
	{
		return [
			'uri' => self::URI,
			'name' => 'mapa_poblaciones',
			'title' => 'Mapa de Poblaciones',
			'description' => 'Visor de Poblaciones con el indicador, la serie, el nivel y las regiones consultados.',
			'mimeType' => self::MIME_TYPE
		];
	}

	public static function Read(string $viewerOrigin): array
	{
		return ['contents' => [[
			'uri' => self::URI,
			'mimeType' => self::MIME_TYPE,
			'text' => self::BuildHtml(),
			'_meta' => ['ui' => ['csp' => ['frameDomains' => [$viewerOrigin]], 'prefersBorder' => true]]
		]]];
	}

	/**
	 * Datos para la aplicación; el cliente no los agrega al contexto del modelo.
	 */
	public static function BuildStructuredContent(array $source): array
	{
		return ['embedUrl' => $source['embedUrl'], 'mapUrl' => $source['mapUrl']];
	}

	public static function BuildHtml(): string
	{
		$html = <<<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
[hidden] { display: none !important; }
html, body { margin: 0; padding: 0; background: transparent; font-family: system-ui, sans-serif; font-size: 14px; }
#estado { padding: 12px; color: #606060; }
#mapa { display: block; width: 100%; height: %HEIGHT%px; border: 0; }
#acciones { padding: 8px 12px; }
#abrir { font: inherit; padding: 6px 12px; cursor: pointer; }
#direccion { display: block; margin-top: 6px; color: #606060; word-break: break-all; user-select: all; }
</style>
</head>
<body>
<div id="estado">Cargando el mapa…</div>
<iframe id="mapa" title="Mapa de Poblaciones" hidden></iframe>
<div id="acciones" hidden>
<button id="abrir" type="button">Abrir el mapa en una pestaña nueva</button>
<span id="direccion"></span>
</div>
<script>
(function () {
	var HEIGHT = %HEIGHT%;
	var INITIALIZE_ID = 1;
	var OPEN_LINK_ID = 2;
	var APP_INFO = { name: 'poblaciones-mapa', version: '1.0.0' };
	var frame = document.getElementById('mapa');
	var status = document.getElementById('estado');
	var actions = document.getElementById('acciones');
	var openButton = document.getElementById('abrir');
	var addressLabel = document.getElementById('direccion');
	var allowedFrameDomains = null;
	var mapUrl = null;

	function send(message) {
		message.jsonrpc = '2.0';
		window.parent.postMessage(message, '*');
	}

	function reportSize() {
		window.requestAnimationFrame(function () {
			send({
				method: 'ui/notifications/size-changed',
				params: { width: document.documentElement.clientWidth, height: document.documentElement.scrollHeight }
			});
		});
	}

	function showMessage(text) {
		status.textContent = text;
		status.hidden = false;
		frame.hidden = true;
		actions.hidden = true;
		reportSize();
	}

	function showOpenLink(text) {
		status.textContent = text;
		status.hidden = false;
		frame.hidden = true;
		actions.hidden = false;
		addressLabel.textContent = mapUrl;
		reportSize();
	}

	function showMap(url) {
		status.hidden = true;
		frame.hidden = false;
		frame.style.height = HEIGHT + 'px';
		frame.src = url;
		actions.hidden = false;
		addressLabel.textContent = '';
		reportSize();
	}

	function readOrigin(url) {
		var match = /^(https?:\/\/[^\/?#]+)/i.exec(url);
		if (match) {
			return match[1].toLowerCase();
		}
		return null;
	}

	function entryCoversOrigin(entry, origin) {
		var normalized = String(entry).toLowerCase();
		if (normalized === origin) {
			return true;
		}
		var wildcard = normalized.indexOf('://*.');
		if (wildcard < 0) {
			return false;
		}
		var scheme = normalized.substring(0, wildcard + 3);
		var suffix = normalized.substring(wildcard + 4);
		return origin.indexOf(scheme) === 0 && origin.length > suffix.length + scheme.length
			&& origin.substring(origin.length - suffix.length) === suffix;
	}

	function isOriginAllowed(origin) {
		if (allowedFrameDomains === null) {
			return true;
		}
		for (var i = 0; i < allowedFrameDomains.length; i++) {
			if (entryCoversOrigin(allowedFrameDomains[i], origin)) {
				return true;
			}
		}
		return false;
	}

	function readAllowedFrameDomains(result) {
		allowedFrameDomains = null;
		if (result && result.hostCapabilities && result.hostCapabilities.sandbox && result.hostCapabilities.sandbox.csp) {
			var list = result.hostCapabilities.sandbox.csp.frameDomains;
			if (Array.isArray(list)) {
				allowedFrameDomains = list;
			}
		}
	}

	function handleToolResult(result) {
		var data = null;
		if (result) {
			data = result.structuredContent;
		}
		if (!data || typeof data.embedUrl !== 'string') {
			showMessage('Esta consulta no tiene un mapa asociado.');
			return;
		}
		mapUrl = data.mapUrl;
		if (typeof mapUrl !== 'string') {
			mapUrl = data.embedUrl;
		}
		var origin = readOrigin(data.embedUrl);
		if (origin !== null && isOriginAllowed(origin)) {
			showMap(data.embedUrl);
		} else {
			showOpenLink('El cliente no permite mostrar el mapa dentro de la conversación.');
		}
	}

	openButton.addEventListener('click', function () {
		if (mapUrl !== null) {
			send({ id: OPEN_LINK_ID, method: 'ui/open-link', params: { url: mapUrl } });
		}
	});

	window.addEventListener('message', function (event) {
		var message = event.data;
		if (event.source !== window.parent || !message || message.jsonrpc !== '2.0') {
			return;
		}
		if (message.method === undefined) {
			if (message.id === INITIALIZE_ID) {
				readAllowedFrameDomains(message.result);
				send({ method: 'ui/notifications/initialized', params: {} });
				reportSize();
			}
			if (message.id === OPEN_LINK_ID && message.error) {
				addressLabel.textContent = mapUrl;
			}
			return;
		}
		if (message.method === 'ui/notifications/tool-result') {
			handleToolResult(message.params);
			return;
		}
		if (message.id !== undefined) {
			send({ id: message.id, result: {} });
		}
	});

	send({
		id: INITIALIZE_ID,
		method: 'ui/initialize',
		params: {
			protocolVersion: '%PROTOCOL_VERSION%',
			appInfo: APP_INFO,
			appCapabilities: {},
			clientInfo: APP_INFO,
			capabilities: {}
		}
	});
})();
</script>
</body>
</html>
HTML;
		return str_replace(['%HEIGHT%', '%PROTOCOL_VERSION%'], [strval(self::MAP_HEIGHT), self::PROTOCOL_VERSION], $html);
	}
}
