<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\services\backoffice\DbSession;


// ********************************* Servicios *********************************
// ******* Tests *********************************

App::$app->post('/TestOrm', function (Request $request) {
	//$controller = new services\cTestOrm();
	//$object = Params::Get("sarasa");
	//$object = App::OrmDeserialize(file_get_contents("php://input"), entities\DraftMetadata::class);
	/*$serializer = SerializerBuilder::create()->setPropertyNamingStrategy(new IdenticalPropertyNamingStrategy())->build();
	$object = $serializer->deserialize(file_get_contents("php://input"), Metadata::class, 'json');*/
	$entity = file_get_contents("php://input");
	$object = App::OrmDeserialize(entities\DraftDataset::class, $entity);
	$em = App::Db()->GetEntityManager();
	$em->merge($object);
	$em->flush();

	/*$session = new DbSession();
	$entity = $session->Save(entities\DraftMetadata::class, $object);*/
	return App::OrmJson($object);
});

App::$app->get('/services/backoffice/GetClippings', function (Request $request) {
	$em = App::Db()->GetEntityManager();
	$records = $em->getRepository(entities\DraftDataset::class)->find(21);
	$entity = App::OrmSerialize($records);
	return $entity;
});
