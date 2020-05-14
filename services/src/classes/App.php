<?php

namespace helena\classes;

use minga\framework\IO;
use minga\framework\Str;
use minga\framework\Params;
use minga\framework\Performance;
use minga\framework\Context;
use minga\framework\Profiling;
use minga\framework\PhpSession;
use minga\framework\GlobalizeDebugSession;
use minga\framework\settings\CacheSettings;

use helena\classes\Paths;

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
	public static $db = null;
	public static $orm = null;
	private static $contentType = null;

	private static function getTwigEngine()
	{
		if (!array_key_exists('twig', self::$app))
		{
			self::$app['twig'] = self::$app->extend('twig', function ($twig, $app) {

				$baseUrl = Context::Settings()->GetPublicUrl();

				$twig->addGlobal('baseurl', $baseUrl);
				$twig->addGlobal('title', 'Nombre del sitio');
				$twig->addGlobal('tooltip_url', Links::TooltipUrl());
				$twig->addGlobal('home_url', Links::GetHomeUrl());
				$twig->addGlobal('application_name', Context::Settings()->applicationName);
				$twig->addGlobal('google_maps_version', '3.39');

				return $twig;
			});
		}
		return self::$app['twig'];
	}

	private static function getMessageTwigEngine()
	{
		if (!array_key_exists('twigMsg', self::$app))
		{
			Profiling::BeginTimer();
			// instancia un twig para mensajes
			$paths = array_merge(Paths::GetMacrosPaths(), Paths::GetMessagesPaths());
			$loaderMsg = new FilesystemLoader($paths);
			$twigMsg = new Environment($loaderMsg, array('cache' => Context::Paths()->GetTwigCache(),
				'debug' => Context::Settings()->Debug()->debug));

			$twigMsg->addExtension(new StringLoaderExtension());

			self::$app['twigMsg'] = $twigMsg;
			Profiling::EndTimer();
		}
		return self::$app['twigMsg'];
	}

	public static function Debug()
	{
		return self::$app['debug'];
	}

	public static function SetDebug($value)
	{
		Context::Settings()->Debug()->debug = $value;
		self::$app['debug'] = $value;
		if ($value)
		{
			GlobalizeDebugSession::GlobalizeDebug();
			Context::Settings()->Cache()->Enabled = CacheSettings::DisabledWrite;
			Context::Settings()->Cache()->FileSystemMode = CacheSettings::FILE;
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

	public static function RedirectLogin()
	{
		return self::Redirect(self::RedirectLoginUrl());
	}
	public static function AbsoluteUrl($url)
	{
		$host = Context::Settings()->GetPublicUrl();
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
		$actual_link = self::AbsoluteUrl('');
		$url = self::AbsoluteUrl('/authenticate/login');

		$url = Str::AppendParam($url, 'ask', 1);
		$url = Str::AppendParam($url, 'to', $actual_link);
		return $url;
	}

	public static function OrmJson($entity){
		$value = self::OrmSerialize($entity);
		$response = new Response($value);
		$response->headers->set('Content-Type', 'application/json');
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
		$serializer = App::GetSerializer();
		return $serializer->deserialize($entity, $className, 'json');
	}
	public static function JsonImmutable($value)
	{
		$w = Params::GetIntMandatory('w');
		if ($w === 0)
			$expireDays = 0;
		else
			$expireDays = 1000;
		return self::Json($value, $expireDays);
	}
	public static function Json($value, $daysToExpire = -1)
	{
		$sessionStarted = PhpSession::GetSessionValue('started', null);
		$sessionTime = gmdate('D, d M Y H:i:s', intval($sessionStarted)) . ' GMT';
		//
		if (version_compare(phpversion(), '7.1', '>=')) {
			ini_set('precision', '17');
			ini_set('serialize_precision', '-1');
		}
		if ($daysToExpire === -1 || self::Debug())
			$headers = [ 'Cache-control' => 'private',
									'Last-Modified' => $sessionTime ];
		else {
			$days = $daysToExpire * 86400;
			$headers = [ 'Cache-control' => 'public' ];
			header("Pragma: ");
			header("Cache-Control: max-age=" . $days );
		}

		return self::$app->json($value, 200, $headers);
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

	public static function SendFile($file)
	{
		$ret = self::$app->SendFile($file);
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

		$disposition = $response->headers->makeDisposition(
			ResponseHeaderBag::DISPOSITION_ATTACHMENT, $name);
		$response->headers->set('Content-Disposition', $disposition);
		$response->headers->set('Content-Type', self::GetMimeType($name));
		return $response;
	}

	private static function GetMimeType($filename)
	{
		if(Str::EndsWith($filename, '.sav'))
			return 'application/x-vnd.spss-statistics-spd';
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
			self::$db = new Db($connection);
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

		$vals['site_maps_url'] = Str::EnsureEndsWith(Context::Settings()->GetPublicUrl(), "/") . "map";
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
		if (in_array($contentType, $jsonContentTypes))
		{
			Profiling::$IsJson = true;
			$content = $res->getContent();
			$pre = substr($content, 0, 1);
			if ($pre == '{')
				$pre .= ' "Profiling": ';
			$content = substr($content, 1);
			$res->setContent($pre . json_encode(Profiling::GetHtmlResults())
				. "," . $content);
		}
	}
}
