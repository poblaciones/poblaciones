<?php

namespace helena\classes;

use minga\framework\CreativeCommons;
use minga\framework\AttributeEntity;
use minga\framework\Str;
use helena\classes\Image;
use helena\entities\frontend\geometries\Envelope;
use helena\services\backoffice\InstitutionService;

class PdfCreator
{
	private $pdf;
	private $metadata;
	private $sources;
	private $dataset;

	public function CreateMetadataPdf($metadata, $sources, $dataset = null)
	{
		$this->metadata = $metadata;
		$this->sources = $sources;
		$this->dataset = $dataset;

		$this->pdf = new PdfFile();

		if ($dataset != null)
		{
			$this->pdf->WriteMainTitle($dataset['dat_caption']);
			$this->WriteValuePair("Cartografía", 'met_title');
		}
		else
		{
			$this->pdf->WriteMainTitle($metadata['met_title']);
			$this->WriteValuePair("Título", 'met_title');
		}
		if ($this->metadata['met_online_since_formatted'] !== '-')
			$this->WriteValuePair("Fecha de publicación", 'met_online_since_formatted');

		if ($this->metadata['met_online_since'] !== $this->metadata['met_last_online'])
			$this->WriteValuePair("Última actualización", 'met_last_online_formatted');

		$this->WriteValuePair("Resumen", 'met_abstract');

		$this->WriteStableUrl();

		$this->WriteValuePair("Autores", 'met_authors');

		$this->WriteValuePair("Período", 'met_period_caption');
		$this->WriteValuePair("Frecuencia de actualización", 'met_frequency');
		$this->WriteValuePair("Cobertura", 'met_coverage_caption');

		if (array_key_exists('Extents', $this->metadata) && $this->metadata['Extents'])
		{
			$env = Envelope::FromDb($this->metadata['Extents']);
			$this->pdf->WritePair("Extensión geográfica", $env->ToFormattedString());
		}
		$this->WriteValuePair("Detalle", 'met_abstract_long');

		$this->WriteContact();
		$this->WriteInstitution();

		$this->WriteSources();

		$this->WriteDataset();

		$this->WriteLicense();

		$filename = $this->pdf->Save();

		return $filename;
	}
	private function ResolveValue($text)
	{
		if (array_key_exists($text, $this->metadata) == false)
			return $this->dataset[$text];
		else
			return $this->metadata[$text];
	}
	private function WriteValuePair($label, $text)
	{
		$value = $this->ResolveValue($text);
		if (trim($value) === "")
			return;
		$this->pdf->WritePair($label, $value);
	}
	private function HasValue($text)
	{
		$value = $this->ResolveValue($text);
		return trim($value) !== "";
	}
	private function WriteIndentedValuePair($label, $text)
	{
		$value = $this->ResolveValue($text);
		if (trim($value) === "")
			return;
		$this->pdf->WriteIndentedPair($label, $value);
	}

	private function GetStatusCaption()
	{
		switch($this->metadata['met_status'])
		{
			case 'C':
				return 'Completo';
			case 'P':
				return 'Parcial';
			case 'B':
				return 'Borrador';
			default:
				return '';
		}
	}
	private function WriteStableUrl()
	{
		$value = $this->metadata['met_url'];
		if ($value == null)
			return;
		$extra = $this->metadata['wrk_access_link'];
		if ($extra) $value .= '/' . $extra;
		$this->pdf->WritePair("Dirección", Links::GetFullyQualifiedUrl($value));
	}
	private function WriteSources()
	{
		$n = sizeof($this->sources);
		if ($n == 0)
			return;
		$plural = ($n == 1 ? "" : "s");
		$this->pdf->WriteHeading4('Fuente' . $plural);

		for($i = 0; $i < $n; $i++)
		{
			$isFirst = ($i == 0);
			$source = $this->sources[$i];
			if (!$isFirst) $this->pdf->WriteIndentedSeparator();
			$this->pdf->WriteIndentedPair('Nombre', $source['src_caption']);
			$this->pdf->WriteIndentedPair('Versión', $source['src_version']);
			$this->pdf->WriteIndentedPair('Autores', $source['src_authors']);
			$this->pdf->WriteIndentedPairLink('Página web', $source['src_web']);
			if ($source['src_wiki'] != '')
				$this->pdf->WriteIndentedPairLink('Wikipedia', $source['src_wiki']);
			if ($source['con_person'] != '')
			{
				$this->pdf->WriteIndentedPair('Contacto', $source['con_person']);
				$this->pdf->WriteDoubleIndentedMail($source['con_email']);
				$this->pdf->WriteDoubleIndentedPair('Teléfono', $source['con_phone']);
			}
			// Institución
			if ($source['ins_caption'] != '')
			{
				//$this->pdf->WriteIndentedSpace();
				$this->pdf->WriteIndentedText('Institución');
				if ($source['ins_watermark_id'] != ''){
					$controller = new InstitutionService();
					$dataURL = $controller->GetInstitutionWatermark($source['ins_watermark_id'], false);
					$html = "<img src='" .$dataURL . "' height='40' />";
					$this->pdf->WriteDoubleIndentedText($html, false);
				}
				$this->pdf->WriteDoubleIndentedPair('Nombre', $source['ins_caption']);
				$this->pdf->WriteDoubleIndentedPairLink('Página web', $source['ins_web']);
				$this->pdf->WriteDoubleIndentedMail($source['ins_email']);
				$this->pdf->WriteDoubleIndentedPair('Teléfono', $source['ins_phone']);
				$this->pdf->WriteDoubleIndentedPair('Dirección', $source['ins_address']);
				$this->pdf->WriteDoubleIndentedPair('País', $source['ins_country']);
			}
		}
	}


	private function WriteContact()
	{
		if (!$this->HasValue('con_person') &&  !$this->HasValue('con_email') &&
			 !$this->HasValue('con_phone'))
			return;

		$this->pdf->WriteHeading4('Contacto');
		$this->WriteIndentedValuePair('Nombre', 'con_person');
		$this->pdf->WriteIndentedMail($this->metadata['con_email']);
		$this->WriteIndentedValuePair('Teléfono', 'con_phone');

	}
	private function WriteInstitution()
	{
		if ($this->metadata['ins_caption'] == '')
			return;
		$this->pdf->WriteHeading4('Institución');
		if ($this->metadata['ins_watermark_id'] != ''){
			$controller = new InstitutionService();
			$file = $controller->GetInstitutionWatermarkFile($this->metadata['ins_watermark_id'], false);
			Image::ResizeToMaxSize($file, null, InstitutionService::MAX_WATERMARK_HEIGHT);
			$this->pdf->AddImage('institution', file_get_contents($file));
			$html = "<img src='var:institution' height='50' />";
			$this->pdf->WriteDoubleIndentedText($html, false);
		}
		$this->WriteIndentedValuePair('Nombre', 'ins_caption');
		$this->pdf->WriteIndentedPairLink('Página web', $this->metadata['ins_web']);
		$this->pdf->WriteIndentedMail($this->metadata['ins_email']);
		$this->WriteIndentedValuePair('Teléfono', 'ins_phone');
		$this->WriteIndentedValuePair('Dirección', 'ins_address');
		$this->WriteIndentedValuePair('País', 'ins_country');
	}

	private function WriteDataset()
	{
		if ($this->dataset == null)
			return;

		$this->WriteDatasetColumns();
		$this->WriteDatasetMetrics();
	}

	private function WriteDatasetColumns()
	{
		$this->pdf->WriteHeading4('Variables');
		$this->pdf->WriteIndentedPairTitle('Nombre', 'Etiqueta');
		foreach($this->dataset['columns'] as $column)
		{
			$label = $column['dco_label'];
			if ($label === null || trim($label) === '') {
				$label = '-';
			}
			$this->pdf->WriteIndentedPair($column['dco_variable'], $label, true, true);
			if (array_key_exists('values', $column) && $column['values'] != null)
			{
				foreach($column['values'] as $value)
					$this->pdf->WriteDoubleIndentedText($value['dla_value'] . ':' . $value['dla_caption']);
			}
		}
	}

	private function WriteDatasetMetrics()
	{
		$this->pdf->WriteHeading4('Indicadores');
		$lastMetric = null;
		foreach($this->dataset['metricsVersions'] as $_ => $variables)
		{
			$metricCaption = $variables[0]['mtr_caption'];
			if ($metricCaption !== $lastMetric)
			{
				$this->pdf->WriteIndentedPairTitle('Nombre:', $metricCaption);
				$lastMetric = $metricCaption;
			}
			$this->pdf->WriteIndentedPair('Versión', $variables[0]['mvr_caption']);
			$this->pdf->WriteIndentedText('Variables');
			$isFirst = true;
			foreach($variables as $variable)
			{
				if (!$isFirst)
					$this->pdf->WriteExtraIndentedSpace();
				else
					$isFirst = false;

				$this->pdf->WriteExtraIndentedPair('Nombre', $variable['mvv_caption']);
				$this->pdf->WriteExtraIndentedPair('Fórmula', $variable['mvv_formula']);

				$this->pdf->WriteExtraIndentedPair('Leyenda', $variable['mvv_legend']);

				if (array_key_exists('values', $variable) && $variable['values'] != null)
				{
					$valuesBlock = '';
					foreach($variable['values'] as $value)
					{
						$color = $value['vvl_fill_color'];
						if ($color !== null && $color !== '')
						{
							if (Str::StartsWith($color, "fffff"))
								// círculo vacío
								$valuesBlock .= "<span style='color: #d0d0d0" . $color . "'>&#x25cb;</span> ";
							else
								// círculo pleno
								$valuesBlock .= "<span style='color: #" . $color . "'>&#x25cf;</span> ";
						}
						$valuesBlock .= $this->pdf->HtmlEncode($value['vvl_caption']) . '<br>';
					}
					$this->pdf->WriteExtraIndentedPair('Categorías', $valuesBlock, false);
				}
			}
		}
	}

	private function WriteLicense()
	{
		if ($this->metadata['met_license'] == '')
			return;

		$ele = new AttributeEntity();
		$ele->attributes = json_decode($this->metadata['met_license'], true);
		$licenseUrl = CreativeCommons::ResolveUrl($ele);

		$this->pdf->WriteHeading4('Licencia');
		$licenseText = CreativeCommons::GetLegendByUrl($licenseUrl);
		$imageFile = CreativeCommons::GetLicenseImageSvgByUrl($licenseUrl);
		$this->pdf->AddImage('license', file_get_contents(Paths::GetResourcesPath() . $imageFile));
		$html = "<p style='font-size: 10pt; line-height: 1.4em'><a href='" . $licenseUrl . "'><img src='var:license' style='float: left; margin-right: 5pt'/></a>" .
									$licenseText . '</p>';
		$this->pdf->WriteIndentedText($html, false);
	}
}
