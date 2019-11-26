<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Request;
use minga\framework\Params;
use minga\framework\Arr;
use minga\framework\Str;
use helena\classes\Session;
use helena\classes\Links;

use minga\framework\ErrorException;
use helena\services\frontend\WorkService;
use helena\services\common\MetadataService;
use helena\db\frontend\MetadataModel;


class cHandle extends cPublicController
{
	private $cleanRoute;

	public function Show()
	{
		$uri = Request::GetRequestURI(true);
		// Tiene las posibles estructura:
		// (A) /handle/workid/metricid/metricName
		//		 /handle/123/12/segregacion
		// (B) /handle/workid/metricid/regionid/regionName_metricName // Listado de 
		//		 /handle/123/12/1/provincias_segregacion
		// (C) /handle/workid/metricid/regionid/regionItemId/regionItemName_metricName
		//		 /handle/123/12/1/1012/catamarca_segregacion
		$parts = explode('/', $uri);
		array_shift($parts);
		if ($parts[0] !== 'handle') 
			throw new ErrorException("Ruta inválida.");
		array_shift($parts);
		$this->AddValue("debugParam", Params::Get("debug"));
		$workId = Params::CheckParseIntValue($parts[0]);
		if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

		$metricId = $this->GetMetricId($parts);
		$regionId = $this->GetRegionId($parts);
		$regionItemId = $this->GetRegionItemId($parts);
		$this->cleanRoute = Links::GetFullyQualifiedUrl(Links::GetWorkHandleUrl($workId, $metricId, $regionId, $regionItemId));
	
		if (Request::IsGoogle() || Params::Get("debug"))
		{
			if ($regionItemId !== null) 
				$this->ShowWorkMetricRegionItem($workId, $metricId, $regionId, $regionItemId);
			else if ($regionId !== null) 
				$this->ShowWorkMetricRegion($workId, $metricId, $regionId);
			else if ($metricId !== null)
				$this->ShowWorkMetric($workId, $metricId);		
			else 
				$this->ShowWork($workId);
			return $this->Render("handle.html.twig");		
		}
		else 
		{
			if ($regionItemId !== null) 
				return $this->RedirectWorkMetricRegionItem($workId, $metricId, $regionId, $regionItemId);
			else if ($regionId !== null) 
				return $this->RedirectWorkMetricRegion($workId, $metricId, $regionId);
			else if ($metricId !== null)
				return $this->RedirectWorkMetric($workId, $metricId);		
			else 
				return $this->RedirectWork($workId);		
		}
  }

	private function GetMetricId($parts)
	{
		if(sizeof($parts) >= 2)
			return Params::CheckParseIntValue($parts[1]);
		else
			return null;	
	}

	private function GetRegionId($parts)
	{
		if(sizeof($parts) >= 3)
			return Params::CheckParseIntValue($parts[2]);
		else
			return null;	
	}

	
	private function GetRegionItemId($parts)
	{
		if(sizeof($parts) >= 4)
			return Params::CheckParseIntValue($parts[3]);
		else
			return null;	
	}

	private function GetMetadata($work) 
	{
		$metadataId = $work->MetadataId;
		$model = new MetadataModel(false);
		return $model->GetMetadata($metadataId);
	}
	

	private function AddMetricLinks ($work) 
	{	
		$links = [];
		foreach($work->Metrics as $metric)
			$links[] = [ 'Id' => $metric['Id'], 
																	'UrlName' => $this->GetUrlName($this->PreppendMap($metric['Name'])), 
																	'Name' => $metric['Name']];
		$this->AddValue('links', $links);
	}

	private function GetUrlName($name)
	{
		$name = Str::RemoveAccents(Str::ToLower($name));
		$name = Str::Replace($name, " ", "_");
		$name = Str::Replace($name, ",", "_");
		$name = Str::Replace($name, "(", "_");
		$name = Str::Replace($name, ")", "_");
		$name = Str::Replace($name, ".", "_");
		$name = Str::Replace($name, "__", "_");
		$name = Str::Replace($name, "__", "_");
		$name = Str::Replace($name, "__", "_");
		if (Str::EndsWith($name, "_")) $name = substr($name, 0, strlen($name) - 1);
		return urlencode($name);
	}

	public function AddMetadata(&$metadata, $url)
	{
		if ($metadata['met_abstract'])
			$metadata['met_title'] = Str::Concat($metadata['met_title'], $metadata['met_abstract'], '. ');

		$this->AddValue('html_title', $metadata['met_title']);
		$map = [	'citation_title' => 'met_title', 
							'citation_publication_date' => 'met_online_since', 
							'citation_date' => 'met_online_since', 
							'citation_year' => 'met_online_since', 
							'citation_author' => 'met_authors', 
							'citation_journal_title' => 'Poblaciones', 
							'citation_pdf_url' => $url . '/metadata', 
							'citation_language' => 'met_title', 
							'citation_external_url' => $url, 
							'description' => 'met_abstract'];
		$tags = $this->MapTags($metadata, $map);

		$this->AddValue('metadata', $tags); 
		$this->AddValue('canonical', $this->cleanRoute); 
	}

	private function MapTags($values, $map)
	{
		$ret = [];
		foreach($map as $key => $value)
		{
			if (array_key_exists($value, $values))
				$val = $values[$value];
			else
				$val = $value;
			$ret[] = ['name' => $key, 'value' => $val];
		}
		return $ret;
	}
	
	private function ShowWork($workId)
	{
		$workService = new WorkService();
		$work = $workService->GetWork($workId);
		$metadata = $this->GetMetadata($work);
		
		//$metadata['met_title'] = $this->PreppendMap($metadata['met_title']);

		$this->AddMetadata($metadata, $work->Url);
		$this->AddMetricLinks($work);

		$this->AddValue("content", $metadata['met_title']);

		$this->AddValue("metadata_pdf", $work->Url . '/metadata');
	}

	private function PreppendMap($title) 
	{
		if (Str::StartsWith(Str::ToLower($title), "map") == false) 
			return "Mapa de " . $title;
		else 
			return $title;
	}

	private function ShowWorkMetric($workId, $metricId)
	{
		$workService = new WorkService();
		$work = $workService->GetWork($workId);
		$metadata = $this->GetMetadata($work);

		$workTitle = $metadata['met_title'];
		//$this->AddValue('source', $metadata['met_title']);
		$title = Arr::GetItemByNamedValue($work->Metrics, "Id", $metricId)['Name'];
		
		$title = $this->PreppendMap($title);
		$metadata['met_title'] = Str::Concat($title, $workTitle, '. ');

		$metadataService = new MetadataService();
		$metadataId = $work->MetadataId;

		$this->AddMetadata($metadata, $work->Url);
		
		$this->AddValue("content", $metadataService->GetMetadataPdf($metadataId, null, false, $workId, true, $metadata));
	}

	private function ShowWorkMetricRegion($workId, $metricId, $regionId)
	{
	}

	private function ShowWorkMetricRegionItem($workId, $metricId, $regionId, $regionItemId)
	{
	}

	private function RedirectWork($workId)
	{
		// http://localhost:8000/map/3701
		return $this->RedirectJs(Links::GetWorkUrl($workId));
	}

	private function RedirectWorkMetric($workId, $metricId)
	{
		// http://localhost:8000/map/3701/#/l=6201
		return $this->RedirectJs(Links::GetWorkMetricUrl($workId, $metricId));
	}

	private function RedirectWorkMetricRegion($workId, $metricId, $regionId)
	{
	}

	private function RedirectWorkMetricRegionItem($workId, $metricId, $regionId, $regionItemId)
	{
	}

	private function RedirectJs($url)
	{
		return "<html><body onload=\"document.location='" . $url . "';\"></body></html>";
	}
}
