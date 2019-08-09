<?php

namespace helena\classes;

use Symfony\Component\HttpFoundation\Request;

class ControllerBound
{
	private $class;
	private $method;

	function __construct($class, $method)
	{
		$this->class = $class;
		$this->method = $method;
	}

	public function __invoke(Request $request)
	{
		$controller = new $this->class;
		$method = $this->method;
		return $controller->$method();
	}
}

