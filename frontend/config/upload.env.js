module.exports = {
	NODE_ENV: '"production"',
	UPLOAD_ENV: '"upload"',
	host: '""', // Toma en forma predeterminada el mismo servidor y protocolo
	ApplicationName: '"Poblaciones"',
	google_analytics_key: '"{{ google_analytics_key }}"', // No cambiar, esto es reemplazado por twig en el server beta o prod.
	add_this_key: '"{{ add_this_key }}"', // No cambiar, esto es reemplazado por twig en el server beta o prod.
	google_maps_key: '"{{ google_maps_key }}"', // No cambiar, esto es reemplazado por twig en el server beta o prod.
	maps_api: 'all',
};
