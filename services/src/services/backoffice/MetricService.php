<?php

namespace helena\services\backoffice;

use helena\classes\App;

use helena\classes\Session;
use helena\classes\GlobalTimer;
use helena\services\common\BaseService;
use helena\caches\DatasetColumnCache;
use helena\services\backoffice\metrics\MetricsManager;
use helena\entities\backoffice as entities;
use minga\framework\ErrorException;
use minga\framework\Serializator;
use minga\framework\Date;

use minga\framework\MessageException;
use helena\services\backoffice\publish\WorkFlags;
use minga\framework\Profiling;


class MetricService extends BaseService
{
	public function GetNewMetricVersionLevel()
	{
		$level = new entities\DraftMetricVersionLevel();
		$version = new entities\DraftMetricVersion();
		$version->setMultilevel(false);
		$metric = new entities\DraftMetric();
		$level->setMetricVersion($version);
		$version->setCaption(Date::CurrentYear());
		$version->setMetric($metric);
		return $level;
	}

	public function GetNewVariable()
	{
		$variable = new entities\DraftVariable();
		$variable->Values = array();
		$variable->setNormalizationScale(100);
		$variable->setIsDefault(false);
		$variable->setDefaultMeasure('N');

		$symbology = new entities\DraftSymbology();
		$symbology->setCategories(4);
		$symbology->setCutMode('S');
		$symbology->setPaletteType('P');
		$symbology->setRainbow(2);
		$symbology->setOpacity(null);
		$symbology->setRainbowReverse(false);
		$symbology->setShowEmptyCategories(true);
		$symbology->setColorFrom('0ce800');
		$symbology->setColorTo('fb0000');
		$symbology->setRound(5);
		$symbology->setPattern(0);
		$symbology->setNullCategory(true);
		$symbology->setShowValues(false);
		$symbology->setShowLabels(false);
		$symbology->setShowTotals(true);

		$variable->setSymbology($symbology);
		return $variable;
	}

	public function MoveVariableUp($datasetId, $variableId)
	{
		$variable = $this->LoadAndValidate($datasetId, $variableId);
		// Obtiene el anterior
		$previousVariableId = App::Db()->fetchScalar("SELECT mvv_id FROM draft_variable WHERE mvv_metric_version_level_id = ? AND mvv_order < ? ORDER BY mvv_order DESC LIMIT 1", array($variable->getMetricVersionLevel()->getId(), $variable->getOrder()));
		$variableAlter = App::Orm()->find(entities\DraftVariable::class, $previousVariableId);
		if ($variableAlter === null)
			return self::OK;
		$this->SwapOrders($variable, $variableAlter);
		// Listo
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		WorkFlags::SetDatasetLabelsChanged($dataset->getWork()->getId());
		return self::OK;
	}

	public function MoveVariableDown($datasetId, $variableId)
	{
		$variable = $this->LoadAndValidate($datasetId, $variableId);
		// Obtiene el siguiente
		$nextVariableId = App::Db()->fetchScalar("SELECT mvv_id FROM draft_variable WHERE mvv_metric_version_level_id = ? AND mvv_order > ? ORDER BY mvv_order ASC LIMIT 1", array($variable->getMetricVersionLevel()->getId(), $variable->getOrder()));
		$variableAlter = App::Orm()->find(entities\DraftVariable::class, $nextVariableId);
		if ($variableAlter === null)
			return self::OK;
		$this->SwapOrders($variable, $variableAlter);
		// Listo
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		WorkFlags::SetDatasetLabelsChanged($dataset->getWork()->getId());
		return self::OK;
	}

	private function SwapOrders($variable, $variableAlter)
	{
		// Actualiza
		$order1 = $variableAlter->getOrder();
		$order2 = $variable->getOrder();
		// Pone negativo para respetar el índice
		$variable->setOrder(-1 - $order1);
		App::Orm()->save($variable);
		// Actualiza los valores
		$variableAlter->setOrder($order2);
		App::Orm()->save($variableAlter);
		$variable->setOrder($order1);
		App::Orm()->save($variable);
	}
	private function LoadAndValidate($datasetId, $variableId)
	{
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$variable = App::Orm()->find(entities\DraftVariable::class, $variableId);
		if ($variable->getMetricVersionLevel()->getDataset() !== $dataset)
			throw new ErrorException('Invalid variable.');
		return $variable;
	}

	public function GetAllMetricGroups()
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findAll(entities\MetricGroup::class, 'Order');
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetricVersionLevelVariables($workId, $metricVersionLevelId)
	{
		$manager = new MetricsManager();
		return $manager->GetMetricVersionLevelVariables($workId, $metricVersionLevelId);
	}

	public function GetDatasetMetricVersionLevels($datasetId)
	{
		$manager = new MetricsManager();
		return $manager->GetDatasetMetricVersionLevels($datasetId);
	}
	public function GetWorkMetricVersions($workId)
	{
		$manager = new MetricsManager();
		return $manager->GetWorkMetricVersions($workId);
	}

	public function GetColumnDistributions($datasetId, $dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale)
	{
		Profiling::BeginTimer();
		$data = null;
		$from = 1;
		$to = 10;
		$key = DatasetColumnCache::CreateKey($dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale, $from, $to);

		if (DatasetColumnCache::Cache()->HasData($datasetId, $data) === false)
		{
			$metricsManager = new MetricsManager();
			$data = $metricsManager->GetColumnDistributions($datasetId, $dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale, $from, $to);
			if ($data == null)
				return null;
			DatasetColumnCache::Cache()->PutData($datasetId, $key, $data);
			$data->EllapsedMs = GlobalTimer::EllapsedMs();
		}
		else
		{
			$data = $this->GotFromCache($data);
		}
		Profiling::EndTimer();
		return $data;
	}


	public function GetCartographyMetrics()
	{
		// Calcula las métricas en que el usuario actual puede agregar versiones
		if (Session::IsMegaUser()) {
			// Le ofrece todas
			return $this->GetAllMetricByType('R');
		}
		else
		{
			// No es administrador, sólo se basa en lo que tiene permitido
			$carto = $this->GetAllowedByType('R');
			$public = $this->GetAllowedByType('P');
			return array_merge($carto, $public);
		}
	}
	public function GetPublicMetrics()
	{
		// Calcula las métricas en que el usuario actual puede agregar versiones
		if (Session::IsSiteEditor()) {
			// Le ofrece todas
			return $this->GetAllMetricByType('P');
		}
		else
		{
			// No es editor, sólo se basa en lo que tiene permitido
			return $this->GetAllowedByType('P');
		}
	}
	private function VersionsSubselect()
	{
		return "(SELECT GROUP_CONCAT(DISTINCT mvr_caption ORDER BY mvr_caption ASC SEPARATOR '\t')
													FROM draft_metric_version
													WHERE mvr_metric_id = mtr_id) Versions";
	}
	private function GetAllMetricByType($type)
	{
		Profiling::BeginTimer();
		$sql = "SELECT mtr_id Id, mtr_caption Caption, mtr_metric_group_id GroupId,
									" . $this->VersionsSubselect() . "
									FROM draft_metric WHERE
									EXISTS(SELECT 1 FROM draft_metric_version JOIN draft_work
									ON wrk_id = mvr_work_id WHERE mvr_metric_id = mtr_id AND wrk_type = ?)
									ORDER BY mtr_caption";
		$ret = App::Db()->fetchAll($sql, array($type));
		$this->SplitVersions($ret);
		Profiling::EndTimer();
		return $ret;
	}

	private function GetAllowedByType($type)
	{
		Profiling::BeginTimer();
		$sql = "SELECT mt1.mtr_id Id, mt1.mtr_caption Caption, mt1.mtr_metric_group_id GroupId,
									" . $this->VersionsSubselect() . "
											FROM draft_work_permission
											JOIN draft_work ON wrk_id = wkp_work_id
											JOIN draft_metric_version ON wrk_id = mvr_work_id
											JOIN draft_metric mt1 ON mvr_metric_id = mt1.mtr_id
											WHERE wkp_user_id = ? AND wkp_permission IN ('A', 'E')
											AND wrk_type = ?
									GROUP BY mt1.mtr_id, mt1.mtr_caption, mt1.mtr_metric_group_id
									HAVING COUNT(DISTINCT wrk_id) = (SELECT COUNT(DISTINCT mv2.mvr_work_id)
																FROM draft_metric mt2
																JOIN draft_metric_version mv2 ON mv2.mvr_metric_id = mt2.mtr_id
																WHERE mt2.mtr_id = mt1.mtr_id)
									ORDER BY mt1.mtr_caption";
		$userId = Session::GetCurrentUser()->GetUserId();
		$ret = App::Db()->fetchAll($sql, array($userId, $type));
		$this->SplitVersions($ret);
		Profiling::EndTimer();
		return $ret;
	}

	private function SplitVersions(&$arr)
	{
		foreach($arr as &$item)
		{
			if ($item['Versions'] !== null)
				$item['Versions'] = explode("\t", $item['Versions']);
		}
	}

	public function UpdateMetricVersionLevel($datasetId, $level)
	{
		Profiling::BeginTimer();
		$metricVersion = $level->getMetricVersion();
		$this->ValidateUpdate($metricVersion);

		$metric = $metricVersion->getMetric();
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$this->SaveMetricLevel($dataset, $level, $metric, $metricVersion);

		WorkFlags::SetMetricDataChanged($dataset->getWork()->getId());

		Profiling::EndTimer();
		// Devuelve ids de los levels que actualizó
		return array('LevelId' => $level->getId(),
									'MetricVersionId' => $level->getMetricVersion()->getId(),
									'MetricId' => $level->getMetricVersion()->getMetric()->getId());
	}

	public function UpdateVariable($datasetId, $level, $variable)
	{
		Profiling::BeginTimer();

		$variableConnected = App::Orm()->Reconnect(entities\DraftVariable::class, $variable);

		if ($variableConnected->getMetricVersionLevel() === null) {
				$variableConnected->setMetricVersionLevel($level);
		}
		$level = $variableConnected->getMetricVersionLevel();

		// Graba el symbology
		App::Orm()->save($variableConnected->getSymbology());
		// Resuelve el order...
		$this->SetDefaultOrder($level, $variableConnected);
		// Graba variable
		App::Orm()->save($variableConnected);
		// Se fija si afecta el default de otras
		if ($variableConnected->getIsDefault())
		{
			App::Db()->exec("UPDATE draft_variable SET mvv_is_default = 0 WHERE mvv_metric_version_level_id = ? AND mvv_id != ?",
						array($level->getId(), $variableConnected->getId()));
		}
		// Graba valores
		$this->SaveValues($variable, $variableConnected);
		// Marca work
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		WorkFlags::SetMetricDataChanged($dataset->getWork()->getId());
		// Listo
		Profiling::EndTimer();
		return array('VariableId' => $variableConnected->getId(), 'Order' => $variableConnected->getOrder());
	}

	public function DeleteVariable($datasetId, $levelId, $variableId)
	{
		Profiling::BeginTimer();
		$variable = App::Orm()->find(entities\DraftVariable::class, $variableId);
		$level = $variable->getMetricVersionLevel();
		if ($levelId !== $level->getId() ||
				$datasetId !== $level->getDataset()->getId()) {
				throw new \ErrorException('Invalid dataset.');
		}
		// Borra valores
		$this->ClearValues($variable->getId());
		// Borra variable
		$symbologyId = $variable->getSymbology()->getId();
		App::Orm()->delete($variable);
		// Borra el symbology
		App::Db()->exec("DELETE FROM draft_symbology WHERE vsy_id = ? AND NOT EXISTS(
										SELECT * FROM draft_variable WHERE mvv_symbology_id = ?)", array($symbologyId, $symbologyId));
		// Marca work
		WorkFlags::SetMetricDataChanged($level->getDataset()->getWork()->getId());
		// Listo
		Profiling::EndTimer();
		return self::OK;
	}

	public function DeleteMetricVersionLevel($datasetId, $levelId)
	{
		Profiling::BeginTimer();
		$level = App::Orm()->find(entities\DraftMetricVersionLevel::class, $levelId);
		if ($datasetId !== $level->getDataset()->getId()) {
				throw new \ErrorException('Invalid dataset.');
		}
		$variables = App::Orm()->findManyByProperty(entities\DraftVariable::class,
													'MetricVersionLevel.Id', $levelId);
		foreach($variables as $variable)
		{
			$this->DeleteVariable($datasetId, $levelId, $variable->getId());
		}
		// Borra level
		App::Orm()->delete($level);
		// Marca work
		WorkFlags::SetMetricDataChanged($level->getDataset()->getWork()->getId());
		// Listo
		Profiling::EndTimer();
		return self::OK;
	}

	private function SetDefaultOrder($level, $variableConnected)
	{
		Profiling::BeginTimer();
		if ($variableConnected->getId() === null || $variableConnected->getId() === 0) {
			$maxSql = "SELECT MAX(mvv_order) + 1 FROM draft_variable WHERE mvv_metric_version_level_id = ?";
			$maxOrder = null;
			if ($level !== null)
				$maxOrder = App::Db()->fetchScalarInt($maxSql, array($level->getId()));
			if ($maxOrder === null) $maxOrder = 1;
			$variableConnected->setOrder($maxOrder);
		}
		Profiling::EndTimer();
	}
	private function ClearValues($variableId)
	{
		if ($variableId) {
			$delete = "DELETE FROM draft_variable_value_label WHERE vvl_variable_id = ?";
			App::Db()->exec($delete, array($variableId));
		}
	}
	private function SaveValues($variable, $variableConnected)
	{
		Profiling::BeginTimer();
		if (method_exists($variable, 'getId'))
			$this->ClearValues($variable->getId());
		else
			$this->ClearValues($variable->Id);

		if (property_exists($variable, 'Values'))
		{
			foreach($variable->Values as $value)
			{
				$valueOrm = App::Orm()->Rebuild(entities\DraftVariableValueLabel::class, $value);
				$valueOrm->setVariable($variableConnected);
				App::Orm()->save($valueOrm);
			}
		}
		Profiling::EndTimer();
	}

	private function SaveMetricLevel($dataset, $metricVersionLevel, $metric, $metricVersion)
	{
		// Resuelve metric
		App::Orm()->save($metric);

		$this->saveMetricVersion($dataset, $metricVersionLevel, $metric, $metricVersion);

		// Graba el level
		if ($metricVersionLevel->getId() === null || $metricVersionLevel->getId() === 0)
		{
			$metricVersionLevel->setDataset($dataset);
	}
		App::Orm()->save($metricVersionLevel);
		Profiling::EndTimer();
	}

	private function saveMetricVersion($dataset, $level, $metric, $metricVersion)
	{
		Profiling::BeginTimer();
		$metricVersion->setCaption(trim($metricVersion->getCaption()));
		// Resuelve metricVersion
		// Si no tiene Id...
		if ($metricVersion->getId() === null || $metricVersion->getId() === 0)
		{
			// Se fija si hay otro con ese nombre
			$existingVersion = App::Orm()->findByProperties(entities\DraftMetricVersion::class,
								 array('Metric.Id' => $metric->getId(), 'Caption' => $metricVersion->getCaption()));
			if ($existingVersion === null)
			{
				$metricVersion->setWork($dataset->getWork());

				App::Orm()->save($metricVersion);
			}
			else
			{
				$this->ValidateVersionAppend($dataset, $existingVersion);
				// Lo agrega
				$level->setMetricVersion($existingVersion);
			}
		}
		else
		{
			// Si ya existía, se fija si cambió la descripción
			$sql = "SELECT mvr_caption caption, (SELECT COUNT(*) FROM draft_metric_version_level WHERE mvl_metric_version_id = mvr_id AND mvl_id <> ?) levels
									FROM draft_metric_version WHERE mvr_id = ?";
			$versionInfo = App::Db()->fetchAssoc($sql, array($level->getId(), $metricVersion->getId()));
			if (strcasecmp($versionInfo['caption'], $metricVersion->getCaption()) !== 0)
			{
				if ($versionInfo['levels'] !== 0 && !$metricVersion->getMultilevel())
				{
					// Si no es único y no está sincronizando, clona
					$metricVersion->setId(null);
				}
				App::Orm()->save($metricVersion);
			}
		}
		Profiling::EndTimer();
	}

	private function ValidateVersionAppend($dataset, $existingVersion)
	{
		// Si es de otro work, sale
		if ($existingVersion->getWork()->getId() !== $dataset->getWork()->getId())
		{
			throw new MessageException("No es posible agregar a este indicador una versión '" .
						$existingVersion->getCaption() . "' debido a que otra obra ya define esa versión para el indicador.");
		}
		// Se fija de qué MultiLevelMatrix son las versiones que ya existen
		$existingLevels = App::Orm()->findManyByProperty(entities\DraftMetricVersionLevel::class,
							'MetricVersion.Id', $existingVersion->getId());
		foreach($existingLevels as $existingLevel)
		{
			if ($existingLevel->getDataset()->getMultilevelMatrix() !== $dataset()->getMultilevelMatrix())
			{
				throw new MessageException("No es posible agregar a un nivel a la versión '" .
						$existingVersion->getCaption() . "' debido a que ya tiene niveles en datasets que no están vinculados al dataset
									actual. Para poder agregar niveles debe primero vincular los datasets desde la solapa 'Multinivel'.
									\n\nSi lo que desea hacer es agregar una nueva versión, debe elegir nombre de versión
												que no se encuentre ya en uso.");
			}
		}
	}

	private function ValidateUpdate($metricVersion)
	{
		$caption = $metricVersion->getCaption();
		if ($caption === null || trim($caption) === "") {
			throw new ErrorException('La Versión no puede ser nula.');
		}
	}
	private function varName($variable)
	{
		return ($variable !== null ? $variable->Variable : '');
	}
	private function GetMatchingVariable($sourceLevels, $targetLevel, $targetVariable)
	{
		$data = $targetVariable->Data;
		$dataColumnName = $this->varName($targetVariable->DataColumn);
		$normalization = $targetVariable->Normalization;
		$normalizationColumnName = $this->varName($targetVariable->NormalizationColumn);

		foreach($sourceLevels as $sourceLevel)
		{
			if ($sourceLevel->MetricVersion->Metric->Id === $targetLevel->MetricVersion->Metric->Id)
			{
				foreach($sourceLevel->Variables as $variable)
				{
					$matchData = ($variable->Data === $data) && ($data !== 'O' || $this->varName($variable->DataColumn) === $dataColumnName);
					$matchNormalization = ($variable->Normalization === $normalization) && ($normalization !== 'O' || $this->varName($variable->NormalizationColumn) === $normalizationColumnName);
					if ($matchData && $matchNormalization)
						return $variable;
				}
			}
		}
		return null;
	}
	public function GetRelatedDatasets($datasetId)
	{
		// Utiliza los metrics para determinar qué datasets comparten indicadores con el dataset indicado.
		$dql = "SELECT dr FROM e:DraftDataset dr JOIN dr.Work wr JOIN wr.Metadata mr JOIN e:DraftMetricVersionLevel lr WITH lr.Dataset = dr JOIN
														lr.MetricVersion vr JOIN vr.Metric m JOIN e:DraftMetricVersion v WITH v.Metric = m
														JOIN e:DraftMetricVersionLevel l WITH l.MetricVersion = v JOIN l.Dataset d
														WHERE d.Id = :p1 ORDER BY mr.Title DESC, dr.Caption";
		$datasets = App::Orm()->findManyByQuery($dql, array($datasetId));
		$ret = array();
		foreach($datasets as $dataset)
		{
			$item = App::Orm()->Disconnect($dataset);
			$item->Work = App::Orm()->Disconnect($dataset->getWork());
			$ret[] = $item;
		}
		return $ret;
	}
	public function LevelDatasetMetrics($srcDatasetId, $targetDatasetId)
	{
		// Toma los puntos de corte de un dataset y se los pone a otro, emparentando
		// las variables de los levels existentes por Data, Normalization y Metric.
		$sourceLevels = $this->GetDatasetMetricVersionLevels($srcDatasetId);
		$targetLevels = $this->GetDatasetMetricVersionLevels($targetDatasetId);
		$ret = 0;
		foreach($targetLevels as $targetLevel)
		{
			$targetLevelConnected = App::Orm()->Reconnect(entities\DraftMetricVersionLevel::class, $targetLevel);
			foreach($targetLevel->Variables as $targetVariable)
			{
				// Se fija si la tiene
				$sourceVariable = $this->GetMatchingVariable($sourceLevels, $targetLevel, $targetVariable);
				if ($sourceVariable !== null)
				{
					// Copia valores
					$targetVariable->NormalizationScale = $sourceVariable->NormalizationScale;
					$symbology = Serializator::Clone($sourceVariable->Symbology, true);
					$symbology->Id = null;
					$symbology->CutMode = 'M';
					$symbology->CutColumn = null;

					$targetVariable->Symbology = $symbology;
					$targetVariable->Values = Serializator::CloneArray($sourceVariable->Values, true);

					$this->UpdateVariable($targetDatasetId, $targetLevelConnected, $targetVariable);
					$ret++;
				}
			}
		}
		return $ret;
	}
}