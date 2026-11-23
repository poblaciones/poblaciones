import h from '@/map/js/helper';
import BasemapLayerSet from '@/map/classes/BasemapLayerSet';

export default BasemapRouter;

function BasemapRouter() {
};

BasemapRouter.prototype.GetSettings = function() {
	return {
		blockSignature: 'b',
		startChar: null,
		endChar: '&',
		groupSeparator: null,
		itemSeparator: ',',
		useKeyValue: false
	};
};

BasemapRouter.prototype.ToRoute = function (coord) {
	var ret = [];
	var segmentedMap = window.SegMap;
	var mapType = segmentedMap.GetMapTypeState();
	// guarda mapType junto con la negación de etiquetas
	if (!segmentedMap.toolbarStates.showLabels) {
		mapType += 'n';
	}
	// Rasters, indicadores y delimitaciones visibles, en el orden del panel
	for (var layer of segmentedMap.toolbarStates.basemapLayers) {
		if (layer.RouteTag && layer.Visible) {
			mapType += layer.RouteTag;
		}
	}
	if (mapType !== 'r') {
		ret.push(mapType);
	}
	return ret;
};

BasemapRouter.prototype.FromRoute = function (args, updateRoute, skipRestore) {
	if (!args || args.length < 1) {
		return;
	}
	var segmentedMap = window.SegMap;
	var visibleBefore = this.visibleLoadableLayers();
	var framing = this.frameFromRoute(args);
	segmentedMap.SaveRoute.Disabled = true;
	if (framing.MapType) {
		segmentedMap.toolbarStates.showLabels = framing.ShowLabels;
		for (var raster of BasemapLayerSet.GetByType(segmentedMap.toolbarStates.basemapLayers, BasemapLayerSet.TYPE_RASTER)) {
			segmentedMap.SetBasemapRasterVisible(raster, framing.VisibleRasters.includes(raster));
		}
		segmentedMap.SetMapTypeState(framing.MapType);
		for (var layer of framing.VisibleBaseMetrics) {
			layer.Visible = false;
			segmentedMap.ToggleBasemapMetric(layer);
		}
		// Las capas que estaban visibles y la ruta no menciona se apagan.
		for (var hidden of visibleBefore) {
			if (framing.VisibleBaseMetrics.indexOf(hidden) === -1) {
				segmentedMap.ToggleBasemapMetric(hidden);
			}
		}
	}
	segmentedMap.SaveRoute.Disabled = false;
};

BasemapRouter.prototype.visibleLoadableLayers = function () {
	var ret = [];
	for (var layer of window.SegMap.toolbarStates.basemapLayers) {
		if (BasemapLayerSet.IsLoadable(layer) && layer.Visible) {
			ret.push(layer);
		}
	}
	return ret;
};

BasemapRouter.prototype.frameFromRoute = function (args) {
	//var mapType = 'r';
	var showLabels = true;
	var setting = args[0];
	var segmentedMap = window.SegMap;

	if (setting.length == 0) {
		return;
	}
	var mapType = setting[0];
	if (setting.includes('n')) {
		showLabels = false;
	}
	var visibleBaseMetrics = [];
	var visibleRasters = [];
	/* Si contiene la letra de una capa, la marca. En indicadores y delimitaciones
	ojo que no los cargó... solo les setea el visible en true */
	for (var layer of segmentedMap.toolbarStates.basemapLayers) {
		if (layer.RouteTag && setting.includes(layer.RouteTag)) {
			if (layer.Type === BasemapLayerSet.TYPE_RASTER) {
				visibleRasters.push(layer);
			} else if (BasemapLayerSet.IsLoadable(layer)) {
				layer.Visible = true;
				visibleBaseMetrics.push(layer);
			}
		}
	}

	var frame = {
		MapType: mapType,
		ShowLabels: showLabels,
		VisibleRasters: visibleRasters,
		VisibleBaseMetrics: visibleBaseMetrics
	};
	return frame;
};
