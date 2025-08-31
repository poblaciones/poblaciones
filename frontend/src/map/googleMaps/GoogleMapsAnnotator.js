import MapAnnotator from '@/map/annotations/MapAnnotator';

export default GoogleMapsAnnotator;

function GoogleMapsAnnotator(mapsApi) {
	MapAnnotator.call(this, mapsApi);

	this.elementLayers = new Map(); // Map element IDs to Google Maps objects
	this.tempLayer = null; // Object for in-progress drawing
}

// Herencia
GoogleMapsAnnotator.prototype = new MapAnnotator();

GoogleMapsAnnotator.prototype.init = function () {
	const google = this.mapsAPI.google;
	this.google = google;

	// Set up click listener
	this.mapsAPI.gMap.addListener('click', (event) => {
		if (this.mapClickHandler) {
			this.mapClickHandler({
				lat: event.latLng.lat(),
				lng: event.latLng.lng()
			});
		}
	});

	// Initialize with select mode
	this._updateInteractionMode();
};

GoogleMapsAnnotator.prototype.addElement = function (element) {
	const google = this.google;
	let mapObject;

	// Create appropriate Google Maps object based on element type
	if (element.tipo === 'marker') {
		const position = new google.maps.LatLng(
			element.coordenadas[0].lat,
			element.coordenadas[0].lng
		);

		const markerOptions = this._getMarkerOptions(element);
		mapObject = new google.maps.Marker({
			position,
			map: this.map,
			title: element.descripcion || '',
			...markerOptions
		});

		// Add click listener
		mapObject.addListener('click', (event) => {
			if (this.elementClickHandler) {
				this.elementClickHandler(element.id, event);
			}
		});

		// Add hover listeners
		mapObject.addListener('mouseover', (event) => {
			if (this.elementHoverHandler) {
				const position = {
					top: event.domEvent.clientY + 10,
					left: event.domEvent.clientX + 10
				};
				this.elementHoverHandler(element.id, position);
			}
		});

		mapObject.addListener('mouseout', () => {
			if (this.elementLeaveHandler) {
				this.elementLeaveHandler();
			}
		});
	} else if (element.tipo === 'polyline') {
		const path = element.coordenadas.map(coord =>
			new google.maps.LatLng(coord.lat, coord.lng)
		);

		mapObject = new google.maps.Polyline({
			path,
			map: this.map,
			strokeColor: element.color || '#FF4081',
			strokeOpacity: 0.8,
			strokeWeight: 3
		});

		// Add click listener
		mapObject.addListener('click', (event) => {
			if (this.elementClickHandler) {
				this.elementClickHandler(element.id, event);
			}
		});

		// Add hover listeners
		mapObject.addListener('mouseover', (event) => {
			if (this.elementHoverHandler) {
				const position = {
					top: event.domEvent.clientY + 10,
					left: event.domEvent.clientX + 10
				};
				this.elementHoverHandler(element.id, position);
			}

			// Highlight on hover unless selected
			if (!this.selectedElementIds.has(element.id)) {
				mapObject.setOptions({
					strokeWeight: 5,
					strokeOpacity: 1.0
				});
			}
		});

		mapObject.addListener('mouseout', () => {
			if (this.elementLeaveHandler) {
				this.elementLeaveHandler();
			}

			// Remove highlight if not selected
			if (!this.selectedElementIds.has(element.id)) {
				mapObject.setOptions({
					strokeColor: element.color || '#FF4081',
					strokeOpacity: 0.8,
					strokeWeight: 3
				});
			}
		});
	} else if (element.tipo === 'polygon') {
		const path = element.coordenadas.map(coord =>
			new google.maps.LatLng(coord.lat, coord.lng)
		);

		mapObject = new google.maps.Polygon({
			paths: path,
			map: this.map,
			strokeColor: element.color || '#4CAF50',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: element.color || '#4CAF50',
			fillOpacity: 0.3
		});

		// Add click listener
		mapObject.addListener('click', (event) => {
			if (this.elementClickHandler) {
				this.elementClickHandler(element.id, event);
			}
		});

		// Add hover listeners
		mapObject.addListener('mouseover', (event) => {
			if (this.elementHoverHandler) {
				const position = {
					top: event.domEvent.clientY + 10,
					left: event.domEvent.clientX + 10
				};
				this.elementHoverHandler(element.id, position);
			}

			// Highlight on hover unless selected
			if (!this.selectedElementIds.has(element.id)) {
				mapObject.setOptions({
					strokeWeight: 3,
					strokeOpacity: 1.0,
					fillOpacity: 0.4
				});
			}
		});

		mapObject.addListener('mouseout', () => {
			if (this.elementLeaveHandler) {
				this.elementLeaveHandler();
			}

			// Remove highlight if not selected
			if (!this.selectedElementIds.has(element.id)) {
				mapObject.setOptions({
					strokeColor: element.color || '#4CAF50',
					strokeOpacity: 0.8,
					strokeWeight: 2,
					fillColor: element.color || '#4CAF50',
					fillOpacity: 0.3
				});
			}
		});
	} else {
		console.warn(`Unknown element type: ${element.tipo}`);
		return null;
	}

	// Store reference to the element
	this.elementLayers.set(element.id, mapObject);
	this.elements.set(element.id, element);

	// Show description on map if enabled
	if (element.mostrarDescripcionEnMapa && element.descripcion) {
		if (element.tipo === 'marker') {
			const infoWindow = new google.maps.InfoWindow({
				content: element.descripcion
			});
			infoWindow.open(this.map, mapObject);
		} else {
			// For polylines and polygons, we'd need a more complex approach
			// like adding a label at the center
			const bounds = new google.maps.LatLngBounds();
			element.coordenadas.forEach(coord => {
				bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
			});
			const center = bounds.getCenter();

			new google.maps.InfoWindow({
				content: element.descripcion,
				position: center
			}).open(this.map);
		}
	}

	return mapObject;
};

GoogleMapsAnnotator.prototype.updateElement = function (element) {
	// Remove existing element
	if (this.elementLayers.has(element.id)) {
		this.removeElement(element.id);
	}

	// Add updated element
	return this.addElement(element);
};

GoogleMapsAnnotator.prototype.removeElement = function (elementId) {
	const mapObject = this.elementLayers.get(elementId);
	if (mapObject) {
		mapObject.setMap(null); // Remove from map
		this.elementLayers.delete(elementId);
		this.elements.delete(elementId);
		this.selectedElementIds.delete(elementId);
	}
};

GoogleMapsAnnotator.prototype.clearElements = function () {
	// Remove all elements from map
	this.elementLayers.forEach(mapObject => {
		mapObject.setMap(null);
	});

	// Clear collections
	this.elementLayers.clear();
	this.elements.clear();
	this.selectedElementIds.clear();
};

GoogleMapsAnnotator.prototype.addTempElement = function (element) {
	// Remove existing temp element if any
	this.removeTempElement();

	const google = this.google;

	// Create temp element based on type
	if (element.tipo === 'marker') {
		this.tempLayer = new google.maps.Marker({
			position: new google.maps.LatLng(
				element.coordenadas[0].lat,
				element.coordenadas[0].lng
			),
			map: this.map,
			opacity: 0.7
		});
	} else if (element.tipo === 'polyline') {
		const path = element.coordenadas.map(coord =>
			new google.maps.LatLng(coord.lat, coord.lng)
		);

		this.tempLayer = new google.maps.Polyline({
			path,
			map: this.map,
			strokeColor: element.color || '#FF4081',
			strokeOpacity: 0.7,
			strokeWeight: 3,
			strokeDashArray: [5, 10]
		});
	} else if (element.tipo === 'polygon') {
		const path = element.coordenadas.map(coord =>
			new google.maps.LatLng(coord.lat, coord.lng)
		);

		this.tempLayer = new google.maps.Polygon({
			paths: path,
			map: this.map,
			strokeColor: element.color || '#4CAF50',
			strokeOpacity: 0.7,
			strokeWeight: 2,
			fillColor: element.color || '#4CAF50',
			fillOpacity: 0.2,
			strokeDashArray: [5, 10]
		});
	}
};

GoogleMapsAnnotator.prototype.updateTempElement = function (element) {
	if (!this.tempLayer) {
		this.addTempElement(element);
		return;
	}
	const google = this.google;

	// Update existing temp element
	if (element.tipo === 'marker') {
		this.tempLayer.setPosition(new google.maps.LatLng(
			element.coordenadas[0].lat,
			element.coordenadas[0].lng
		));
	} else if (element.tipo === 'polyline' || element.tipo === 'polygon') {
		const path = element.coordenadas.map(coord =>
			new google.maps.LatLng(coord.lat, coord.lng)
		);

		if (element.tipo === 'polyline') {
			this.tempLayer.setPath(path);
		} else {
			this.tempLayer.setPaths(path);
		}
	}
};

GoogleMapsAnnotator.prototype.removeTempElement = function () {
	if (this.tempLayer) {
		this.tempLayer.setMap(null);
		this.tempLayer = null;
	}
};

GoogleMapsAnnotator.prototype.selectElement = function (elementId) {
	const mapObject = this.elementLayers.get(elementId);
	if (mapObject) {
		// Add to selection set
		this.selectedElementIds.add(elementId);

		// Apply selected style
		const element = this.elements.get(elementId);

		if (element.tipo === 'marker') {
			// For markers, change the icon or scale
			mapObject.setOptions({
				animation: this.google.maps.Animation.BOUNCE,
				zIndex: 1000
			});

			// Stop bouncing after a short time
			setTimeout(() => {
				if (this.selectedElementIds.has(elementId)) {
					mapObject.setAnimation(null);
				}
			}, 750);
		} else if (element.tipo === 'polyline') {
			// Highlight the polyline
			mapObject.setOptions({
				strokeColor: '#2196F3',
				strokeOpacity: 1.0,
				strokeWeight: 4,
				zIndex: 1000
			});
		} else if (element.tipo === 'polygon') {
			// Highlight the polygon
			mapObject.setOptions({
				strokeColor: '#2196F3',
				strokeOpacity: 1.0,
				strokeWeight: 3,
				fillColor: '#2196F3',
				fillOpacity: 0.3,
				zIndex: 1000
			});
		}
	}
};

GoogleMapsAnnotator.prototype.deselectElement = function (elementId) {
	const mapObject = this.elementLayers.get(elementId);
	const element = this.elements.get(elementId);

	if (mapObject && element) {
		// Remove from selection set
		this.selectedElementIds.delete(elementId);

		// Restore original style
		if (element.tipo === 'marker') {
			mapObject.setAnimation(null);
			mapObject.setZIndex(undefined);
		} else if (element.tipo === 'polyline') {
			mapObject.setOptions({
				strokeColor: element.color || '#FF4081',
				strokeOpacity: 0.8,
				strokeWeight: 3,
				zIndex: undefined
			});
		} else if (element.tipo === 'polygon') {
			mapObject.setOptions({
				strokeColor: element.color || '#4CAF50',
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: element.color || '#4CAF50',
				fillOpacity: 0.3,
				zIndex: undefined
			});
		}
	}
};

GoogleMapsAnnotator.prototype.clearSelection = function () {
	// Deselect all elements
	for (const elementId of this.selectedElementIds) {
		this.deselectElement(elementId);
	}
	this.selectedElementIds.clear();
};

GoogleMapsAnnotator.prototype.centerOnElement = function (element) {
	if (!this.map || !this.google || !element ||
		!element.coordenadas || element.coordenadas.length === 0) {
		return;
	}

	const google = this.google;

	if (element.tipo === 'marker') {
		// Center on marker
		this.mapsAPI.gMap.setCenter(new google.maps.LatLng(
			element.coordenadas[0].lat,
			element.coordenadas[0].lng
		));
		this.mapsAPI.gMap.setZoom(15);
	} else {
		// Create bounds around polyline or polygon
		const bounds = new google.maps.LatLngBounds();
		element.coordenadas.forEach(coord => {
			bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
		});

		this.mapsAPI.gMap.fitBounds(bounds);

		// Adjust zoom if too close
		const listener = this.mapsAPI.gMap.addListener('idle', () => {
			if (this.mapsAPI.gMap.getZoom() > 16) {
				this.mapsAPI.gMap.setZoom(16);
			}
			google.maps.event.removeListener(listener);
		});
	}
};

GoogleMapsAnnotator.prototype.destroy = function () {
	// Clean up resources
	this.clearElements();
};

GoogleMapsAnnotator.prototype._updateInteractionMode = function () {
	const google = this.mapsAPI.google;

	// Set cursor and interaction behavior based on current mode
	switch (this.currentMode) {
		case 'select':
			this.mapsAPI.gMap.setOptions({ draggableCursor: 'default' });
			this.mapsAPI.drawingManager.setDrawingMode(null);
			break;
		case 'draw-marker':
			this.mapsAPI.gMap.setOptions({ draggableCursor: 'crosshair' });
			this.mapsAPI.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
			break;
		case 'draw-polyline':
			this.mapsAPI.gMap.setOptions({ draggableCursor: 'crosshair' });
			this.mapsAPI.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
			break;
		case 'delete':
			this.mapsAPI.gMap.setOptions({ draggableCursor: 'not-allowed' });
			this.mapsAPI.drawingManager.setDrawingMode(null);
			break;
		default:
			this.mapsAPI.gMap.setOptions({ draggableCursor: 'default' });
			this.mapsAPI.drawingManager.setDrawingMode(null);
	}
};

GoogleMapsAnnotator.prototype._getMarkerOptions = function (element) {
	const options = {};

	// Set icon based on element properties
	switch (element.forma) {
		case 'pin':
			// Default Google Maps marker
			break;
		case 'cuadrado':
			// Create a square icon
			options.icon = {
				path: 'M -10,-10 L 10,-10 L 10,10 L -10,10 Z',
				fillColor: element.color || '#3F51B5',
				fillOpacity: 1,
				strokeWeight: 2,
				strokeColor: '#FFFFFF',
				scale: 1
			};
			break;
		case 'círculo':
			// Create a circle icon
			options.icon = {
				path: this.google.maps.SymbolPath.CIRCLE,
				fillColor: element.color || '#3F51B5',
				fillOpacity: 1,
				strokeWeight: 2,
				strokeColor: '#FFFFFF',
				scale: 8
			};
			break;
	}

	return options;
};
;
