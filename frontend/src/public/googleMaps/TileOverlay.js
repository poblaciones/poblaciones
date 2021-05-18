import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import TileRequest from '@/public/googleMaps/TileRequest';
import PreviewHandler from '@/public/composers/PreviewHandler';

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
	this.previewHandler = null;
	if (this.composer.usePreview) {
		this.previewHandler = new PreviewHandler(this);
	}
}

TileOverlay.prototype.getTile = function (coord, zoom, ownerDocument) {

	var div = ownerDocument.createElement('div');
	//div.style.transform = "translateZ(0)";
	this.activeSelectedMetric.UpdateOpacity(zoom);
	div.style.zIndex = this.activeSelectedMetric.index;
	div.style.width = this.tileSize.width + 'px';
	div.style.height = this.tileSize.height + 'px';
	div.style.fontSize = '10';

	var args = h.getFrameKey(coord.x, coord.y, zoom);
  // si no se agrega idCounter, google maps hace coexistir
  // tiles con key duplicado
	var key = args + '&s=' + (this.idCounter++);
	div.setAttribute('key', key);

	// se fija si tiene sentido pedirlo
	if (!this.IsTileVisible(coord, zoom)) {
		return div;
	}

	var mercator = new Mercator();
	var tileBounds = mercator.getTileBoundsLatLon({ x: coord.x, y: coord.y, z: zoom });

	var preview = this.resolvePreview(div, tileBounds, coord, zoom);

	if (preview && preview.IsFullCopy) {
		// es copia completa... regenera etiquetas y markers
		this.processLabels(preview.TileData, key, tileBounds, coord.x, coord.y, zoom);
		// lo guarda si el original
		if (preview.SourceZoom === zoom) {
			this.composer.SaveTileData(preview.Svg, preview.TileData, coord.x, coord.y, zoom);
		}
	} else {
		// pide información
		var dataRequest = new TileRequest(window.SegMap.Queue, window.SegMap.StaticQueue, this, coord, zoom, key, div);
		dataRequest.GetTile();
		this.requestedTiles[key] = dataRequest;
	}
	//div.innerHTML = '<div style="padding: 4px; ">XXXXXXXXXXXX<a href="' + args + '">' + args + '</a></div>';

	return div;
};

TileOverlay.prototype.resolvePreview = function (div, tileBounds, coord, zoom) {
	if (!this.previewHandler) {
		return null;
	}
	var preview = this.previewHandler.getPreview(tileBounds, coord, zoom);
	if (preview) {
		if (preview.Svg) {
			// le pide al composer que reaplique los estilos
			for (var n = 0; n < preview.SvgParts.length; n++)
				this.composer.RescaleStylesAndPatterns(preview.SvgParts[n], zoom, preview.SourceZoom);

			div.appendChild(preview.Svg);
		}
	}
	return preview;
};


TileOverlay.prototype.process = function (mapResults, dataResults, gradient, tileKey, div, x, y, z) {
	if ((tileKey in this.requestedTiles) === false || this.disposed) {
		return;
	}
	delete this.requestedTiles[tileKey];
	var mercator = new Mercator();
	var tileBounds = mercator.getTileBoundsLatLon({ x: x, y: y, z: z });
	var features = (dataResults.Data.features !== undefined ? dataResults.Data.features : dataResults.Data);
	this.processLabels(features, tileKey, tileBounds, x, y, z);
	var svg = null;
	if (this.composer.renderPolygons) {
		svg = this.composer.renderPolygons(mapResults, features, gradient, div, x, y, z, tileBounds, dataResults.Texture);
	}
	this.composer.SaveTileData(svg, features, x, y, z);
};

TileOverlay.prototype.processLabels = function(dataResults, tileKey, tileBounds, x, y, z) {
	this.composer.textInTile[tileKey] = [];
	this.composer.renderLabels(dataResults, tileKey, tileBounds, z);
};

TileOverlay.prototype.IsTileVisible = function (coord, zoom) {
	if (this.IsOutOfClipping(coord, zoom)) {
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


TileOverlay.prototype.releaseTile = function (tile) {
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
	if (this.previewHandler) {
		this.previewHandler.dispose();
	}
};
