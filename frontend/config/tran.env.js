module.exports ={
  // EN DESA, no cambian sin reiniciar npm
	NODE_ENV: '"development"',
	UPLOAD_ENV: '""',
	ApplicationName: '"Poblaciones"',
	maps_api: '"leaflet"',

	add_this_key: '"ra-5adea5cc40743803"', // Para desarrollo. Las de prod se toman de settings
	google_analytics_key: '""', // Para desarrollo. Las de prod se toman de settings

	//host: '"https://mapa.poblaciones.org"', // al comentar esto usa directo el server de beta
	//host: '"https://beta.poblaciones.org"', // al comentar esto usa directo el server de beta
	host: '"https://desa.poblaciones.org:9000"', // al comentar esto usa directo el server de beta
};
