<?php

namespace helena\classes;

use minga\framework\CreativeCommons;
use minga\framework\AttributeEntity;
use minga\framework\Str;

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

		$friendlyName = $metadata['met_title'] . '.pdf';
		$type = 'application/pdf';

		$this->pdf = new PdfFile();

		$this->pdf->WriteHeading1($metadata['met_title']);
		$this->WriteValuePair("Título", 'met_title');
		if ($dataset != null)
			$this->WriteValuePair("Dataset", 'dat_caption');

		$this->WriteValuePair("Fecha de publicación", 'met_publication_date');
		if ($this->metadata['met_online_since_formatted'] !== '-')
			$this->WriteValuePair("Puesta online", 'met_online_since_formatted');

		if ($this->metadata['met_online_since'] !== $this->metadata['met_last_online'])
			$this->WriteValuePair("Última actualización", 'met_last_online_formatted');

		$this->WriteValuePair("Resumen", 'met_abstract');

		$this->WriteStableUrl();

		$this->WriteValuePair("Autores", 'met_authors');

		$this->WriteValuePair("Período", 'met_period_caption');
		$this->WriteValuePair("Frecuencia de actualización", 'met_frequency');
		$this->WriteValuePair("Cobertura", 'met_coverage_caption');

		$this->WriteValuePair("Detalle", 'met_abstract_long');

		$this->WriteContact();
		$this->WriteInstitution();

		$this->WriteSources();
		$this->WriteLicense();

		$this->WriteDataset();

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

		$this->pdf->WritePair("Dirección estable", Links::GetFullyQualifiedUrl($this->metadata['met_url']));
	}
	private function WriteSources()
	{
		$n = sizeof($this->sources);
		if ($n == 0)
			return;
		$plural = ($n == 1 ? "" : "s");
		if ($this->metadata['met_type'] === 'P')
			$this->pdf->WriteHeading4('Fuente' . $plural);
		else
			$this->pdf->WriteHeading4('Fuente' . $plural . ' secundaria' . $plural);

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
				//$this->pdf->WriteIndentedSpace();
				$this->pdf->WriteIndentedPair('Contacto', $source['con_person']);
				$this->pdf->WriteDoubleIndentedPair('Correo electrónico', $source['con_email']);
				$this->pdf->WriteDoubleIndentedPair('Teléfono', $source['con_phone']);
			}
			// Institución
			if ($source['ins_caption'] != '')
			{
				//$this->pdf->WriteIndentedSpace();
				$this->pdf->WriteIndentedPair('Institución', $source['ins_caption']);
				$this->pdf->WriteDoubleIndentedPair('Página web', $source['ins_web']);
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
		$this->WriteIndentedValuePair('Nombre', 'ins_caption');
		$this->WriteIndentedValuePair('Página web', 'ins_web');
		$this->pdf->WriteIndentedMail($this->metadata['ins_email']);
		$this->WriteIndentedValuePair('Teléfono', 'ins_phone');
		$this->WriteIndentedValuePair('Dirección', 'ins_address');
		$this->WriteIndentedValuePair('País', 'ins_country');
	}

	private function WriteDataset()
	{
		if ($this->dataset == null)
			return;
		$this->pdf->WriteHeading4('Variables');
		$this->pdf->WriteIndentedPairTitle('Nombre', 'Etiqueta');
		foreach($this->dataset['columns'] as $column)
		{
			$this->pdf->WriteIndentedPair($column['dco_variable'], $column['dco_label'], true, false);
			if (array_key_exists('values', $column) && $column['values'] != null)
			{
				foreach($column['values'] as $value)
					$this->pdf->WriteDoubleIndentedText($value['dla_value'] . ':' . $value['dla_caption']);
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
		$licenseText = CreativeCommons::GetLeyendByUrl($licenseUrl);
		$imageFile = CreativeCommons::GetLicenseImageSvgByUrl($licenseUrl);
		$this->pdf->AddImage('license', file_get_contents(Paths::GetResourcesPath() . $imageFile));
		$html = "<p style='font-size: 10pt; line-height: 1.4em'><a href='" . $licenseUrl . "'><img src='var:license' style='float: left; margin-right: 5pt'/></a>" .
									$licenseText . '</p>';
		$this->pdf->WriteIndentedText($html, false);
	}
}
