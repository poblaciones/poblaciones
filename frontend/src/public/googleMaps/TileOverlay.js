import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import TileRequest from '@/public/googleMaps/TileRequest';

export default TileOverlay;

function TileOverlay(map, google, activeSelectedMetric) {
	var TILE_SIZE = 256;
	this.map = map;
	this.google = google;
	this.idCounter = 0;
	this.activeSelectedMetric = activeSelectedMetric;
	this.tileSize = new google.maps.Size(TILE_SIZE, TILE_SIZE);
	this.composer = activeSelectedMetric.CreateComposer();
	this.geographyService = activeSelectedMetric.GetCartographyService();
	this.requestedTiles = [];
	this.zoomListener = null;
	// Guarda lo relacionado al preview de tile
	this.lastZoom = this.map.getZoom();
	var loc = this;
	if (loc.composer.svgInTile !== undefined) {
		this.svgInTileBackup = {};
		this.zoomListener = this.map.addListener('zoom_changed', function () {
			// guarda
			loc.svgInTileBackup[loc.lastZoom] = loc.composer.svgInTile;
			// actualiza
			loc.composer.svgInTile = [];
			loc.lastZoom = loc.map.getZoom();
		});
	}

}

TileOverlay.prototype.getTile = function (coord, zoom, ownerDocument) {

	var div = ownerDocument.createElement('div');

	this.activeSelectedMetric.UpdateOpacity(zoom);
	div.style.zIndex = this.activeSelectedMetric.index;
	div.style.width = this.tileSize.width + 'px';
	div.style.height = this.tileSize.height + 'px';
	div.style.fontSize = '10';

	var boundsRectRequired = window.SegMap.TileBoundsRequiredString({ x: coord.x, y: coord.y, z: zoom });
	var args = h.getFrameKey(coord.x, coord.y, zoom, boundsRectRequired);
  // si no se agrega idCounter, google maps hace coexistir
  // tiles con key duplicado
	var key = args + '&s=' + (this.idCounter++);
	div.setAttribute('key', key);

	//
	div.dataMetric = new this.google.maps.Data();
	// se fija si tiene sentido pedirlo
	if (!this.IsTileVisible(boundsRectRequired, coord, zoom)) {
		return div;
	}

	var dataRequest = new TileRequest(window.SegMap.Queue, window.SegMap.StaticQueue, this, coord, zoom, boundsRectRequired, key, div);
	dataRequest.GetTile();
	//div.innerHTML = '<div style="padding: 4px; ">XXXXXXXXXXXX<a href="' + args + '">' + args + '</a></div>';

	if (this.geographyService.url) {
		var ele = this.getPreview(coord, zoom);
		if (ele) {
			div.appendChild(ele);
		}
	}
	this.requestedTiles[key] = dataRequest;
	return div;
};

TileOverlay.prototype.getPreview = function (coord, zoom) {
	if (this.svgInTileBackup === undefined) {
		return null;
	}
	if (!this.activeSelectedMetric || !this.activeSelectedMetric.HasSelectedVariable()) {
		return null;
	}
	var v = this.activeSelectedMetric.SelectedVariable().Id;

	for (var n = zoom; n > 0; n--) {
		var svg = this.CreateBestPossibleSvg(v, coord, zoom, n);
		if (svg) {
			return svg;
		}
	}
	for (var n = zoom + 1; n < 22; n++) {
		var svg = this.CreateBestPossibleSvg(v, coord, zoom, n);
		if (svg) {
			return svg;
		}
	}
	return null;
};

TileOverlay.prototype.CreateBestPossibleSvg = function (v, coord, zoom, previousZoom) {
	if (!this.svgInTileBackup.hasOwnProperty(previousZoom)) {
		return null;
	}
	var svgs = this.svgInTileBackup[previousZoom];
	// Puede ser mayor o menor
	if (zoom >= previousZoom) {
		// Calcula las coordenadas y el offset del contenedor
		var deltaZ = zoom - previousZoom;
		var sourceX = Math.trunc(coord.x / Math.pow(2, deltaZ));
		var sourceY = Math.trunc(coord.y / Math.pow(2, deltaZ));
		var sourceZ = previousZoom;
		// Calcula la escala
		var times = Math.pow(2, deltaZ);
		var newSize = 256 / times;
		var offsetX = 256 * ((coord.x / Math.pow(2, deltaZ)) - sourceX);
		var offsetY = 256 * ((coord.y / Math.pow(2, deltaZ)) - sourceY);
		// se fija si lo tiene
		var sourceKey = h.getVariableFrameKey(v, sourceX, sourceY, sourceZ);
		if (svgs.hasOwnProperty(sourceKey)) {
			// lo devuelve
			var ret = svgs[sourceKey].cloneNode(true);
			ret.setAttribute("viewBox", offsetX + " " + offsetY + " " + newSize + " " + newSize);
			return ret;
		}
	} else {
		// Calcula cuál es la esquina de inicio
		var deltaZ = previousZoom - zoom;
		var sourceX = coord.x * Math.pow(2, deltaZ);
		var sourceY = coord.y * Math.pow(2, deltaZ);
		var sourceZ = previousZoom;
		// Calcula la escala
		var times = Math.pow(2, deltaZ);
		var newSize = 256 / times;
		// se fija si lo tiene
		var i = 0;
		var root = this.createDiv(256, 256);

		for (var y = 0; y < times; y++) {
			var row = this.createDiv(256, newSize);
			row.style.whiteSpace = 'nowrap';
			for (var x = 0; x < times; x++) {
				var sourceKey = h.getVariableFrameKey(v, sourceX + x, sourceY + y, sourceZ);
				var svg = null;
				if (svgs.hasOwnProperty(sourceKey)) {
					// lo devuelve
					var svg = svgs[sourceKey].cloneNode(true);
					svg.setAttribute("viewBox", "0 0 256 256");
					svg.style.maxWidth = newSize + 'px';
					svg.style.maxHeight = newSize + 'px';
					svg.style.display = 'inline-block';
					i++;
				}
				else {
					svg = this.createDiv(newSize, newSize);
					svg.style.display = 'inline-block';
				}
				row.appendChild(svg);
			}
			root.appendChild(row);
		}
		if (i > 0) {
			return root;
		}
	}
	return null;
};

TileOverlay.prototype.createDiv = function (width, height) {
	var div = document.createElement("div");
	if (width && height) {
		div.style.width = width + "px";
		div.style.height = height + "px";
	}
	return div;
};

TileOverlay.prototype.IsTileVisible = function (boundsRectRequired, coord, zoom) {
	if (boundsRectRequired === null && this.IsOutOfClipping(coord, zoom)) {
		return false;
	}
	return true;
};

TileOverlay.prototype.SetDivFailure = function (div) {
	div.innerHTML = '<div style="background-color: rgba(200, 200, 200, 0.75); padding: 4px; "><i class="fas fa-exclamation-triangle"></i> Error al cargar este bloque de información<br>&nbsp;<br>Si el problema persiste al recargar la página, <br>póngase en contacto con soporte.</div>';
	div.style.fontSize = '12px';
	div.style.fontFamily = 'Arial, Helvetica, sans-serif';
	div.style.borderStyle = 'solid';
	div.style.textAlign = 'center';
	div.style.paddingTop = (this.tileSize.height / 3) + 'px';
  div.style.borderWidth = '1px';
  div.style.borderColor = '#c0c0c0';
  div.style.color = '#333';
	div.style.backgroundColor = 'rgba(100, 100, 100, 0.25)';
};

TileOverlay.prototype.process = function (dataMetric, mapResults, dataResults, gradient, tileKey, div, x, y, z) {
	if ((tileKey in this.requestedTiles) === false) {
		return;
	}
	delete this.requestedTiles[tileKey];

	this.composer.textInTile[tileKey] = [];
	var mercator = new Mercator();
	var tileBounds = mercator.getTileBoundsLatLon({ x: x, y: y, z: z });
	var filtered = this.composer.renderGeoJson(dataMetric, mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds);
	// Los agrega
	this.composer.bindStyles(dataMetric, tileKey);
	dataMetric.addGeoJson(filtered);
	// Listo
	window.SegMap.MapsApi.BindDataMetric(dataMetric);
};

TileOverlay.prototype.releaseTile = function(tile) {
	if (tile.dataMetric) {
		tile.dataMetric.setMap(null);
		var key = tile.getAttribute('key');

		this.killIfRunning(key);
		this.composer.removeTileFeatures(key);

		tile.dataMetric = null;
	}
};
TileOverlay.prototype.killIfRunning = function(key) {
	if ((key in this.requestedTiles) === false) {
		return false;
	}

	this.requestedTiles[key].CancelHttpRequests();

	delete this.requestedTiles[key];
	return true;
};

TileOverlay.prototype.IsOutOfClipping = function (coord, zoom) {
	if (!this.activeSelectedMetric.CheckTileIsOutOfClipping()) {
		return false;
	}
	var mercator = new Mercator();
	var tile = mercator.normalizeTile({ x: coord.x, y: coord.y, z: zoom });
	var tileBounds = mercator.getTileBoundsLatLon(tile);
	var clippingBounds = window.SegMap.Clipping.clipping.Region.Envelope;
	if (clippingBounds) {
		return !mercator.rectanglesIntersect(tileBounds, clippingBounds);
	} else {
		return false;
	}
};

TileOverlay.prototype.clear = function () {
	this.composer.clear();
	this.svgInTileBackup = {};
	if (this.zoomListener) {
		this.zoomListener.remove();
	}
};
