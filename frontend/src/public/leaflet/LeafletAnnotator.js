import MapAnnotator from '@/public/annotations/MapAnnotator';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default LeafletAnnotator;

// Constructor
function LeafletAnnotator(mapsAPI) {
	MapAnnotator.call(this, mapsAPI);

	this.elementLayers = new Map(); // Map element IDs to Leaflet layers
	this.tempLayer = null; // Layer for in-progress drawing
	this.selectedStyle = {
		color: '#2196F3',
		weight: 4,
		opacity: 1,
		fillOpacity: 0.3,
		fillColor: '#2196F3'
	};

	// Event handlers for element updates
	this.elementDragEndHandler = null;

	// Flag to control whether elements can be moved/edited
	this.canEdit = false;

	// Required Leaflet plugins
	this.leafletEdit = window.L && window.L.edit;
}

// Herencia
LeafletAnnotator.prototype = new MapAnnotator();

// Método init
LeafletAnnotator.prototype.init = function () {

	// Set up map click event
	var self = this;
	this.mapsAPI.map.on('click', function (event) {
		if (self.mapClickHandler) {
			self.mapClickHandler({
				lat: event.latlng.lat,
				lng: event.latlng.lng
			});
		}
	});

	// Initialize with select mode
	this._updateInteractionMode();
};

// Método addElement
LeafletAnnotator.prototype.addElement = function (element) {
	var layer;
	var self = this;

	// Create appropriate Leaflet layer based on element type
	if (element.tipo === 'marker') {
		var markerOptions = this._getMarkerOptions(element);
		layer = L.marker(element.coordenadas[0], {
			icon: markerOptions.icon,
			title: markerOptions.title,
			draggable: this.this.canEdit
		});

		// Add drag end event to markers
		layer.on('dragend', function (event) {
			var latlng = event.target.getLatLng();
			var updatedElement = Object.assign({}, element, {
				coordenadas: [{ lat: latlng.lat, lng: latlng.lng }]
			});
			// Trigger update event
			if (self.elementDragEndHandler) {
				self.elementDragEndHandler(updatedElement);
			}
		});

	} else if (element.tipo === 'polyline') {
		layer = L.polyline(element.coordenadas, {
			color: element.color || '#FF4081',
			weight: 3,
			opacity: 0.8
		});

		// Make polyline editable when editing is enabled
		if (this.this.canEdit) {
			this._makeLayerEditable(layer, element);
		}

	} else if (element.tipo === 'polygon') {
		layer = L.polygon(element.coordenadas, {
			color: element.color || '#4CAF50',
			weight: 2,
			opacity: 0.8,
			fillOpacity: 0.3,
			fillColor: element.color || '#4CAF50'
		});

		// Make polygon editable when editing is enabled
		if (this.this.canEdit) {
			this._makeLayerEditable(layer, element);
		}
	} else {
		console.warn("Unknown element type: " + element.tipo);
		return;
	}

	// Add element to map
	layer.addTo(this.map);

	// Store reference to the element
	layer.elementId = element.id;
	this.elementLayers.set(element.id, layer);
	this.elements.set(element.id, element);

	// Set up events
	this._setupLayerEvents(layer);

	// Show description on map if enabled
	if (element.mostrarDescripcionEnMapa && element.descripcion) {
		if (element.tipo === 'marker') {
			layer.bindTooltip(element.descripcion, { permanent: true, direction: 'top' });
		} else {
			layer.bindTooltip(element.descripcion, { permanent: true, sticky: true });
		}
	}

	return layer;
};

// Método updateElement
LeafletAnnotator.prototype.updateElement = function (element) {
	// Remove existing element
	if (this.elementLayers.has(element.id)) {
		this.removeElement(element.id);
	}
	// Add updated element
	return this.addElement(element);
};

// Método removeElement
LeafletAnnotator.prototype.removeElement = function (elementId) {
	var layer = this.elementLayers.get(elementId);
	if (layer) {
		this.mapsAPI.map.removeLayer(layer);
		this.elementLayers.delete(elementId);
		this.elements.delete(elementId);
		this.selectedElementIds.delete(elementId);
	}
};

// Método clearElements
LeafletAnnotator.prototype.clearElements = function () {
	var self = this;
	// Remove all elements from map
	this.elementLayers.forEach(function (layer) {
		self.map.removeLayer(layer);
	});

	// Clear collections
	this.elementLayers.clear();
	this.elements.clear();
	this.selectedElementIds.clear();
};

// Método addTempElement
LeafletAnnotator.prototype.addTempElement = function (element) {
	// Remove existing temp element if any
	this.removeTempElement();

	// Create temp layer based on element type
	if (element.tipo === 'marker') {
		this.tempLayer = L.marker(element.coordenadas[0], {
			opacity: 0.7
		}).addTo(this.map);
	} else if (element.tipo === 'polyline') {
		this.tempLayer = L.polyline(element.coordenadas, {
			color: element.color || '#FF4081',
			weight: 3,
			opacity: 0.7,
			dashArray: '5, 10'
		}).addTo(this.map);
	} else if (element.tipo === 'polygon') {
		this.tempLayer = L.polygon(element.coordenadas, {
			color: element.color || '#4CAF50',
			weight: 2,
			opacity: 0.7,
			fillOpacity: 0.2,
			dashArray: '5, 10'
		}).addTo(this.map);
	}
};

// Método updateTempElement
LeafletAnnotator.prototype.updateTempElement = function (element) {
	// Update existing temp element
	if (this.tempLayer) {
		if (element.tipo === 'marker') {
			this.tempLayer.setLatLng(element.coordenadas[0]);
		} else if (element.tipo === 'polyline' || element.tipo === 'polygon') {
			this.tempLayer.setLatLngs(element.coordenadas);
		}
	} else {
		// Create if it doesn't exist
		this.addTempElement(element);
	}
};

// Método removeTempElement
LeafletAnnotator.prototype.removeTempElement = function () {
	if (this.tempLayer) {
		this.mapsAPI.map.removeLayer(this.tempLayer);
		this.tempLayer = null;
	}
};

// Método selectElement
LeafletAnnotator.prototype.selectElement = function (elementId) {
	var layer = this.elementLayers.get(elementId);
	if (layer) {
		// Add to selection set
		this.selectedElementIds.add(elementId);

		// Apply selected style
		if (layer instanceof L.Marker) {
			// For markers, we could use a different icon or change opacity
			layer.setOpacity(1.0);
			layer._icon.classList.add('selected-marker');
		} else {
			// For lines and polygons, apply style
			layer.setStyle(this.selectedStyle);
			layer.bringToFront();
		}
	}
};

// Método deselectElement
LeafletAnnotator.prototype.deselectElement = function (elementId) {
	var layer = this.elementLayers.get(elementId);
	var element = this.elements.get(elementId);

	if (layer && element) {
		// Remove from selection set
		this.selectedElementIds.delete(elementId);

		// Restore original style
		if (layer instanceof L.Marker) {
			layer.setOpacity(0.9);
			layer._icon.classList.remove('selected-marker');
		} else if (element.tipo === 'polyline') {
			layer.setStyle({
				color: element.color || '#FF4081',
				weight: 3,
				opacity: 0.8
			});
		} else if (element.tipo === 'polygon') {
			layer.setStyle({
				color: element.color || '#4CAF50',
				weight: 2,
				opacity: 0.8,
				fillOpacity: 0.3,
				fillColor: element.color || '#4CAF50'
			});
		}
	}
};

// Método clearSelection
LeafletAnnotator.prototype.clearSelection = function () {
	var self = this;
	// Deselect all elements
	this.selectedElementIds.forEach(function (elementId) {
		self.deselectElement(elementId);
	});
	this.selectedElementIds.clear();
};

// Método centerOnElement
LeafletAnnotator.prototype.centerOnElement = function (element) {
	if (!element || !element.coordenadas || element.coordenadas.length === 0) {
		return;
	}

	if (element.tipo === 'marker') {
		// Center on marker
		this.mapsAPI.map.setView(element.coordenadas[0], 15);
	} else {
		// Create bounds around polyline or polygon
		var bounds = L.latLngBounds(element.coordenadas);
		this.mapsAPI.map.fitBounds(bounds, {
			padding: [50, 50],
			maxZoom: 15
		});
	}
};

// Método destroy
LeafletAnnotator.prototype.destroy = function () {

};

// Método _updateInteractionMode (método privado)
LeafletAnnotator.prototype._updateInteractionMode = function () {
	// Set cursor and interaction behavior based on current mode
	var mapContainer = this.container;

	switch (this.currentMode) {
		case 'select':
			mapContainer.style.cursor = 'default';
			break;
		case 'draw-marker':
			mapContainer.style.cursor = 'crosshair';
			break;
		case 'draw-polyline':
			mapContainer.style.cursor = 'crosshair';
			break;
		case 'delete':
			mapContainer.style.cursor = 'not-allowed';
			break;
		default:
			mapContainer.style.cursor = 'default';
	}
};

// Método _setupLayerEvents (método privado)
LeafletAnnotator.prototype._setupLayerEvents = function (layer) {
	var self = this;

	// Click handler
	layer.on('click', function (event) {
		if (self.elementClickHandler) {
			L.DomEvent.stopPropagation(event);
			self.elementClickHandler(layer.elementId, event);
		}
	});

	// Mouseover/out for hover effects
	layer.on('mouseover', function (event) {
		if (self.elementHoverHandler) {
			var position = {
				top: event.originalEvent.clientY + 10,
				left: event.originalEvent.clientX + 10
			};
			self.elementHoverHandler(layer.elementId, position);
		}

		// Apply hover style unless already selected
		if (!self.selectedElementIds.has(layer.elementId)) {
			if (layer instanceof L.Marker) {
				layer._icon.classList.add('hover-marker');
			} else {
				layer.setStyle({
					weight: layer.options.weight + 1,
					opacity: layer.options.opacity + 0.1
				});
			}
		}
	});

	layer.on('mouseout', function (event) {
		if (self.elementLeaveHandler) {
			self.elementLeaveHandler();
		}

		// Remove hover style if not selected
		if (!self.selectedElementIds.has(layer.elementId)) {
			var element = self.elements.get(layer.elementId);
			if (layer instanceof L.Marker) {
				layer._icon.classList.remove('hover-marker');
			} else if (element) {
				if (element.tipo === 'polyline') {
					layer.setStyle({
						color: element.color || '#FF4081',
						weight: 3,
						opacity: 0.8
					});
				} else if (element.tipo === 'polygon') {
					layer.setStyle({
						color: element.color || '#4CAF50',
						weight: 2,
						opacity: 0.8,
						fillOpacity: 0.3,
						fillColor: element.color || '#4CAF50'
					});
				}
			}
		}
	});
};

// Método onElementDragEnd
LeafletAnnotator.prototype.onElementDragEnd = function (handler) {
	this.elementDragEndHandler = handler;
};

// Método setEditingEnabled
LeafletAnnotator.prototype.setEditingEnabled = function (enabled) {
	var self = this;
	// Update the editing flag
	this.this.canEdit = enabled;

	// Update marker draggable state
	this.elementLayers.forEach(function (layer, elementId) {
		var element = self.elements.get(elementId);
		if (!element) return;

		if (element.tipo === 'marker') {
			layer.dragging.enabled(enabled);
		} else {
			if (enabled) {
				self._makeLayerEditable(layer, element);
			} else {
				// Disable editing if previously enabled
				if (layer.editing && layer.editing.enabled()) {
					layer.editing.disable();
				}
			}
		}
	});
};

// Método _makeLayerEditable (método privado)
LeafletAnnotator.prototype._makeLayerEditable = function (layer, element) {
	var self = this;
	// Check if Leaflet's editing capability is available
	if (!layer.editing) return;

	// Enable editing
	layer.editing.enable();

	// Add event listener for when edit ends
	layer.on('editend', function () {
		var updatedCoordinates = [];
		var layerLatLngs = layer.getLatLngs();

		// Handle the different structures returned by polyline vs polygon
		if (element.tipo === 'polyline') {
			// For polylines, it's a simple array of LatLng objects
			layerLatLngs.forEach(function (latlng) {
				updatedCoordinates.push({
					lat: latlng.lat,
					lng: latlng.lng
				});
			});
		} else if (element.tipo === 'polygon') {
			// For polygons, it might be nested arrays
			var coords = Array.isArray(layerLatLngs[0]) ? layerLatLngs[0] : layerLatLngs;
			coords.forEach(function (latlng) {
				updatedCoordinates.push({
					lat: latlng.lat,
					lng: latlng.lng
				});
			});
		}

		// Create updated element with new coordinates
		var updatedElement = Object.assign({}, element, {
			coordenadas: updatedCoordinates
		});

		// Trigger update event
		if (self.elementDragEndHandler) {
			self.elementDragEndHandler(updatedElement);
		}
	});

	// Add also a simple drag event for polygons/polylines
	layer.on('dragend', function () {
		var updatedCoordinates = [];
		var layerLatLngs = layer.getLatLngs();

		// Process coordinates same as above
		if (element.tipo === 'polyline') {
			layerLatLngs.forEach(function (latlng) {
				updatedCoordinates.push({
					lat: latlng.lat,
					lng: latlng.lng
				});
			});
		} else if (element.tipo === 'polygon') {
			var coords = Array.isArray(layerLatLngs[0]) ? layerLatLngs[0] : layerLatLngs;
			coords.forEach(function (latlng) {
				updatedCoordinates.push({
					lat: latlng.lat,
					lng: latlng.lng
				});
			});
		}

		var updatedElement = Object.assign({}, element, {
			coordenadas: updatedCoordinates
		});

		if (self.elementDragEndHandler) {
			self.elementDragEndHandler(updatedElement);
		}
	});
};

// Método _getMarkerOptions (método privado)
LeafletAnnotator.prototype._getMarkerOptions = function (element) {
	var iconOptions = {};

	// Check if it's a comment type (which has precedence over forma)
	if (element.tipo === 'comment') {
		// Create a comment icon (chat bubble)
		return {
			icon: L.divIcon({
				html: '<div style="width: 30px; height: 30px; background-color: ' + (element.color || '#FF9800') + '; border: 2px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
					'<span class="material-icons" style="font-size: 18px; color: white;">comment</span>' +
					'</div>',
				className: 'custom-div-icon',
				iconSize: [30, 30],
				iconAnchor: [15, 15]
			})
		};
	}

	// Set icon based on element properties
	switch (element.forma) {
		case 'pin':
			iconOptions = {
				iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
				shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41]
			};
			break;
		case 'cuadrado':
			// Create a square icon
			return {
				icon: L.divIcon({
					html: '<div style="width: 20px; height: 20px; background-color: ' + element.color + '; border: 2px solid #FFF; display: flex; align-items: center; justify-content: center;">' +
						'<span class="material-icons" style="font-size: 14px; color: white;">' + (element.icono || '') + '</span>' +
						'</div>',
					className: 'custom-div-icon',
					iconSize: [20, 20],
					iconAnchor: [10, 10]
				})
			};
		case 'círculo':
			// Create a circle icon
			return {
				icon: L.divIcon({
					html: '<div style="width: 20px; height: 20px; background-color: ' + element.color + '; border: 2px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
						'<span class="material-icons" style="font-size: 14px; color: white;">' + (element.icono || '') + '</span>' +
						'</div>',
					className: 'custom-div-icon',
					iconSize: [20, 20],
					iconAnchor: [10, 10]
				})
			};
		case 'comment':
			// Create a comment icon (chat bubble)
			return {
				icon: L.divIcon({
					html: '<div style="width: 30px; height: 30px; background-color: ' + (element.color || '#FF9800') + '; border: 2px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
						'<span class="material-icons" style="font-size: 18px; color: white;">comment</span>' +
						'</div>',
					className: 'custom-div-icon',
					iconSize: [30, 30],
					iconAnchor: [15, 15]
				})
			};
		default:
			iconOptions = {
				iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
				shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41]
			};
	}

	return {
		icon: L.icon(iconOptions),
		title: element.descripcion || ''
	};
};
