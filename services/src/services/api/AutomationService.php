<?php

namespace helena\services\api;

use helena\classes\App;
use minga\framework\MessageBox;
use helena\services\common\BaseService;
use helena\db\frontend\DatasetModel;
use helena\db\frontend\WorkModel;
use minga\framework\Context;
use minga\framework\ErrorException;
use minga\framework\IO;
use minga\framework\Params;
use minga\framework\Str;
use minga\framework\System;
use minga\framework\Zip;
use minga\framework\FileBucket;
use helena\services\frontend\WorkService;
use helena\services\frontend\BoundaryService;
use helena\services\common\MetadataService;

class AutomationService extends BaseService
{
	private string $serverUrl;

	public function DownloadWorkDatasets($workId)
	{
        $dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$this->serverUrl = $dynamicServer->publicUrl;

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
			foreach($datasets as $dataset)
		    {
				$files[] = $this->downloadDataset($path, "s", $workId, $dataset['id']);
				if ($dataset['type'] == 'S') {
					$files[] = $this->downloadDataset($path, "cw", $workId, $dataset['id']);
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

        $baseUrl = $this->serverUrl . '/services/metadata';
		$referer = '';
        $cookieJar = tempnam(sys_get_temp_dir(), 'pob_cookies_');

        try {
            // ── Paso 1: iniciar la generación ─────────────────────────────────────
            $startUrl = $baseUrl . sprintf('/GetWorkMetadataPdf?w=%s&m=%s', $workId, $metadataId);

            $fileHeaders = [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'sec-ch-ua: "Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
                'sec-ch-ua-mobile: ?0',
                'sec-ch-ua-platform: "Windows"',
                'Upgrade-Insecure-Requests: 1',
            ];

            $destPath = $this->downloadFile($startUrl, $referer, $fileHeaders, $cookieJar, $destDir);

            return $destPath;

        } finally {
            if (file_exists($cookieJar)) {
                unlink($cookieJar);
            }
        }
    }

    function downloadDataset(
        string $path,
        string $type,
        int $workId,
        int $datasetId): string
	{
		$destDir = $path;

		$baseUrl = $this->serverUrl . '/services/download';
		$referer = '';
		$cookieJar = tempnam(sys_get_temp_dir(), 'pob_cookies_');

        // Cabeceras comunes que envía el navegador
        $commonHeaders = [
            'Accept: application/json, text/plain, */*',
            'sec-ch-ua: "Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
            'sec-ch-ua-mobile: ?0',
            'sec-ch-ua-platform: "Windows"',
        ];

        try {
            // ── Paso 1: iniciar la generación ─────────────────────────────────────
            $startUrl = $baseUrl . sprintf('/StartDatasetDownload?t=%s&d=%d&w=%d', $type, $datasetId, $workId);
            $response = $this->curlGet($startUrl, $referer, $commonHeaders, $cookieJar);
            $data = json_decode($response['body'], true);

            // Si el primer response ya dice done=true, saltamos el polling
            if (empty($data['done'])) {
				if (!isset($data['key'])) {
					throw new ErrorException("StartDatasetDownload no devolvió key. Body: " . $response['body']);
				}
				$key = $data['key'];
				// ── Paso 2: ejecutar pasos hasta done=true ────────────────────────────────
				$stepUrl = $baseUrl . sprintf('/StepDatasetDownload?k=%s', $key);

				do {
					$response = $this->curlGet($stepUrl, $referer, $commonHeaders, $cookieJar);
					$data = json_decode($response['body'], true);

					if ($data === null) {
						throw new ErrorException("Respuesta no-JSON en StepDatasetDownload: " . $response['body']);
					}

					$step = $data['step'] ?? '?';
					$totalSteps = $data['totalSteps'] ?? '?';

					if ($step !== '?' && $totalSteps !== '?' && (int) $step > (int) $totalSteps + 2) {
						// Guardia por si el server entra en un estado inesperado
						throw new ErrorException("Número de paso ($step) excede totalSteps ($totalSteps) — abortando (key=$key)");
					}

				} while (empty($data['done']));
			}

            // ── Paso 3: descargar el archivo ──────────────────────────────────────
            if (!is_dir($destDir) && !mkdir($destDir, 0755, true)) {
                throw new ErrorException("No se pudo crear el directorio destino: $destDir");
            }

            $fileUrl = $baseUrl . sprintf('/GetDatasetFile?t=%s&d=%d&w=%d', $type, $datasetId, $workId);

            // Necesitamos las cookies de sesión y seguir la redirección si la hay
            $fileHeaders = [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'sec-ch-ua: "Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
                'sec-ch-ua-mobile: ?0',
                'sec-ch-ua-platform: "Windows"',
                'Upgrade-Insecure-Requests: 1',
            ];

            $destPath = $this->downloadFile($fileUrl, $referer, $fileHeaders, $cookieJar, $destDir);

            return $destPath;

        } finally {
            if (file_exists($cookieJar)) {
                unlink($cookieJar);
            }
        }
    }


    // ── Helpers internos ──────────────────────────────────────────────────────────

    function curlGet(string $url, string $referer, array $headers, string $cookieJar): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_REFERER        => $referer,
            CURLOPT_COOKIEFILE     => $cookieJar,   // leer cookies
            CURLOPT_COOKIEJAR      => $cookieJar,   // guardar cookies
            CURLOPT_ENCODING       => '',            // acepta gzip automáticamente
            CURLOPT_TIMEOUT        => 300,
        ]);

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

		$body     = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new ErrorException("cURL error en $url: $error");
        }
        if ($httpCode >= 400) {
            throw new ErrorException("HTTP $httpCode en $url");
        }

        return ['body' => $body, 'httpCode' => $httpCode];
    }


    function downloadFile(string $url, string $referer, array $headers, string $cookieJar, string $destDir): string
    {
        // Primera llamada solo para obtener el Content-Disposition y determinar el nombre
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_REFERER        => $referer,
            CURLOPT_COOKIEFILE     => $cookieJar,
            CURLOPT_COOKIEJAR      => $cookieJar,
            CURLOPT_ENCODING       => '',
            CURLOPT_TIMEOUT        => 300,
            CURLOPT_HEADER         => true,   // incluir cabeceras en la respuesta
        ]);

		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

		$raw      = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new ErrorException("cURL error descargando archivo: $error");
        }
        if ($httpCode >= 400) {
            throw new ErrorException("HTTP $httpCode al descargar archivo");
        }

        $rawHeaders = substr($raw, 0, $headerSize);
        $body       = substr($raw, $headerSize);

        // Extraer nombre del archivo desde Content-Disposition
        $filename = $this->extractFilename($rawHeaders);
        if (!$filename) {
            $filename = 'dataset_' . time() . '.bin';
        }

        $destPath = rtrim($destDir, '/') . '/' . $filename;
        if (file_put_contents($destPath, $body) === false) {
            throw new ErrorException("No se pudo escribir el archivo en: $destPath");
        }

        return $destPath;
    }


    function extractFilename(string $headers): ?string
    {
        // Intenta primero el parámetro RFC 5987 (filename*=UTF-8''...)
        if (preg_match("/filename\*=UTF-8''([^\r\n;]+)/i", $headers, $m)) {
            return urldecode(trim($m[1]));
        }
        // Fallback al filename= clásico
        if (preg_match('/filename="?([^"\r\n;]+)"?/i', $headers, $m)) {
            return urldecode(trim($m[1], " \"'"));
        }
        return null;
    }
}

