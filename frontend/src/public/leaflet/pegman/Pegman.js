import * as L from 'leaflet';

export default class CreatePegman {
	constructor() {
	}
	Create() {
		// https://github.com/Raruto/leaflet-pegman/blob/master/leaflet-pegman.js
		return L.Control.extend({
			includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
			options: {
				position: 'bottomright',
				theme: "leaflet-pegman-v3-default", // or "leaflet-pegman-v3-small"
				debug: false,
				apiKey: '',
				libraries: '',
				mutant: {
					attribution: 'Map data: &copy; <a href="https://www.google.com/intl/en/help/terms_maps.html">Google</a>',
					pane: "overlayPane",
					type: null, // Non-image map type (used to force a transparent background)
				},
				pano: {
					enableCloseButton: true,
					fullscreenControl: false,
					imageDateControl: true
				},
				marker: {
					draggable: true,
					icon: L.icon({
						className: "pegman-marker",
						iconSize: [52, 52],
						iconAnchor: [24, 33],
						iconUrl: 'data:image/png;base64,' + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII=",
					}),
				}
			},

			__interactURL: 'https://unpkg.com/interactjs@1.2.9/dist/interact.min.js',
			__gmapsURL: 'https://maps.googleapis.com/maps/api/js?v=3',
			__mutantURL: 'https://unpkg.com/leaflet.gridlayer.googlemutant@0.10.0/Leaflet.GoogleMutant.js',

			initialize: function (options) {

				if (typeof options.logging !== "undefined") options.debug = options.logging;

				L.Util.setOptions(this, options);

				// Grab Left/Right/Up/Down Direction of Mouse for Pegman Image
				this._mousePos = {
					direction: {},
					old: {},
				};

				this._pegmanMarkerCoords = null;
				this._streetViewCoords = null;
				this._streetViewLayerEnabled = false;

				this._dropzoneMapOpts = {
					accept: '.draggable', // Only Accept Elements Matching this CSS Selector
					overlap: 0.75, // Require a 75% Element Overlap for a Drop to be Possible
					ondropactivate: L.bind(this.onDropZoneActivated, this),
					ondragenter: L.bind(this.onDropZoneDragEntered, this),
					ondragleave: L.bind(this.onDropZoneDragLeaved, this),
					ondrop: L.bind(this.onDropZoneDropped, this),
					ondropdeactivate: L.bind(this.onDropZoneDeactivated, this),
				};
				this._draggableMarkerOpts = {
					inertia: false,
					onmove: L.bind(this.onDraggableMove, this),
					onend: L.bind(this.onDraggableEnd, this),
				};

				this._lazyLoaderAdded = false;
			},

			onAdd: function (map) {
				this._map = map;

				this._container = L.DomUtil.create('div', 'leaflet-pegman pegman-control leaflet-bar');
				this._pegman = L.DomUtil.create('div', 'pegman draggable drag-drop', this._container);
				this._pegmanButton = L.DomUtil.create('div', 'pegman-button', this._container);
				this._pegmanMarker = L.marker([0, 0], this.options.marker);
				this._panoDiv = this.options.panoDiv ? document.querySelector(this.options.panoDiv) : L.DomUtil.create('div', '', this._map._container);

				L.DomUtil.addClass(this._panoDiv, 'pano-canvas');
				L.DomUtil.addClass(this._map._container, this.options.theme);

				L.DomEvent.disableClickPropagation(this._panoDiv);
				// L.DomEvent.on(this._container, 'click mousedown touchstart dblclick', this._disableClickPropagation, this);
				L.DomEvent.on(this._container, 'click mousedown dblclick', this._disableClickPropagation, this);

				this._container.addEventListener('touchstart', this._loadScripts.bind(this, !L.Browser.touch), { once: true });
				this._container.addEventListener('mousedown', this._loadScripts.bind(this, true), { once: true });
				this._container.addEventListener('mouseover', this._loadScripts.bind(this, false), { once: true });

				this._loadInteractHandlers();
				this._loadGoogleHandlers();

				L.DomEvent.on(document, 'mousemove', this.mouseMoveTracking, this);
				L.DomEvent.on(document, 'keyup', this.keyUpTracking, this);

				this._pegmanMarker.on("dragend", this.onPegmanMarkerDragged, this);
				this._map.on("click", this.onMapClick, this);
				this._map.on("layeradd", this.onMapLayerAdd, this);

				return this._container;
			},

			onRemove: function (map) {
				interact(this._pegman).unset();
				interact(this._map._container).unset();
				interact(this._container).unset();

				if (this._googleStreetViewLayer) this._googleStreetViewLayer.remove();
				if (this._pegmanMarker) this._pegmanMarker.remove();

				L.DomUtil.remove(this._panoDiv);

				L.DomEvent.off(document, 'mousemove', this.mouseMoveTracking, this);
				L.DomEvent.off(document, 'keyup', this.keyUpTracking, this);

				map.off("mousemove", this._setMouseCursor, this);
			},

			_log: function (args) {
				if (this.options.debug) {
					console.log(args);
				}
			},

			_addClasses: function (el, classNames) {
				classNames = classNames.split(" ");
				for (var s in classNames) {
					L.DomUtil.addClass(el, classNames[s]);
				}
			},

			_removeClasses: function (el, classNames) {
				classNames = classNames.split(" ");
				for (var s in classNames) {
					L.DomUtil.removeClass(el, classNames[s]);
				}
			},

			_removeAttributes: function (el, attrNames) {
				for (var a in attrNames) {
					el.removeAttribute(attrNames[a]);
				}
			},

			_insertAfter: function (targetNode, newNode) {
				targetNode.parentNode.insertBefore(newNode, targetNode.nextSibling);
			},

			_translateElement: function (el, dx, dy) {
				if (dx === false && dy === false) {
					this._removeAttributes(this._pegman, ["style", "data-x", "data-y"]);
				}
				// Element's position is preserved within the data-x/data-y attributes
				var x = (parseFloat(el.getAttribute('data-x')) || 0) + dx;
				var y = (parseFloat(el.getAttribute('data-y')) || 0) + dy;

				// Translate element
				el.style.webkitTransform = el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

				// Update position attributes
				el.setAttribute('data-x', x);
				el.setAttribute('data-y', y);
			},

			_updateClasses: function (action) {
				switch (action) {
					case "pegman-dragging":
						this._removeClasses(this._pegman, "dropped");
						this._addClasses(this._container, "dragging");
						break;
					case "pegman-dragged":
						this._removeClasses(this._pegman, "can-drop dragged left right active dropped");
						this._removeAttributes(this._pegman, ["style", "data-x", "data-y"]);
						break;
					case "dropzone-actived":
						this._addClasses(this._map._container, "drop-active");
						break;
					case "dropzone-drag-entered":
						this._addClasses(this._pegman, "active can-drop");
						this._addClasses(this._map._container, "drop-target");
						break;
					case "dropzone-drag-leaved":
						this._removeClasses(this._map._container, "drop-target");
						this._removeClasses(this._pegman, "can-drop");
						break;
					case "dropzone-drop":
						this._removeClasses(this._container, "dragging");
						this._removeClasses(this._pegman, "active left right");
						this._addClasses(this._pegman, "dropped");
						this._removeClasses(this._pegman, "can-drop dragged left right active dropped");
						break;
					case "dropzone-deactivated":
						this._removeClasses(this._pegman, "active left right");
						this._removeClasses(this._map._container, "drop-active drop-target");
						break;
					case "mousemove-top":
						this._addClasses(this._pegman, "top");
						this._removeClasses(this._pegman, "bottom right left");
						break;
					case "mousemove-bottom":
						this._addClasses(this._pegman, "bottom");
						this._removeClasses(this._pegman, "top right left");
						break;
					case "mousemove-left":
						this._addClasses(this._pegman, "left");
						this._removeClasses(this._pegman, "right top bottom");
						break;
					case "mousemove-right":
						this._addClasses(this._pegman, "right");
						this._removeClasses(this._pegman, "left top bottom");
						break;
					case "pegman-added":
						this._addClasses(this._container, "active");
						break;
					case "pegman-removed":
						this._removeClasses(this._container, "active");
						break;
					case "streetview-shown":
						this._addClasses(this._container, "streetview-layer-active");
						break;
					case "streetview-hidden":
						this._removeClasses(this._container, "streetview-layer-active");
						break;
					default:
						throw "Unhandled event:" + action;
				}
				this.fire("svpc_" + action);
			},

			onDraggableMove: function (e) {
				this.mouseMoveTracking(e);
				this.pegmanRemove();
				this._updateClasses("pegman-dragging");
				this._translateElement(this._pegman, e.dx, e.dy);
			},

			onDraggableEnd: function (e) {
				this._pegmanMarkerCoords = this._map.mouseEventToLatLng(e);
				this.pegmanAdd();
				this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
				this._updateClasses("pegman-dragged");
			},

			onDropZoneActivated: function (e) {
				this._updateClasses("dropzone-actived");
			},

			onDropZoneDragEntered: function (e) {
				this.showStreetViewLayer();
				this._updateClasses("dropzone-drag-entered");
			},

			onDropZoneDragLeaved: function (e) {
				this._updateClasses("dropzone-drag-leaved");
			},

			onDropZoneDropped: function (e) {
				this._updateClasses("dropzone-drop");
				this._translateElement(this._pegman, false, false);
			},

			onDropZoneDeactivated: function (e) {
				this._updateClasses("dropzone-deactivated");
			},

			onPegmanMarkerDragged: function (e) {
				this._pegmanMarkerCoords = this._pegmanMarker.getLatLng();
				this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
			},

			onMapClick: function (e) {
				if (this._streetViewLayerEnabled) {
					this.findStreetViewData(e.latlng.lat, e.latlng.lng);
				}
			},

			onMapLayerAdd: function (e) {
				if (this._googleStreetViewLayer)
					this._googleStreetViewLayer.bringToFront();
			},

			onStreetViewPanoramaClose: function () {
				this.clear();
			},

			onPanoramaPositionChanged: function () {
				var pos = this._panorama.getPosition();
				pos = L.latLng(pos.lat(), pos.lng());
				if (this._map && !this._map.getBounds().pad(-0.05).contains(pos)) {
					this._map.panTo(pos);
				}
				this._pegmanMarker.setLatLng(pos);
			},

			onPanoramaPovChanged: function () {
				var pov = this._panorama.getPov();
				this._pegmanMarker.getElement().style.backgroundPosition = "0 " + -Math.abs((Math.round(pov.heading / (360 / 16)) % 16) * Math.round(835 / 16)) + 'px'; // sprite_height = 835px; num_rows = 16; pegman_angle = [0, 360] deg
			},

			clear: function () {
				this.pegmanRemove();
				this.hideStreetViewLayer();
				this.closeStreetViewPanorama();
			},

			toggleStreetViewLayer: function (e) {
				if (this._streetViewLayerEnabled) this.clear();
				else this.showStreetViewLayer();
				this._log("streetview-layer-toggled");
			},

			pegmanAdd: function () {
				this._pegmanMarker.addTo(this._map);
				this._pegmanMarker.setLatLng(this._pegmanMarkerCoords);
				this.findStreetViewData(this._pegmanMarkerCoords.lat, this._pegmanMarkerCoords.lng);
				this._updateClasses("pegman-added");
			},

			pegmanRemove: function () {
				this._pegmanMarker.removeFrom(this._map);
				this._updateClasses("pegman-removed");
			},

			closeStreetViewPanorama: function () {
				this._panoDiv.style.display = "none";
			},

			openStreetViewPanorama: function () {
				this._panoDiv.style.display = "block";
			},

			hideStreetViewLayer: function () {
				if (this._googleStreetViewLayer) {
					this._googleStreetViewLayer.removeFrom(this._map);
					this._streetViewLayerEnabled = false;
					this._updateClasses("streetview-hidden");
				}
			},

			showStreetViewLayer: function () {
				if (this._googleStreetViewLayer) {
					this._googleStreetViewLayer.addTo(this._map);
					this._streetViewLayerEnabled = true;
					this._updateClasses("streetview-shown");
				}
			},

			findStreetViewData: function (lat, lng) {
				if (typeof google === 'undefined') {
					this._loadScripts(true);
					return this.once('svpc_streetview-shown', L.bind(this.findStreetViewData, this, lat, lng));
				}

				if (!this._pegmanMarker._map && this._map) {
					this._pegmanMarkerCoords = L.latLng(lat, lng);
					return this.pegmanAdd();
				}

				// var searchRadiusPx = 24,
				// 	latlng = L.latLng(lat, lng),
				// 	p = this._map.project(latlng).add([searchRadiusPx, 0]),
				// 	searchRadius = latlng.distanceTo(this._map.unproject(p));

				this._streetViewCoords = new google.maps.LatLng(lat, lng);

				var zoom = this._map.getZoom();
				var searchRadius = 100;

				if (zoom < 6) searchRadius = 5000;
				else if (zoom < 10) searchRadius = 500;
				else if (zoom < 15) searchRadius = 250;
				else if (zoom >= 17) searchRadius = 50;
				else searchRadius = 100;

				this._streetViewService.getPanoramaByLocation(this._streetViewCoords, searchRadius, L.bind(this.processStreetViewServiceData, this));
			},

			processStreetViewServiceData: function (data, status) {
				if (status == google.maps.StreetViewStatus.OK) {
					this.openStreetViewPanorama();
					this._panorama.setPano(data.location.pano);
					this._panorama.setPov({
						heading: google.maps.geometry.spherical.computeHeading(data.location.latLng, this._streetViewCoords),
						pitch: 0,
						zoom: 0
					});
					this._panorama.setVisible(true);
				} else {
					console.warn("Street View data not found for this location.");
					// this.clear(); // TODO: add a visual feedback when no SV data available
				}
			},

			/**
			 * mouseMoveTracking
			 * @desc internal function used to style pegman while dragging
			 */
			mouseMoveTracking: function (e) {
				var mousePos = this._mousePos;

				// Top <--> Bottom
				if (e.pageY < mousePos.old.y) {
					mousePos.direction.y = 'top';
					this._updateClasses("mousemove-top");
				} else if (e.pageY > mousePos.old.y) {
					mousePos.direction.y = 'bottom';
					this._updateClasses("mousemove-bottom");
				}
				// Left <--> Right
				if (e.pageX < mousePos.old.x) {
					mousePos.direction.x = 'left';
					this._updateClasses("mousemove-left");
				} else if (e.pageX > mousePos.old.x) {
					mousePos.direction.x = 'right';
					this._updateClasses("mousemove-right");
				}

				mousePos.old.x = e.pageX;
				mousePos.old.y = e.pageY;
			},

			/**
			 * keyUpTracking
			 * @desc internal function used to track keyup events
			 */
			keyUpTracking: function (e) {
				if (e.keyCode == 27) {
					this._log('escape pressed');
					this.clear();
				}
			},

			_disableClickPropagation: function (e) {
				L.DomEvent.stopPropagation(e);
				L.DomEvent.preventDefault(e);
			},

			_loadGoogleHandlers: function (toggleStreetView) {
				if (typeof google !== 'object' || typeof google.maps !== 'object' || typeof L.GridLayer.GoogleMutant !== 'function') return;
				this._initGoogleMaps(toggleStreetView);
				this._initMouseTracker();
			},

			_initGoogleMaps: function (toggleStreetView) {
				this._googleStreetViewLayer = L.gridLayer.googleMutant(this.options.mutant);
				this._googleStreetViewLayer.addGoogleLayer('StreetViewCoverageLayer');

				this._panorama = new google.maps.StreetViewPanorama(this._panoDiv, this.options.pano);
				this._streetViewService = new google.maps.StreetViewService();

				this._panorama.addListener('closeclick', L.bind(this.onStreetViewPanoramaClose, this));
				this._panorama.addListener('position_changed', L.bind(this.onPanoramaPositionChanged, this));
				this._panorama.addListener('pov_changed', L.bind(this.onPanoramaPovChanged, this));

				if (toggleStreetView) {
					this.showStreetViewLayer();
				}
			},

			_initMouseTracker: function () {
				if (!this._googleStreetViewLayer) return;

				var tileSize = this._googleStreetViewLayer.getTileSize();

				this.tileWidth = tileSize.x;
				this.tileHeight = tileSize.y;

				this.defaultDraggableCursor = this._map._container.style.cursor;

				this._map.on("mousemove", this._setMouseCursor, this);
			},

			_setMouseCursor: function (e) {
				var coords = this._getTileCoords(e.latlng.lat, e.latlng.lng, this._map.getZoom());
				var img = this._getTileImage(coords);
				var pixel = this._getTilePixelPoint(img, e.originalEvent);
				var hasTileData = this._hasTileData(img, pixel);
				this._map._container.style.cursor = hasTileData ? 'pointer' : this.defaultDraggableCursor;
			},

			_getTileCoords: function (lat, lon, zoom) {
				var xtile = parseInt(Math.floor((lon + 180) / 360 * (1 << zoom)));
				var ytile = parseInt(Math.floor((1 - Math.log(Math.tan(this._toRad(lat)) + 1 / Math.cos(this._toRad(lat))) / Math.PI) / 2 * (1 << zoom)));
				return {
					x: xtile,
					y: ytile,
					z: zoom,
				};
			},

			_getTileImage: function (coords) {
				if (!this._googleStreetViewLayer || !this._googleStreetViewLayer._tiles) return;
				var key = this._googleStreetViewLayer._tileCoordsToKey(coords);
				var tile = this._googleStreetViewLayer._tiles[key];
				if (!tile) return;
				var img = tile.el.querySelector('img');
				if (!img) return;
				this._downloadTile(img.src, this._tileLoaded); // crossOrigin = "Anonymous"
				return img;
			},

			_getTilePixelPoint: function (img, e) {
				if (!img) return;
				var imgRect = img.getBoundingClientRect();
				var imgPos = {
					pageY: (imgRect.top + window.scrollY).toFixed(0),
					pageX: (imgRect.left + window.scrollX).toFixed(0)
				};
				var mousePos = {
					x: e.pageX - imgPos.pageX,
					y: e.pageY - imgPos.pageY
				};
				return mousePos;
			},

			_hasTileData: function (img, pixelPoint) {
				if (!this.tileContext || !pixelPoint) return;
				var pixelData = this.tileContext.getImageData(pixelPoint.x, pixelPoint.y, 1, 1).data;
				var alpha = pixelData[3];
				var hasTileData = (alpha != 0);
				return hasTileData;
			},

			_toRad: function (number) {
				return number * Math.PI / 180;
			},

			_downloadTile: function (imageSrc, callback) {
				if (!imageSrc) return;
				var img = new Image();
				img.crossOrigin = "Anonymous";
				img.addEventListener("load", callback.bind(this, img), false);
				img.src = imageSrc;
			},

			_tileLoaded: function (img) {
				this.tileCanvas = document.createElement("canvas");
				this.tileContext = this.tileCanvas.getContext("2d");

				this.tileCanvas.width = this.tileWidth;
				this.tileCanvas.height = this.tileHeight;

				this.tileContext.drawImage(img, 0, 0);
			},

			_loadInteractHandlers: function () {
				// TODO: trying to replace "interact.js" with default "L.Draggable" object
				// var draggable = new L.Draggable(this._container);
				// draggable.enable();
				// draggable.on('drag', function(e) { console.log(e); });
				if (typeof interact !== 'function') return;

				// Enable Draggable Element to be Dropped into Map Container
				this._draggable = interact(this._pegman).draggable(this._draggableMarkerOpts);
				this._dropzone = interact(this._map._container).dropzone(this._dropzoneMapOpts);

				this._draggable.styleCursor(false);

				// Toggle on/off SV Layer on Pegman's Container single clicks
				interact(this._container).on("tap", L.bind(this.toggleStreetViewLayer, this));

				// Prevent map drags (Desktop / Mobile) while dragging pegman control
				L.DomEvent.on(this._container, "touchstart", function (e) { this._map.dragging.disable(); }, this);
				L.DomEvent.on(this._container, "touchend", function (e) { this._map.dragging.enable(); }, this);
			},

			_loadScripts: function (toggleStreetView) {
				if (this._lazyLoaderAdded) return;
				this._lazyLoaderAdded = true;

				this._loadJS(this.__interactURL, this._loadInteractHandlers.bind(this), typeof interact !== 'function');
				this._loadJS(this.__gmapsURL + '&key=' + this.options.apiKey + '&libraries=' + this.options.libraries + '&callback=?', this._loadGoogleHandlers.bind(this, toggleStreetView), typeof google !== 'object' || typeof google.maps !== 'object');
				this._loadJS(this.__mutantURL, this._loadGoogleHandlers.bind(this, toggleStreetView), typeof L.GridLayer.GoogleMutant !== 'function');

			},

			_loadJS: function (url, callback, condition) {
				if (!condition) {
					callback();
					return;
				}
				if (url.indexOf('callback=?') !== -1) {
					this._jsonp(url, callback);
				} else {
					var script = document.createElement('script');
					script.src = url;
					var loaded = function () {
						script.onload = script.onreadystatechange = null;
						this._log(url + " loaded");
						callback();
					}.bind(this);
					script.onload = script.onreadystatechange = loaded;

					var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
					head.insertBefore(script, head.firstChild);
				}
			},

			_jsonp: function (url, callback, params) {
				var query = url.indexOf('?') === -1 ? '?' : '&';
				params = params || {};
				for (var key in params) {
					if (params.hasOwnProperty(key)) {
						query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
					}
				}

				var timestamp = new Date().getUTCMilliseconds();
				var jsonp = "json_call_" + timestamp; // uniqueId('json_call');
				window[jsonp] = function (data) {
					callback(data);
					window[jsonp] = undefined;
				};

				var script = document.createElement('script');
				if (url.indexOf('callback=?') !== -1) {
					script.src = url.replace('callback=?', 'callback=' + jsonp) + query.slice(0, -1);
				} else {
					script.src = url + query + 'callback=' + jsonp;
				}
				var loaded = function () {
					if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
						script.onload = script.onreadystatechange = null;
						if (script && script.parentNode) {
							script.parentNode.removeChild(script);
						}
					}
				};
				script.async = true;
				script.onload = script.onreadystatechange = loaded;
				var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
				// Use insertBefore instead of appendChild to circumvent an IE6 bug.
				// This arises when a base node is used.
				head.insertBefore(script, head.firstChild);
			},

		});
	}
}
