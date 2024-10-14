<?php

namespace helena\classes;

use minga\framework\Db;
use minga\framework\IO;
use minga\framework\Log;
use minga\framework\Str;
use minga\framework\Request as FrameworkRequest;
use minga\framework\Params;
use minga\framework\Performance;
use minga\framework\Context;
use minga\framework\Profiling;
use minga\framework\MessageBox;
use minga\framework\PhpSession;
use minga\framework\GlobalizeDebugSession;
use minga\framework\WebConnection;
use minga\framework\settings\CacheSettings;

use helena\classes\Paths;
use helena\classes\settings\LocalSettings;

use Twig\Environment;
use Twig\Extension\StringLoaderExtension;
use Twig\Loader\FilesystemLoader;

use JMS\Serializer\SerializerBuilder;
use JMS\Serializer\SerializationContext;
use JMS\Serializer\Naming\IdenticalPropertyNamingStrategy;

use Symfony\Component\PropertyInfo\Extractor\ReflectionExtractor;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;

class App
{
	public static $app;
	public static $attributes = [];
	public static $db = null;
	public static $orm = null;
	public static $isJson = false;
	private static $contentType = null;
	private static $debugWasSet = false;

	private static function getTwigEngine()
	{
		if (!array_key_exists('twig', self::$attributes))
		{
			Profiling::BeginTimer();
			// instancia un twig para mensajes
			$paths = array_merge(Paths::GetMacrosPaths(), Paths::GetTemplatePaths());
			$loaderMsg = new FilesystemLoader($paths);
			$twigMsg = new Environment($loaderMsg, array('cache' => Context::Paths()->GetTwigCache(),
				'debug' => Context::Settings()->Debug()->debug));

			$twigMsg->addExtension(new StringLoaderExtension());

			self::$attributes['twig'] = $twigMsg;
			Profiling::EndTimer();
		}
		return self::$attributes['twig'];
	}

	private static $settings = null;

	public static function Settings() : LocalSettings
	{
		if(self::$settings == null)
			self::$settings = new LocalSettings();

		return self::$settings;
	}
	private static function getMessageTwigEngine()
	{
		if (!array_key_exists('twigMsg', self::$attributes))
		{
			Profiling::BeginTimer();
			// instancia un twig para mensajes
			$paths = array_merge(Paths::GetMacrosPaths(), Paths::GetMessagesPaths());
			$loaderMsg = new FilesystemLoader($paths);
			$twigMsg = new Environment($loaderMsg, array('cache' => Context::Paths()->GetTwigCache(),
				'debug' => Context::Settings()->Debug()->debug));

			$twigMsg->addExtension(new StringLoaderExtension());

			self::$attributes['twigMsg'] = $twigMsg;
			Profiling::EndTimer();
		}
		return self::$attributes['twigMsg'];
	}

	public static function Debug()
	{
		return self::$app['debug'];
	}

	public static function SetSessionDebug($value)
	{
		self::doSetSessionDebug($value);
	}

	public static function SetDebug($value)
	{
		Context::Settings()->Debug()->settingsDebug = $value;
		self::doSetSessionDebug($value);
	}

	private static function doSetSessionDebug($value)
	{
		if (self::$debugWasSet)
			return;
		Context::Settings()->Debug()->debug = $value;
		self::$app['debug'] = $value;
		if ($value) {
			//GlobalizeDebugSession::GlobalizeDebug();
			self::$debugWasSet = true;
		}
	}


	public static function SetDbConfig($db)
	{
		self::$app['db.options'] = $db;
	}

	public static function GetDbConfig()
	{
		return self::$app['db.options'];
	}

	public static function AutoCommit()
	{
		if (self::$orm !== null)
		{
				self::Orm()->flush();
				self::$orm = null;
		}
		if (self::$db !== null)
			self::Db()->ensureCommit();
	}
	public static function EndRequest($ommitExit = false)
	{
		Performance::End();
		if (!$ommitExit)
			exit();
	}

	public static function RenderResolve($templates, $args)
	{
		$twig = self::getTwigEngine();
		return $twig->resolveTemplate($templates)->render($args);
	}

	public static function NotFoundResponse($text = 'Page not found.')
	{
		$response = self::Response($text, 'text-html');
		$response->setStatusCode(404);
		return $response;
	}

	public static function NotFoundExit($text = 'Page not found.')
	{
		MessageBox::Set404NotFoundHeaders();
		echo $text;
		self::EndRequest();
	}

	public static function RedirectKeepingParams($url, $status = 302)
	{
		$ret = $url;
		$params = FrameworkRequest::GetQueryString();
		if ($params)
		{
			if (Str::Contains($ret, "?") == false)
				$ret .= "?";
			else
				$ret .= "&";
			$ret .= $params;
		}
		return self::Redirect($ret, $status);
	}

	public static function Redirect($url, $status = 302)
	{
		return self::$app->redirect($url, $status);
	}

	public static function Request()
	{
		return self::$app['request_stack']->getCurrentRequest();
	}

	public static function Get($route, $fn)
	{
		self::$app->get($route, $fn);
	}
	public static function Post($route, $fn)
	{
		self::$app->post($route, $fn);
	}
	public static function GetOrPost($route, $fn)
	{
		self::Get($route, $fn);
		self::Post($route, $fn);
	}
	public static function GenerateUrl($url, $params = array())
	{
		return self::$app['url_generator']->generate($url, $params);
	}

	public static function RedirectParams($url, $params, $status)
	{
		return self::$app->redirect(self::$app['url_generator']->generate($url, $params), $status);
	}


	private static function OrphanSqlWhere()
	{
		$db = Context::Settings()->Db()->Name;
		$tableNameBase = "left(TABLE_NAME, POSITION('_matrix' IN CONCAT(replace(replace(replace(  TABLE_NAME, '_errors', ''), '_retry', ''), '_snapshot', ''), '_matrix')) - 1)";
		$where =
		"(TABLE_NAME LIKE 'work_dataset_draft_%' or TABLE_NAME LIKE 'work_dataset_shard_%') AND " .
		"NOT EXISTS (SELECT * from " . $db . ".draft_dataset WHERE dat_table COLLATE utf8_unicode_ci = " . $tableNameBase . ") AND " .
		"NOT EXISTS (SELECT * from " . $db . ".dataset WHERE dat_table COLLATE utf8_unicode_ci = " . $tableNameBase . ")";
		return $where;
	}

	public static function GetOrphanSet()
	{
		try
		{
			Profiling::BeginTimer();
			$sql = "SELECT TABLE_NAME `table`
				FROM information_schema.tables
				WHERE table_schema = ? AND " . self::OrphanSqlWhere() . " ORDER BY TABLE_NAME";

			return self::Db()->fetchAll($sql,
				[Context::Settings()->Db()->Name]);
		}
		catch(\Exception $e)
		{
			Log::HandleSilentException($e);
			return '-1';
		}
		finally
		{
			Profiling::EndTimer();
		}
	}
	public static function GetOrphanSize()
	{
		try
		{
			Profiling::BeginTimer();
			$sql = "SELECT
				SUM(data_length + index_length) AS size
				FROM information_schema.tables
				WHERE table_schema = ? AND " . self::OrphanSqlWhere();
			return self::Db()->fetchAssoc($sql,
				[Context::Settings()->Db()->Name]);
		}
		catch(\Exception $e)
		{
			Log::HandleSilentException($e);
			return '-1';
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	public static function GetTmpSize()
	{
		try
		{
			Profiling::BeginTimer();
			$sql = "SELECT
				SUM(data_length + index_length) AS size
				FROM information_schema.tables
				WHERE table_schema = ? AND TABLE_NAME like 'tmp_work_dataset_%'";
			return self::Db()->fetchAssoc($sql,
				[Context::Settings()->Db()->Name]);
		}
		catch(\Exception $e)
		{
			Log::HandleSilentException($e);
			return '-1';
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	public static function RedirectLogin()
	{
		return self::Redirect(self::RedirectLoginUrl());
	}

	public static function AbsoluteLocalUrl($url)
	{
		return self::AbsoluteUrl($url, true);
	}

	public static function AbsoluteUrl($url, $locaLink = false)
	{
		if ($locaLink)
			$host = App::Settings()->Servers()->Current()->publicUrl;
		else
			$host = App::Settings()->Servers()->Main()->publicUrl;
		$hasBar = substr($url, 0, 1) === '/';
		if (!$hasBar)
		{
			if (array_key_exists('REQUEST_URI', $_SERVER)) {
				$uri = $_SERVER['REQUEST_URI'];
			} else $uri = '';

			if ($url != "")
			{
				$n = strrpos($uri, '/');
				$host .= substr($uri, 0, $n);
			}
			else
				$host .= $uri;

			if ($url != "" && substr($host, -1) !== '/')
			$host .= "/";
		}
		return $host . $url;
	}
	public static function RedirectLoginUrl()
	{
		$locaLink = Str::StartsWith(FrameworkRequest::GetRequestURI(), "/logs");
		$actual_link = self::AbsoluteUrl('', $locaLink);
		$url = self::AbsoluteUrl('/authenticate/login', $locaLink);

		$url = Str::AppendParam($url, 'ask', 1);
		$url = Str::AppendParam($url, 'to', $actual_link);
		return $url;
	}

	public static function OrmJson($entity){
		$value = self::OrmSerialize($entity);
		$response = new Response($value);
		$response->headers->set('Content-Type', 'application/json');
//		$response->headers->set('Content-Type', 'text/plain');

		return $response;
	}

	public static function Response($content, $contentType, $statusCode = 200){
		$response = new Response($content);
		$response->headers->set('Content-Type', $contentType);
		$response->setStatusCode($statusCode);
		return $response;
	}

	private static function GetSerializer(){
		$encoders = array(new JsonEncoder());
		$normalizer = new ObjectNormalizer(null, null, null, new ReflectionExtractor());
		$normalizer->setCircularReferenceLimit(1);
		// Add Circular reference handler
		/*$normalizer->setCircularReferenceHandler(function ($object) {
			return get_class($object);
		});*/

		$dateTimeNormalizer = new DateTimeNormalizer('d-m-Y H:i');
		$normalizers = array($dateTimeNormalizer, $normalizer);
		$serializer = new Serializer($normalizers, $encoders);
		return $serializer;
	}

	public static function OrmSerialize($entity){
		Profiling::BeginTimer();
		$context = new SerializationContext();
		$context->setSerializeNull(true);
		$serializer = SerializerBuilder::create()->setPropertyNamingStrategy(new IdenticalPropertyNamingStrategy())->build();
		$value = $serializer->serialize($entity, 'json', $context);
		Profiling::EndTimer();
		return $value;
	}
	public static function ReconnectJsonParam($className, $param) {
		Profiling::BeginTimer();
		$value = Params::Get($param, null);
		if ($value === null) return null;
		$newValue = json_decode($value);
		$sessionEntity = self::Orm()->Reconnect($className, $newValue);
		Profiling::EndTimer();
		return $sessionEntity;
	}
	public static function ReconnectJsonParamMandatory($className, $param) {
		Profiling::BeginTimer();
		Params::GetMandatory($param);
		$sessionEntity = self::ReconnectJsonParam($className, $param);
		Profiling::EndTimer();
		return $sessionEntity;
	}

	public static function OrmDeserialize($className, $entity){
		$serializer = self::GetSerializer();
		return $serializer->deserialize($entity, $className, 'json');
	}
	public static function JsonImmutable($value, $alreadyEncoded = false, $gzipped = false)
	{
		$w = Params::GetIntMandatory('w');
		if ($w === 0)
			$expireDays = 0;
		else
			$expireDays = 1000;
		return self::Json($value, $expireDays, $alreadyEncoded, $gzipped);
	}

	public static function Json($value, $daysToExpire = -1, $alreadyEncoded = false, $gzipped = false)
	{
		$sessionStarted = PhpSession::GetSessionValue('started', null);
		$sessionTime = gmdate('D, d M Y H:i:s', intval($sessionStarted)) . ' GMT';
		//
		self::$isJson = true;

		if (version_compare(phpversion(), '7.1', '>=')) {
			ini_set('precision', '17');
			ini_set('serialize_precision', '-1');
		}

		// Procesa la compresión...
		$acceptsGzip = strstr(Params::SafeServer('HTTP_ACCEPT_ENCODING'), "gzip");
		if ($gzipped)
		{
			if (!$acceptsGzip)
			{
				// lo expande...
				$value = gzdecode($value);
			}
		}

		$response = new Response($alreadyEncoded ? $value : json_encode($value));
		if ($daysToExpire === -1 || self::Debug())
		{
			$response->headers->set('Cache-control', 'private');
			$response->headers->set('Last-Modified', $sessionTime);
		}
		else {
			$days = $daysToExpire * 86400;
			$response->headers->set('Pragma', '');
			$response->headers->set('Cache-Control', 'public, max-age=' . $days);
		}

		// Procesa la compresión...
		if ($gzipped && $acceptsGzip)
		{
			// pone los headers...
			$response->headers->set("X-Compression", "gzip");
			$response->headers->set("Content-Encoding", "gzip");
		}

		// Tiene que ir como text/plain porque si no complica los coars y cachés.
		$response->headers->set('Content-Type', 'text/plain');
		return $response;
	}

	public static function JsonCacheableImmutable(
				$cache,
				$cacheArgs,
				$dataCalculator,
				$skipCache = false)
	{
		$encodedZipData = null;
		if (!$skipCache)
		{
			if (sizeof($cacheArgs) === 1 && $cache->HasRawData($cacheArgs[0], $encodedZipData))
				return App::JsonImmutable($encodedZipData, true, true);
			if (sizeof($cacheArgs) === 2 && $cache->HasRawData($cacheArgs[0], $cacheArgs[1], $encodedZipData))
				return App::JsonImmutable($encodedZipData, true, true);
		}
		$encodedZipData = self::EncodeAndzip($dataCalculator());

		Performance::CacheMissed();
		Performance::SetMethod("get");

		if (!$skipCache)
		{
			if (sizeof($cacheArgs) === 1)
				$cache->PutRawData($cacheArgs[0], $encodedZipData);
			else if (sizeof($cacheArgs) === 2)
				$cache->PutRawData($cacheArgs[0], $cacheArgs[1], $encodedZipData);
		}
		return App::JsonImmutable($encodedZipData, true, true);
	}

	public static function EncodeAndzip($data)
	{
		if (sizeof($data->Data) > 25000)
		{
			return self::serializeCompressed($data);
		}
		else
			return gzencode(json_encode($data));
	}


	private static function serializeCompressed($data, $level='6')
	{
		$STEP = 25000;
		$rows = $data->Data;
		$data->Data = [];
		$template = json_encode($data);
		$nPos = strpos($template, '"Data":[]');
		$header = substr($template, 0, $nPos + 8);
		$footer = substr($template, $nPos + 8);

		$dest = IO::GetTempFilename();

    $mode='wb'.$level;
    if(! ($fp_out=gzopen($dest,$mode)))
			throw new \ErrorException("No pudo serializarse el resultado.");
		gzwrite($fp_out, $header);
		// Pone los chunks
		$total = 0;
		ini_set('serialize_precision', '-1');
		for($n = 0; $n < sizeof($rows); $n += $STEP)
		{
			$size = min($STEP, sizeof($rows) - $n);
			$arrayPart = array_slice($rows, $n, $size);
			$total += $size;

			$serialize = '' . json_encode($arrayPart);
			$serialize[0] = ($n > 0 ? ',': ' ');
			$serialize[strlen($serialize) - 1] = ' ';
			gzwrite($fp_out, $serialize);
		}
		$rows = null;
		gzwrite($fp_out, $footer);
		gzclose($fp_out);

		$ret = IO::ReadAllText($dest);
		IO::Delete($dest);
		return $ret;
	}

	private function gzcompressfile($source,$dest, $level='9')
	{
    $mode='wb'.$level;
    $error=false;
    if($fp_out=gzopen($dest,$mode))
		{
      if($fp_in=fopen($source,'rb'))
			{
				while(!feof($fp_in))
						gzwrite($fp_out,fread($fp_in,1024*512));
				fclose($fp_in);
      }
      else
				$error=true;

			gzclose($fp_out);
		}
    else
			$error=true;

		if($error)
			return false;
		else
			return true;
	}

	public static function RegisterControllerGetPost($path, $controllerClassName)
	{
		self::RegisterControllerGet($path, $controllerClassName);
		self::RegisterControllerPost($path, $controllerClassName);
	}

	public static function RegisterControllerPost($path, $controllerClassName)
	{
		$controller = new ControllerBound($controllerClassName, 'Post');
		return self::$app->post($path, $controller);
	}

	public static function RegisterControllerGet($path, $controllerClassName)
	{
		$controller = new ControllerBound($controllerClassName, 'Show');
		return self::$app->get($path, $controller);
	}

	public static function RegisterCRUDRoute($path, $controllerClassName)
	{
		self::RegisterControllerGet($path, $controllerClassName);
		self::RegisterControllerGet($path . 'Item', $controllerClassName . 'Item');
		self::RegisterControllerPost($path . 'Item', $controllerClassName . 'Item');
	}

	public static function FormFactory()
	{
		return self::$app['form.factory'];
	}


	public static function FlushRemoteFile($url, $args = null, $cache = null, $cacheKey = null)
	{
		$response = null;
		if ($cache)
		{
			$data = null;
			if ($cache->HasData($cacheKey, $data))
			{
				$response = $data;
				$tmp = IO::GetTempFilename();
				IO::WriteAllText($tmp, Str::Replace($response->content, "<title>", "<meta cached=1><title>"));
				$response->file = $tmp;
			}
		}
		// Lo trae
		if ($response === null)
		{
			// Trae el contenido
			$conn = new WebConnection();
			$conn->Initialize();
			$conn->SetFollowRedirects(false);
			$conn->SetHeader("INTERNAL", "1");
			$response = $conn->Get($url, '', 0, $args);
			$conn->Finalize();
			// Se fija si recibió un redirect...
			if ($response->IsRedirect())
			{
				return App::Redirect($response->GetLocationHeader(), $response->httpCode);
			}
		}
		$sending = App::SendFile($response->file, true);
		if (array_key_exists("content-disposition", $response->headers))
			$sending->headers->set('content-disposition', $response->headers['content-disposition']);

		if ($cache && ! $response->content)
		{
			$response->content = IO::ReadAllText($response->file);
			$cache->PutData($cacheKey, $response);
		}
		return $sending;
	}
	public static function FlushRemotePost($url, $args = null)
	{
		$response = null;
		$conn = new WebConnection();
		$conn->Initialize();
		$response = $conn->Post($url, '', $args);
		$conn->Finalize();

		$sending = App::SendFile($response->file, true);
		if (array_key_exists("content-disposition", $response->headers))
			$sending->headers->set('content-disposition', $response->headers['content-disposition']);
		return $sending;
	}

	public static function SendFile($file, $deleteAfterSend = false)
	{
		$ret = self::$app->SendFile($file);
		if ($deleteAfterSend)
			$ret->deleteFileAfterSend(true);
		if (self::$contentType !== null)
		    $ret->headers->set('Content-Type', self::$contentType);
		return $ret;
	}

	public static function StreamFile($filepath, $name)
	{
		ob_clean();
		$response = new StreamedResponse();
		$response->setCallback(function() use ($filepath) {
			IO::ReadFileChunked($filepath);
		});

		$disposition = "attachment; filename=\"" . rawurlencode ( $name ) .
														'"; filename*=UTF-8\'\'' . rawurlencode ( $name );

		$response->headers->set('Content-Disposition', $disposition);
		$response->headers->set('Content-Type', self::GetMimeType($name));
		return $response;
	}

	private static function GetMimeType($filename)
	{
		if(Str::EndsWith($filename, '.sav'))
			return 'application/x-vnd.spss-statistics-spd';
		else if(Str::EndsWith($filename, '.xlsx'))
			return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
		else if(Str::EndsWith($filename, '.zip'))
			return 'application/zip';
		else if(Str::EndsWith($filename, '.dta'))
			return 'application/x-stata';
		else if(Str::EndsWith($filename, '.rdata'))
			return 'application/octet-stream';
		else if(Str::EndsWith($filename, '.csv'))
			return 'text/csv;charset=ISO-8859-1';
		else
			return 'application/octet-stream';
	}

	public static function Db()
	{
		if (self::$db == null)
		{
			$connection = self::$app['db'];
			self::$db = new Db($connection, new SqlLogger());
		}
		return self::$db;
	}
	public static function Orm()
	{
		if (self::$orm == null)
			self::$orm = new Orm();
		return self::$orm;
	}
	public static function SetContentType($contentType)
	{
		self::$contentType = $contentType;
	}
	public static function Render($template, $args)
	{
		Profiling::BeginTimer();
		self::AddStandardParameters($args);
		$twig = self::getTwigEngine();
		$text = $twig->render($template, $args);
		$ret = new Response($text, 200);
		if (self::$contentType !== null)
	    $ret->headers->set('Content-Type', self::$contentType);

		Profiling::EndTimer();
		return $ret;
	}

	public static function RenderResponse($template, $args)
	{
		Profiling::BeginTimer();
		self::AddStandardParameters($args);
		$twig = self::getTwigEngine();
		echo $twig->render($template, $args);
		Profiling::EndTimer();
		self::EndRequest();
	}

	public static function RenderMessage($template, $vals = array())
	{
		self::AddStandardParameters($vals);
		$styleP = "style='margin: 3px 0 0px 0;'";
		$vals['stylesP'] = $styleP;
		$stylePLeft = "style='text-align: left;margin: 3px 0 0px 0;'";
		$vals['stylesPLeft'] = $stylePLeft;
		$twig = self::getMessageTwigEngine();
		return $twig->render($template, $vals);
	}

	private static function AddStandardParameters(&$vals)
	{
		$vals['home_url'] = Links::GetHomeUrl();
		$vals['home_maps_url'] = "/";
		$vals['maps_info_url'] = Links::GetInstitutionalUrl();
		$vals['maps_send_url'] = "/send";
		$vals['terms_url'] = Links::GetTermsUrl();
		$vals['privacy_url'] = Links::GetPrivacyUrl();
		$vals['maps_faq_url'] = "/faq";
		$vals['maps_feedback_url'] =  Links::GetContactUrl();
		$vals['maps_backoffice_url'] = Links::GetBackofficeUrl();
		$mainUrl = App::Settings()->Servers()->Main()->publicUrl;
		$vals['site_maps_url'] = Str::EnsureEndsWith($mainUrl, "/") . "map";
		$vals['logos_url'] = "/static/img/logos";
		if (array_key_exists('current_user', $vals) === false)
			$vals['current_user'] = null;
		return;
	}

	public static function GetPhpCli()
	{
		return Context::Settings()->Servers()->PhpCli;
	}

	public static function GetPython3Path()
	{
		if (Context::Settings()->Servers()->Python3 === null
			&& isset(self::$app['python']))
		{
				return self::$app['python'];
		}
		return Context::Settings()->Servers()->Python3;
	}

	//TODO: Deprecated
	public static function GetPythonPath()
	{
		if (Context::Settings()->Servers()->Python27 === null
			&& isset(self::$app['python']))
		{
				return self::$app['python'];
		}
		return Context::Settings()->Servers()->Python27;
	}

	public static function GetSetting($key)
	{
		return self::$app[$key];
	}

	public static function GetEnvironment()
	{
		return null;
	}

	public static function GetStorage()
	{
		return '';
	}

	public static function SanitizeUrbanity($paramValue)
	{
		// Ordena y limpia lo recibido en urbanity
		$ret = '';
		foreach(['U', 'D', 'R', 'L'] as $validFilter)
		if (Str::Contains($paramValue, $validFilter))
			$ret .= $validFilter;
		if ($ret == '' || strlen($ret) === 4)
			return null;
		else
			return $ret;
	}

	public static function AppendProfilingResults(Request $req, Response $res)
	{
		if (!Profiling::IsProfiling() || $req->getMethod() !== 'GET')
			return;

		$contentType = $res->headers->get(
			'Content-Type'
		);
		$htmlContentTypes = array(
			'text/html', ''
		);
		if (in_array($contentType, $htmlContentTypes))
		{
			$content = $res->getContent();
			$res->setContent($content . Profiling::GetHtmlResults());
			return;
		}
		$jsonContentTypes = array(
			'application/json',
			'application/json; charset=utf-8',
			'application/javascript',
		);
		if (in_array($contentType, $jsonContentTypes) || self::$isJson)
		{
			Profiling::$IsJson = true;
			$content = $res->getContent();
			$pre = substr($content, 0, 1);
			if ($pre == '{')
				$pre .= ' "Profiling": ';
			$content = substr($content, 1);
			$res->setContent($pre . json_encode(explode("\n", Profiling::GetHtmlResults()))
				. "," . $content);
		}
	}
}
