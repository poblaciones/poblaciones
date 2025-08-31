import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * LeafletAnnotator - A tool for annotating Leaflet maps with markers, polylines, and polygons
 */
function LeafletAnnotator(mapsAPI) {
	this.mapsAPI = mapsAPI;
	this.map = mapsAPI.map;
	this.container = this.map.getContainer();

	// Collections
	this.elementLayers = new Map(); // Map element IDs to Leaflet layers
	this.elements = new Map(); // Store element data
	this.selectedElementIds = new Set(); // Currently selected elements

	// Drawing state
	this.tempLayer = null; // Layer for in-progress drawing
	this.drawingCoordinates = []; // Coordinates being drawn
	this.currentMode = 'select'; // Default mode: select, draw-marker, draw-polyline, draw-polygon
	this.drawingInProgress = false;

	// Styles
	this.selectedStyle = {
		color: '#2196F3',
		weight: 4,
		opacity: 1,
		fillOpacity: 0.3,
		fillColor: '#2196F3'
	};

	// Event handlers
	this.elementClickHandler = null;
	this.elementHoverHandler = null;
	this.elementLeaveHandler = null;
	this.elementDragEndHandler = null;
	this.mapClickHandler = null;
	this.onCompleteDrawHandler = null;

	// Flag to control whether elements can be moved/edited
	this.canEdit = false;

	// Set up event listeners
	var self = this;
	this.map.on('click', function (event) {
		self._handleMapClick(event);
	});

	this.map.on('mousemove', function (event) {
		self._handleMapMouseMove(event);
	});

	// Initialize with select mode
	this._updateCursor();
}

/**
 * Set the current interaction mode
 * @param {string} mode - The mode to set (select, draw-marker, draw-polyline, draw-polygon)
 */
LeafletAnnotator.prototype.setMode = function (mode) {
	this.currentMode = mode;
	this._updateCursor();

	// Cancel any in-progress drawing when changing modes
	if (this.drawingInProgress) {
		this.cancelDrawing();
	}
};


/**
 * Handle map click events based on current mode
 * @private
 */
LeafletAnnotator.prototype._handleMapClick = function (event) {
	var latlng = event.latlng;
	var position = { lat: latlng.lat, lng: latlng.lng };

	// Different behavior based on current mode
	switch (this.currentMode) {
		case 'select':
			// Pass the event to the registered handler
			if (this.mapClickHandler) {
				this.mapClickHandler(position);
			}
			break;

		case 'draw-marker':
			// Create a marker immediately
			var marker = {
				Id: 'temp-' + Date.now(),
				Type: 'M',
				Description: 'Nuevo elemento',
				Geometry: [position],
				Color: '#2196F3',
				Forma: 'pin'
			};
			this.addTempElement(marker);
			// Complete drawing and open attributes popup
			this._completeDrawing(marker);
			break;

		case 'draw-polyline':
			this._handlePolyDraw(position, 'polyline');
			break;

		case 'draw-polygon':
			this._handlePolyDraw(position, 'polygon');
			break;

		case 'draw-comment':
			// Create a marker immediately
			var marker = {
				Id: 'temp-' + Date.now(),
				Type: 'C',
				Geometry: [position],
				Color: '#2196F3',
				Forma: 'pin'
			};
			this.addTempElement(marker);
			// Complete drawing and open attributes popup
			this._completeDrawing(marker);
			break;

		case 'draw-question':
			// Create a marker immediately
			var marker = {
				Id: 'temp-' + Date.now(),
				Type: 'Q',
				Geometry: [position],
				Color: '#2196F3',
				Forma: 'pin'
			};
			this.addTempElement(marker);
			// Complete drawing and open attributes popup
			this._completeDrawing(marker);
			break;
	}
};

/**
 * Handle drawing for polylines and polygons
 * @private
 */
LeafletAnnotator.prototype._handlePolyDraw = function (position, type) {
	// Start drawing if not already in progress
	if (!this.drawingInProgress) {
		this.drawingInProgress = true;
		this.drawingCoordinates = [position];

		// Create initial temporary visualization
		var element = {
			Id: 'temp-' + Date.now(),
			Type: type,
			Description: 'Nuevo elemento',
			Geometry: this.drawingCoordinates,
			Color: type === 'polyline' ? '#FF4081' : '#4CAF50'
		};

		this.addTempElement(element);

		// Add double-click handler to complete the drawing
		var self = this;
		this.map.once('dblclick', function (e) {
			L.DomEvent.stopPropagation(e);
			L.DomEvent.preventDefault(e);

			if (self.drawingCoordinates.length >= (type === 'polygon' ? 3 : 2)) {
				self._completeDrawing(element);
			} else {
				// Not enough points to create a valid shape
				self.cancelDrawing();
			}
		});
		window.addEventListener('keydown', function (e) {
			var loc = window.SegMap.MapsApi.Annotations;
			if (e.key === "Enter") {
				if (loc.currentMode == 'draw-polyline') {
					loc.drawingInProgress = true;
					loc._handlePolyDraw(position, 'polyline');
				} else if (loc.currentMode == 'draw-polygon') {
					loc.drawingInProgress = true;
					loc._handlePolyDraw(position, 'polygon');
				} else {
					loc._completeDrawing(element);
				}
			}

			if (e.key === "Escape") {
				if (loc.tempLayer) {
					loc.removeTempElement();
					loc.cancelDrawing();
				} else {
					window.SegMap.toolbarStates.selectionMode = "PAN";
				}
			}
		}, { 'once' : true});


	} else {
		// Continue adding points to existing drawing
		this.drawingCoordinates.push(position);

		// Update the temporary visualization
		var element = {
			Id: 'temp-' + Date.now(),
			Type: this.currentMode === 'draw-polyline' ? 'L' : 'P',
			Geometry: this.drawingCoordinates,
			Color: this.currentMode === 'draw-polyline' ? '#FF4081' : '#4CAF50'
		};

		this.updateTempElement(element);
	}
};

/**
 * Handle map mouse move events (for drawing preview)
 * @private
 */
LeafletAnnotator.prototype._handleMapMouseMove = function (event) {
	// Only relevant when drawing is in progress
	if (!this.drawingInProgress || this.currentMode === 'select' || this.currentMode === 'draw-marker') {
		return;
	}

	var latlng = event.latlng;
	var position = { lat: latlng.lat, lng: latlng.lng };

	// Create a preview with existing points plus current mouse position
	var previewCoords = [...this.drawingCoordinates, position];

	// Update the temporary visualization
	var element = {
		Id: 'temp-' + Date.now(),
		Type: this.currentMode === 'draw-polyline' ? 'L' : 'P',
		Description: 'Nuevo elemento',
		Geometry: previewCoords,
		Color: this.currentMode === 'draw-polyline' ? '#FF4081' : '#4CAF50'
	};

	this.updateTempElement(element);
};

/**
 * Complete the drawing process and prompt for attributes
 * @private
 */
LeafletAnnotator.prototype._completeDrawing = function (element) {
//	this.removeTempElement();
	this.drawingInProgress = false;

	// Show the attribute popup
	this._showAttributesPopup(element);
};

/**
 * Show a popup to collect attributes for the new element
 * @private
 */
LeafletAnnotator.prototype._showAttributesPopup = function (element) {
	var loc = this;
	loc.removeTempElement();
	window.Popups.AnnotationItem.show(element).then(
		function (element) {
			// Notify handler about the new element
			if (loc.onCompleteDrawHandler) {
				loc.onCompleteDrawHandler(element);
			}
	});
};

/**
 * Set a handler for when drawing is completed
 * @param {Function} handler - Handler function that receives the new element
 */
LeafletAnnotator.prototype.onCompleteDrawing = function (handler) {
	this.onCompleteDrawHandler = handler;
};

/**
 * Cancel the current drawing
 */
LeafletAnnotator.prototype.cancelDrawing = function () {
	this.removeTempElement();
	this.drawingInProgress = false;
	this.drawingCoordinates = [];
};

/**
 * Update an existing element
 * @param {Object} element - The element with updated properties
 */
LeafletAnnotator.prototype.updateElement = function (element) {
	// Remove existing element
	if (this.elementLayers.has(element.Id)) {
		this.removeElement(element.Id);
	}
	// Add updated element
	return this.addElement(element);
};

/**
 * Remove an element from the map
 * @param {string} elementId - The ID of the element to remove
 */
LeafletAnnotator.prototype.removeElement = function (elementId) {
	var layer = this.elementLayers.get(elementId);
	if (layer) {
		this.map.removeLayer(layer);
		this.elementLayers.delete(elementId);
		this.elements.delete(elementId);
		this.selectedElementIds.delete(elementId);
	}
};

/**
 * Clear all elements from the map
 */
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

/**
 * Add a temporary element (for drawing preview)
 * @param {Object} element - The element to add temporarily
 */
LeafletAnnotator.prototype.addTempElement = function (element) {
	// Remove existing temp element if any
	this.removeTempElement();

	// Create temp layer based on element type
	if (element.Type === 'M') {
		var markerOptions = this._getMarkerOptions(element);
		this.tempLayer = L.marker(element.Geometry[0], {
			opacity: 0.7, icon: markerOptions.icon
		}).addTo(this.map);
	} else if (element.Type === 'L') {
		this.tempLayer = L.polyline(element.Geometry, {
			color: element.Color || '#FF4081',
			weight: 3,
			opacity: 0.7,
			dashArray: '5, 10'
		}).addTo(this.map);
	} else if (element.Type === 'P') {
		this.tempLayer = L.polygon(element.Geometry, {
			color: element.Color || '#4CAF50',
			weight: 2,
			opacity: 0.7,
			fillOpacity: 0.2,
			dashArray: '5, 10'
		}).addTo(this.map);
	}
};

/**
 * Update a temporary element (for drawing preview)
 * @param {Object} element - The updated element
 */
LeafletAnnotator.prototype.updateTempElement = function (element) {
	// Update existing temp element
	if (this.tempLayer) {
		if (element.Type === 'M' || element.Type === 'C' || element.Type === 'Q') {
			this.tempLayer.setLatLng(element.Geometry[0]);
		} else if (element.Type === 'L' || element.Type === 'P') {
			this.tempLayer.setLatLngs(element.Geometry);
		}
	} else {
		// Create if it doesn't exist
		this.addTempElement(element);
	}
};

/**
 * Remove the temporary element
 */
LeafletAnnotator.prototype.removeTempElement = function () {
	if (this.tempLayer) {
		this.map.removeLayer(this.tempLayer);
		this.tempLayer = null;
	}
};

/**
 * Select an element
 * @param {string} elementId - The ID of the element to select
 */
LeafletAnnotator.prototype.selectElement = function (elementId) {
	var layer = this.elementLayers.get(elementId);
	if (layer) {
		// Add to selection set
		this.selectedElementIds.add(elementId);

		// Apply selected style
		if (layer instanceof L.Marker) {
			// For markers, we could use a different icon or change opacity
			layer.setOpacity(1.0);
			if (layer._icon) {
				layer._icon.classList.add('selected-marker');
			}
		} else {
			// For lines and polygons, apply style
			layer.setStyle(this.selectedStyle);
			layer.bringToFront();
		}
	}
};

/**
 * Deselect an element
 * @param {string} elementId - The ID of the element to deselect
 */
LeafletAnnotator.prototype.deselectElement = function (elementId) {
	var layer = this.elementLayers.get(elementId);
	var element = this.elements.get(elementId);

	if (layer && element) {
		// Remove from selection set
		this.selectedElementIds.delete(elementId);

		// Restore original style
		if (layer instanceof L.Marker) {
			layer.setOpacity(0.9);
			if (layer._icon) {
				layer._icon.classList.remove('selected-marker');
			}
		} else if (element.Type === 'L') {
			layer.setStyle({
				color: element.Color || '#FF4081',
				weight: 3,
				opacity: 0.8
			});
		} else if (element.Type === 'P') {
			layer.setStyle({
				color: element.Color || '#4CAF50',
				weight: 2,
				opacity: 0.8,
				fillOpacity: 0.3,
				fillColor: element.Color || '#4CAF50'
			});
		}
	}
};

/**
 * Clear all selected elements
 */
LeafletAnnotator.prototype.clearSelection = function () {
	var self = this;
	// Deselect all elements
	this.selectedElementIds.forEach(function (elementId) {
		self.deselectElement(elementId);
	});
	this.selectedElementIds.clear();
};

/**
 * Center the map on an element
 * @param {Object} element - The element to center on
 */
LeafletAnnotator.prototype.centerOnElement = function (element) {
	if (!element || !element.Geometry || element.Geometry.length === 0) {
		return;
	}

	if (element.Type === 'M') {
		// Center on marker
		this.map.setView(element.Geometry[0], 15);
	} else {
		// Create bounds around polyline or polygon
		var bounds = L.latLngBounds(element.Geometry);
		this.map.fitBounds(bounds, {
			padding: [50, 50],
			maxZoom: 15
		});
	}
};

/**
 * Clean up resources when no longer needed
 */
LeafletAnnotator.prototype.destroy = function () {
	// Remove temporary elements
	this.removeTempElement();

	// Clear all elements
	this.clearElements();

	// Remove event listeners (if needed)
};

/**
 * Update the cursor style based on current mode
 * @private
 */
LeafletAnnotator.prototype._updateCursor = function () {
	// Set cursor based on current mode
	switch (this.currentMode) {
		case 'select':
			window.SegMap.SetCursor('default');
			break;
		case 'draw-marker':
		case 'draw-polyline':
		case 'draw-polygon':
			window.SegMap.SetCursor('crosshair');
			break;
		case 'delete':
			window.SegMap.SetCursor('not-allowed');
			break;
		default:
			window.SegMap.SetCursor('default');
	}
};

/**
 * Set up event handlers for a layer
 * @private
 */
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
			if (layer instanceof L.Marker && layer._icon) {
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
			if (layer instanceof L.Marker && layer._icon) {
				layer._icon.classList.remove('hover-marker');
			} else if (element) {
				if (element.Type === 'L') {
					layer.setStyle({
						color: element.Color || '#FF4081',
						weight: 3,
						opacity: 0.8
					});
				} else if (element.Type === 'P') {
					layer.setStyle({
						color: element.Color || '#4CAF50',
						weight: 2,
						opacity: 0.8,
						fillOpacity: 0.3,
						fillColor: element.Color || '#4CAF50'
					});
				}
			}
		}
	});
};

/**
 * Set a handler for element drag end events
 * @param {Function} handler - Handler function
 */
LeafletAnnotator.prototype.onElementDragEnd = function (handler) {
	this.elementDragEndHandler = handler;
};

/**
 * Set a handler for element click events
 * @param {Function} handler - Handler function
 */
LeafletAnnotator.prototype.onElementClick = function (handler) {
	this.elementClickHandler = handler;
};

/**
 * Set a handler for element hover events
 * @param {Function} handler - Handler function
 */
LeafletAnnotator.prototype.onElementHover = function (handler) {
	this.elementHoverHandler = handler;
};

/**
 * Set a handler for element leave events
 * @param {Function} handler - Handler function
 */
LeafletAnnotator.prototype.onElementLeave = function (handler) {
	this.elementLeaveHandler = handler;
};

/**
 * Set a handler for map click events
 * @param {Function} handler - Handler function
 */
LeafletAnnotator.prototype.onMapClick = function (handler) {
	this.mapClickHandler = handler;
};

/**
 * Enable or disable editing for all elements
 * @param {boolean} enabled - Whether editing should be enabled
 */
LeafletAnnotator.prototype.setEditingEnabled = function (enabled) {
	var self = this;
	// Update the editing flag
	this.canEdit = enabled;

	// Update marker draggable state
	this.elementLayers.forEach(function (layer, elementId) {
		var element = self.elements.get(elementId);
		if (!element) return;

		if (element.Type === 'M') {
			if (layer.dragging) {
				if (enabled) {
					layer.dragging.enable();
				} else {
					layer.dragging.disable();
				}
			}
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

/**
 * Make a layer editable
 * @private
 */
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
		if (element.Type === 'L') {
			// For polylines, it's a simple array of LatLng objects
			layerLatLngs.forEach(function (latlng) {
				updatedCoordinates.push({
					lat: latlng.lat,
					lng: latlng.lng
				});
			});
		} else if (element.Type === 'P') {
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
			Geometry: updatedCoordinates
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
		if (element.Type === 'L') {
			layerLatLngs.forEach(function (latlng) {
				updatedCoordinates.push({
					lat: latlng.lat,
					lng: latlng.lng
				});
			});
		} else if (element.Type === 'Polygon') {
			var coords = Array.isArray(layerLatLngs[0]) ? layerLatLngs[0] : layerLatLngs;
			coords.forEach(function (latlng) {
				updatedCoordinates.push({
					lat: latlng.lat,
					lng: latlng.lng
				});
			});
		}

		var updatedElement = Object.assign({}, element, {
			Geometry: updatedCoordinates
		});

		if (self.elementDragEndHandler) {
			self.elementDragEndHandler(updatedElement);
		}
	});
};

/**
 * Get marker options based on element properties
 * @private
 */
LeafletAnnotator.prototype._getMarkerOptions = function (element) {
	var iconOptions = {};

	// Check if it's a comment type (which has precedence over forma)
	if (element.Type === 'C') {
		return {
			icon: L.divIcon({
				html: '<div style="width: 30px; height: 30px; background-color: ' + (element.Color || '#FF9800') + '; border: 2px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
					'<span class="material-icons" style="font-size: 18px; color: white;">comment</span>' +
					'</div>',
				className: 'custom-div-icon',
				iconSize: [30, 30],
				iconAnchor: [15, 15]
			}),
			title: element.Description || ''
		};
	}
	if (element.Type === 'Q') {
		return {
			icon: L.divIcon({
				html: '<div style="width: 30px; height: 30px; background-color: ' + (element.Color || '#FF9800') + '; border: 2px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
					'<span class="material-icons" style="font-size: 18px; color: white;">help</span>' +
					'</div>',
				className: 'custom-div-icon',
				iconSize: [30, 30],
				iconAnchor: [15, 15]
			}),
			title: element.Description || ''
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
					html: '<div style="width: 20px; height: 20px; background-color: ' + (element.Color || '#2196F3') + '; border: 2px solid #FFF; display: flex; align-items: center; justify-content: center;">' +
						'<span class="material-icons" style="font-size: 14px; color: white;">' + (element.icono || '') + '</span>' +
						'</div>',
					className: 'custom-div-icon',
					iconSize: [20, 20],
					iconAnchor: [10, 10]
				}),
				title: element.Description || ''
			};
		case 'círculo':
			// Create a circle icon
			return {
				icon: L.divIcon({
					html: '<div style="width: 20px; height: 20px; background-color: ' + (element.Color || '#2196F3') + '; border: 2px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
						'<span class="material-icons" style="font-size: 14px; color: white;">' + (element.icono || '') + '</span>' +
						'</div>',
					className: 'custom-div-icon',
					iconSize: [20, 20],
					iconAnchor: [10, 10]
				}),
				title: element.Description || ''
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
		title: element.Description || ''
	};
};

// Export the constructor
export default LeafletAnnotator;
