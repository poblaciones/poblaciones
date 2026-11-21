<?php

namespace helena\classes\settings;

/**
 * Ajustes del servidor MCP. Se accede con App::Settings()->Mcp().
 * Todos los valores tienen un valor seguro por omisión y se asignan en config/settings.php.
 */
class McpSettings
{
	public bool $Enabled = false;

	public array $AllowedOrigins = ['https://claude.ai', 'https://claude.com'];

	public int $MaxResponseChars = 100000;

	public int $DefaultRows = 200;

	public int $MaxRows = 1000;

	public int $MaxListableRows = 20000;

	public int $MaxDefaultColumns = 40;

	public int $InlineBoundaryItemsLimit = 800;

	public array $ListingRestrictedGeographyIds = [];

	public int $MaxCallsPerMinute = 600;
}
