<?php

namespace helena\classes;

use minga\framework\Str;
use minga\framework\Profiling;
use minga\framework\ErrorException;

use Doctrine\DBAL\Logging\SQLLogger as sqlLog;

class SqlLogger implements sqlLog
{
	  private static $isLazyLogging = false;
		const CLOSING = "DoctrineProxies\\__CG__\\";
		const OBJ = "Object(";

    public function startQuery($sql, array $params = null, array $types = null)
		{
			Profiling::ShowQuery($sql, $params, $types);
			$e = new ErrorException();
			$st = explode("\n", $e->getTraceAsString());
			// Busca lazy loading
			#4 : Doctrine\ORM\Persisters\Entity\BasicEntityPersister->loadById(Array, Object(DoctrineProxies\__CG__\helena\entities\backoffice\DraftMetadata))
			foreach($st as $line)
			{
				if (Str::Contains($line, "Doctrine\\ORM\\Persisters\\Entity\\BasicEntityPersister->loadById"))
				{
					self::$isLazyLogging = true;
					$n = strrpos($line, self::CLOSING);
					$from = $n + strlen(self::CLOSING);
					$className = substr($line, $from, strlen($line) - $from - 2);
					$caller = $this->getCaller($st);

					if ($caller != "")
						$entry = 'LazyGet->' . $this->getClassOnly($caller) . '.' . $this->getClassOnly($className);
					else
						$entry = 'LoadById->' . $this->getClassOnly($className);

					Profiling::BeginTimer($entry);
					Profiling::RegisterDbHit();
					return;
				}
			}
			// sigue y registra
			Profiling::RegisterDbHit();
		}

		private function getClassOnly($st)
		{
			$n = strrpos($st, "\\");
			return substr($st, $n + 1);
		}
		private function getCaller($st)
		{
			// visitProperty(Object(JMS\Serializer\Metadata\PropertyMetadata), Object(helena\entities\backoffice\DraftWork)
			if (sizeof($st) > 14)
			{
				$line = $st[14];
				if (Str::Contains($line, "JsonSerializationVisitor->visitProperty"))
				{
					$n = strrpos($line, self::OBJ);
					$n = strrpos(substr($line, 0, $n), self::OBJ) + strlen(self::OBJ);
					$end = strpos($line, ")", $n);
					$caller = substr($line, $n, $end - $n);
					return $caller;
				}
			}
			return "";
		}
    public function stopQuery()
		{
			if (self::$isLazyLogging === true)
			{
				self::$isLazyLogging = false;
				Profiling::EndTimer();
			}
		}
}


