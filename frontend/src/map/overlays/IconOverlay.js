import arr from '@/common/framework/arr';
import color from '@/common/framework/color';
import h from '@/map/js/helper';
import { IconLayer } from '@deck.gl/layers';
import Svg from '@/map/js/svg';
import MarkerFactory from './MarkerFactory';
import FixedSizeShapeOverlay from './FixedSizeShapeOverlay';

export default IconOverlay;

function IconOverlay(activeSelectedMetric) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
	this.customIcons = this.activeSelectedMetric.Icons();
	this.labelsVisibility = [];
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.layer = null;
	this.shapes = null;
	this.framelessIconLayer = null;
	this.markerFactory = new MarkerFactory(window.SegMap.MapsApi, this.activeSelectedMetric, this.variable, this.customIcons);
};

IconOverlay.prototype.CreateLayers = function (data) {
	var dataFiltered = this.Filter(data);
	var markerSettings = this.activeSelectedMetric.SelectedMarker();
	var delegates = this.markerFactory.createDelegates();
	if (markerSettings.Size !== 'F') {
		return [this.CreateLayer(dataFiltered, markerSettings, delegates)];
	}
	var frame = window.SegMap.frame;
	this.shapes = new FixedSizeShapeOverlay(this.activeSelectedMetric, delegates);
	var shapesLayer = this.shapes.CreateLayer(dataFiltered, frame.Zoom);
	if (this.RequiresFramelessIcons(markerSettings)) {
		this.framelessIconLayer = this.CreateFramelessIconLayer(dataFiltered, markerSettings);
	}
	return this.composeFixedSizeLayers(shapesLayer);
};

// Devuelve las capas nuevas cuando el zoom cambia la presentación; si no, null.
IconOverlay.prototype.UpdateZoom = function (zoom) {
	if (this.shapes === null) {
		return null;
	}
	var shapesLayer = this.shapes.UpdateZoom(zoom);
	if (shapesLayer === null) {
		return null;
	}
	if (this.framelessIconLayer !== null) {
		// deck.gl no admite volver a recibir una instancia ya montada.
		this.framelessIconLayer = this.framelessIconLayer.clone({});
	}
	return this.composeFixedSizeLayers(shapesLayer);
};

// Cuando las figuras se reducen a puntos, los íconos no serían legibles.
IconOverlay.prototype.composeFixedSizeLayers = function (shapesLayer) {
	var layers = [shapesLayer];
	if (this.framelessIconLayer !== null && this.shapes.showsShapes) {
		layers.push(this.framelessIconLayer);
	}
	return layers;
};

IconOverlay.prototype.CreateLayer = function (dataFiltered, markerSettings, delegates) {
	var loc = this;
	var sc = 1;
	var now = new Date();
	var ticks = now.getTime();

	var units;
	var min;
	if (!markerSettings.AutoScale) {
		units = 'pixels';
		if (markerSettings.Size === 'S') {
			sc = .75;
		} else if (markerSettings.Size === 'M') {
			sc = 1;
		} else if (markerSettings.Size === 'L') {
			sc = 1.5;
		}
		min = 10 * sc;
	} else {
		units = 'meters';
		if (markerSettings.Size === 'S') {
			sc = 1;
		} else if (markerSettings.Size === 'M') {
			sc = 1.5;
		} else if (markerSettings.Size === 'L') {
			sc = 2;
		}
		min = 5 * sc;
	}

	const layer = new IconLayer({
		id: 'icon-layer' + ticks,
		data: dataFiltered,
		pickable: true,
		largeZoom: window.SegMap.frame.Zoom > 10,
		autoHighlight: true,
		sizeUnits: units,
		sizeMinPixels: min,
		sizeMaxPixels: 40 * sc,
		getIcon: this.createIconAccessor(markerSettings),
		onError: function (error) {
			console.log(error.message);
		},
		onHover: delegates.mouseover,
		onClick: delegates.click,
		sizeScale: 150 * sc,
		updateTriggers: {
			getSize: loc.LargeZoom
		},
		getPosition: d => [d.Lon, d.Lat],
	});
	this.layer = layer;

	return layer;
};

// Los íconos se dibujan sin marco sobre las figuras de FixedSizeShapeOverlay,
// que son las que reciben los clics: por eso esta capa no es seleccionable.
IconOverlay.prototype.CreateFramelessIconLayer = function (dataFiltered, markerSettings) {
	var ticks = new Date().getTime();
	this.layer = new IconLayer({
		id: 'icon-layer' + ticks,
		data: dataFiltered,
		pickable: false,
		sizeUnits: 'meters',
		sizeScale: markerSettings.FixedSize,
		getIcon: this.createIconAccessor(markerSettings),
		getPosition: d => [d.Lon, d.Lat],
		onError: function (error) {
			console.log(error.message);
		},
	});
	return this.layer;
};

IconOverlay.prototype.RequiresFramelessIcons = function (markerSettings) {
	if (this.HasCategorySymbols()) {
		return true;
	}
	if (markerSettings.Type === 'N') {
		return false;
	}
	if (markerSettings.Source === 'V') {
		return true;
	}
	var fixedContent = this.markerFactory.resolveContent(markerSettings, null, null);
	if (fixedContent) {
		return true;
	} else {
		return false;
	}
};

IconOverlay.prototype.HasCategorySymbols = function () {
	if (this.variable === null) {
		return false;
	}
	var values = this.activeSelectedMetric.ResolveVariableValues(this.variable);
	for (var value of values) {
		if (value.Symbol) {
			return true;
		}
	}
	return false;
};

// Cada ícono distinto se genera una única vez: deck.gl reutiliza la imagen
// ya cargada para las repeticiones del mismo id.
IconOverlay.prototype.createIconAccessor = function (markerSettings) {
	var loc = this;
	var isDone = {};
	return function (mapItem) {
		var id = mapItem.LID + '_' + (mapItem.Symbol ? mapItem.Symbol : '');
		if (isDone[id]) {
			return {
				id: id,
				url: '-',
				width: 0,
				height: 0,
			};
		}
		isDone[id] = true;
		var frame = loc.markerFactory.CreateMarker(mapItem, markerSettings);
		if (frame === null) {
			return {
				id: id,
				url: loc.svgToDataURL(loc.markerFactory.errorIcon()),
				width: 32,
				height: 32,
			};
		}
		return {
			id: id,
			url: loc.svgToDataURL(frame.svg),
			width: frame.iconSize[0],
			height: frame.iconSize[1],
			anchorX: frame.iconAnchor[0],
			anchorY: frame.iconAnchor[1],
		};
	};
};

IconOverlay.prototype.ZoomChanged = function (zoom) {
//	this.layer.update(); // setProps({ 'largeZoom': (window.SegMap.frame.Zoom > 10) });
};

IconOverlay.prototype.LargeZoom = function () {
	return window.SegMap.frame.Zoom > 10;
};

IconOverlay.prototype.Filter = function (data) {
	if (!this.activeSelectedMetric.IsFiltering()) {
		return data;
	}
	var variableId = this.variable.Id;
	var dataFiltered = [];
	var varId;
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
				dataFiltered.push(dataElement);
			}
		}
	}
	return dataFiltered;
};

IconOverlay.prototype.svgToDataURL = function (svg) {
	// Note that a xml string cannot be directly embedded in a data URL
	// it has to be either escaped or converted to base64.

		return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
	// or
	//return `data:image/svg+xml;base64,${btoa(svg)}`;
};

