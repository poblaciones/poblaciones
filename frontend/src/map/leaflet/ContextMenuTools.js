import h from '@/map/js/helper';
import str from '@/common/framework/str';
export default ContextMenuTools;

function ContextMenuTools(mapInstance) {
	if (!mapInstance) throw new Error('Debe proporcionar una instancia de Leaflet map.');
	this.map = mapInstance;
	this.measuring = false;
	this.measurePoints = [];
	this.measureLine = null;
	this.measurePopup = null;
	this.tempLine = null; // Línea temporal que sigue al mouse
	this._initContextMenu();
	this._attachEvents();
}
// --- Inicializa el menú contextual con las opciones ---
ContextMenuTools.prototype._initContextMenu = function () {
	var loc = this;

	loc.map.options.contextmenu = true;
	loc.map.options.contextmenuWidth = 200;

	var menuItems = [
		{
			text: 'Abrir en StreetView',
			callback: function (e) { loc._openStreetView(e); }
		},
		{
			text: 'Abrir en Google Maps',
			callback: function (e) { loc._openInGoogleMaps(e); }
		},
		{
			text: 'Abrir en OpenStreetMap',
			callback: function (e) { loc._openInOSM(e); }
		},
		'-',
		{
			text: 'Consultar a Claude',
			callback: function (e) { loc._askClaude(e); }
		},
		{
			text: 'Consultar a ChatGPT',
			callback: function (e) { loc._askChatGPT(e); }
		},
/*		{
			text: 'Consultar a Gemini',
			callback: function (e) { loc._askGemini(e); }
		},*/
		'-',
		{
			text: 'Mostrar dirección',
			callback: function (e) { loc._showAddress(e); }
		},
		{
			text: 'Mostrar coordenadas',
			callback: function (e) { loc._showCoordinates(e); }
		},
		'-',
		{
			text: 'Medir (metros)',
			callback: function (e) { loc._startMeasure(e); }
		}
	];

	if (loc.map.contextmenu) {
		menuItems.forEach(function (item) {
			if (item === '-') {
				loc.map.contextmenu.addItem({ separator: true });
			} else {
				loc.map.contextmenu.addItem(item);
			}
		});
	} else {
		loc.map.options.contextmenuItems = menuItems;
	}
};

// --- Acción: abrir en OpenStreetMap ---
ContextMenuTools.prototype._openInOSM = function (e) {
	var lat = e.latlng.lat;
	var lng = e.latlng.lng;
	var zoom = this.map.getZoom();
	var url = 'https://www.openstreetmap.org/#map=' + zoom + '/' + lat + '/' + lng;
	window.open(url, '_blank');
};

// --- Acción: abrir en Google Maps ---
ContextMenuTools.prototype._openInGoogleMaps = function (e) {
	var lat = e.latlng.lat;
	var lng = e.latlng.lng;
	var zoom = this.map.getZoom();
	var url = 'https://www.google.com/maps/@' + lat + ',' + lng + ',' + zoom + 'z';
	window.open(url, '_blank');
};

// --- Función auxiliar para construir prompt enriquecido ---
ContextMenuTools.prototype._buildEnrichedPrompt = function (lat, lng, callback) {
	var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=es';

	fetch(url, { headers: { 'User-Agent': 'LeafletApp' } })
		.then(function (res) { return res.json(); })
		.then(function (data) {
			var locality = '';
			var state = '';
			var country = '';

			if (data.address) {
				locality = data.address.city || data.address.town || data.address.village || '';
				state = data.address.state || '';
				country = data.address.country || '';
			}

			var prompt = '¿Qué podés decirme de la ubicación ' + lat + ', ' + lng;

			if (locality) {
				prompt += ' en ' + locality;
			}
			if (state) {
				prompt += ', ' + state;
			}
			if (country) {
				prompt += ', ' + country;
			}

			prompt += '? Incluí información sobre características socioeconómicas, demográficas, servicios disponibles y cualquier dato relevante de la zona.';

			callback(prompt);
		})
		.catch(function () {
			var prompt = '¿Qué podés decirme de la ubicación ' + lat + ', ' + lng + '? Incluí información sobre características socioeconómicas, demográficas, servicios disponibles y cualquier dato relevante de la zona.';
			callback(prompt);
		});
};

// --- Acción: consultar con ChatGPT ---
ContextMenuTools.prototype._askChatGPT = function (e) {
	var lat = e.latlng.lat.toFixed(6);
	var lng = e.latlng.lng.toFixed(6);

	this._buildEnrichedPrompt(lat, lng, function (prompt) {
		var chatgptUrl = 'https://chat.openai.com/?q=' + encodeURIComponent(prompt);
		window.open(chatgptUrl, '_blank');
	});
};

// --- Acción: consultar con Claude ---
ContextMenuTools.prototype._askClaude = function (e) {
	var lat = e.latlng.lat.toFixed(6);
	var lng = e.latlng.lng.toFixed(6);

	this._buildEnrichedPrompt(lat, lng, function (prompt) {
		var claudeUrl = 'https://claude.ai/new?q=' + encodeURIComponent(prompt);
		window.open(claudeUrl, '_blank');
	});
};

// --- Acción: consultar con Gemini ---
ContextMenuTools.prototype._askGemini = function (e) {
	var lat = e.latlng.lat.toFixed(6);
	var lng = e.latlng.lng.toFixed(6);

	this._buildEnrichedPrompt(lat, lng, function (prompt) {
		var geminiUrl = 'https://gemini.google.com/app?q=' + encodeURIComponent(prompt);
		window.open(geminiUrl, '_blank');
	});
};

// --- Eventos generales del mapa ---
ContextMenuTools.prototype._attachEvents = function () {
	var loc = this;

	// Capturar click directamente del contenedor del mapa
	var mapContainer = loc.map.getContainer();
	mapContainer.addEventListener('click', function (e) {
		if (!loc.measuring) return;

		// Solo procesar si estamos en modo medición
		e.stopPropagation();
		e.preventDefault();

		// Convertir las coordenadas del click en latLng
		var latlng = loc.map.mouseEventToLatLng(e);

		loc.measurePoints.push(latlng);

		if (loc.measurePoints.length === 2) {
			// Segundo punto: calcular distancia y mostrar línea final
			var dist = loc.map.distance(loc.measurePoints[0], loc.measurePoints[1]);
			var distText = dist >= 1000
				? (dist / 1000).toFixed(2) + ' km'
				: dist.toFixed(1) + ' m';

			// Eliminar línea temporal
			if (loc.tempLine) {
				loc.map.removeLayer(loc.tempLine);
				loc.tempLine = null;
			}

			if (loc.measureLine) loc.map.removeLayer(loc.measureLine);
			loc.measureLine = L.polyline(loc.measurePoints, { color: 'blue', weight: 2 }).addTo(loc.map);

			// Guarda referencia al popup para poder eliminarlo después
			loc.measurePopup = L.popup()
				.setLatLng(loc.measurePoints[1])
				.setContent('Distancia: <strong>' + distText + '</strong>')
				.openOn(loc.map);

			// Cuando se cierre el popup, eliminar la línea
			loc.measurePopup.on('remove', function () {
				if (loc.measureLine) {
					loc.map.removeLayer(loc.measureLine);
					loc.measureLine = null;
				}
				loc.measurePopup = null;
			});

			// Resetear el estado de medición
			loc.measuring = false;
			loc.measurePoints = [];
		}
	}, true); // El 'true' hace que capture en fase de captura, antes que otros eventos

	// Evento de movimiento del mouse para mostrar línea temporal
	loc.map.on('mousemove', function (e) {
		if (!loc.measuring || loc.measurePoints.length !== 1) return;

		// Eliminar línea temporal anterior
		if (loc.tempLine) {
			loc.map.removeLayer(loc.tempLine);
		}

		// Crear nueva línea temporal desde el primer punto hasta el mouse
		loc.tempLine = L.polyline([loc.measurePoints[0], e.latlng], {
			color: 'blue',
			weight: 2,
			opacity: 0.5,
			dashArray: '5, 5' // Línea punteada para diferenciarla
		}).addTo(loc.map);
	});

	// Evento de tecla ESC para cancelar medición
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && loc.measuring) {
			loc._cancelMeasure();
		}
	});
};


// --- Acción: abrir Street View ---
ContextMenuTools.prototype._openStreetView = function (e) {
	var lat = e.latlng.lat;
	var lng = e.latlng.lng;

	// Obtener el zoom actual del mapa
	var zoom = this.map.getZoom();

	// Obtener el centro actual del mapa
	var center = this.map.getCenter();

	// Construir URL de StreetView con parámetros para volver al mapa
	var url = 'https://www.google.com/maps/@' + lat + ',' + lng + ',' + zoom + 'z/data=!3m1!1e3!5m1!1e1?entry=ttu';

	// Alternativa con más control sobre la vista de retorno:
	// var url = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + lat + ',' + lng +
	//           '&heading=0&pitch=0&fov=80' +
	//           '&basemap=roadmap&center=' + center.lat + ',' + center.lng + '&zoom=' + zoom;

	window.open(url, '_blank');
};

// --- Acción: mostrar dirección ---
ContextMenuTools.prototype._showAddress = function (e) {
	var lat = e.latlng.lat;
	var lng = e.latlng.lng;
	var loc = this;
	var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=es';
	fetch(url, { headers: { 'User-Agent': 'LeafletApp' } })
		.then(function (res) { return res.json(); })
		.then(function (data) {
			var address = data.display_name || 'Dirección no disponible';
			L.popup()
				.setLatLng(e.latlng)
				.setContent('<strong>Dirección</strong><br>' + address)
				.openOn(loc.map);
		})
		.catch(function () {
			L.popup()
				.setLatLng(e.latlng)
				.setContent('Error al obtener la dirección.')
				.openOn(loc.map);
		});
};

// --- Acción: mostrar coordenadas ---
ContextMenuTools.prototype._showCoordinates = function (e) {
	var lat = e.latlng.lat.toFixed(6);
	var lng = e.latlng.lng.toFixed(6);
	L.popup()
		.setLatLng(e.latlng)
		.setContent('<strong>Coordenadas</strong><br>Latitud: ' + lat + '<br>Longitud: ' + lng)
		.openOn(this.map);
};

// --- Acción: iniciar medición ---
ContextMenuTools.prototype._startMeasure = function (e) {
	var loc = this;

	// Limpiar medición anterior si existe
	if (loc.measureLine) {
		loc.map.removeLayer(loc.measureLine);
		loc.measureLine = null;
	}
	if (loc.measurePopup) {
		loc.map.closePopup(loc.measurePopup);
		loc.measurePopup = null;
	}
	if (loc.tempLine) {
		loc.map.removeLayer(loc.tempLine);
		loc.tempLine = null;
	}

	loc.measuring = true;
	loc.measurePoints = [];

	L.popup()
		.setLatLng(e.latlng)
		.setContent('Haga clic en dos puntos del mapa para medir la distancia. Presione ESC para cancelar.')
		.openOn(loc.map);
};

// --- Acción: cancelar medición ---
ContextMenuTools.prototype._cancelMeasure = function () {
	var loc = this;
	loc.measuring = false;
	loc.measurePoints = [];

	// Eliminar línea temporal si existe
	if (loc.tempLine) {
		loc.map.removeLayer(loc.tempLine);
		loc.tempLine = null;
	}

	loc.map.closePopup();
};
