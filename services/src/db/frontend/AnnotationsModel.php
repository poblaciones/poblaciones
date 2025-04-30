<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\classes\Session;
use helena\classes\GeoJson;

use minga\framework\Date;
use minga\framework\Profiling;
use helena\entities\frontend\work\AnnotationsInfo;

use helena\entities\frontend\geometries\Coordinate;
use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Envelope;

class AnnotationsModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'anotation';
		$this->idField = 'ann_id';
		$this->captionField = 'ann_caption';

	}

	public function GetAnnotations($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT ann_id AS Id, ann_work_id AS WorkId, ann_caption AS Caption, ann_guest_access AS GuestAccess,
				  ann_allowed_types AS AllowedTypes
				FROM draft_annotation WHERE ann_work_id = ?
				ORDER BY ann_caption";
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetAnnotationItems($workId, $annotationId)
	{
		Profiling::BeginTimer();
		$params = array($workId, $annotationId);

		$sql = "SELECT ani_id AS Id, ani_type AS Type, ST_Y(ani_centroid) AS Lat, ST_X(ani_centroid) AS Lon,
					ani_geometry AS Geometry, ani_order AS OrderNumber,
				  ani_caption AS Description, ani_description AS Content, ani_color AS Color,
					ani_length_m AS LengthMeters,
					'' AS LID,
					'' AS Symbol,
				  ani_area_m2 AS AreaSquareMeters, ani_create AS Created, ani_user AS Created, ani_update AS Updated
				FROM draft_annotation JOIN draft_annotation_item ON ann_id = ani_annotation_id WHERE ann_work_id = ? AND ani_annotation_id = ?
				ORDER BY ani_order";

		$annotationItems = App::Db()->fetchAll($sql, $params);
		$geo = new GeoJson();
		//$envelope = Envelope::FromCircle($frame->ClippingCircle)->Trim();

		foreach($annotationItems as &$item)
		{
			$item['Geometry'] = $geo->GenerateFromBinary(array(array('name' => '', 'value' => $item['Geometry'], 'FID' => $item['Id'])));
		}
		Profiling::EndTimer();
		return $annotationItems;
	}

	private function AppendAnnotation(&$annotations, $block)
	{
		if (sizeof($block) == 0)
			return;
		// Lo crea
		$annotation = new AnnotationsInfo();
		$annotation->Fill($block[0]);
		$annotation->FillItems($block);
		// Lo agrega
		$annotations[] = $annotation;
	}
}