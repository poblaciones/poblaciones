<?php

namespace helena\services\mcp;

/**
 * Error esperable de una herramienta (argumento inválido, consulta no permitida).
 * El mensaje se devuelve al asistente, por lo que debe indicar cómo corregir el pedido.
 */
class McpToolException extends \Exception
{
}
