<?php

namespace helena\classes;

use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouteCollection;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Matcher\UrlMatcher;
use Symfony\Component\Routing\Exception\ResourceNotFoundException;

// -------------------------------------------------------------------------
// Proxy retornado por get/post/match/options para soportar ->assert()
// -------------------------------------------------------------------------
class RouteProxy
{
	private Route $route;

	public function __construct(Route $route)
	{
		$this->route = $route;
	}

	public function assert(string $variable, string $pattern): self
	{
		$this->route->setRequirement($variable, $pattern);
		return $this;
	}
}

// -------------------------------------------------------------------------
// MiniApp — reemplazo de Silex\Application
// -------------------------------------------------------------------------
class SilexApp implements \ArrayAccess
{
	private RouteCollection $routes;
	private int $counter = 0;
	private array $values = [];
	private array $before = []; // [['handler' => callable, 'priority' => int]]
	private array $after = [];
	private array $errorHandlers = [];

	public function __construct()
	{
		$this->routes = new RouteCollection();
		$this->values['db.options'] = [
			'driver' => 'pdo_mysql',
			'charset' => 'utf8',
			'driverOptions' => [
				\PDO::ATTR_STRINGIFY_FETCHES => false,
				\PDO::ATTR_EMULATE_PREPARES  => false, // esto es clave para tipos nativos al serializar
			],
			'host' => null,
			'dbname' => null,
			'user' => null,
			'password' => null,
		];
	}

	public function redirect(string $url, int $status = 302): Response
	{
		return new \Symfony\Component\HttpFoundation\RedirectResponse($url, $status);
	}

	// -------------------------------------------------------------------------
	// Ruteo
	// -------------------------------------------------------------------------

	public function get(string $path, callable $handler): RouteProxy
	{
		return $this->addRoute($path, $handler, ['GET']);
	}

	public function post(string $path, callable $handler): RouteProxy
	{
		return $this->addRoute($path, $handler, ['POST']);
	}

	public function match(string $path, callable $handler): RouteProxy
	{
		return $this->addRoute($path, $handler, ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
	}

	public function options(string $path, callable $handler): RouteProxy
	{
		return $this->addRoute($path, $handler, ['OPTIONS']);
	}

	private function addRoute(string $path, callable $handler, array $methods): RouteProxy
	{
		$route = new Route($path, ['_controller' => $handler], [], [], '', [], $methods);
		$this->routes->add('route_' . $this->counter++, $route);
		return new RouteProxy($route);
	}

	// -------------------------------------------------------------------------
	// Middlewares y error handler
	// -------------------------------------------------------------------------

	public function before(callable $handler, int $priority = 0): void
	{
		$this->before[] = ['handler' => $handler, 'priority' => $priority];
		usort($this->before, fn($a, $b) => $b['priority'] <=> $a['priority']);
	}

	public function after(callable $handler): void
	{
		$this->after[] = $handler;
	}

	public function error(callable $handler): void
	{
		$this->errorHandlers[] = $handler;
	}

	// -------------------------------------------------------------------------
	// Dispatch (público para poder llamarlo desde before con handle())
	// -------------------------------------------------------------------------

	public function handle(Request $request, $type = 1): Response
	{
		$context = new RequestContext();
		$context->fromRequest($request);
		$matcher = new UrlMatcher($this->routes, $context);

		try {
			$match = $matcher->match($request->getPathInfo());
			$controller = $match['_controller'];
			$params = array_filter(
				$match,
				fn($k) => !str_starts_with($k, '_'),
				ARRAY_FILTER_USE_KEY
			);
			$rf = new \ReflectionFunction(\Closure::fromCallable($controller));
			$args = [$request];
			foreach ($rf->getParameters() as $p) {
				if ($p->getName() === 'request')
					continue;
				if (array_key_exists($p->getName(), $params)) {
					$args[] = $params[$p->getName()];
				} elseif ($p->isDefaultValueAvailable()) {
					$args[] = $p->getDefaultValue();
				}
			}
			$result = $controller(...$args);
			if ($result instanceof Response) {
				return $result;
			}
			return new Response((string) $result);

		} catch (ResourceNotFoundException $e) {
			$response = $this->handleError(new \RuntimeException('Not found', 404), $request, 404);
			if ($response !== null) {
				return $response;
			}
			throw $e;
		} catch (\Exception $e) {
			$code = $e->getCode() ?: 500;
			$response = $this->handleError($e, $request, $code);
			if ($response !== null) {
				return $response;
			}
			throw $e;
		}
	}

	public function run(): void
	{
		$request = Request::createFromGlobals();

		// Before middlewares
		foreach ($this->before as $entry) {
			$result = ($entry['handler'])($request);
			if ($result instanceof Response) {
				$this->sendWithAfter($request, $result);
				return;
			}
		}

		$response = $this->handle($request);

		$this->sendWithAfter($request, $response);
	}

	public function sendFile(
		$file,
		int $status = 200,
		array $headers = [],
		?string $contentDisposition = null
	): BinaryFileResponse {
		$response = new BinaryFileResponse($file, $status, $headers, true);

		if ($contentDisposition !== null) {
			$filename = $file instanceof \SplFileInfo
				? $file->getFilename()
				: basename($file);
			$response->setContentDisposition($contentDisposition, $filename);
		}

		$path = $file instanceof \SplFileInfo ? $file->getPathname() : $file;
		$finfo = new \finfo(FILEINFO_MIME_TYPE);
		$mimeType = $finfo->file($path);
		if ($mimeType) {
			$response->headers->set('Content-Type', $mimeType);
		}

		return $response;
	}

	private function sendWithAfter(Request $request, Response $response): void
	{
		// After middlewares
		foreach ($this->after as $handler) {
			$handler($request, $response);
		}
		$response->send();
	}

	private function handleError(\Exception $e, Request $request, int $code): ?Response
	{
		foreach ($this->errorHandlers as $handler) {
			$result = $handler($e, $request, $code);
			if ($result instanceof Response) {
				return $result;
			}
		}
		return null;
	}

	// -------------------------------------------------------------------------
	// ArrayAccess — config, lazy services y db
	// -------------------------------------------------------------------------

	public function offsetSet($offset, $value): void
	{
		$this->values[$offset] = $value;
	}

	#[\ReturnTypeWillChange]
	public function offsetGet($offset)
	{
		// Lazy: construye 'db' con 'db.options' la primera vez que se pide
		if ($offset === 'db' && !isset($this->values['db'])) {
			$opts = $this->values['db.options'] ?? null;
			if ($opts) {
				$this->values['db'] = \Doctrine\DBAL\DriverManager::getConnection($opts);
			}
		}

		$val = $this->values[$offset] ?? null;

		// Lazy services: Closure se ejecuta una vez y se cachea
		if ($val instanceof \Closure) {
			$this->values[$offset] = $val($this);
			return $this->values[$offset];
		}

		return $val;
	}

	public function offsetExists($offset): bool
	{
		return isset($this->values[$offset]);
	}

	public function offsetUnset($offset): void
	{
		unset($this->values[$offset]);
	}
}