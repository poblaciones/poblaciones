import h from '@/public/js/helper';

export default PreviewHandler;

function PreviewHandler(tileOverlay) {
	this.tileOverlay = tileOverlay;
	this.svgInTileForPreview = {};
	this.zoomListener = null;
	this.lastZoom = this.tileOverlay.map.getZoom();
	var loc = this;
	this.zoomListener = this.tileOverlay.map.addListener('zoom_changed', function () {
		// guarda
		loc.svgInTileForPreview[loc.lastZoom] = loc.tileOverlay.composer.svgInTile;
		// actualiza
		loc.tileOverlay.composer.svgInTile = [];
		loc.lastZoom = loc.tileOverlay.map.getZoom();
	});
};

PreviewHandler.prototype.getPreview = function (coord, zoom) {
	if (window.SegMap.MapsApi.selector.tooltipOverlayPaths && window.SegMap.MapsApi.selector.tooltipOverlayPaths.length > 0) {
		// tiene que limpiar para no clonar la selección
		window.SegMap.MapsApi.selector.resetTooltip();
	}
	for (var previousZoom = zoom; previousZoom >= 0; previousZoom--) {
		if (this.svgInTileForPreview.hasOwnProperty(previousZoom)) {
			var svgs = this.svgInTileForPreview[previousZoom];
			var svg = this.ExtractPartialSvg(svgs, coord, zoom, previousZoom);
			if (svg) {
				return svg;
			}
		}
	}
	for (var previousZoom = zoom + 1; previousZoom <= 22; previousZoom++) {
		if (this.svgInTileForPreview.hasOwnProperty(previousZoom)) {
			var svgs = this.svgInTileForPreview[previousZoom];
			var svg = this.ComposeMosaicSvg(svgs, coord, zoom, previousZoom);
			if (svg) {
				return svg;
			}
		}
	}
	return null;
};

PreviewHandler.prototype.ExtractPartialSvg = function (svgs, coord, zoom, previousZoom) {
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
	var sourceKey = this.tileOverlay.composer.GetSvgKey(sourceX, sourceY, sourceZ);
	if (svgs.hasOwnProperty(sourceKey)) {
		// lo devuelve
		var ret = svgs[sourceKey].cloneNode(true);

			// NO REDUCIDO
		const TILE_SIZE = 256;
		const TILE_PRJ_SIZE = 8192;
		var GLOBAL_FIT = TILE_PRJ_SIZE / TILE_SIZE;
		ret.setAttribute("scaling", times);
		ret.setAttribute("viewBox", (offsetX * GLOBAL_FIT) + " " + (offsetY  * GLOBAL_FIT) + " " + (newSize  * GLOBAL_FIT) + " " + (newSize * GLOBAL_FIT) );

		return { Svg: ret, Parts: [ret], SourceZoom: previousZoom, IsFullCopy: !this.hasQualityLoss(zoom, previousZoom) };
	} else {
		return null;
	}
};

PreviewHandler.prototype.ComposeMosaicSvg = function (svgs, coord, zoom, previousZoom) {
	// NO REDUCIDO
	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;
	var GLOBAL_FIT = TILE_PRJ_SIZE / TILE_SIZE;
	// Calcula cuál es la esquina de inicio
	var deltaZ = previousZoom - zoom;
	var sourceX = coord.x * Math.pow(2, deltaZ);
	var sourceY = coord.y * Math.pow(2, deltaZ);
	var sourceZ = previousZoom;
	// Calcula la escala
	var times = Math.pow(2, deltaZ);
	var newSize = TILE_SIZE / times;
	// se fija si lo tiene
	var i = 0;
	var root = this.createDiv(256, 256);
	var parts = [];
	for (var y = 0; y < times; y++) {
		var row = this.createDiv(256, newSize);
		row.style.whiteSpace = 'nowrap';
		for (var x = 0; x < times; x++) {
			var sourceKey = this.tileOverlay.composer.GetSvgKey(sourceX + x, sourceY + y, sourceZ);
			var svg = null;
			if (svgs.hasOwnProperty(sourceKey)) {
				// lo devuelve
				var svg = svgs[sourceKey].cloneNode(true);
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
	if (i > 0) {
		return { Svg: root, Parts: parts, SourceZoom: previousZoom, IsFullCopy: (i === times * times && !this.hasQualityLoss(zoom, previousZoom)) };
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
	this.svgInTileForPreview = {};
	if (this.zoomListener) {
		this.zoomListener.remove();
		this.zoomListener = null;
	};
};
