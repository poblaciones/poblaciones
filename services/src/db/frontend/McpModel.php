<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\ErrorException;
use minga\framework\Profiling;

/**
 * Única consulta propia del conector MCP. El resto de los datos se obtiene de los servicios
 * y modelos existentes, para que las reglas de negocio vivan en un solo lugar.
 */
class McpModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = '';
		$this->idField = '';
		$this->captionField = '';
	}

	/**
	 * Cantidad de filas de la tabla de snapshot de un nivel. Permite rechazar un listado
	 * demasiado grande antes de leerlo.
	 */
	public function CountSnapshotRows(string $snapshotTable, ?int $partition): int
	{
		if (preg_match('/^[A-Za-z0-9_]+$/', $snapshotTable) !== 1)
			throw new ErrorException('Nombre de tabla inválido.');
		Profiling::BeginTimer();
		$sql = "SELECT COUNT(*) FROM " . $snapshotTable;
		if ($partition !== null)
			$sql .= " WHERE sna_partition = " . intval($partition);
		$ret = App::Db()->fetchScalarInt($sql);
		Profiling::EndTimer();
		return $ret;
	}
}
