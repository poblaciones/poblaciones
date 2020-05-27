import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import TileRequest from '@/public/googleMaps/TileRequest';
import PreviewHandler from './PreviewHandler';

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
	this.disposed = false;
	// Guarda lo relacionado al preview de tile
	this.preview = (this.composer.svgInTile !== undefined ? new PreviewHandler(this) : null);
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

	// se fija si tiene sentido pedirlo
	if (!this.IsTileVisible(boundsRectRequired, coord, zoom)) {
		return div;
	}

	var dataRequest = new TileRequest(window.SegMap.Queue, window.SegMap.StaticQueue, this, coord, zoom, boundsRectRequired, key, div);
	dataRequest.GetTile();
	//div.innerHTML = '<div style="padding: 4px; ">XXXXXXXXXXXX<a href="' + args + '">' + args + '</a></div>';

	if (this.geographyService.url) {
		if (this.preview) {
			var ele = this.preview.getPreview(coord, zoom);
			if (ele) {
				div.appendChild(ele);
			}
		}
	}
	this.requestedTiles[key] = dataRequest;
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

TileOverlay.prototype.process = function (mapResults, dataResults, gradient, tileKey, div, x, y, z) {
	if ((tileKey in this.requestedTiles) === false || this.disposed) {
		return;
	}
	delete this.requestedTiles[tileKey];

	this.composer.textInTile[tileKey] = [];
	var mercator = new Mercator();
	var tileBounds = mercator.getTileBoundsLatLon({ x: x, y: y, z: z });
	this.composer.render(mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds);
};

TileOverlay.prototype.releaseTile = function(tile) {
	var key = tile.getAttribute('key');
	this.killIfRunning(key);
	this.composer.removeTileFeatures(key);
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

TileOverlay.prototype.dispose = function () {
	this.disposed = true;
	this.composer.dispose();
	if (this.preview) {
		this.preview.dispose();
	}
};
