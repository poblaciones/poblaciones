<?php

namespace helena\classes;

use minga\framework\IO;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;


class ExportGrid
{
    private $formato;
    private $contenido;
    private $dataProcesada = [];

    public function __construct($format, $data)
	{
        $this->formato = $format;
        $this->contenido = $data;

        // Validar formato
        if (!in_array($this->formato, ['csv', 'xls'])) {
            throw new \Exception("Formato no soportado. Use 'csv', 'xls' o 'xlsx'.");
        }
    }

    private function Process() {
        $lines = explode("\n", $this->contenido);
        $this->dataProcesada = [];

        foreach ($lines as $line) {
            if (empty(trim($line))) continue;

            // Dividir la línea en campos
            $row = str_getcsv($line);

            // Reemplazar "undefined" por cadena vacía
            foreach ($row as &$field) {
                if ($field === "undefined") {
                    $field = "";
                }
            }

            $this->dataProcesada[] = $row;
        }

        return $this;
    }

    public function Export()
	{
        $this->Process();

        // Generar nombre de archivo único
		$rutaArchivo = IO::GetTempFilename();

        // Generar archivo según el formato
        if ($this->formato === 'csv') {
            return $this->generarCSV($rutaArchivo);
        } else {
            return $this->generarExcel($rutaArchivo);
        }
    }

    /**
     * Genera un archivo CSV
     *
     * @param string $rutaArchivo Ruta completa del archivo a generar
     * @return string Ruta del archivo generado
     */
    private function generarCSV($rutaArchivo) {
        $file = fopen($rutaArchivo, 'w');

        // Escribir datos en el archivo CSV
        foreach ($this->dataProcesada as $row) {
            fputcsv($file, $row);
        }

        fclose($file);
        return $rutaArchivo;
    }

    private function generarExcel($rutaArchivo) {

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Fila inicial
        $row = 1;

        foreach ($this->dataProcesada as $rowData) {
            $col = 1;
            foreach ($rowData as $cellValue) {
                // Convertir valores con coma a números decimales
                if (is_string($cellValue) && preg_match('/^\d+,\d+$/', $cellValue)) {
                    // Reemplazar coma por punto para formato decimal
                    $numericValue = str_replace(',', '.', $cellValue);
                   $sheet->setCellValueByColumnAndRow($col, $row, (float)$numericValue);
                } else {
                    $sheet->setCellValueByColumnAndRow($col, $row, $cellValue);
                }
                $col++;
            }
            $row++;
        }

        // Guardar el archivo
		$writer = new Xlsx($spreadsheet);
		$writer->save($rutaArchivo . ".xlsx");
        return $rutaArchivo;
    }
}