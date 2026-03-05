import h from '@/map/js/helper';

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
	if (segmentedMap.toolbarStates.showElevation) {
		mapType += 'e';
	}
	for (var basemapMetric of segmentedMap.toolbarStates.basemapMetrics) {
		if (basemapMetric.Visible) {
			mapType += basemapMetric.RouteTag;
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
	var framing = this.frameFromRoute(args);
	var segmentedMap = window.SegMap;
	segmentedMap.SaveRoute.Disabled = true;
	if (framing.MapType) {
		segmentedMap.toolbarStates.showLabels = framing.ShowLabels;
		segmentedMap.SetShowElevation(framing.Elevation);
		segmentedMap.SetMapTypeState(framing.MapType);
		for (var layer of framing.VisibleBaseMetrics) {
			layer.Visible = false;
			segmentedMap.ToggleBasemapMetric(layer);
		}
	}
	segmentedMap.SaveRoute.Disabled = false;
};

BasemapRouter.prototype.frameFromRoute = function (args) {
	//var mapType = 'r';
	var showLabels = true;
	var elevation = false;
	var setting = args[0];
	var segmentedMap = window.SegMap;

	if (setting.length == 0) {
		return;
	}
	var mapType = setting[0];
	if (setting.includes('n')) {
		showLabels = false;
	}
	if (setting.includes('e')) {
		elevation = true;
	}
	var visibleBaseMetrics = [];
	/*si contiene estas letras, lo agrega en...
	ojo que no los cargó... solo les setea el visible en true */
	for (var basemapMetric of segmentedMap.toolbarStates.basemapMetrics) {
		if (setting.includes(basemapMetric.RouteTag)) {
			basemapMetric.Visible = true;
			visibleBaseMetrics.push(basemapMetric);
		}
	}

	var frame = {
		MapType: mapType,
		Elevation: elevation,
		ShowLabels: showLabels,
		VisibleBaseMetrics: visibleBaseMetrics
	};
	return frame;
};
