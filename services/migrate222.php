<?php

use minga\framework\Profiling;
use minga\framework\Context;
use helena\classes\App;
use  helena\services\backoffice\publish\SnapshotsManager;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\snapshots\SnapshotMetricVersionModel;
use helena\services\backoffice\publish\CacheManager;

require_once __DIR__.'/startup.php';

Context::Settings()->Debug()->profiling = true;
Profiling::BeginShowQueries(true, true);

// Trae la lista de datasets migrables
$datasets = App::Db()->fetchAll("select * from dataset");
echo 'Migración de tablas para versión 2.22' . " \n";

$snapshotsManager = new SnapshotsManager();

$n = 1;
foreach($datasets as $dataset)
{
	echo 'Dataset: ' . $dataset['dat_id'] . " (" . $n++ . " de " . sizeof($datasets) .")\n";
	$unshardified = PublishDataTables::Unshardify($dataset['dat_id']);
	$snapshotsManager->UpdateDatasetMetrics(['dat_id' => $unshardified]);
	echo "\nCompleto.\n\n";
}
echo "Drop de snapshot_metric_version_item_variable...\n";

App::Db()->dropTable("snapshot_metric_version_item_variable");

echo "\nDrop de cachés...\n";
$model = new SnapshotMetricVersionModel();
$model->IncrementAllSignatures();
$cm = new CacheManager();
$cm->CleanAllMetricCaches();


echo "\nListo.\n";

