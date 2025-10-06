<?php

namespace helena\services\backoffice;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\IO;
use minga\framework\Profiling;
use minga\framework\ErrorException;

use helena\classes\App;
use helena\classes\Links;
use helena\classes\DbFile;
use helena\classes\Session;
use helena\classes\Statistics;
use helena\db\frontend\FileModel;
use helena\services\common\BaseService;
use helena\db\frontend\SignatureModel;
use helena\entities\backoffice\DraftWork;
use helena\entities\backoffice\structs\WorkInfo;
use helena\entities\backoffice\structs\StartupInfo;
use helena\entities\backoffice as entities;
use helena\services\backoffice\notifications\NotificationManager;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\PublishSnapshots;
use helena\services\backoffice\publish\CacheManager;
use helena\services\backoffice\publish\WorkFlags;
use minga\framework\PublicException;

class WorkService extends BaseService
{
	private const MAX_ICON_WIDTH = 120;
	private const MAX_ICON_HEIGHT = 120;

	public function Create($type, $title = '')
	{
		$work = new entities\DraftWork();
		if ($type === 'P' && Session::IsSiteEditor() === false)
			throw new PublicException('El usuario actual no dispone de suficientes permisos para realizar esta acción.');

		$work->setType($type);
		$work->setImageType('N');
		$work->setUnfinished(false);
		$work->setMetadataChanged(false);
		$work->setDatasetLabelsChanged(false);
		$work->setDatasetDataChanged(false);
		$work->setMetricLabelsChanged(false);
		$work->setMetricDataChanged(false);
		$work->setIsIndexed(false);
		$work->setSegmentedCrawling(false);
		$work->setIsPrivate(false);
		$work->setIsExample(false);
		$work->setShard(App::Settings()->Shard()->CurrentShard);

		// Crea startup
		$startup  = $this->CreateStartup();
		$work->setStartup($startup);
		// Crea metadatos
		$metadata = $this->CreateMetadata($type, $title);
		$work->setMetadata($metadata);

		// Graba work
		WorkFlags::Save($work);
		// Le agrega el onboarding
		$workId = $work->getId();
		$onboarding = new OnboardingService();
		$onboarding->CreateOnboarding($workId);

		$shardifiedWorkId = PublishDataTables::Shardified($workId);

		// Crea la tabla de chunks de files
		self::CreateChunksTable($workId);

		// Pone el url en Work
		$url = Links::GetWorkUrl($shardifiedWorkId);
		$metadata->setUrl($url);
		App::Orm()->Save($metadata);
		// Agrega permisos
		$this->AddDefaultPermission($work);

		// Manda un mensaje administrativo avisando del nuevo elemento
		$nm = new NotificationManager();
		$nm->NotifyCreate($work);

		return $work;
	}

	private function CreateStartup()
	{
		$startup = new entities\DraftWorkStartup();
		$startup->setType('E');
		$startup->setClippingRegionItemSelected(true);
		App::Orm()->Save($startup);
		return $startup;
	}

	private function CreateMetadata($type, $title)
	{
		$metadata = new entities\DraftMetadata();
		$metadata->setType($type);
		$metadata->setTitle($title);
		$metadata->setAbstract('');
		$metadata->setStatus('B');
		$metadata->setAuthors('');
		$metadata->setCoverageCaption('');
		$licence = '{"licenseType":1,"licenseOpen":"always","licenseCommercial":1,"licenseVersion":"4.0\/deed.es"}';
		$metadata->setLicense($licence);
		$metadata->setLanguage('es; Español');
		$metadata->setCreate(new \DateTime());
		$metadata->setUpdate(new \DateTime());

		// Crea uno a uno entre contacto y metadata
		$contact = new entities\DraftContact();
		App::Orm()->Save($contact);
		$metadata->setContact($contact);
		App::Orm()->Save($metadata);
		return $metadata;
	}
	private function AddDefaultPermission($work)
	{
		$userService = new UserService();
		$permissionDefault = new entities\DraftWorkPermission();
		$permissionDefault->setUser($userService->GetCurrentUser());
		$permissionDefault->setPermission('A');
		$permissionDefault->setWork($work);
		App::Orm()->Save($permissionDefault);
	}

	public function GetWorkPreview($workId)
	{
		$work = App::Orm()->find(DraftWork::class, $workId);
		$preview = $work->getPreviewFileId();
		if (!$preview) {
			return ['DataUrl' => null];
		}
		$fileModel = new FileModel(true, $workId);
		$outFile = IO::GetTempFilename() . '.tmp';
		$fileModel->ReadFileToFile($preview, $outFile);

		$dataURL = IO::ConvertFiletoBase64($outFile);
		IO::Delete($outFile);
		return ['DataUrl' => $dataURL];
	}
	public function PostWorkPreview($workId, $tmpFilename)
	{
		$fs = new FileService($this->isDraft);

		$file = $fs->Create('Preview de ' . $workId, "image/png");

		$fs->SaveFile($file, $tmpFilename, "image/png", $workId);
		$work = App::Orm()->find(DraftWork::class, $workId);
		// Si había alguno, retiene para borrar
		$oldFileId = $work->GetPreviewFileId();
		// Listo
		$work->setPreviewFileId($file->getId());
		App::Orm()->Save($work);
		// Va
		if ($oldFileId && $oldFileId !== $file->getId())
		{
			$fs = new FileService($this->isDraft);
			$fs->DeleteFile($oldFileId, $workId);
		}
		return $file->getId();
	}

	public function GetWorkInfo($workId)
	{
		Profiling::BeginTimer();
		$workInfo = new WorkInfo();
		$workInfo->Work = App::Orm()->find(DraftWork::class, $workId);
		if ($workInfo->Work === null)
			throw new PublicException('El elemento no existe en la base de datos.');
		$permissions = new PermissionsService();
		$onboarding = new OnboardingService();
		$workInfo->Permissions = $permissions->GetPermissions($workId);
		$workInfo->Datasets = $this->GetDatasets($workId);

		// Colecciones de metadatos
		$metadataService = new MetadataService();
		$metadataId = $workInfo->Work->getMetadata()->getId();
		$workInfo->Sources = $metadataService->GetSources($metadataId);
		$workInfo->Institutions = $metadataService->GetInstitutions($metadataId);
		$workInfo->Files = $metadataService->GetFiles($metadataId);
		// Listo metadatos

		$workInfo->Icons = $this->GetIcons($workId);
		$workInfo->Onboarding = $onboarding->GetOnboarding($workId);
		$workInfo->StatsMonths = Statistics::ResolveWorkMonths($workId);
		$workInfo->StatsQuarters = Statistics::ResolveWorkQuarters($workId);
		$workInfo->ExtraMetrics = $this->GetExtraMetrics($workId);
		$workInfo->Startup = $this->GetStartupInfo($workId);
		$workInfo->PendingReviewSince = $this->GetPendingReviewSince($workId);
		$workIdShardified = PublishDataTables::Shardified($workId);
		$workInfo->ArkUrl = Links::GetWorkArkUrl($workIdShardified);
		Statistics::StoreInternalHit($workIdShardified, 'backoffice');
		Profiling::EndTimer();
		return $workInfo;
	}

	private function GetPendingReviewSince($workId)
	{
		Profiling::BeginTimer();
		$review = App::Db()->fetchScalarNullable("SELECT MAX(rev_submission_time) FROM review WHERE rev_work_id = ?", array($workId));
		Profiling::EndTimer();
		return $review;
	}

	public function GetStartupInfo($workId)
	{
		Profiling::BeginTimer();
		$signatures = new SignatureModel();
		$startup = new StartupInfo();
		$startup->LookupSignature = $signatures->GetLookupSignature();
		$extraInfo = $this->GetWorkStartupClippingRegionExtra($workId);
		$startup->RegionExtraInfo = $extraInfo['extra'];
		$startup->RegionCaption = $extraInfo['caption'];
		Profiling::EndTimer();
		return $startup;
	}


	private function GetExtraMetrics($workId)
	{
		Profiling::BeginTimer();
		$extraMetrics = App::Orm()->findManyByProperty(entities\DraftWorkExtraMetric::class, "Work.Id", $workId);
		$ret = [];
		foreach($extraMetrics as $extraMetric)
		{
			$metric = json_decode(App::OrmSerialize($extraMetric->getMetric()), true);
			$metric['StartActive'] = $extraMetric->getStartActive();
			$ret[] = $metric;
		}
		Arr::SortByKey($ret, 'Caption');
		Profiling::EndTimer();
		return $ret;
	}

	private function GetWorkStartupClippingRegionExtra($workId)
	{
		Profiling::BeginTimer();

		$sql = "SELECT clc_caption caption, Replace(clc_full_parent, '\t', ' > ') extra FROM draft_work JOIN draft_work_startup ON wrk_startup_id = wst_id
							JOIN snapshot_lookup_clipping_region_item ON wst_clipping_region_item_id = clc_clipping_region_item_id AND wst_clipping_region_item_id IS NOT NULL
								WHERE wrk_id = ?
								LIMIT 1";
		$row = App::Db()->fetchAssoc($sql, array($workId));
		if ($row === null)
			$ret = ['extra' => null, 'caption' => null];
		else
			$ret = $row;
		Profiling::EndTimer();
		return $ret;
	}

	public static function CreateChunksTable($workId)
	{
		$chunkTable = DbFile::GetChunksTableName(true, $workId);
		$sql = "CREATE TABLE " . $chunkTable . "(`chu_id` int(11) NOT NULL AUTO_INCREMENT, `chu_file_id` int(11) NOT NULL,`chu_content` longblob, PRIMARY KEY (`chu_id`), KEY `draft_fk_file_chunk_file1_idx` (`chu_file_id`), CONSTRAINT `fk_draft_file_chunk_" . $chunkTable . "` FOREIGN KEY (`chu_file_id`) REFERENCES `draft_file` (`fil_id`) ON DELETE CASCADE ON UPDATE NO ACTION) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";
		App::Db()->execDDL($sql);
	}

	public function GetIcons($workId)
	{
		Profiling::BeginTimer();
		$files = new FileModel(true, $workId);
		$ret = $files->ReadWorkIcons($workId);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetWorkMetricsList($workId)
	{
		Profiling::BeginTimer();
		$metrics = App::Orm()->findManyByQuery("SELECT m FROM e:DraftMetric m
																				JOIN e:DraftMetricVersion v WITH v.Metric = m
																				JOIN e:DraftMetricVersionLevel l WITH l.MetricVersion = v
																				JOIN v.Work w WHERE w.Id = :p1 ORDER BY m.Caption", array($workId));
		Profiling::EndTimer();
		return $metrics;
	}

	public function RequestReview($workId)
	{
		// Graba la entrada
		$userService = new UserService();
		$user = $userService->GetCurrentUser();

		$revision = new entities\Review();
		$revision->setWork(App::Orm()->find(DraftWork::class, $workId));
		$revision->setUserSubmission($user);
		$revision->setSubmissionDate(new \DateTime());
		App::Orm()->save($revision);

		// Manda un mensaje administrativo avisando del pedido
		$nm = new NotificationManager();
		$nm->NotifyRequestReview($workId);
		return $this->GetPendingReviewSince($workId);
	}
	public function AppendExtraMetric($workId, $metricId)
	{
		// Evita duplicados
		$this->RemoveExtraMetric($workId, $metricId);
		// La agrega
		$args = [$workId, $metricId];
		App::Db()->exec("INSERT INTO draft_work_extra_metric(wmt_work_id, wmt_metric_id) VALUES (?, ?)", $args);
		App::Db()->markTableUpdate('draft_work_extra_metric');
		// Listo
		WorkFlags::SetMetadataDataChanged($workId);

		return self::OK;
	}

	public function UpdateExtraMetricStart($workId, $metricId, $active)
	{
		$args = [($active ? 1 : 0), $workId, $metricId];
		App::Db()->exec("UPDATE draft_work_extra_metric SET wmt_start_active = ? WHERE wmt_work_id = ? AND wmt_metric_id = ?", $args);
		App::Db()->markTableUpdate('draft_work_extra_metric');

		WorkFlags::SetMetadataDataChanged($workId);

		return self::OK;
	}


	public function RemoveExtraMetric($workId, $metricId)
	{
		$args = [$workId, $metricId];
		App::Db()->exec("DELETE FROM draft_work_extra_metric WHERE wmt_work_id = ? AND wmt_metric_id = ?", $args);
		App::Db()->markTableUpdate('draft_work_extra_metric');

		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}

	public function UpdateStartup($workId, $startup)
	{
		$center = $startup->getCenter();
		if ($center !== null)
			$startup->setCenter(new \LongitudeOne\Spatial\PHP\Types\Geometry\Point($center->x, $center->y, null));

		App::Orm()->save($startup);
		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}
	public function UnarchiveWork($workId)
	{
		$key = 'work_archived_' . $workId;
		$service = new UserService();
		$service->ClearSetting($key);
		return ['result' => self::OK];
	}
	public function ArchiveWork($workId)
	{
		$key = 'work_archived_' . $workId;
		$service = new UserService();
		$service->SetSetting($key, 1);
		return ['result' => self::OK];
	}

	public function HideExample($workId)
	{
		$key = 'work_example_hidden_' . $workId;
		$service = new UserService();
		$service->SetSetting($key, 1);
		return ['result' => self::OK];
	}

	public function PromoteExample($workId)
	{
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setIsExample(true);
		App::Orm()->save($draftWork);

		return ['result' => self::OK];
	}

	public function DemoteExample($workId)
	{
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setIsExample(false);
		App::Orm()->save($draftWork);
		return ['result' => self::OK];
	}

	public function PromoteWork($workId)
	{
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setType('P');

		$meta = $draftWork->getMetadata();
		$meta->setType('P');

		App::Orm()->save($draftWork);
		App::Orm()->save($meta);
		return ['result' => self::OK];
	}

	public function DemoteWork($workId)
	{
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setType('R');

		$meta = $draftWork->getMetadata();
		$meta->setType('R');

		App::Orm()->save($draftWork);
		App::Orm()->save($meta);
		return ['result' => self::OK];
	}

	public function UpdateWorkVisibility($workId, $value, $link = null)
	{
		if ($link === '?')
		{
			$link = Str::GenerateLink();
		}
		// Cambia el valor
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWork->setIsPrivate($value);
		$draftWork->setAccessLink($link);
		App::Orm()->save($draftWork);
		// Si existe publicado, lo cambia también
		$workIdShardified = PublishDataTables::Shardified($workId);
		$work = App::Orm()->find(entities\Work::class, $workIdShardified);
		if ($work !== null) {
			$work->setIsPrivate($value);
			$work->setAccessLink($link);
			App::Orm()->save($work);
		}
		$caches = new CacheManager();
		$caches->CleanPdfMetadata($draftWork->getMetadata()->getId());
		$caches->CleanWorkHandlesCache($workId);

		// Actualiza cachés
		$publisher = new PublishSnapshots();
		$publisher->UpdateWorkVisibility($workId);
		return ['result' => self::OK, 'link' => $link];
	}
	public function CheckAllWorksConsistency()
	{
		$allWorks = App::Db()->fetchAll("SELECT wrk_id FROM draft_work");
		$ret = [];
		foreach($allWorks as $work)
		{
			$workId = $work['wrk_id'];
			$check = $this->CheckWorkConsistency($workId);
			if ($check['status'] !== 'OK')
				$ret[] = ['workId' => $workId, 'message' => $check['errors']];
		}
		return ['workCount' => count($allWorks), 'failedCount' => sizeof($ret), 'failed' => $ret];
	}
	public function CheckWorkConsistency($workId)
	{
		// Verifica:
		// - que el datasets usen columnas que les sean propias
		// - que los symbologies no estén ya usados
		// - que los dataset_marker no estén ya usados
		$errors = '';
		// 1. Trae las referencias a columnas en dataset
		$queryCols = "SELECT dat_id,
													dat_images_column_id, GetDatasetOf(dat_images_column_id),
													dat_latitude_column_id, GetDatasetOf(dat_latitude_column_id),
													dat_longitude_column_id, GetDatasetOf(dat_longitude_column_id),
													dat_latitude_column_segment_id, GetDatasetOf(dat_latitude_column_segment_id),
													dat_longitude_column_segment_id, GetDatasetOf(dat_longitude_column_segment_id),
													dat_geography_item_column_id, GetDatasetOf(dat_geography_item_column_id),
													dat_caption_column_id, GetDatasetOf(dat_caption_column_id),
													dat_partition_column_id, GetDatasetOf(dat_partition_column_id)
													FROM draft_dataset WHERE dat_work_id = ?";
		$columnRefs = App::Db()->fetchAll($queryCols, array($workId));
		$errors .= $this->CheckOffdatasetColumns($columnRefs);
		// 2. Trae las referencias en variables
		$queryCols = "SELECT dat_id,
										mvv_normalization_column_id, GetDatasetOf(mvv_normalization_column_id),
										mvv_data_column_id, GetDatasetOf(mvv_data_column_id)
										FROM draft_variable
										JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
										JOIN draft_dataset ON dat_id = mvl_dataset_id
										WHERE dat_work_id = ?";
		$variableRefs = App::Db()->fetchAll($queryCols, array($workId));
		$errors .= $this->CheckOffdatasetColumns($variableRefs);

		// 4. Trae las referencias a symbology
		$queryCols = "SELECT dat_id,
										vsy_cut_column_id, GetDatasetOf(vsy_cut_column_id),
										vsy_sequence_column_id, GetDatasetOf(vsy_sequence_column_id)
										FROM draft_symbology
										JOIN draft_variable ON mvv_symbology_id = vsy_id
										JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
										JOIN draft_dataset ON dat_id = mvl_dataset_id
										WHERE dat_work_id = ?";
		$symbologyRefs = App::Db()->fetchAll($queryCols, array($workId));
		$errors .= $this->CheckOffdatasetColumns($symbologyRefs);

		// 5. Trae los counts de symbologies
		$queryCols = "SELECT v2.mvv_id, (SELECT COUNT(*) FROM draft_variable v1 WHERE v1.mvv_symbology_id = v2.mvv_symbology_id) c
										FROM draft_symbology
										JOIN draft_variable v2 ON v2.mvv_symbology_id = vsy_id
										JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
										JOIN draft_dataset ON dat_id = mvl_dataset_id
										WHERE dat_work_id = ?";
		$symbologyCounts = App::Db()->fetchAll($queryCols, array($workId));
		$errors .= $this->CheckDuplicates($symbologyCounts, 'La simbología para la variable se encuentra duplicada', 'mvv_id');

		// 6. Trae los counts de markers
		$queryCols = "SELECT dat_id, (SELECT COUNT(*) FROM draft_dataset d1
																					WHERE d1.dat_marker_id = d2.dat_marker_id) c
													FROM draft_dataset d2 WHERE dat_work_id = ?";
		$markerCounts = App::Db()->fetchAll($queryCols, array($workId));
		$errors .= $this->CheckDuplicates($markerCounts, 'El dataset_marker para el dataset se encuentra duplicado', 'dat_id');

		return ['status' => (strlen($errors) > 0 ? 'Failed' : 'OK'), 'errors' => $errors];
	}

	private function CheckOffdatasetColumns($rows)
	{
		$ret = '';
		// La primera es el Id... luego son pares de columna <variable>, <id>
		foreach($rows as $row)
		{
			$datId = $row['dat_id'];
			$keys = array_keys($row);
			for($n = 1; $n < count($row); $n += 2)
			{
				$got = $row[$keys[$n + 1]];
				if ($got !== null && $got !== $datId)
				{
					$ret .= "El dataset para " . $keys[$n] . "=" . $row[$keys[$n]] . " no es el esperado. Esperado: " . $datId . ", obtenido: " . $got . "\n";
				}
			}
		}
		return $ret;
	}

	private function CheckDuplicates($rows, $message, $idColumn)
	{
		$ret = "";
		foreach($rows as $row)
		{
			if ($row['c'] > 1)
			{
				$ret .= $message . ". Identificador " . $idColumn . "=" . $row[$idColumn] . "\n";
			}
		}
		return $ret;
	}

	private function GetDatasets($workId)
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findManyByQuery("SELECT d FROM e:DraftDataset d JOIN d.Work w WHERE w.Id = :p1", array($workId));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetWorksByType($filter)
	{
		$condition = "wrk_type = '" . substr($filter, 0, 1) . "' ";
		// Trae las cartografías
		$list = $this->GetWorks($condition);
		return $list;
	}

	public function GetCurrentUserWorks()
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		// Si no es usuario público, trae todas las cartografías públicas
		if (Session::IsSiteReader())
		{
			$condition_type = "wrk_type = 'P' OR ";
		}
		else
		{
			$condition_type = "";
		}
		// Trae las cartografías del usuario
		$conditions = $condition_type . " wrk_id IN (SELECT wkp_work_id FROM draft_work_permission WHERE wkp_user_id = " . $userId . ")"
			. " OR wrk_is_example = 1";
		$list = $this->GetWorks($conditions);
		return $list;
	}
	private function GetWorks($condition)
	{
		Profiling::BeginTimer();

		$userId = Session::GetCurrentUser()->GetUserId();
		$sql = "SELECT wrk_id Id,
								met_title Caption,
								wrk_update Updated,
								met_last_online MetadataLastOnline,
								UserFullNameById(met_last_online_user_id) LastOnlineUser,
								UserFullNameById(wrk_update_user_id) UpdateUser,
								(wrk_metadata_changed OR wrk_dataset_labels_changed OR
								wrk_dataset_data_changed OR wrk_metric_labels_changed OR
								wrk_metric_data_changed) HasChanges
								, wrk_is_private IsPrivate
								, wrk_is_indexed IsIndexed
								, wrk_is_example IsExample
								, (SELECT COUNT(*) FROM user_setting
									WHERE ust_user_id = ? AND ust_key = CONCAT('work_archived_', wrk_id)) IsArchived
								, wrk_is_deleted IsDeleted
								, wrk_access_link AccessLink
								, wrk_preview_file_id PreviewId
								, wrk_segmented_crawling SegmentedCrawling
								, wrk_type Type
								, wrk_unfinished Unfinished
								, (SELECT MIN(wkp_permission) FROM draft_work_permission WHERE wkp_work_id = wrk_id AND wkp_user_id = ?) privileges
								, (SELECT COUNT(*) FROM draft_dataset d1 WHERE d1.dat_work_id = wrk_id) DatasetCount
								, (SELECT COUNT(*) FROM draft_dataset d2 WHERE d2.dat_work_id = wrk_id AND dat_geocoded = 1) GeorreferencedCount
								, (SELECT COUNT(*) FROM draft_metric_version_level mvl
																				JOIN draft_dataset d2 ON mvl.mvl_dataset_id = d2.dat_id
																					WHERE d2.dat_work_id = wrk_id) MetricCount
															FROM draft_work
											LEFT JOIN draft_metadata ON wrk_metadata_id = met_id
									WHERE " . $condition . " ORDER BY met_title";
			$ret = App::Db()->fetchAll($sql, array($userId, $userId));
			Arr::IntToBoolean($ret, array('IsPrivate', 'IsIndexed', 'SegmentedCrawling', 'IsArchived', 'IsDeleted', 'IsExample'));
			Profiling::EndTimer();
			return $ret;
	}


	public function CreateWorkIcon($workId, $name, $image)
	{
		$icon = new entities\DraftWorkIcon();

		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);

		$file = new entities\DraftFile();
		$file->setName($name);

		$icon->setWork($draftWork);
		$icon->setFile($file);

		if (!$image)
			throw new ErrorException("No se ha recibido la imagen");

		$fileController = new FileService($this->isDraft);
		$fileController->SaveBase64BytesToFile($image, $file, $workId,
										self::MAX_ICON_WIDTH, self::MAX_ICON_HEIGHT);

		App::Orm()->Save($icon);

		WorkFlags::SetMetadataDataChanged($workId);

		return $icon;
	}

	public function UpdateWorkIcon($workId, $iconId, $name)
	{
		$draftWorkIcon = App::Orm()->find(entities\DraftWorkIcon::class, $iconId);

		if ($draftWorkIcon->getWork()->getId() !== $workId)
			throw new ErrorException("El ícono no coincide con la obra");

		$file = $draftWorkIcon->getFile();
		$file->setName($name);
		App::Orm()->Save($file);

		WorkFlags::SetMetadataDataChanged($workId);

		return self::OK;
	}

	public function DeleteWorkIcon($workId, $iconId)
	{
		$draftWork = App::Orm()->find(entities\DraftWork::class, $workId);
		$draftWorkIcon = App::Orm()->find(entities\DraftWorkIcon::class, $iconId);

		if ($draftWorkIcon->getWork()->getId() !== $workId)
			throw new ErrorException("El ícono no coincide con la obra");

		$fileId = $draftWorkIcon->getFile()->getId();

		App::Db()->exec("DELETE FROM draft_work_icon WHERE wic_id = ?", array($iconId));
		App::Db()->markTableUpdate('draft_work_icon');

		$fileService = new FileService($this->isDraft);
		$fileService->DeleteFile($fileId, $workId);

		WorkFlags::SetMetadataDataChanged($workId);

		return self::OK;
	}

}
