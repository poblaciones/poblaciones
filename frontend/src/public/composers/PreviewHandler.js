import h from '@/public/js/helper';
import arr from '@/common/framework/arr';

export default PreviewHandler;

function PreviewHandler(tileOverlay) {
	this.tileOverlay = tileOverlay;
	this.tileDataCacheForPreview = {};
	this.zoomListener = null;
	this.lastZoom = window.SegMap.MapsApi.getZoom();
	window.SegMap.ZoomChangedSubscribers.push(this);
};

PreviewHandler.prototype.ZoomChanged = function (zoom) {
		this.savePreviewData();
};

PreviewHandler.prototype.savePreviewData = function () {
	// guarda
	this.tileDataCacheForPreview[this.lastZoom] = this.tileOverlay.composer.tileDataCache;
	// actualiza
	this.tileOverlay.composer.tileDataCache = [];
	this.lastZoom = window.SegMap.MapsApi.getZoom();
};

PreviewHandler.prototype.getPreview = function (tileBounds, coord, zoom) {
	if (window.SegMap.MapsApi.selector.tooltipOverlayPaths && window.SegMap.MapsApi.selector.tooltipOverlayPaths.length > 0) {
		// tiene que limpiar para no clonar la selección
		window.SegMap.MapsApi.selector.resetTooltip();
	}
	for (var previousZoom = zoom; previousZoom >= 0; previousZoom--) {
		if (this.tileDataCacheForPreview.hasOwnProperty(previousZoom)) {
			var tilesData = this.tileDataCacheForPreview[previousZoom];
			var preview = this.ExtractPartialRenderData(tilesData, tileBounds, coord, zoom, previousZoom);
			if (preview) {
				return preview;
			}
		}
	}
	for (var previousZoom = zoom + 1; previousZoom <= 22; previousZoom++) {
		if (this.tileDataCacheForPreview.hasOwnProperty(previousZoom)) {
			var tilesData = this.tileDataCacheForPreview[previousZoom];
			var preview = this.ComposeMosaicRenderData(tilesData, coord, zoom, previousZoom);
			if (preview) {
				return preview;
			}
		}
	}
	return null;
};

PreviewHandler.prototype.ExtractPartialRenderData = function (tilesData, tileBounds, coord, zoom, previousZoom) {
	// Calcula las coordenadas y el offset del contenedor
	var deltaZ = zoom - previousZoom;
	var sourceX = Math.trunc(coord.x / Math.pow(2, deltaZ));
	var sourceY = Math.trunc(coord.y / Math.pow(2, deltaZ));
	var sourceZ = previousZoom;

	// se fija si lo tiene
	var sourceKey = this.tileOverlay.composer.GetTileCacheKey(sourceX, sourceY, sourceZ);
	if (tilesData.hasOwnProperty(sourceKey)) {
		var src = tilesData[sourceKey];
		var svg = this.CreatePartialSvg(src.Svg, coord, sourceX, sourceY, deltaZ);
		var tileData = this.CreatePartialTileData(src.TileData, tileBounds);

		return { Svg: svg.Svg, TileData: tileData, SvgParts: svg.Parts, SourceZoom: previousZoom, IsFullCopy: !this.hasQualityLoss(zoom, previousZoom) };
	} else {
		return null;
	}
};

PreviewHandler.prototype.CreatePartialTileData = function (tileData, tileBounds) {
	if (!tileData) {
		return null;
	}
	var ret = [];
	if (tileData.length === 0) {
		return ret;
	}
	var useCentroid = (tileData[0].Lat === undefined && tileData[0].properties);
	if (useCentroid) {
		for (var n = 0; n < tileData.length; n++) {
			var lat = tileData[n].properties.centroid[0];
			var lon = tileData[n].properties.centroid[1];
			if (this.rectangleContains(tileBounds, lat, lon)) {
				ret.push(tileData[n]);
			}
		}
	} else {
		for (var n = 0; n < tileData.length; n++) {
			if (this.rectangleContains(tileBounds, tileData[n].Lat, tileData[n].Lon)) {
				ret.push(tileData[n]);
			}
		}
	}
	return ret;
};

PreviewHandler.prototype.rectangleContains = function (tileBounds, lat, lon) {
	if (tileBounds.Min.Lat < tileBounds.Max.Lat) {
		return (lat >= tileBounds.Min.Lat && lat <= tileBounds.Max.Lat &&
			lon >= tileBounds.Min.Lon && lon <= tileBounds.Max.Lon);
	} else {
		return (lat <= tileBounds.Min.Lat && lat >= tileBounds.Max.Lat &&
			lon >= tileBounds.Min.Lon && lon <= tileBounds.Max.Lon);
	}
};

PreviewHandler.prototype.CreatePartialSvg = function (sourceSvg, coord, sourceX, sourceY, deltaZ) {
	if (!sourceSvg || !this.tileOverlay.composer.renderPolygons) {
		return { Svg: null, Parts: [] };
	}
	// lo devuelve
	var svg = sourceSvg.cloneNode(true);
	// Calcula la escala
	var times = Math.pow(2, deltaZ);
	var newSize = 256 / times;
	var offsetX = 256 * ((coord.x / Math.pow(2, deltaZ)) - sourceX);
	var offsetY = 256 * ((coord.y / Math.pow(2, deltaZ)) - sourceY);
	// NO REDUCIDO
	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;
	var GLOBAL_FIT = TILE_PRJ_SIZE / TILE_SIZE;
	svg.setAttribute("scaling", times);
	svg.setAttribute("viewBox", (offsetX * GLOBAL_FIT) + " " + (offsetY * GLOBAL_FIT) + " " + (newSize * GLOBAL_FIT) + " " + (newSize * GLOBAL_FIT));
	return { Svg: svg, Parts: [svg] };
};

PreviewHandler.prototype.ComposeMosaicRenderData = function (tilesData, coord, zoom, previousZoom) {
	// Calcula cuál es la esquina de inicio
	var deltaZ = previousZoom - zoom;
	var sourceX = coord.x * Math.pow(2, deltaZ);
	var sourceY = coord.y * Math.pow(2, deltaZ);
	var sourceZ = previousZoom;
	// Calcula la escala
	var times = Math.pow(2, deltaZ);

	var svg = this.ComposeMosaicSvg(tilesData, sourceX, sourceY, sourceZ, times);
	var tileData = this.ComposeMosaicTileData(tilesData, sourceX, sourceY, sourceZ, times);

	if (svg.Svg || tileData) {
		return { Svg: svg.Svg, SvgParts: svg.Parts, TileData: tileData, SourceZoom: previousZoom, IsFullCopy: (tileData !== null && !this.hasQualityLoss(zoom, previousZoom)) };
	} else {
		return { Svg: null, SvgParts: [] };
	}
};

PreviewHandler.prototype.ComposeMosaicSvg = function (tilesData, sourceX, sourceY, sourceZ, times) {
	if (!this.tileOverlay.composer.renderPolygons) {
		return { Svg: null, Parts: null };
	}
	// NO REDUCIDO
	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;

	var newSize = TILE_SIZE / times;
	// se fija si lo tiene
	var i = 0;
	var root = this.createDiv(TILE_SIZE, TILE_SIZE);
	var parts = [];
	for (var y = 0; y < times; y++) {
		var row = this.createDiv(256, newSize);
		row.style.whiteSpace = 'nowrap';
		for (var x = 0; x < times; x++) {
			var sourceKey = this.tileOverlay.composer.GetTileCacheKey(sourceX + x, sourceY + y, sourceZ);
			var svg = null;
			if (tilesData.hasOwnProperty(sourceKey) && tilesData[sourceKey].Svg) {
				// lo devuelve
				var svg = tilesData[sourceKey].Svg.cloneNode(true);
				svg.setAttribute("scaling", 1 / times);
				svg.setAttribute("viewBox", "0 0 " + TILE_PRJ_SIZE + " " + TILE_PRJ_SIZE);
				svg.style.maxWidth = newSize + 'px';
				svg.style.maxHeight = newSize + 'px';
				svg.style.display = 'inline-block';
				parts.push(svg);
				i++;
			}
			else {
				svg = this.createDiv(newSize, newSize);
				svg.style.display = 'inline-block';
			}
			svg.style.position = '';
			row.appendChild(svg);
		}
		root.appendChild(row);
	}
	return { Svg: root, Parts: parts };
};


PreviewHandler.prototype.ComposeMosaicTileData = function (tilesData, sourceX, sourceY, sourceZ, times) {
	// se fija si lo tiene
	var i = 0;
	var features = [];
	for (var y = 0; y < times; y++) {
		for (var x = 0; x < times; x++) {
			var sourceKey = this.tileOverlay.composer.GetTileCacheKey(sourceX + x, sourceY + y, sourceZ);
			if (tilesData.hasOwnProperty(sourceKey)) {
				// lo devuelve
				var data = tilesData[sourceKey].TileData;
				if (data) {
					features = features.concat(data);
					i++;
				}
			} else {
				break;
			}
		}
	}
	if (i === times * times) {
		return features;
	} else {
		return null;
	}
};

PreviewHandler.prototype.hasQualityLoss = function (zoom, previousZoom) {
	// Establece si el salto de zoom implica pérdida de información. Puede darse por
	// dos casos:
	// la fuente está enviando en un nivel de calidad de menor calidad para ese zoom
	// está a más de 3 niveles de zoom
	return this.resolveRZoom(zoom) > this.resolveRZoom(previousZoom); // || (zoom - previousZoom > 2);
};

PreviewHandler.prototype.resolveRZoom = function (zoom) {
	if (zoom < 12)
		return Math.floor(zoom / 3) + 1;
	else
		return Math.floor(zoom / 6) + 3;
};

PreviewHandler.prototype.createDiv = function (width, height) {
	var div = document.createElement("div");
	if (width && height) {
		div.style.width = width + "px";
		div.style.height = height + "px";
	}
	return div;
};

PreviewHandler.prototype.dispose = function () {
	this.tileDataCacheForPreview = {};
	arr.Remove(window.SegMap.ZoomChangedSubscribers, this);
};
