<?php

namespace helena\entities\admin;

use helena\entities\BaseMapModelLabeled;
use minga\framework\Str;

class Metadata extends BaseMapModelLabeled
{
	public $Id;
	public $Name;
	public $PublicationDate;
	public $PublicationYear;
	public $Abstract;
	public $Status;
	public $Authors;
	public $Coverage;
	public $Period;
	public $Frequency;
	public $GroupId;
	public $Theme;
	public $License;
	public $Type;
	public $AbstractLong;
	public $Language = 'es; Español';
	public $Encoding;
	public $Projection;
	public $Url;
	public $Create;
	public $Update;
	public $ScheduleNextUpdate;
	// Calculadas
	public $LicenseType = 1;
	public $LicenseOpen = 'always';
	public $LicenseCommercial = 1;
	public $LicenseVersion = '4.0/deed.es';

	// Colecciones
	public $Metrics;
	// Objetos
	public $Institution;
	public $Contact;
	public $SourceId;
	public $InstitutionId;
	public $ContactId;

	function __construct()
	{
		$this->Institution = new Institution();
		$this->Contact = new Contact();
	}
	public function FillMetadata($row)
	{
		$this->Fill($row);
		if ($this->License != null && Str::StartsWith($this->License, '{'))
		{
			$license = json_decode($this->License, true);
			$this->LicenseType = $license['licenseType'];
			$this->LicenseOpen = $license['licenseOpen'];
			$this->LicenseCommercial = $license['licenseCommercial'];
			$this->LicenseVersion = $license['licenseVersion'];
		}

		if ($row['con_id'] != null)
		{
			$this->Contact->Fill($row);
		}
		if ($row['ins_id'] != null)
		{
			$this->Institution->Fill($row);
		}
	}
	public function FillMetadataFromParams()
	{
		$this->FillFromParams();
		if ($this->InstitutionId === '') $this->InstitutionId = null;

		$license = array();
		$license['licenseType'] = $this->LicenseType;
		$license['licenseOpen'] = $this->LicenseOpen;
		$license['licenseCommercial'] = $this->LicenseCommercial;
		$license['licenseVersion'] = $this->LicenseVersion;
		$this->License = json_encode($license);

		$this->Contact->FillFromParams('Contact');
		$this->Institution->FillFromParams('Institution');
	}

	public static function GetMapLabeled()
	{
		return array (
						array('met_id', 'Id'),
						array('met_title', 'Name', 'Nombre'),
						array('met_publication_date', 'PublicationDate', 'Fecha de publicación'),
						array('met_abstract', 'Abstract', 'Resúmen'),
						array('met_status', 'Status', 'Estado'),
						array('met_authors', 'Authors', 'Autores'),
						array('met_coverage_caption', 'Coverage', 'Cobertura'),
						array('met_period_caption', 'Period', 'Período'),

						array('', 'Contact', '#CONTACT#Punto de Contacto de la Geografía'),
						array('', 'Institution', '#INSTITUTION#Institución'),

						array('met_frequency', 'Frequency', 'Frecuencia de mantenimiento'),
						array('met_group_id', 'GroupId'),
						array('', 'Theme', 'Tema'),
						array('met_license', 'License', 'Licencia'),
						array('met_type', 'Type', 'Tipo'),
						array('met_abstract_long', 'AbstractLong', 'Descripción'),
						array('met_language', 'Language', 'Lenguaje', 'spa, Español'),
						array('', 'Encoding', 'Conjunto de caracteres', 'UTF-8'),
						array('', 'Projection', 'Proyección', 'Mercator. EPSG:4326'),
						array('met_url', 'Url', 'Ruta estable'),
						array('met_contact_id', 'ContactId'),
						array('met_institution_id', 'InstitutionId'),
						array('met_schedule_next_update', 'ScheduleNextUpdate'),
						array('met_create', 'Create'),
						array('met_update', 'Update'));
	}
}


