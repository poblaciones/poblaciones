import h from '@/public/js/helper';

export default PreviewHandler;

function PreviewHandler(tileOverlay) {
	this.tileOverlay = tileOverlay;
	this.svgInTileBackup = {};
	this.zoomListener = null;
	this.lastZoom = this.tileOverlay.map.getZoom();
	var loc = this;
	this.zoomListener = this.tileOverlay.map.addListener('zoom_changed', function () {
		// guarda
		loc.svgInTileBackup[loc.lastZoom] = loc.tileOverlay.composer.svgInTile;
		// actualiza
		loc.tileOverlay.composer.svgInTile = [];
		loc.lastZoom = loc.tileOverlay.map.getZoom();
	});
};

PreviewHandler.prototype.getPreview = function (coord, zoom) {
	if (!this.tileOverlay.activeSelectedMetric || !this.tileOverlay.activeSelectedMetric.HasSelectedVariable()) {
		return null;
	}
	var v = this.tileOverlay.activeSelectedMetric.SelectedVariable().Id;

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

PreviewHandler.prototype.CreateBestPossibleSvg = function (v, coord, zoom, previousZoom) {
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
			ret.style.strokeWidth = (1.5 / times) + "px";
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

PreviewHandler.prototype.createDiv = function (width, height) {
	var div = document.createElement("div");
	if (width && height) {
		div.style.width = width + "px";
		div.style.height = height + "px";
	}
	return div;
};

PreviewHandler.prototype.dispose = function () {
	this.svgInTileBackup = {};
	if (this.zoomListener) {
		this.zoomListener.remove();
		this.zoomListener = null;
	};
};
