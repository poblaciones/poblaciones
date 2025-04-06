import arr from '@/common/framework/arr';
import color from '@/common/framework/color';
import h from '@/public/js/helper';
import { GeoJsonLayer } from '@deck.gl/layers';

export default PolygonOverlay;

function PolygonOverlay(activeSelectedMetric) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
	this.labelsVisibility = [];
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.layer = null;
	this.colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
};

PolygonOverlay.prototype.CreateLayer = function (data) {
	var dataFiltered = this.Filter(data);
	var loc = this;
	var isDone = {};

	var now = new Date();
	var ticks = now.getTime();
	var loc = this;
	var data = {
		type: "FeatureCollection",
		features: dataFiltered
	};
	const layer = new GeoJsonLayer({
		id: 'polygon-layer' + ticks,
		data: data,
		filled: true,

		//getPolygon: d => d.Data.geometry.coordinates,
		//getElevation: d => 0,
		getFillColor: d => color.ParseColorParts(loc.colorMap[d.properties.LID] + "80"),
		getLineColor: d => color.ParseColorParts(loc.colorMap[d.properties.LID]),
		getLineWidth: 5,
		lineWidthMinPixels: 1,
		pickable: true,
		onError: function (error) {
			console.log(error.message);
		},
/*		onHover: delegates.mouseover,
		onClick: delegates.click,
	*/
		//getSize: d => 1 + (window.SegMap.frame.Zoom > 10 ? 10 : 0) ,//0 * (window.SegMap.frame.Zoom / 5),
    //getColor: d => color.ParseColorParts(loc.colorMap[d.LID] ? loc.colorMap[d.LID] : '#cccccc')
	});
	this.layer = layer;

	return layer;
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
	var variableId = this.variable.Id;
	var dataFiltered = [];
	var varId;
	if (!this.activeSelectedMetric.IsFiltering()) {
		//return data;
		for (var dataElement of data) {
			dataFiltered.push(this.createGeoJsonElement(dataElement));
		}
		return dataFiltered;
	}
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

