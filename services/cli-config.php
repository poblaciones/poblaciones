<?php
use Doctrine\ORM\Tools\Console\ConsoleRunner;
use helena\classes\App;

// replace with file to your own project bootstrap
require_once 'startup.php';

// replace with mechanism to retrieve EntityManager in your
$entityManager = App::Orm()->GetEntityManager();

return ConsoleRunner::createHelperSet($entityManager);