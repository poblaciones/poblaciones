<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Request;
use minga\framework\Params;
use minga\framework\Arr;
use minga\framework\Context;
use minga\framework\Str;
use helena\classes\Session;
use helena\classes\Links;
use helena\entities\frontend\geometries\Envelope;
use helena\services\frontend\SelectedMetricService;
use minga\framework\ErrorException;
use helena\services\frontend\WorkService;
use helena\db\frontend\ClippingRegionItemModel;
use minga\framework\Profiling;
use minga\framework\Performance;
use helena\caches\WorkHandlesCache;

use helena\db\frontend\MetadataModel;


class cHandle extends cPublicController
{
	private $cleanRoute;
	private $cleanRouteBase;

	public function Show()
	{
		Performance::SetController('handle', 'get', true);

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
		$regionItemId = $this->GetRegionItemId($parts);
		$this->cleanRoute = Links::GetFullyQualifiedUrl(Links::GetWorkHandleUrl($workId, $metricId, $regionItemId));
		$this->cleanRouteBase = Links::GetFullyQualifiedUrl(Links::GetWorkHandleUrl($workId, $metricId, null));

		if (Request::IsGoogle() || Params::Get("debug"))
		{
			if ($metricId !== null)
			{
				$this->ShowWorkMetric($workId, $metricId, $regionItemId);
			}
			else
				$this->ShowWork($workId);

			if (Params::Get("debug"))
				$this->AddValue("selfNavigateLink", $this->cleanRoute);

			return $this->Render("handle.html.twig");
		}
		else
		{
			if ($metricId !== null)
				return $this->RedirectWorkMetric($workId, $metricId, $regionItemId);
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

	private function GetRegionItemId($parts)
	{
		if(sizeof($parts) >= 3)
			return Params::CheckParseIntValue($parts[2]);
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
		$this->AddValue('canonical_base', $this->cleanRouteBase);
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

		$this->AddValue('handleTitle', $metadata['met_title']);

		$items[] = ['Name' => 'Resumen', 'Value' => $metadata['met_abstract']];
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

	private function ShowWorkMetric($workId, $metricId, $regionId)
	{
		$workService = new WorkService();
		$work = $workService->GetWork($workId);
		$metadata = $this->GetMetadata($work);

		$model = new MetadataModel();

		$items = [];
		$metadataId = $work->MetadataId;
		$sources = $model->GetMetadataSources($metadataId);
		$metricName = Arr::GetItemByNamedValue($work->Metrics, "Id", $metricId)['Name'];
		//$metric = $this->PreppendMap($metricName);
		$metric = $metricName;

		$this->AddInfo($metadata, $metric, $items);
		$this->AddSources($sources, $items);
		$this->AddValue("items", $items);
		$this->AddMetadata($metadata, $work->Url);
		$this->AddVariables($workId, $metricId, $outDatasetTables);
		$metadata['met_title'] = $metric;

		if ($regionId != null)
		{
			$model = new ClippingRegionItemModel();
			$clippingRegionItem = $model->GetClippingRegionItem($regionId, true);
			$this->AddValue("clippingRegionItem", $clippingRegionItem['Name']);
			$this->AddValue("clippingRegion", $clippingRegionItem['Type']);
			$this->AddValueIfNotNull("parentCaption", $clippingRegionItem['parentCaption']);
			$this->AddValueIfNotNull("grandParentCaption", $clippingRegionItem['grandParentCaption']);
		}
		if ($metadata['Extents'] !== null && Session::IsWorkPublicSegmentedCrawled($workId))
		{
			$extents = Envelope::FromDb($metadata['Extents']);
			$this->AddRegions($workId, $metricId, $outDatasetTables, $metricName, $extents, $regionId);
		}
	}

	private function AddRegions($workId, $metricId, $datasetTables, $metricName, $extents, $regionId)
	{
		// Lo busca en el caché
		$key = WorkHandlesCache::CreateKey($metricId, $regionId);

		$data = null;
		if (!WorkHandlesCache::Cache()->HasData($workId, $key, $data))
		{
			$data = $this->CalculateRegionData($metricId, $datasetTables, $metricName, $extents, $regionId);
			// Lo agrega al caché...
			WorkHandlesCache::Cache()->PutData($workId, $key, $data);
		}
		$this->AddValue("metricUrlName", Str::CrawlerUrlEncode($metricName));
		$this->AddValue("regions", $data);
	}

	private function CalculateRegionData($metricId, $datasetTables, $metricName, $extents, $regionId)
	{
		Profiling::BeginTimer();

		$model = new ClippingRegionItemModel();
		$clippingRegionItemIds = $model->GetCrawlerItemsIntersectingEnvelope($metricId, $datasetTables, $extents, $regionId);
		// Si no tiene regionId, se queda con los que no tienen padre en la lista
		if ($regionId == null)
		{
			$idDictionary = [];
			foreach($clippingRegionItemIds as $clippingRegionItem)
				$idDictionary[] = $clippingRegionItem['Id'];
			//asort($idDictionary);
			// recorre viendo cuáles no tienen el padre en la lista
			$newList = [];
			foreach($clippingRegionItemIds as $clippingRegionItem)
				//if (!Arr::BinarySearchContains($idDictionary, $clippingRegionItem['cli_parent_id']))
				if (! in_array($clippingRegionItem['cli_parent_id'], $idDictionary))
				{
					$newList[] = $clippingRegionItem;
				}
			$clippingRegionItemIds = $newList;
		}
		foreach($clippingRegionItemIds as &$clippingRegionItem)
		{
			$clippingRegionItem['UrlName'] = Str::CrawlerUrlEncode($clippingRegionItem['Name']);
		}
		$data = Arr::FromSortedToKeyed($clippingRegionItemIds, 'clr_caption');
		Profiling::EndTimer();
		return $data;
	}
	private function AddVariables($workId, $metricId, &$outDatasetTables)
	{
		$outDatasetTables = [];
		// Trae los niveles y variables...
		$selectedService = new SelectedMetricService();
		$selectedMetric = $selectedService->GetSelectedMetric($metricId);
		$variables = [];
		foreach($selectedMetric->Versions as $version)
		{
			if ($version->Version->WorkId === $workId)
			{
				$maxGeography = 0;
				$maxTable = '';
				foreach($version->Levels as $level)
				{
					// el version lo tiene que acompañar (para lo de regiones) del
					// geographyId su level más bajo
					if ($level->GeographyId > $maxGeography)
					{
						$maxTable = $level->Dataset->Table . "_snapshot";
						$maxGeography = $level->GeographyId;
					}
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
				if ($maxTable != '' && !in_array($maxTable, $outDatasetTables))
						$outDatasetTables[] = $maxTable;
			}
		}
		$this->AddValue("variables", $variables);
	}

	private function AddInfo($metadata, $metric, &$items)
	{
		$this->AddValue("handleTitle", $metric);

		$workTitle = $metadata['met_title'];
		if (trim($metadata["met_abstract"]) === "") $metadata["met_abstract"] = '-';
		$tags = ["met_abstract" => $workTitle, "met_authors" => "Autores", "ins_caption" => "Institución"];
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

	private function AddSources($sources, &$items)
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

	private function RedirectWork($workId)
	{
		// http://localhost:8000/map/3701
		return $this->RedirectJs(Links::GetWorkUrl($workId));
	}

	private function RedirectWorkMetric($workId, $metricId, $regionItemId)
	{
		// http://localhost:8000/map/3501/#/l=6301&!r19166
		return $this->RedirectJs(Links::GetWorkMetricUrl($workId, $metricId, $regionItemId));
	}


	private function RedirectJs($url)
	{
		return "<html><body onload=\"document.location='" . $url . "';\"></body></html>";
	}
}
