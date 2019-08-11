<?php

use helena\classes\App;
use minga\framework\Context;
use minga\framework\settings\CacheSettings;
use minga\framework\settings\MailSettings;

// enable the debug mode
App::SetDebug(true);

// **** Servidores
Context::Settings()->Servers()->RegisterServer('core', "http://desa.poblaciones.org");
Context::Settings()->Servers()->RegisterCDNServer('mapas', "http://desa.poblaciones.org");
Context::Settings()->Servers()->SetCurrentServer('mapas');
Context::Settings()->Shard()->CurrentShard = 1;

// **** Keys de terceros
Context::Settings()->Keys()->GoogleMapsKey = "GOOGLE_MAPS_KEY";

// En caso de usarse SendGrid para la salida de mails:
// Context::Settings()->Mail()->SendGridApiKey = 'SEND_GRID_API_KEY';
//
// En caso de usarse AddThis para que los usuarios vinculen contenidos en redes sociales:
// Context::Settings()->Keys()->AddThisKey = "ADD_THIS_KEY";

// **** Keys de firmado
Context::Settings()->Keys()->RememberKey = '3vAAAGS4lKNFO7PKg1vWAy4SnnalgRatxknIrQJhWDvTqe7QTJV4gZD2w+n3EQdzzfi6gBhq3Xo/eUSp7M92ymMeYuo=';

// **** Región de inicio
// Context::Settings()->Map()->DefaultClippingRegion = { ID en clipping_region_item };

// **** Mail
// Posibles providers: Context::Settings()->Mail()->Provider: MailSettings::SendGrid, MailSettings::SMTP;
Context::Settings()->Mail()->From = 'no-responder@aacademica.org';
Context::Settings()->Mail()->NotifyAddressErrors = '';
Context::Settings()->Mail()->SMTPSecure = "";
Context::Settings()->Mail()->SMTPHost = "localhost";

// Base de datos MySQL
Context::Settings()->Db()->SetDatabase("SERVIDOR", "BASE_DE_DATOS", "USUARIO", "CONTRASEÑA");

// Ubicación de python
$app['python'] = 'C:/Python27/python.exe';

