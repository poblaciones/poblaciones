<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\services\backoffice\publish\PublishDataTables;

use minga\framework\Profiling;
use minga\framework\Str;
use helena\entities\frontend\geometries\Envelope;
use helena\classes\SpecialColumnEnum;
use helena\classes\App;
use helena\classes\DatasetTypeEnum;
use minga\framework\PublicException;
use helena\db\backoffice\WorkModel;

class SnapshotByDatasetModel
{
	public function RegenDatasetLevels($datasetId)
	{
		Profiling::BeginTimer();
		$datasetIdShardified = PublishDataTables::Shardified($datasetId);

		$workModel = new WorkModel(false);
		$dataset = $workModel->GetDataset($datasetIdShardified);

		if (sizeof($dataset) == 0 || $dataset == null)
			throw new PublicException("Dataset no encontrado");

		$columns = $this->BuildHeaders($dataset);

		$levels = $this->GetDatasetLevels($dataset['dat_id']);
		$variables = $this->GetAllVariables($levels);
		foreach ($variables as $variable)
		{
			$this->BuildVariableColumns($datasetId, $variable, $columns);
		}

		if (App::Db()->tableExists($dataset['dat_table']))
		{
			$this->CreateTable($dataset, $columns);
			$this->InsertValues($dataset, $columns);
			$this->UpdateSequences($dataset, $variables);

			foreach ($levels as $level)
			{
				$this->UpdateExtents($dataset, $level);
			}
		}

		Profiling::EndTimer();
	}

	public static function SnapshotTable($table)
	{
		return $table . "_snapshot";
	}

	private function CreateTable($dataset, $columns)
	{
		Profiling::BeginTimer();

		// Hace el drop preventivo
		$table = self::SnapshotTable($dataset['dat_table']);
		App::Db()->dropTable($table);

		// Hace el create
		$sqlCols = '';
		foreach($columns as $column)
			$sqlCols .= "," . $column[0] . ' ' . $column[1];
		$sql = "CREATE TABLE " . $table . " (" . substr($sqlCols, 1) . ",
								 INDEX (sna_geography_item_id), SPATIAL INDEX(sna_envelope), SPATIAL INDEX(sna_location)) ENGINE=MyISAM;";
		App::Db()->execDDL($sql);
		App::Db()->markTableUpdate($table);

		// Listo
		Profiling::EndTimer();
	}
	private function GetNextRow($dataset, $columns)
	{
		Profiling::BeginTimer();

		$table = $dataset['dat_table'];

        $sqlOffset = "SELECT COUNT(*) FROM " . self::SnapshotTable($table);
        $offset = App::Db()->fetchScalarInt($sqlOffset);

		$description = $this->GetDescriptionColumn($dataset);
		$fields = "";
		$extra = "";
		if ($description !== 'null')
			$fields = "," . $description . ' AS caption';
		foreach($columns as $column)
			if ($column[0] == 'sna_location')
            {
                $extra = $column[3];
				break;
            }
		if ($extra)
        {
            $fields .= "," . $extra . ' AS info';
        }
        if (!$fields) {
            return '';
        }
        // Arma el SELECT
        $sql = "SELECT " . substr($fields, 1);
        // Pone valores
        $sql .= " FROM " . $table . " ORDER BY id LIMIT 1 OFFSET " . $offset;
        $ret = App::Db()->fetchAssoc($sql);
        $text = "Registro: Posición " . $offset . ". ";
        if ($ret) {
            if (array_key_exists('caption', $ret)) {
                $text .= " Descripción: '" . $ret['caption'] . "'. ";
            }
            if (array_key_exists('info', $ret)) {
                $text .= " Valores: '" . $ret['info'] . "'. ";
            }
        }
        return $text;
    }

	private function InsertValues($dataset, $columns)
	{
		Profiling::BeginTimer();

		$sqlCols = '';
		foreach($columns as $column)
			$sqlCols .= "," . $column[0];
		$sqlValues = '';
		foreach($columns as $column)
			$sqlValues .= "," . ($column[2] === null ? "null" :  $column[2]);

		// Arma el FROM
		$table = $dataset['dat_table'];
		$snapshotTable = self::SnapshotTable($table);
		$sql = "INSERT INTO " . $snapshotTable . " (" . substr($sqlCols, 1) . ")
						SELECT " . substr($sqlValues, 1);
		// Pone valores
		$sql .= " FROM " . $table .
						" INNER JOIN geography_item geo ON geo.gei_id = geography_item_id";
		if ($dataset["dat_are_segments"])
			$sql .= " INNER JOIN geography_item geo_segment ON geo_segment.gei_id = geography_item_segment_id";

		// Cierra el select
		$sql .= " ORDER BY id";
        try
        {
            App::Db()->exec($sql);
			App::Db()->markTableUpdate($snapshotTable);
		}
		catch(\Exception $ex)
        {
            $msg = $ex->getMessage();
			if (Str::EndsWith($msg, "Cannot get geometry object from data you send to the GEOMETRY field"))
            {
                $text = '';
                // Obtiene información y armar el error
                $text = "El dataset '" . $dataset['dat_caption'] . "' contiene elementos cuyas geometrías o valores para ubicaciones no son válidas.\n\n";
                $text .= $this->GetNextRow($dataset, $columns);
				$text .= "\n\nVerifique estos valores e intente publicar nuevamente.";
				throw new PublicException($text);
            }
			else
            {
                throw $ex;
            }
        }
		Profiling::EndTimer();
	}

	public function GetDatasetLevels($datasetId)
	{
		Profiling::BeginTimer();

		$sql = "SELECT metric_version.*, metric_version_level.*, dataset.*, geo_id,
							geo_caption, geo_field_caption_name,
							caption.dco_field AS dat_caption_field,
							longitude.dco_field AS dat_longitude_field,
							latitude.dco_field AS dat_latitude_field,
							longitudeSegment.dco_field AS dat_longitude_field_segment,
							latitudeSegment.dco_field AS dat_latitude_field_segment

							FROM metric_version
							JOIN metric_version_level ON mvl_metric_version_id = mvr_id
						  JOIN dataset ON dat_id = mvl_dataset_id
							JOIN geography ON geo_id = dat_geography_id

							LEFT JOIN dataset_column latitude ON latitude.dco_id = dat_latitude_column_id
							LEFT JOIN dataset_column longitude ON longitude.dco_id = dat_longitude_column_id
							LEFT JOIN dataset_column latitudeSegment ON latitudeSegment.dco_id = dat_latitude_column_segment_id
							LEFT JOIN dataset_column longitudeSegment ON longitudeSegment.dco_id = dat_longitude_column_segment_id

							LEFT JOIN dataset_column caption ON caption.dco_id = dat_caption_column_id

							WHERE dat_id = ?";

		$ret = App::Db()->fetchAll($sql, array($datasetId));
		foreach($ret as &$metricVersionLevel)
		{
			$variables = Variable::GetVariables($metricVersionLevel);
			$metricVersionLevel['variables'] = $variables;
		}
		Profiling::EndTimer();
		return $ret;
	}

	private function GetAllVariables($levels)
	{
		$ret = [];
		foreach($levels as $level)
			$ret = array_merge($ret, $level['variables']);

		return $ret;
	}
	private function UpdateSequences($dataset, $variables)
	{
		$table = self::SnapshotTable($dataset['dat_table']);
		foreach($variables as $variable)
		{
			if ($variable->IsSequence())
			{
				$c1 = 'sna_' . $variable->Id() . '_value_label_id';
				$c2 = 'sna_' . $variable->Id() . '_sequence_value';
				$c3 = 'sna_' . $variable->Id() . '_sequence_order';
				// Arma la lista
				$sql = "CREATE TEMPORARY TABLE t ENGINE=MEMORY
									AS (SELECT sna_id, @rowid:= (CASE WHEN @last = " . $c1 . " THEN @rowid + 1 ELSE 1 END)
												AS pos, @last:= " . $c1 . " last
											FROM ". $table . ", (SELECT @rowid:=0) as init, (SELECT @last:=0) as last
									ORDER BY " . $c1 . ", " . $c2 . ")";
				App::Db()->exec($sql);
				// Actualiza
				$update = "UPDATE " . $table . " v JOIN t ON t.sna_id = v.sna_id SET " . $c3 . "= pos";
				App::Db()->exec($update);
				App::Db()->markTableUpdate($table);

				// Libera
				App::Db()->dropTemporaryTable('t');
			}
		}
	}

	private function UpdateExtents($dataset, $metricVersionLevel)
	{
		Profiling::BeginTimer();

		// Calcula la condición que muestra que tiene valores en esas
		// filas cuando son categoriales
		$variables = $metricVersionLevel['variables'];
		$notNullCondition = "";
		foreach ($variables as $variable)
		{
			if ($variable->attributes['vsy_cut_mode'] === 'V')
			{
				$col = 'sna_' . $variable->Id() . '_value_label_id';
				$notNullCondition .= " AND " . $col . " <> 0 AND " . $col . " IS NOT NULL ";
			}
		}
		// Calcula para cada level
		$sql = "SELECT ST_AsText(PolygonEnvelope(LineString(
                POINT(Min(ST_X(ST_PointN(ST_ExteriorRing(sna_envelope), 1))),
				MIN(ST_Y(ST_PointN(ST_ExteriorRing(sna_envelope), 1)))),

				POINT(Max(ST_X(ST_PointN(ST_ExteriorRing(sna_envelope), 3))),
				MAX(ST_Y(ST_PointN(ST_ExteriorRing(sna_envelope), 3))))
                              ))) extents
				FROM  " . self::SnapshotTable($dataset['dat_table']);
		if ($notNullCondition !== '')
			$sql .= " WHERE " . substr($notNullCondition, 4);

		$res = App::Db()->fetchAssoc($sql);

		if ($res['extents'] !== null)
		{
			$envelope = Envelope::FromDb($res['extents']);
			$rect = "ST_PolygonFromText('" . $envelope->ToWKT() . "')";
		}
		else
		{
			$rect = 'null';
		}
		// Lo pone
		$metricVersionLevelId = $metricVersionLevel['mvl_id'];
		$unShardifiedId = PublishDataTables::Unshardify($metricVersionLevelId);
		$update = "UPDATE draft_metric_version_level SET mvl_extents = " . $rect . " WHERE mvl_id = ?";
		App::Db()->exec($update, array($unShardifiedId));
		App::Db()->markTableUpdate('draft_metric_version_level');

		// Listo
		Profiling::EndTimer();
	}


	private function BuildHeaders($dataset)
	{
		// $dataset = recibe $dataset + geography
		$columns = [];
		$columns[] = ['sna_id', 'int(11) PRIMARY KEY', 'id'];
		$columns[] = ['sna_geography_item_id', 'int(11) NOT NULL', 'geo.gei_id'];
		$columns[] = ['sna_urbanity', "char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N'", 'geo.gei_urbanity'];
		$description = $this->GetDescriptionColumn($dataset);
		if ($description !== 'null')
			 $description = 'LEFT(' . $description . ', 250)';
		$columns[] = ['sna_description', 'varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL', $description];
		// resuelve el ícono
		if ($dataset['dmk_type'] !== 'N' && $dataset['dmk_source'] === 'V')
		{
			if ($dataset['dmk_content_field'])
				$contentField = $dataset['dmk_content_field'];
			else
				$contentField = 'null';
			$columns[] = ['sna_symbol', 'varchar(10240) COLLATE utf8_unicode_ci DEFAULT NULL', $contentField];
		}

		$columns[] = ['sna_feature_id', 'bigint(11) NOT NULL', $this->GetFeatureIdField($dataset)];
		$columns[] = ['sna_area_m2', 'double NOT NULL', $this->GetArea($dataset)];

		$envelopeTarget = '';
		$location = '';
		if ($dataset['partition_column_field'])
		{
				$columns[] = ['sna_partition', 'int(11) NOT NULL', $dataset['partition_column_field']];
		}

		if ($dataset['dat_are_segments'])
		{
			$segment = self::ResolveSegmentPolygon($dataset);
			$location = "GeometryCentroid(" . $segment . ")";
			$envelopeTarget = $segment;
			$columns[] = ['sna_segment', 'linestring NOT NULL', $segment];
            $location_info = 'CONCAT(' . $dataset['dat_latitude_field'] . ', ' . $dataset['dat_longitude_field'] . ' - '
				 . $dataset['dat_latitude_field_segment'] . ', ' . $dataset['dat_longitude_field_segment'] . ')';
        }
		else
		{
			if ($dataset['dat_type'] == DatasetTypeEnum::Data)
			{
				$envelopeTarget = "geo.gei_geometry";
				$location = "geo.gei_centroid";
                $location_info = "";
			}
			else if ($dataset['dat_type'] == DatasetTypeEnum::Locations)
			{
				$point = "POINT(DmsToDecimal(" . $dataset['dat_longitude_field'] . "), DmsToDecimal(" .
                    $dataset['dat_latitude_field'] . ") )";
				$envelopeTarget = $point;
				$location = $point;
                $location_info = 'CONCAT(' . $dataset['dat_latitude_field'] . ', ' . $dataset['dat_longitude_field'] . ')';
			}
			else if ($dataset['dat_type'] == DatasetTypeEnum::Shapes)
			{
				$envelopeTarget = "geometry";
				$location = "centroid";
				$location_info = "ST_AsText(geometry)";
			}
			else
				throw new PublicException("Tipo de dataset no reconocido.");
		}
		$columns[] = ['sna_envelope', 'polygon NOT NULL', "PolygonEnvelope(" . $envelopeTarget . ")"];
		$columns[] = ['sna_location', 'point NOT NULL', $location, $location_info];

		return $columns;
	}

	public static function ResolveSegmentPolygon($dataset)
	{
		if ($dataset['dat_type'] == DatasetTypeEnum::Data)
		{
			return "LINESTRING(geo.gei_centroid, geo_segment.gei_centroid)";
		}
		else if ($dataset['dat_type'] == DatasetTypeEnum::Locations)
		{
			return "LINESTRING(POINT(DmsToDecimal(" . $dataset['dat_longitude_field'] . "), DmsToDecimal(" .
																$dataset['dat_latitude_field'] . ") )," .
										"POINT(DmsToDecimal(" . $dataset['dat_longitude_field_segment'] . "), DmsToDecimal(" .
																$dataset['dat_latitude_field_segment'] . ") ))";
		}
		else
			throw new PublicException("Tipo de dataset no válido para segmentos.");

	}

	private function BuildVariableColumns($datasetId, $variable, &$columns)
	{
		// Calcula el valor
		$columns[] = ['sna_' . $variable->Id() . '_value', 'double NULL', $variable->CalculateValueField()];

		// Calcula la categoría
		$valueForSegmentation = $variable->CalculateSegmentationValueField();
		$valueLabel = $variable->CalculateVersionValueLabelId($valueForSegmentation);
		$columns[] = ['sna_' . $variable->Id() . '_value_label_id', 'int(11) NOT NULL', $valueLabel];

		// total de normalización
		$totalValue = $variable->CalculateNormalizationField();
		if ($variable->HasFilters())
		{
			$totalSql = "(CASE WHEN " . $variable->CalculateFilterCondition($datasetId) . " THEN " . $totalValue . " ELSE NULL END)";
		}
		else
		{
			$totalSql = $totalValue;
		}
		$columns[] = ['sna_' . $variable->Id() . '_total', "double NULL DEFAULT '0'", $totalSql];

		// Se fija si precisa traer el valor de una secuencia
		if ($variable->IsSequence())
		{
			$columns[] = ['sna_' . $variable->Id() . '_sequence_value', "double NOT NULL DEFAULT '0'", $variable->SequenceField()];
			$columns[] = ['sna_' . $variable->Id() . '_sequence_order', "int NOT NULL DEFAULT '0'", '0'];
		}
	}

	public static function UseGeographyItemPolygon($dataset)
	{
		return !($dataset['dat_type'] == DatasetTypeEnum::Shapes ||
			$dataset['dat_type'] == DatasetTypeEnum::Locations ||
			$dataset['dat_are_segments']);
	}

	private function GetFeatureIdField($dataset)
	{
		if (self::UseGeographyItemPolygon($dataset))
		{
			return "gei_id";
		}
		else
			return $dataset["dat_id"] . " * 0x100000000 + id";
	}

	private function GetArea($dataset)
	{
		return Variable::SpecialColumnToField(SpecialColumnEnum::AreaM2, $dataset['dat_type'], $dataset['dat_are_segments']);
	}
	private function GetDescriptionColumn($metricVersionLevel)
	{
		if ($metricVersionLevel['dat_caption_field'] == null)
		{
			if ($metricVersionLevel['geo_field_caption_name'] == "" || $metricVersionLevel['dat_are_segments'])
				return "null";
			else
				return "gei_caption";
		}
		else
		{
			return self::ResolveDescriptionField($metricVersionLevel['dat_caption_column_id'], $metricVersionLevel['dat_caption_field']);
		}
	}

	public static function ResolveDescriptionField($columnId, $field)
	{
		// Se fija si hay valueLabels para dat_caption_column_id
		if (self::HasValueLabels($columnId))
		{
			return 'IFNULL((SELECT dla_caption FROM dataset_column_value_label
								WHERE dla_dataset_column_id = ' . $columnId . ' AND dla_value = ' . $field . '), ' . $field . ')';
		}
		else
		{
			return $field;
		}
	}

	private static function HasValueLabels($columnId)
	{
		$ret = App::Db()->fetchScalarInt('SELECT EXISTS(SELECT * FROM dataset_column_value_label
																	WHERE dla_dataset_column_id = ' . $columnId . ')');
		return $ret === 1;
	}
}
