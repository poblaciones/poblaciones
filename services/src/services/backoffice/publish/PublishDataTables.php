<?php

namespace helena\services\backoffice\publish;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Log;
use minga\framework\Profiling;
use minga\framework\Context;
use minga\framework\PublicException;

use helena\classes\Session;
use helena\db\backoffice\WorkModel;
use helena\entities\backoffice as entities;
use helena\services\backoffice\cloning\RowDuplicator;
use helena\classes\Links;
use helena\classes\Account;
use helena\classes\DbFile;
use helena\classes\App;

class PublishDataTables
{
	public $verboseDebug = false;

	private function PrepareDraftTablesOperation($workId, &$shard, $ommitShardValidation = false)
	{
		// dataset tiene referencias a columns circulares.
		Profiling::BeginTimer();

		$metadataMatrix = array('class' => entities\Metadata::class, 'parentKey' => 'wrk_metadata_id',
														'children' => array(

															array('class' => entities\MetadataInstitution::class, 'childKey' => 'min_metadata_id',
																		'children' => array(
																				array('class' => entities\Institution::class, 'parentKey' => 'min_institution_id',
																								'children' => array(
																									array('class' => entities\File::class, 'parentKey' => 'ins_watermark_id',
																												'children' => array(array('class' => entities\FileChunk::class, 'childKey' => 'chu_file_id'))))
																				))),

															array('class' => entities\Contact::class, 'parentKey' => 'met_contact_id'),

															array('class' => entities\MetadataSource::class, 'childKey' => 'msc_metadata_id',
																		'children' => array(
																				array('class' => entities\Source::class, 'parentKey' => 'msc_source_id',
																				'children' => array(
																											array('class' => entities\Institution::class, 'parentKey' => 'src_institution_id',
																														'children' => array(
																															array('class' => entities\File::class, 'parentKey' => 'ins_watermark_id',
																																		'children' => array(array('class' => entities\FileChunk::class, 'childKey' => 'chu_file_id'))))
																											),
																											array('class' => entities\Contact::class, 'parentKey' => 'src_contact_id'))))),
															array('class' => entities\MetadataFile::class, 'childKey' => 'mfi_metadata_id',
																		'children' => array(
																			array('class' => entities\File::class, 'parentKey' => 'mfi_file_id',
																						'children' => array(array('class' => entities\FileChunk::class, 'childKey' => 'chu_file_id')))))
													));

		$metricMatrix = array('class' => entities\MetricVersion::class, 'childKey' => 'mvr_work_id',
																'children' => array(
																			array('class' => entities\Metric::class, 'parentKey' => 'mvr_metric_id'),
																			array('class' => entities\MetricVersionLevel::class, 'childKey' => 'mvl_metric_version_id',
																						'children' => array(
																								array('class' => entities\Variable::class, 'childKey' => 'mvv_metric_version_level_id',
																											'children' => array(
																												array('class' => entities\Symbology::class, 'parentKey' => 'mvv_symbology_id'),
																												array('class' => entities\VariableValueLabel::class, 'childKey' => 'vvl_variable_id'))),
																			))));

		$datasetMatrix = array('class' => entities\Dataset::class, 'childKey' => 'dat_work_id',
																			'postUpdateColumns' => array('dat_caption_column_id', 'dat_images_column_id', 'dat_partition_column_id',
																																		'dat_latitude_column_id', 'dat_longitude_column_id',
																																		'dat_latitude_column_segment_id', 'dat_longitude_column_segment_id',
																																		'dat_geography_item_column_id'),
																		'children' => array(
																					array('class' => entities\DatasetColumn::class, 'childKey' => 'dco_dataset_id',
																							'children' => array(
																								array('class' => entities\DatasetColumnValueLabel::class, 'childKey' => 'dla_dataset_column_id'))
																						),
																					array('class' => entities\DatasetMarker::class, 'parentKey' => 'dat_marker_id',
																									'postUpdateColumns' => array('dmk_content_column_id'))
																				));

		$imageMatrix = array('class' => entities\File::class, 'parentKey' => 'wrk_image_id', 'children' => array(array('class' => entities\FileChunk::class, 'childKey' => 'chu_file_id')));

		$iconMatrix = array('class' => entities\WorkIcon::class, 'childKey' => 'wic_work_id',
																		'children' => array(
																			array('class' => entities\File::class, 'parentKey' => 'wic_file_id',
																						'children' => array(array('class' => entities\FileChunk::class, 'childKey' => 'chu_file_id')))));

		$onboardingMatrix = array('class' => entities\Onboarding::class, 'childKey' => 'onb_work_id',
																'children' => array(
																			array('class' => entities\OnboardingStep::class, 'childKey' => 'obs_onboarding_id',
																					'children' => array(
																						array('class' => entities\File::class, 'parentKey' => 'obs_image_id',
																									'children' => array(array('class' => entities\FileChunk::class, 'childKey' => 'chu_file_id')))))));

		$extraMetrics = array('class' => entities\WorkExtraMetric::class, 'childKey' => 'wmt_work_id');
		$workStartup = array('class' => entities\WorkStartup::class, 'parentKey' => 'wrk_startup_id');

		// Inicia el pasaje
		$publishMatrix = array('class' => entities\Work::class,
														'children' => array(
															$imageMatrix,
															$iconMatrix,
															$onboardingMatrix,
															$extraMetrics,
															$workStartup,
															$metadataMatrix,
															$datasetMatrix,
															$metricMatrix));

		// 0. Calcula las dependencias entre tablas
		$branches = $this->ProcessTree($publishMatrix, null);

		// 1. Valida que la obra exista y sea del shard actual
		if (!$ommitShardValidation)
		{
			$data = App::Db()->fetchAssoc("select wrk_shard from draft_work where wrk_id = ?", array($workId));
			if (!$data)
				throw new PublicException('Cartografía inexistente.');
			$shard = intval($data['wrk_shard']);
			if ($shard != App::Settings()->Shard()->CurrentShard)
				throw new PublicException('El shard de la obra no coincide con el del entorno: w: ' . $workId . ' s:' . $shard . ' vs ' . App::Settings()->Shard()->CurrentShard);
			}
		Profiling::EndTimer();

		return $branches;
	}

	public function UpdateOnlineDates($workId)
	{
		$metadata = App::Orm()->find(entities\DraftWork::class, $workId)->getMetadata();
		$workIdShardified = self::Shardified($workId);
		$metadataPublished = App::Orm()->find(entities\Work::class, $workIdShardified)->getMetadata();

		$since = $metadata->getOnlineSince();
		$last = new \DateTime();
		if ($since === null) {
			$metadata->setOnlineSince($last);
			$metadataPublished->setOnlineSince($last);
		}
		$metadata->setLastOnline($last);
		$metadataPublished->setLastOnline($last);

		$userId = Session::GetCurrentUser()->GetUserId();
		$metadata->setLastOnlineUserId($userId);
		$metadataPublished->setLastOnlineUserId($userId);

		$metadata->setUpdate($last);
		$metadataPublished->setUpdate($last);
		App::Orm()->save($metadata);
		App::Orm()->save($metadataPublished);
	}

	public function CleanWorkCaches($workId)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);

		$cacheManager = new CacheManager();
		$cacheManager->CleanPdfMetadata($work->getMetadata()->getId());
		$cacheManager->CleanWorkHandlesCache($workId);
		$cacheManager->CleanWorkVisiblityCache($workId);
		$cacheManager->ClearWorkSelectedMetricMetadata($workId); // < aca se traba
		$this->CleanWorkMetadataCaches($workId, $work->getMetadata()->getId());

		// Limpia efectos de haber editado la institución y ahora republicarla
		$workModel = new WorkModel();
		$works = $workModel->GetInstitutionsByWork($workId);
		foreach($works as $selectedWork)
		{
			$this->CleanWorkMetadataCachesByInstitution($selectedWork['institution_id']);
		}
		// Limpia el caché de previews
		$work->setPreviewFileId(null);
		App::Orm()->save($work);
	}
	private function CleanWorkMetadataCachesByInstitution($institutionId)
	{
		// Limpia a los cachés de metadatos de works de la misma institución
		$workModel = new WorkModel(false);
		$institutionIdShardified = self::Shardified($institutionId);
		$works = $workModel->GetWorkAndMetadataIdsByInstitution($institutionIdShardified);
		foreach($works as $work)
		{
			$this->CleanWorkMetadataCaches($work['wrk_id'], $work['met_id']);
		}
	}
	private function CleanWorkMetadataCaches($workId, $metadataId)
	{
		$cacheManager = new CacheManager();
		$cacheManager->ClearWorkSelectedMetricMetadata($workId);
		$cacheManager->CleanPdfMetadata($metadataId);
	}

	public function RevokeOnlineDates($workId)
	{
		$metadata = App::Orm()->find(entities\DraftWork::class, $workId)->getMetadata();
		$metadata->setLastOnline(null);
		App::Orm()->save($metadata);
	}

	public function UpdatePublicUrl($workId)
	{
		// 3. Resetea el public Url
		$workIdShardified = self::Shardified($workId);
		$url = Links::GetWorkUrl($workIdShardified);
		$this->SetPublicUrl($workId, $url);
		return $url;
	}

	public function DeleteWorkTables($workId, $ommitShardValidation = false)
	{
		Profiling::BeginTimer();
		$shard = '';
		$branches = $this->PrepareDraftTablesOperation($workId, $shard, $ommitShardValidation);
		// 2. Limpia
		$workIdShardified = self::Shardified($workId);
		$this->CleanWork($workIdShardified, $branches);
		// 3. Resetea el public Url
		$this->SetPublicUrl($workId, null);
		Profiling::EndTimer();
	}

	public function SetPublicUrl($workId, $url)
	{
		Profiling::BeginTimer();
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		if ($draftWork !== null)
		{
			$metadata = $draftWork->getMetadata();
			$metadata->setUrl($url);
			App::Orm()->Save($metadata);
		}
		$workIdShardified = self::Shardified($workId);
		$work = App::Orm()->find(entities\Work::class, $workIdShardified);
		if ($work !== null)
		{
			$metadata = $work->getMetadata();
			$metadata->setUrl($url);
			App::Orm()->Save($metadata);
		}
		Profiling::EndTimer();
	}

	public function CleanTempTables()
	{
		$sql = "SELECT wdd_id, wdd_table FROM work_dataset_draft WHERE wdd_table like 'tmp_work_dataset%' AND wdd_created  < NOW() - INTERVAL 1 WEEK";
		$tables = App::Db()->fetchAll($sql);
		foreach($tables as $table)
		{
			App::Db()->dropTable($table['wdd_table']);
			App::Db()->exec("DELETE FROM work_dataset_draft WHERE wdd_id = ?", array($table['wdd_id']));
			App::Db()->markTableUpdate('work_dataset_draft');
		}
		return sizeof($tables);
	}
	public function CleanMatrixTables()
	{
		$sql = "SHOW TABLES LIKE 'work_dataset_shard_%_snapshot_matrix_%'";
		$tables = App::Db()->fetchAllByPos($sql);
		foreach($tables as $table)
		{
			App::Db()->dropTable($table[0]);
		}
		return sizeof($tables);
	}

	public function CleanOrphanTables()
	{
		$tables = App::GetOrphanSet();
		foreach($tables as $table)
		{
			//echo  $table['aa'] . ' - ' .   $table['table'] . '<br>';
			App::Db()->dropTable($table['table']);
		}
		return sizeof($tables);
	}

	public function CopyDraftTables($workId)
	{
		Profiling::BeginTimer();
		$shard = '';
		$branches = $this->PrepareDraftTablesOperation($workId, $shard);
		// 1. Calcula los insertsOrUpdate
		$this->CallCopyQueries($branches, $workId);
		// 2. Termina de pasar propiedades específicas
		$this->FixProperties($shard, $workId);
		// 3. Quita instituciones o fuentes sin usuarios
		$this->FixOrphans();
		// 4. Se asegura de pedir indicadores válidos
		$this->FixActiveMetrics($workId);
		// 5. Copa los chunk de archivos
		$this->CopyFileChunks($workId);

		Profiling::EndTimer();
	}

	private function FixActiveMetrics($workId)
	{
		Profiling::BeginTimer();
		// Obtiene las propias
		$sql = "SELECT mvr_metric_id metricId FROM draft_work_startup
							JOIN draft_work ON wrk_startup_id = wst_id
							JOIN draft_metric_version ON wrk_id = mvr_work_id AND FIND_IN_SET(mvr_metric_id, wst_active_metrics)
							JOIN draft_metric ON mtr_id = mvr_metric_id
							WHERE wrk_id = ? ORDER BY mtr_caption";
		$ownMetric = App::Db()->fetchAll($sql, array($workId));
		// Obtiene las extra
		$sql = "SELECT wmt_metric_id metricId FROM draft_work_extra_metric
											WHERE wmt_work_id = ? AND wmt_start_active = 1";
		$extraMetric = App::Db()->fetchAll($sql, array($workId));

		// Arma el final
		$metricsList = [];
		$this->addMetricsToResult($metricsList, $ownMetric);
		$this->addMetricsToResult($metricsList, $extraMetric);

		$metrics = join(',', $metricsList);

		// Graba el resultado
		$workIdShardified = self::Shardified($workId);
		$sql = "UPDATE work_startup JOIN work ON wrk_startup_id = wst_id
										 SET wst_active_metrics = ? WHERE wrk_id = ?";
		App::Db()->exec($sql, array($metrics, $workIdShardified));
		App::Db()->markTableUpdate('work_startup');
		Profiling::EndTimer();
	}

	private function addMetricsToResult(&$metricsList, $list)
	{
		foreach($list as $metric)
		{
			$metricIdShardified = self::Shardified($metric['metricId']);
			if (!in_array($metricIdShardified, $metricsList))
				$metricsList[] = $metricIdShardified;
		}
	}

	private function FixOrphans()
	{
		Profiling::BeginTimer();
		$institutions = "DELETE FROM institution
												WHERE not exists (select 1 from source where src_institution_id = ins_id)
												AND not exists (select 1 from metadata_institution where min_institution_id = ins_id);";
		App::Db()->exec($institutions);
		App::Db()->markTableUpdate('institution');

		$sources = "DELETE FROM source WHERE not exists (select 1 from metadata_source where msc_source_id = src_id)";
		App::Db()->exec($sources);
		App::Db()->markTableUpdate('source');

		$metrics = "DELETE FROM metric WHERE not exists (select 1 from metric_version where mvr_metric_id = mtr_id)";
		App::Db()->exec($metrics);
		App::Db()->markTableUpdate('metric');

		Profiling::EndTimer();
	}

	public function DeleteDatasetsTables($workId)
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel(false);
		$workIdShardified = self::Shardified($workId);
		$datasets = $workModel->GetDatasets($workIdShardified);
		foreach($datasets as $dataset)
		{
			RevokeSnapshots::DropTable($dataset['dat_table'], $dataset['dat_id']);
		}
		Profiling::EndTimer();
	}

	public function CopyDatasets($workId, $slice, &$totalSlices)
	{
		Profiling::BeginTimer();

		// Copia work_dataset_draft_xxxx si hace falta
		$workModel = new WorkModel();
		$datasets = $workModel->GetDatasets($workId);
		if ($slice < sizeof($datasets))
		{
			$dataset = $datasets[$slice];
			$this->CopyWorkDatasetTable($dataset['dat_table'], $dataset['dat_id']);
		}
		Profiling::EndTimer();

		$totalSlices = sizeof($datasets) - 1;
		return $slice >= $totalSlices;
	}

	private function FixProperties($shard, $workId)
	{
		Profiling::BeginTimer();

		$workIdShardified = self::Shardified($workId);
		// Arregla columnas
		$query = "UPDATE dataset d1 JOIN draft_dataset d2 ON d1.dat_id = d2.dat_id " .
									" * 100 + " . $shard . " AND d2.dat_work_id = ?
									SET d1.dat_table = replace(d2.dat_table, '_draft_', '_shard_" . App::Settings()->Shard()->CurrentShard . "_' ),
									 d1.dat_partition_column_id = d2.dat_partition_column_id * 100 + " . $shard . ",
									 d1.dat_images_column_id = d2.dat_images_column_id * 100 + " . $shard . ",
									 d1.dat_latitude_column_id = d2.dat_latitude_column_id * 100 + " . $shard . ",
									 d1.dat_longitude_column_id = d2.dat_longitude_column_id * 100 + " . $shard . ",
									 d1.dat_latitude_column_segment_id = d2.dat_latitude_column_segment_id * 100 + " . $shard . ",
									 d1.dat_longitude_column_segment_id = d2.dat_longitude_column_segment_id * 100 + " . $shard . ",
									 d1.dat_geography_item_column_id = d2.dat_geography_item_column_id * 100 + " . $shard . ",
									 d1.dat_caption_column_id = d2.dat_caption_column_id * 100 + " . $shard;
		App::Db()->exec($query, array($workId));
		App::Db()->markTableUpdate('dataset');

		$queryMarkers = "UPDATE dataset_marker d1 JOIN draft_dataset_marker d2 ON d1.dmk_id = d2.dmk_id " .
									" * 100 + " . $shard . " JOIN draft_dataset ds2 ON ds2.dat_marker_id = d2.dmk_id AND ds2.dat_work_id = ?
									SET d1.dmk_content_column_id = d2.dmk_content_column_id * 100 + " . $shard;
		App::Db()->exec($queryMarkers, array($workId));
		App::Db()->markTableUpdate('dataset_marker');

		// Hace update de publishedby
		$query = "UPDATE work SET wrk_published_by = ? WHERE wrk_id = ?";
		App::Db()->exec($query, array(Account::Current()->user, $workIdShardified));
		App::Db()->markTableUpdate('work');

		Profiling::EndTimer();
	}
	private function CallCopyQueries($branches, $workId)
	{
		Profiling::BeginTimer();
		$queries = array();
		$affectedTables = array();
		$this->InsertQueryCreator($queries, $affectedTables, 'INSERTING', $branches, $workId);
		// Dump queries
		//	$this->dumpQueries($queries, $workId);
		foreach($queries as $query)
		{
			$affected = App::Db()->exec($query, array($workId));
			$this->queryLog($query, array($workId), $affected);
		}
		foreach ($affectedTables as $table)
		{
			App::Db()->markTableUpdate($table);
		}
		Profiling::EndTimer();
	}
	private function queryLog($query, $params, $affected)
	{
		$log = $query . " Params: " . print_r($params, true) . ". Affected: " . $affected. "<br>";
		Log::AppendExtraInfo($log);
		if ($this->verboseDebug)
			echo $log;
	}

	private function CopyFileChunks($workId)
	{
		$src_table = DbFile::GetChunksTableName(true, $workId);
		$target_table = DbFile::GetChunksTableName(false, PublishDataTables::Shardified($workId));
		// La crea
		App::Db()->dropTable($target_table);
		$create = "CREATE TABLE " . $target_table . " (`chu_id` int(11) NOT NULL AUTO_INCREMENT, `chu_file_id` int(11) NOT NULL,`chu_content` longblob, PRIMARY KEY (`chu_id`), KEY `fk_file_chunk_file1_idx` (`chu_file_id`), CONSTRAINT `fk_file_" . $target_table . "` FOREIGN KEY (`chu_file_id`) REFERENCES `file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;" ;
		App::Db()->execDDL($create);

		// Pasa las filas
		$sql = "INSERT INTO " . $target_table . "(chu_file_id, chu_content) SELECT "
			. $this->ShardifiedDb('chu_file_id') . ", chu_content FROM " . $src_table . " WHERE " . $this->ShardifiedDb('chu_file_id') . " IN (SELECT fil_id FROM file)";
		App::Db()->exec($sql);
		App::Db()->markTableUpdate($target_table);
	}

	private function CopyWorkDatasetTable($table, $datasetId)
	{
		Profiling::BeginTimer();

		$target = Str::Replace($table, '_draft_', '_shard_' . App::Settings()->Shard()->CurrentShard . '_');
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);;

		// Crea la tabla
		RevokeSnapshots::DropTable($target, $datasetIdShardified);
		$create = "CREATE TABLE " . $target . " LIKE " . $table;
		App::Db()->execDDL($create);
		$alterTable = "ALTER TABLE " . $target . " CHANGE `geography_item_id` `geography_item_id` INT(11) NOT NULL";
		App::Db()->execDDL($alterTable);
		// Hace el insert
		$insert = "INSERT " . $target . " SELECT * FROM " . $table . " WHERE ommit = 0";
		App::Db()->exec($insert);

		App::Db()->markTableUpdate($target);

		Profiling::EndTimer();
	}

	public function UnlockColumns($workId, $drafTables = false, $datasetId = null)
	{
		$drafting = ($drafTables ? 'draft_' : '');
		$datasetCondition = ($datasetId ? ' AND dat_id = ' . $datasetId : '');
		// 1. Pone en null las referencias a columnas en dataset
		$queryCols = "UPDATE " . $drafting . "dataset SET
													dat_partition_column_id = NULL,
													dat_images_column_id = NULL,
													dat_latitude_column_id = NULL,
													dat_longitude_column_id = NULL,
													dat_latitude_column_segment_id = NULL,
													dat_longitude_column_segment_id = NULL,
													dat_geography_item_column_id = NULL,
													dat_caption_column_id = NULL
									WHERE dat_work_id = ?" . $datasetCondition;
		App::Db()->exec($queryCols, array($workId));
		App::Db()->markTableUpdate($drafting . "dataset");

		// 2. Pone en null las referencias en variables
		$queryCols = "UPDATE " . $drafting . "variable
									SET mvv_normalization_column_id = NULL, mvv_data_column_id = NULL
									WHERE EXISTS (SELECT * from " . $drafting . "dataset_column
									JOIN " . $drafting . "dataset ON dat_id = dco_dataset_id
									WHERE (dco_id = mvv_data_column_id
									OR dco_id = mvv_normalization_column_id) AND dat_work_id = ? " . $datasetCondition . ")";
		App::Db()->exec($queryCols, array($workId));
		App::Db()->markTableUpdate($drafting . "variable");

		// 3. Pone en null las referencias circulares a columnas
		$circularCols = "UPDATE " . $drafting . "dataset_column INNER JOIN " . $drafting . "dataset ON dco_dataset_id = dat_id SET dco_aggregation_weight_id = NULL
									WHERE dat_work_id = ? " . $datasetCondition;
		App::Db()->exec($circularCols, array($workId));
		App::Db()->markTableUpdate($drafting . "dataset_column");

		// 4. Pone en null las referencias a symbology
		$queryCols = "UPDATE " . $drafting . "symbology INNER JOIN " . $drafting . "variable ON mvv_symbology_id = vsy_id INNER JOIN " . $drafting . "metric_version_level ON mvv_metric_version_level_id = mvl_id INNER JOIN " . $drafting . "dataset ON mvl_dataset_id = dat_id
									SET vsy_cut_column_id = NULL, vsy_sequence_column_id = NULL
									WHERE dat_work_id = ? " . $datasetCondition;
		App::Db()->exec($queryCols, array($workId));
		App::Db()->markTableUpdate($drafting . "symbology");

		// 5. Pone en null las referencias desde markers
		$markerCols = "UPDATE " . $drafting . "dataset_marker INNER JOIN " . $drafting . "dataset ON dat_marker_id = dmk_id SET dmk_content_column_id = NULL
									WHERE dat_work_id = ? " . $datasetCondition;
		App::Db()->exec($markerCols, array($workId));
		App::Db()->markTableUpdate($drafting . "dataset_marker");
	}
	private function CleanWork($workId, $branches)
	{
		Profiling::BeginTimer();
		// 1. Guarda los contactos previos
		$deleteContact = array();
		$affectedTables = array();
		$this->InsertQueryCreator($deleteContact, $affectedTables, 'GETCONTACT', $branches, $workId);
		$query = $deleteContact[0] . " UNION " . $deleteContact[1];
		$contacts =	App::Db()->fetchAll($query, array($workId, $workId));
		// 2. Libera referencias a columnas
		$this->UnlockColumns($workId);
		// 2. Borra work (tiene triggers y cascade para las demás tablas)
		$query = "DELETE metric_version FROM metric_version WHERE mvr_work_id = ?";
		App::Db()->exec($query, array($workId));
		App::Db()->markTableUpdate("metric_version");
		// Preserva metadata
		$metSql = "SELECT wrk_metadata_id FROM work WHERE wrk_id = ?";
		$metadataId = App::Db()->fetchScalarIntNullable($metSql, array($workId));
		// Borra la tabla de chunks de archivos
		$chunkTable = DbFile::GetChunksTableName(false, $workId);
		App::Db()->dropTable($chunkTable);
		// Borra work
		$query = "DELETE FROM work WHERE wrk_id = ?";
		App::Db()->exec($query, array($workId));
		App::Db()->markTableUpdate("work");
		// Borra metadata
		if ($metadataId !== null)
		{
			$query = "DELETE FROM metadata WHERE met_id = ?";
			App::Db()->exec($query, array($metadataId));
			App::Db()->markTableUpdate("metadata");
		}
		// 3. Borra los contacts que hayan quedado huéfanos
		$contactList = '';
		if (sizeof($contacts) > 0)
		{
			foreach($contacts as $row)
				$contactList .= ($contactList != '' ? ',' : '') . $row['con_id'];
			$deleteQuery = "DELETE FROM contact WHERE con_id IN (" . $contactList . ")
												AND con_id NOT IN (select src_contact_id FROM source) AND con_id NOT IN (select met_contact_id FROM metadata) ";
			App::Db()->exec($deleteQuery);
			App::Db()->markTableUpdate("contact");
		}
		Profiling::EndTimer();
	}

	private function dumpQueries($queries, $workId)
	{
		foreach($queries as $query)
			echo($query . '<br>');
		exit();
	}

	private function InsertQueryCreator(&$queries, &$affectedTables, $op, $joinsTreeNode, $workId, $prev = null, $partialQuery = '')
	{
		$tablePreffix = ($op == 'INSERTING' ? 'draft_' : '');
		if ($prev != null)
				$partialQuery = " JOIN " . $tablePreffix . $prev['table'] . " ON " . $joinsTreeNode['level']['key'] ."=". $joinsTreeNode['level']['foreignField'] . $partialQuery;

		foreach($joinsTreeNode['childLevels'] as $child)
		{
			if ($child['level']['inverse']) // is inverse == true
				$this->InsertQueryCreator($queries, $affectedTables, $op, $child, $workId, $joinsTreeNode['level'], $partialQuery);
		}

		if ($op == 'INSERTING')
		{
			$cols = $this->GetCommonColumns($joinsTreeNode['level']['class'], $this->TransformToDraft($joinsTreeNode['level']['class']), $joinsTreeNode['level']['postUpdateColumns']);
			$table = $this->GetTablenameFromSuffixedTable($joinsTreeNode['level']['table']);
			$queries[] = "\n INSERT INTO " . $table  . "(" . $cols['insert'] . ") SELECT " . $cols['select'] . " FROM " . $tablePreffix . $joinsTreeNode['level']['table'] . ($partialQuery != '' ? $partialQuery : "") .
											" WHERE wrk_id = ? ON DUPLICATE KEY UPDATE " . $cols['update'] ;
			$affectedTables[] = $table;
		}
		else if ($op == 'GETCONTACT')
		{
			if ($this->GetTablenameFromSuffixedTable($joinsTreeNode['level']['table']) == 'contact')
				$queries[] = "SELECT " . $this->GetSuffix($joinsTreeNode['level']['table']) . ".* FROM " . $joinsTreeNode['level']['table'] . ($partialQuery != '' ? $partialQuery : "") . " WHERE wrk_id = ?";
		}

		foreach($joinsTreeNode['childLevels'] as $child)
			if (!$child['level']['inverse']) // is inverse == false
				$this->InsertQueryCreator($queries, $affectedTables, $op, $child, $workId, $joinsTreeNode['level'], $partialQuery);
	}
	private function TransformToDraft($entityName)
	{
		$first = '';
		$last = '';
		Str::TwoSplitReverse($entityName, '\\', $first, $last);
		return $first . '\\Draft' . $last;
	}
	private function GetCommonColumns($entity1, $entity2, $skip)
	{
		$shardifyIds = true;
		$staticColumns = array();
		if ($skip != null)
		{
			foreach($skip as $column)
				$staticColumns[$column] = null;
		}
		$ret =  RowDuplicator::GetMigrateSqlQueries($entity1, $entity2, $shardifyIds, $staticColumns);
		return $ret;
	}


	private function ProcessTree($ele, $prevKey = null, $nlevel = 0)
	{
		$table = $this->GetTable($ele) . ' L' . $nlevel;
		$relation = $this->GetRelation($ele);
		$key = $this->GetKey($ele);
		if ($relation['type'] == 'parent')
			$level = array('table' => $table,
										'key' => $this->TableFieldPreffix($nlevel) . $key,
										'foreignField' => $this->TableFieldPreffix($nlevel - 1) . $relation['field'],
										'inverse' => true,
										'class' => $ele['class'],
										'postUpdateColumns' => Arr::SafeGet($ele, 'postUpdateColumns', null));
		else if ($relation['type'] == 'child')
			$level =  array('table' => $table,
										'key' => $this->TableFieldPreffix($nlevel - 1) . $prevKey,
										'foreignField' => $this->TableFieldPreffix($nlevel) . $relation['field'],
										'inverse' => false,
										'class' => $ele['class'],
										'postUpdateColumns' => Arr::SafeGet($ele, 'postUpdateColumns', null));
		else
			$level = array('table' => $table,
										'key' => 0,
										'foreignField' => 0,
										'inverse' => 0,
										'class' => $ele['class'],
										'postUpdateColumns' => null);

		$children = Arr::SafeGet($ele, 'children', null);
		$childLevels = array();
		if ($children)
		{
			$prevKey = $key;
			foreach($children as $child)
				$childLevels[] = $this->ProcessTree($child, $key, $nlevel + 1);
		}
		return array('level' => $level, 'childLevels' => $childLevels);
	}


	private function TableFieldPreffix($n)
	{
		return 'L' . $n . '.';
	}

	private function GetKey($ele)
	{
		$metadata = App::Orm()->getClassMetadata($ele['class']);
		return $metadata->getColumnName($metadata->identifier[0]);
	}

	private function GetSuffix($suffixedTableName)
	{
		return explode(' ', $suffixedTableName)[1];
	}

	private function GetTablenameFromSuffixedTable($suffixedTableName)
	{
		return explode(' ', $suffixedTableName)[0];
	}

	private function GetTable($ele)
	{
		$metadata = App::Orm()->getClassMetadata($ele['class']);
		return $metadata->GetTableName();
	}
	private function GetRelation($ele)
	{
		if (array_key_exists('parentKey', $ele))
			return array('type' => 'parent', 'field' => $ele['parentKey']);
		else if (array_key_exists('childKey', $ele))
			return array('type' => 'child', 'field' => $ele['childKey']);
		else
			return array('type' => null);
	}

	public static function Shardified($id)
	{
		return $id * 100 + App::Settings()->Shard()->CurrentShard;
	}

	public static function ShardifiedDb($field)
	{
		return '(' . $field . ' * 100 + ' . App::Settings()->Shard()->CurrentShard . ')';
	}

	public static function Unshardify($id)
	{
		return intval($id / 100);
	}

	public static function UnshardifyList($list, $fields)
	{
		foreach($list as &$row)
		{
			foreach($fields as $field)
			{
				$row[$field] = self::Unshardify($row[$field]);
			}
		}
		return $list;
	}
}
