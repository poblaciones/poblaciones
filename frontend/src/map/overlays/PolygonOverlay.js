import arr from '@/common/framework/arr';
import color from '@/common/framework/color';
import h from '@/map/js/helper';
import { GeoJsonLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';

export default PolygonOverlay;

function PolygonOverlay(activeSelectedMetric) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
	this.labelsVisibility = [];
	this.dynamicWidth = activeSelectedMetric.dynamicWidth;
	this.lineWidth = activeSelectedMetric.lineWidth;
	this.dashedLine = activeSelectedMetric.dashedLine;
	this.currentZoom = 8; // ← inicializar siempre
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.layer = null;
	this.colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
};
// Los stops expresan: "con base width=2, ¿cuántos píxeles quiero?"
// El scale = targetPixels / baseWidth = targetPixels / 2
PolygonOverlay.prototype.GetLineScaleForZoom = function (zoom) {
	// target en píxeles para getLineWidth: 2
	const stops = [
		[5, 1],
		[8, 2],
		[14, 5],
		[16, 10],
		[18, 20],
		[21, 160]
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
	/*getLineWidth: 5, // en metros
lineWidthMinPixels: 2,
*/

	var options = {
		id: 'polygon-layer' + ticks,
		data: geojson,
		filled: true,
		getFillColor: d => color.ParseColorParts(loc.colorMap[d.properties.LID] + "80"),
		getLineColor: d => color.ParseColorParts(loc.colorMap[d.properties.LID] + "B0"),

		getLineWidth: this.lineWidth,           // base en metros, igual que antes
		lineWidthMinPixels: 1,     // que no desaparezca en zoom lejano
		lineWidthMaxPixels: 200,   // tope para zoom muy cercano
		lineWidthScale: lineScale,
		pickable: true,
		onError: function (error) { console.log(error.message); },
	};
	if (this.dashedLine) {
		options.filled = false;
		options.extensions = [new PathStyleExtension({ dash: true })];
		// Punteado
		options.getDashArray = [10, 5];         // [largo del trazo, largo del hueco]
		options.dashJustified = true;
	}
	const layer = new GeoJsonLayer(options);

	this.layer = layer;
	return layer;
};
PolygonOverlay.prototype.UpdateZoom = function (zoom) {
	if (!this.dynamicWidth) {
		return this.layer;
	}
	this.currentZoom = zoom;
	if (this.layer) {
		const lineScale = this.GetLineScaleForZoom(zoom);
		this.layer = this.layer.clone({
			lineWidthScale: lineScale,
			updateTriggers: { lineWidthScale: lineScale }
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

