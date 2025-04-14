
export default MapAnnotator;

// Abstract base adapter function
function MapAnnotator(mapsAPI) {
	this.mapsAPI = mapsAPI;
	this.elements = new Map(); // Store elements by id for quick access
	this.selectedElementIds = new Set(); // Track selected elements
	this.currentMode = 'select'; // 'select', 'draw-marker', 'draw-polyline', 'draw-line', 'draw-comment', 'draw-question', 'delete', 'edit'
	// Event handlers
	this.elementClickHandler = null;
	this.elementHoverHandler = null;
	this.elementLeaveHandler = null;
	this.mapClickHandler = null;
	this.elementDragEndHandler = null;
}

// Initialize the map
MapAnnotator.prototype.init = function () {
	throw new Error("Method 'init()' must be implemented");
};

// Set interaction mode
MapAnnotator.prototype.setMode = function (mode) {
	this.currentMode = mode;
	this._updateInteractionMode();

	// Enable or disable editing based on mode
	if (mode === 'edit') {
		this.setEditingEnabled(true);
	} else {
		this.setEditingEnabled(false);
	}
};

// Register event handlers
MapAnnotator.prototype.onElementClick = function (handler) {
	this.elementClickHandler = handler;
};

MapAnnotator.prototype.onElementHover = function (handler) {
	this.elementHoverHandler = handler;
};

MapAnnotator.prototype.onElementLeave = function (handler) {
	this.elementLeaveHandler = handler;
};

MapAnnotator.prototype.onMapClick = function (handler) {
	this.mapClickHandler = handler;
};

// Register handler for drag-end events
MapAnnotator.prototype.onElementDragEnd = function (handler) {
	this.elementDragEndHandler = handler;
};

// Enable or disable editing for all elements
MapAnnotator.prototype.setEditingEnabled = function (enabled) {
	throw new Error("Method 'setEditingEnabled()' must be implemented");
};

// Element operations
MapAnnotator.prototype.addElement = function (element) {
	throw new Error("Method 'addElement()' must be implemented");
};

MapAnnotator.prototype.updateElement = function (element) {
	throw new Error("Method 'updateElement()' must be implemented");
};

MapAnnotator.prototype.removeElement = function (elementId) {
	throw new Error("Method 'removeElement()' must be implemented");
};

MapAnnotator.prototype.clearElements = function () {
	throw new Error("Method 'clearElements()' must be implemented");
};

// Temporary element for drawing
MapAnnotator.prototype.addTempElement = function (element) {
	throw new Error("Method 'addTempElement()' must be implemented");
};

MapAnnotator.prototype.updateTempElement = function (element) {
	throw new Error("Method 'updateTempElement()' must be implemented");
};

MapAnnotator.prototype.removeTempElement = function () {
	throw new Error("Method 'removeTempElement()' must be implemented");
};

// Selection operations
MapAnnotator.prototype.selectElement = function (elementId) {
	throw new Error("Method 'selectElement()' must be implemented");
};

MapAnnotator.prototype.deselectElement = function (elementId) {
	throw new Error("Method 'deselectElement()' must be implemented");
};

MapAnnotator.prototype.clearSelection = function () {
	throw new Error("Method 'clearSelection()' must be implemented");
};

// Center on element
MapAnnotator.prototype.centerOnElement = function (element) {
	throw new Error("Method 'centerOnElement()' must be implemented");
};

// Clean up
MapAnnotator.prototype.destroy = function () {
	throw new Error("Method 'destroy()' must be implemented");
};

// Protected method to update interaction mode
MapAnnotator.prototype._updateInteractionMode = function () {
	throw new Error("Method '_updateInteractionMode()' must be implemented");
};
