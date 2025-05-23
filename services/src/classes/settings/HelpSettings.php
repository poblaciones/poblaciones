<?php

namespace helena\classes\settings;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Request;
use minga\framework\Context;

class HelpSettings
{
	public $ContactLink = ['Caption' => 'Contacto', 'Url' => 'https://poblaciones.org/contacto/'];
	public $TutorialsLink = ['Caption' => 'Tutoriales', 'Url' => 'https://www.youtube.com/@poblaciones/playlists'];
	public $ReadGuideLink = ['Caption' => 'Guía para la consulta de información', 'Url' => 'https://poblaciones.org/guias/guia-para-la-consulta-de-informacion.pdf'];
	public $UploadGuideLink = ['Caption' => 'Guía para la creación de mapas', 'Url' => 'https://poblaciones.org/guias/guia-para-la-creacion-de-mapas.pdf'];
	public $AboutLink = ['Caption' => 'Acerca de Poblaciones', 'Url' => 'https://poblaciones.org/institucional'];

	// Secciones de ayuda
	public $CatografiesSection = ['Caption' => 'Cartografías', 'Url' => 'Cartografías'];
	public $VisibilitySection = ['Caption' => 'Visibilidad', 'Url' => 'Visibilidad'];
	public $PermissionsSection = ['Caption' => 'Permisos', 'Url' => 'Permisos'];
	public $CustomizeSection = ['Caption' => 'Personalizar', 'Url' => 'Personalizar'];
	public $MetadataSection = ['Caption' => 'Metadatos', 'Url' => 'Información de metadatos'];
	public $NewDatasetSection = ['Caption' => 'Nuevo dataset', 'Url' => 'Datasets'];

	public $MetadataContentSection = ['Caption' => 'Contenido', 'Url' => 'Contenido'];
	public $MetadataAttributionSection = ['Caption' => 'Atribución', 'Url' => 'Atribución'];
	public $MetadataInstitutionsSection = ['Caption' => 'Instituciones', 'Url' => 'Instituciones'];
	public $MetadataAbstractSection = ['Caption' => 'Resumen', 'Url' => 'Resumen'];
	public $MetadataSourcesSection = ['Caption' => 'Fuentes secundarias', 'Url' => 'Fuentes secundarias'];
	public $MetadataAttachmentsSection = ['Caption' => 'Adjuntos', 'Url' => 'Adjuntos'];

	public $DatasetMetricsSection = ['Caption' => 'Indicadores', 'Url' => 'Indicadores'];
	public $DatasetGeoreferenceSection = ['Caption' => 'Georreferenciación', 'Url' => 'Georreferenciación'];
	public $DatasetImportSection = ['Caption' => 'Importación', 'Url' => 'Importar datos'];
	public $DatasetDataSection = ['Caption' => 'Datos', 'Url' => 'DatasetData'];
	public $DatasetVariablesSection = null; // ['Caption' => 'Variables', 'Url' => 'Variables'];
	public $DatasetIdentitySection = ['Caption' => 'Identificación', 'Url' => 'Identificación'];
	public $DatasetMultilevelSection = ['Caption' => 'Estructura Multinivel', 'Url' => 'Agregar niveles (multinivel)'];

}
