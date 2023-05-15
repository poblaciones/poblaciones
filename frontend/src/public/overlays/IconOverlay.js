import arr from '@/common/framework/arr';
import color from '@/common/framework/color';
import h from '@/public/js/helper';
import { IconLayer } from '@deck.gl/layers';
import Svg from '@/public/js/svg';
import MarkerFactory from './MarkerFactory';

export default IconOverlay;

function IconOverlay(activeSelectedMetric) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
	this.customIcons = this.activeSelectedMetric.SelectedVersion().Work.Icons;
	this.labelsVisibility = [];
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.layer = null;
	this.markerFactory = new MarkerFactory(window.SegMap.MapsApi, this.activeSelectedMetric, this.variable, this.customIcons);
};

IconOverlay.prototype.CreateLayer = function (data, sc = 1) {
		/*this.activeSelectedMetric.get[
		{
			name: 'Colma (COLM)',
			address: '365 D Street, Colma CA 94014',
			exits: 4214,
			coordinates: [-59.846507, -36.783843]
		},
	];*/
	var dataFiltered = this.Filter(data);
	var loc = this;
	var delegates = loc.markerFactory.createDelegates();

	var markerSettings = this.activeSelectedMetric.SelectedLevel().Dataset.Marker;
	var isDone = {};

	var now = new Date();
	var ticks = now.getTime();

	const layer = new IconLayer({
		id: 'icon-layer' + ticks,
		data: dataFiltered,
		pickable: true,
		largeZoom: window.SegMap.frame.Zoom > 10,
		autoHighlight: true,
		sizeUnits: 'meters',
		sizeMinPixels: 4 * sc, // 20, 32, 50
		sizeMaxPixels: 40 * sc, // 20, 32, 50
		//filled: true,
		getIcon: function (mapItem) {
			var id = mapItem.LID + '_' + (mapItem.Symbol ? mapItem.Symbol : '');
			if (!isDone[id]) {
				isDone[id] = true;
				var frame = loc.markerFactory.CreateMarker(mapItem, markerSettings);
				if (frame === null) {
					return {
						id: id,
						url: loc.svgToDataURL(loc.markerFactory.errorIcon()),
						width: 32,
						height: 32,
					};
				} else {
					var svg = loc.svgToDataURL(frame.svg);
					return {
						id: id,
						url: svg,
						width: frame.iconSize[0],
						height: frame.iconSize[1],
						anchorX: frame.iconAnchor[0],
						anchorY: frame.iconAnchor[1],
						//mask: true
					};
				}
			} else {
				return {
					id: id,
					url: '-',
					width: 0,
					height: 0,
};
			}
		},
	/*	loadOptions: {
			//'type' : 'image'
			imagebitmap: {
				resizeWidth: frame.iconSize[0],
				resizeHeight: frame.iconSize[1]
			}
		},*/
		//iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
		//iconMapping: ICON_MAPPING,
		//getIcon: d => 'marker',
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
		//getSize: d => 1 + (window.SegMap.frame.Zoom > 10 ? 10 : 0) ,//0 * (window.SegMap.frame.Zoom / 5),
    //getColor: d => color.ParseColorParts(loc.colorMap[d.LID] ? loc.colorMap[d.LID] : '#cccccc')
	});
	this.layer = layer;

	return layer;
};

IconOverlay.prototype.ZoomChanged = function (zoom) {
//	this.layer.update(); // setProps({ 'largeZoom': (window.SegMap.frame.Zoom > 10) });
};

IconOverlay.prototype.LargeZoom = function () {
	return window.SegMap.frame.Zoom > 10;
};

IconOverlay.prototype.Filter = function (data) {
	var variableId = this.variable.Id;
	var dataFiltered = [];
	var varId;
	if (!this.activeSelectedMetric.IsFiltering()) {
		return data;
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

