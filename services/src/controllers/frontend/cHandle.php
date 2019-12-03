<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Request;
use minga\framework\Params;
use minga\framework\Arr;
use minga\framework\Str;
use helena\classes\Session;
use helena\classes\Links;

use helena\services\frontend\SelectedMetricService;
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
		// Al último le saca el posible sufijo textual
		$last = sizeof($parts) - 1;
		if (Str::Contains($parts[$last], "_"))
			 $parts[$last] = Str::EatFrom($parts[$last], "_");
		
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
																	'UrlName' => Str::CrawlerUrlEncode($metric['Name']), 
																	'Name' => $metric['Name']];
		$this->AddValue('links', $links);
	}

	public function AddMetadata(&$metadata, $url)
	{
		$this->AddValue('htmltitle', $metadata['met_title']);
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
		$metadata['met_title'] = $this->PreppendMap($metadata['met_title']);

		$this->AddMetadata($metadata, $work->Url);
		$this->AddMetricLinks($work);

		$items[] = ['Name' => $metadata['met_title'], 'Value' => $metadata['met_abstract']];
		$this->AddValue("items", $items);		
		
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
		$model = new MetadataModel();

		$items = [];
		$metadataId = $work->MetadataId;
		$sources = $model->GetMetadataSources($metadataId);
		//$dataset = $model->GetDatasetMetadata($datasetId);

		$metric = Arr::GetItemByNamedValue($work->Metrics, "Id", $metricId)['Name'];
		$metric = $this->PreppendMap($metric);

		$this->addInfo($metadata, $metric, $items);
		$this->addSources($sources, $items);
		$this->AddValue("items", $items);		

		$metadata['met_title'] = $metric;
		$this->AddMetadata($metadata, $work->Url);
		// Trae los niveles y variables...
		$selectedService = new SelectedMetricService();
		$selectedMetric = $selectedService->GetSelectedMetric($metricId);
		$variables = [];
		foreach($selectedMetric->Versions as $version)	
		{
			if ($version->Version->WorkId === $workId)
			{
				// Lo representa
				foreach($version->Levels as $level)	
				{
					foreach($level->Variables as $variable)	
					{
						$line = $variable->Name;
						$vals = "";
						foreach($variable->ValueLabels as $value)	
						{
							if ($vals != "") $vals .= ", ";
							$vals .= $value->Name;
						}
						$fullName = Str::Concat($line, $vals, ": ");
						$fullName .= " (" . $level->Name . ", " . $version->Version->Name . ")"; 
						$variables[] = $fullName;
					}
				}
			}
		}
		$this->AddValue("variables", $variables);		
	}

	private function addInfo($metadata, $metric, &$items) 
	{
		$items[] = ['Name' => $metric, 'Value' => ''];
		$workTitle = $metadata['met_title'];
		if (trim($metadata["met_abstract"]) === "") $metadata["met_abstract"] = '-';
		$tags = ["met_abstract" => $workTitle, "met_authors" => "Autores", "ins_caption" => "Institución", "con_person" => "Contacto"];
		foreach($tags as $tag => $label)
		{
			if (array_key_exists($tag, $metadata)) 
			{
				$val = $metadata[$tag];
				if ($val !== null && trim($val) !== '')
				{
					$items[] = ['Name' => $label, 'Value' => $val];
				}
			}
		}
	}

	private function addSources($sources, &$items) 
	{
		$n = sizeof($sources);
		if ($n == 0)
			return;
		$plural = ($n == 1 ? "" : "s");
		$caption = 'Fuente' . $plural;
		$val = '';

		for($i = 0; $i < $n; $i++)
		{
			$source = $sources[$i];
			$val = $source['src_caption'];
			$val = Str::Concat($val, $source['src_version'], ', ');
			$val = Str::Concat($val, $source['src_authors'], '. ');
			// Institución
			if ($source['ins_caption'] != '')
			{
				$val = Str::Concat($val, $source['ins_caption'], '. ');
			}
			$items[] = ['Name' => $caption, 'Value' => $val];
			$caption = '';
		}
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
