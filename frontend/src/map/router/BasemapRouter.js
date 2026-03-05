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
	if (mapType !== 's' && !segmentedMap.toolbarStates.showLabels) {
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
	if (!args || args.length < 2) {
		return;
	}
	var framing = this.frameFromRoute(args);
	var segmentedMap = window.SegMap;
	segmentedMap.SaveRoute.Disabled = true;
	if (framing.MapType) {
		segmentedMap.toolbarStates.showLabels = framing.ShowLabels;
		segmentedMap.SetShowElevation(framing.Elevation);
		segmentedMap.SetMapTypeState(framing.MapType);
	}

	segmentedMap.SaveRoute.Disabled = false;
};

BasemapRouter.prototype.frameFromRoute = function (args) {
	var mapType = 'r';
	var showLabels = true;
	var elevation = false;
	console.log(args);
	if (args.length === 4 && args[3].length > 0) {
		// Tiene algo indicado
		if (args[3].endsWith('n') || args[3].endsWith('ne')) {
			showLabels = false;
		}
		if (args[3].endsWith('e')) {
			elevation = true;
		}
		if (args[3] !== 'n' && args[3] !== 'ne' && args[3] !== 'e') {
			mapType = args[3][0];
		}
	}
	var visibleBaseMetrics = [];
	/*si contiene estas letras, lo agrega en...
	ojo que no los cargó... solo les setea el visible en true */
	for (var basemapMetric of segmentedMap.toolbarStates.basemapMetrics) {
		if (args.includes(basemapMetric.RouteTag)) {
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
