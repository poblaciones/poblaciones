<?php

namespace helena\services\api;

use helena\classes\App;
use minga\framework\MessageBox;
use helena\services\common\BaseService;
use helena\db\frontend\DatasetModel;
use helena\db\frontend\WorkModel;
use minga\framework\Context;
use helena\services\frontend as frontendServices;
use minga\framework\ErrorException;
use minga\framework\IO;
use minga\framework\Params;
use minga\framework\Str;
use helena\services\common\DatasetDownloadManager;
use minga\framework\Zip;
use minga\framework\FileBucket;
use helena\services\common\MetadataService;

class AutomationService extends BaseService
{
	private string $serverUrl;

	public function DownloadWorkDatasets($workId)
	{
        try
		{
			$bucket = FileBucket::Create();
			$path = $bucket->GetBucketFolder();
			$wm = new WorkModel();
			$work = $wm->GetWork($workId);
			$metadataId = $work['met_id'];
			$ws = new DatasetModel();
			$datasets = $ws->GetDatasetsByWorkId($workId);

			$files = [];
			$partitionValues = [null];
			foreach($datasets as $dataset)
		    {
				if ($dataset['dat_partition_mandatory'] && $dataset['dat_partition_column_id'])
				{
					$columnId = $dataset['dat_partition_column_id'];
					$sql = "SELECT dla_value FROM dataset_column_value_label
											WHERE dla_dataset_column_id = ? ORDER BY dla_order, dla_id ";
					$partitionValues = App::Db()->fetchAllColumn($sql, [$columnId]);
				}
				foreach ($partitionValues as $partition)
				{
					$files[] = $this->downloadDataset($path, "s", $workId, $dataset['id'], $partition);
					if ($dataset['type'] == 'S') {
						$files[] = $this->downloadDataset($path, "cw", $workId, $dataset['id'], $partition);
					}
				}
			}
			// Agrega los metadatos
            $files[] = $this->downloadWorkMetadata($path, $workId, $metadataId);
			$files[] = $this->getMetadataInfo($path, $workId, $metadataId);
            // Zipea los archivos
			$filenameZip = IO::GetTempFilename() . ".zip";
			$zip = new Zip($filenameZip);
			$zip->AppendFilesToZip($path, "");
            // Libera
			$bucket->Delete();
            // Devuelve
			return App::StreamFile($filenameZip, 'work-' . $workId . ".zip");
		}
		catch(\Exception $e)
		{
			return $this->ProcessError($e);
		}
	}


    function getMetadataInfo(
        string $path,
        int $workId, int $metadataId): string
	{
        $ms = new MetadataService();
		$res = $ms->GetMetadataInfo($metadataId, $workId);
        // reemplaza los keys con prefijo...
		$res = $this->fixMetadataValues($res);
        // devuelve
        $filename = $path . '/metadata.json';
        IO::WriteJson($filename, $res);
        return $filename;
	}

    /**
     * Transforma un array aplicando las siguientes reglas:
     * - Claves que empiezan con "con_" → reemplazar por "contact_"
     * - Claves que empiezan con "ins_" → reemplazar por "institution_"
     * - Claves que empiezan con "met_" → eliminar el prefijo "met_"
     * - Claves que empiezan con "msc_" → eliminar la entrada completa
     * - Claves que empiezan con "src_" → eliminar el prefijo "src_"
     * - Claves que empiezan con "wrk_" → reemplazar por "work_"
     * - Cualquier clave (después de los reemplazos) que termine en "_id" → eliminar la entrada
     *
     * @param array $data Array a transformar
     * @return array Array transformado
     */
    function fixMetadataValues(array $data): array
    {
        $resultado = [];

        foreach ($data as $clave => $valor)
		{
            // 1. Eliminar entradas que empiecen con "msc_" (sin ningún otro procesamiento)
			if (!Str::StartsWith($clave, 'msc_') && ! Str::EndsWith($clave, '_id'))
			{
				// 2. Aplicar reemplazos de prefijos
				$nuevaClave = $clave;
				if (Str::StartsWith($clave, 'con_')) {
					$nuevaClave = 'contact_' . substr($clave, 4);
				} elseif (Str::StartsWith($clave, 'ins_')) {
					$nuevaClave = 'institution_' . substr($clave, 4);
				} elseif (Str::StartsWith($clave, 'met_')) {
					$nuevaClave = substr($clave, 4);
				} elseif (Str::StartsWith($clave, 'src_')) {
					$nuevaClave = substr($clave, 4);
				} elseif (Str::StartsWith($clave, 'wrk_')) {
					$nuevaClave = 'work_' . substr($clave, 4);
				}
				// 3. Procesar recursivamente el valor si es un array
				$nuevoValor = is_array($valor) ? $this->fixMetadataValues($valor) : $valor;

				$resultado[$nuevaClave] = $nuevoValor;
			}
        }
        return $resultado;
    }

    function downloadWorkMetadata(
        string $path,
        int $workId, int $metadataId): string
	{
		$destDir = $path;
		$friendlyName = "";
		$controller = new MetadataService();
		//Session::$AccessLink = $link;
		$file = $controller->GetMetadataPdfFile($metadataId, null, false, $workId, $friendlyName);
		IO::Copy($file, $path . "/metadatos.pdf");
		return "metadatos.pdf";
	}

    function downloadDataset(
        string $path,
        string $type,
        int $workId,
        int $datasetId,
		?string $partition): string
	{
        $destDir = $path;

		$controller = new frontendServices\DownloadDatasetService(false);
		// ── Paso 1: iniciar la generación ─────────────────────────────────────
	    $data = $controller->CreateMultiRequestFile($type, $datasetId, null, [], null, null, $partition);
        // Si el primer response ya dice done=true, saltamos el polling
        if (empty($data['done'])) {
			if (!isset($data['key'])) {
				throw new ErrorException("StartDatasetDownload no devolvió key. Body: " . $response['body']);
			}
			$key = $data['key'];
			// ── Paso 2: ejecutar pasos hasta done=true ────────────────────────────────
			do {
				$data = $controller->StepMultiRequestFile($key);
				$step = $data['step'];
				$totalSteps = $data['totalSteps'];

				if ((int) $step > (int) $totalSteps + 2) {
					throw new ErrorException("Número de paso ($step) excede totalSteps ($totalSteps) — abortando (key=$key)");
				}

			} while (empty($data['done']));
		}
        // ── Paso 3: descargar el archivo ──────────────────────────────────────
        if (!is_dir($destDir) && !mkdir($destDir, 0755, true)) {
            throw new ErrorException("No se pudo crear el directorio destino: $destDir");
        }

		$file = DatasetDownloadManager::GetFile($type, $datasetId, null, [], null, null, $partition, false);
		$filename = DatasetDownloadManager::GetFileName($datasetId, [], null, null, $partition, $type, false);
		IO::Copy($file, $destDir . "/" . $filename);
		return $filename;
    }
}

