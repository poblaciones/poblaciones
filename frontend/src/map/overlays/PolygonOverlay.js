import arr from '@/common/framework/arr';
import color from '@/common/framework/color';
import h from '@/map/js/helper';
import { GeoJsonLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import LabeledGeoJsonLayer from './LabeledGeoJsonLayer';


export default PolygonOverlay;

function PolygonOverlay(activeSelectedMetric) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
	this.labelsVisibility = [];
	this.dynamicWidth = activeSelectedMetric.dynamicWidth;
	// Se normaliza a número: sin etiquetas GeoJsonLayer tolera undefined, pero
	// dentro del composite el valor llega al PathLayer de contorno como
	// getWidth y su validación lo rechaza.
	this.lineWidth = Number(activeSelectedMetric.lineWidth) || 1;
	this.aliases = activeSelectedMetric.aliases;
	this.dashedLine = activeSelectedMetric.dashedLine;
	this.showInMapLabels = activeSelectedMetric.showInMapLabels;
	this.lightInMapLabels = activeSelectedMetric.lightInMapLabels;
	this.currentZoom = 8;
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.layer = null;
};
// Los stops expresan: "con base width=2, ¿cuántos píxeles quiero?"
// El scale = targetPixels / baseWidth = targetPixels / 2
PolygonOverlay.prototype.GetLineScaleForZoom = function (zoom) {
	// target en píxeles para getLineWidth: 2
	const stops = [
		[5, 1],
		[8, 2],
		[14, 5],
		[16, 10]
	];

	if (zoom <= stops[0][0]) return stops[0][1] / 2;
	if (zoom >= stops[stops.length - 1][0]) return stops[stops.length - 1][1] / 2;

	for (let i = 0; i < stops.length - 1; i++) {
		const [z1, w1] = stops[i];
		const [z2, w2] = stops[i + 1];
		if (zoom >= z1 && zoom <= z2) {
			const fraction = (zoom - z1) / (z2 - z1);
			const targetPixels = w1 + fraction * (w2 - w1);
			return targetPixels / 2; // dividido por el baseWidth
		}
	}
	return 1;
};

PolygonOverlay.prototype.formatDescription = function (properties) {
	if (!properties.Description) {
		return '';
	}
	var desc = '' + properties.Description;
	if (this.aliases) {
		Object.keys(this.aliases).forEach(function (key) {
			desc = desc.split(key).join(this.aliases[key]);
		}, this);
	}
	return desc.toUpperCase();
};

PolygonOverlay.prototype.getDynamicLabelSize = function () {
	var zoom = this.currentZoom;
	if (zoom >= 16) {
		return zoom - 1;
	} else {
		return Math.min(12, zoom * 2 - 10);
	}
};

PolygonOverlay.prototype.CreateLayer = function (data) {
	var zoom = window.SegMap.frame.Zoom;
	if (zoom !== undefined) this.currentZoom = zoom;
	var dataFiltered = this.Filter(data);
	var loc = this;
	var ticks = new Date().getTime();
	this._lastData = data;
	var geojson = {
		type: "FeatureCollection",
		features: dataFiltered
	};

	const lineScale = this.GetLineScaleForZoom(this.currentZoom);
	var extraId = '' + (this.activeSelectedMetric && this.activeSelectedMetric.properties && this.activeSelectedMetric.properties.Metric ?
												this.activeSelectedMetric.properties.Metric.Id : '');
	var options = {
		id: 'polygon-layer-' + extraId + '-' + ticks,
		data: geojson,

		filled: true,
		getFillColor: d => color.ParseColorParts(loc.colorMap[d.properties.LID] + "80"),
		getLineColor: d => color.ParseColorParts(loc.colorMap[d.properties.LID] + "B0"),
		getLineWidth: this.lineWidth,
		lineWidthMinPixels: 1,
		lineWidthMaxPixels: 200,
		lineWidthScale: lineScale,
		pickable: true,
		onError: function (error) { console.log(error.message); },
	};
	if (this.showInMapLabels) {
		// Etiquetas
		options.getLabel = d => loc.formatDescription(d.properties);
		options.getLabelPriority = 1;
		// Ojo: es el zoom de deck, que deck-utils calcula como map.getZoom() - 1
		// (Leaflet usa teselas de 256 px y deck.gl de 512). Para restringir las
		// etiquetas a zoom alto hay que restar 1 al valor del mapa.
		options.getLabelZoomRange = [8, 20];
		options.labelFontWeight = 500;
		options.labelMaxCount = 40;
		options.labelMinPixelDistance = 70;
		options.labelBackgroundPadding= [3, 1];
		//if (this.dynamicWidth) {
		options.getLabelSize = d => loc.getDynamicLabelSize();
		//	} else {
		//	options.getLabelSize = 12;
		//}
		if (this.lightInMapLabels) {
			options.getLabelColor = [120, 120, 120];
			options.labelBackground = d => [255, 255, 255, 70];
		} else {
			options.getLabelColor = [255, 255, 255, 255];
			options.labelBackground = d => [d.itemColor[0], d.itemColor[1], d.itemColor[2], 200];
		}
	}
	if (this.dashedLine) {
		options.filled = false;
		options.extensions = [new PathStyleExtension({ dash: true })];
		options.getDashArray = [10, 5];
		options.dashJustified = true;
	}
	if (this.showInMapLabels && window.SegMap.Labels.visible) {
		this.layer = new LabeledGeoJsonLayer(options);
	} else {
		this.layer = new GeoJsonLayer(options);
	}

	return this.layer;
};
PolygonOverlay.prototype.UpdateZoom = function (zoom) {
	// Sin ancho dinámico no hay nada que reemplazar: devolver la instancia ya
	// montada haría que deck.gl reciba en setProps una capa en uso.
	this.currentZoom = zoom;
	if (!this.dynamicWidth) {
		return null;
	}
	if (this.layer) {
		// lineWidthScale no es un accessor: el cambio de prop basta para
		// redibujar y no requiere updateTriggers.
		this.layer = this.layer.clone({
			lineWidthScale: this.GetLineScaleForZoom(zoom)
		});
		return this.layer;
	}
	return null;
};

PolygonOverlay.prototype.createGeoJsonElement = function (dataElement) {
	return {
		type: 'Feature',
		properties: {
			Description: dataElement['Description'],
			LID: dataElement['LID'],
			VID: dataElement['VID'],
			Value: dataElement['Value'],
			Total: dataElement['Total']
		},
		geometry: dataElement.Data.geometry
	};
};

PolygonOverlay.prototype.Filter = function (data) {
	var dataFiltered = [];
	var varId;
	if (!this.activeSelectedMetric.IsFiltering()) {
		//return data;
		for (var dataElement of data) {
			dataFiltered.push(this.createGeoJsonElement(dataElement));
		}
		return dataFiltered;
	}
	var variableId = this.variable.Id;
	for (var dataElement of data) {
		varId = dataElement['VID'];
		if (varId === variableId) {
			var val = dataElement['LID'];
			var valKey = 'K' + val;
			if (!(valKey in this.labelsVisibility)) {
				this.labelsVisibility[valKey] = this.activeSelectedMetric.ResolveValueLabelVisibility(val);
			}
			if (this.labelsVisibility[valKey]) {
				/*var isSequenceInactiveStep = this.isSequenceInactiveStep(mapItem);
				if (variable.IsSequence) {
					this.SequenceHandler.registerSequenceMarker(tileKey, mapItem, marker, zoom);
				}*/
				dataFiltered.push(this.createGeoJsonElement(dataElement));
			}
		}
	}
	return dataFiltered;
};
