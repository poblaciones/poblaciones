<?php

namespace helena\classes;

use helena\classes\App;

use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\Profiling;
use helena\services\backoffice\publish\PublishDataTables;


class DbFile
{

	public static function GetChunksTableName($fromDraft, $workId)
	{
		if ($workId)
		{
			if ($fromDraft)
			{
				return "work_file_chunk_draft_" . str_pad('' . $workId, 6, '0', STR_PAD_LEFT);
			}
			else
			{
				$shard = App::Settings()->Shard()->CurrentShard;
				$unshardify = PublishDataTables::Unshardify($workId);
				return "work_file_chunk_shard_" . $shard. "_" . str_pad('' . $unshardify, 6, '0', STR_PAD_LEFT);
			}
		}
		else
		{
			if ($fromDraft)
				return 'draft_file_chunk';
			else
				return 'file_chunk';
		}

	}
}
