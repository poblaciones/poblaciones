<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\classes\Session;

use minga\framework\Date;
use minga\framework\Profiling;
use helena\entities\frontend\work\AnnotationsInfo;

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

		$sql = "SELECT ann_id AS AnnotationId, ann_caption AS AnnotationCaption, ann_guest_access AS AnnotationGuestAccess,
				  ann_allowed_types AS AnnotationAllowedTypes,
				  ani_id AS Id,  ani_type AS Type, ani_centroid AS Centroid, ani_geometry AS Geometry, ani_order AS OrderNumber,
				  ani_caption AS CaptionText, ani_description AS Description, ani_color AS Color, ani_length_m AS LengthMeters,
				  ani_area_m2 AS AreaSquareMeters, ani_create AS Created, ani_user AS Created, ani_update AS Updated
				FROM draft_annotation JOIN draft_annotation_item ON ann_id = ani_annotation_id WHERE ann_work_id = ?
				ORDER BY ann_caption, ann_id, ani_order";

		$ret = App::Db()->fetchAll($sql, $params);
		$block = [];
		$annotations = [];
		$lastAnnotationId = null;
		foreach($ret as $row)
		{
			if ($lastAnnotationId != $row["AnnotationId"])
			{
				$lastAnnotationId = $row["AnnotationId"];
				$this->AppendAnnotation($annotations, $block);
				$block = [];
			}
			$block[] = $row;
		}
		$this->AppendAnnotation($annotations, $block);

		Profiling::EndTimer();
		return $annotations;
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