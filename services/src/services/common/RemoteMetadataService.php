<?php

namespace helena\services\common;

use minga\framework\Date;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use minga\framework\IO;
use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\Performance;
use minga\framework\WebConnection;

use helena\classes\Links;
use helena\caches\PdfMetadataCache;
use helena\caches\DictionaryMetadataCache;
use helena\services\common\BaseService;
use helena\db\frontend\MetadataModel;
use helena\db\frontend\FileModel;
use helena\classes\App;
use minga\framework\Context;
use helena\classes\PdfCreator;
use helena\classes\Statistics;
use helena\db\backoffice\WorkModel;
use OpenSpout\Writer\Common\Creator\WriterEntityFactory;
use OpenSpout\Writer\Common\Creator\Style\StyleBuilder;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Writer\XLSX\Entity\SheetView;


class RemoteMetadataService extends BaseService
{
	public function GetMetadataFile($metadataId, $fileId)
	{
		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$url = $dynamicServer->publicUrl . '/services/metadata/GetMetadataFile';
		$args = ['m' => $metadataId, 'f' => $fileId];

		return App::FlushRemoteFile($url, $args);
	}

	public function GetWorkMetadataPdf($metadataId, $datasetId, $workId, $link)
	{
		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$url = $dynamicServer->publicUrl . '/services/metadata/GetWorkMetadataPdf';
		$args = ['m' => $metadataId, 'd' => $datasetId, 'w' => $workId, 'l' => $link];

		return App::FlushRemoteFile($url, $args);
	}

	public function GetMetadataPdf($metadataId, $workId)
	{
		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$url = $dynamicServer->publicUrl . '/services/metadata/GetMetadataPdf';
		$args = ['m' => $metadataId, 'w' => $workId];

		return App::FlushRemoteFile($url, $args);
	}


}

