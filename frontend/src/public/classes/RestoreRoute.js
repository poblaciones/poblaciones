import ActiveSelectedMetric from '@/public/classes/ActiveSelectedMetric';
import MetricRouter from '@/public/classes/MetricRouter';
import h from '@/public/js/helper';
import err from '@/common/js/err';

export default RestoreRoute;

function RestoreRoute(map) {
	this.segmentedMap = map;
};

RestoreRoute.prototype.LoadRoute = function (route) {
	this.LoadLocationFromRoute(route);
	var metrics = this.metricListFromRoute(route);
	this.LoadMetrics(metrics);
};

RestoreRoute.prototype.LoadLocationFromRoute = function (route) {
	var framing = this.framingFromRoute(route);
	this.segmentedMap.SaveRoute.lastState = null;
	// Setea la posición, el zoom y el tipo de mapa
	this.segmentedMap.SaveRoute.Disabled = true;
	if (framing.Center.Lat && framing.Center.Lon) {
		this.segmentedMap.SetCenter(framing.Center);
	}
	if (framing.Zoom || framing.Zoom === 0) {
		this.segmentedMap.SetZoom(framing.Zoom);
	}
	if (framing.MapType) {
		this.segmentedMap.SetMapTypeState(framing.MapType);
	}
	// Se fija si cambia el clipping
	this.LoadClipping(framing);
	this.segmentedMap.SaveRoute.Disabled = false;

};

RestoreRoute.prototype.framingFromRoute = function (route) {
	var start = route.indexOf('@') + 1;
	var end = route.indexOf('/', start);
	var remaining = '';
	var lat = null;
	var lon = null;
	var zoom = null;
	if (start !== 0) {
		if (end === -1) {
			end = route.length;
		}
		var frameClippingPart = route.substring(start, end);
		var parts = frameClippingPart.split('&');
		// Reconoce la posición del frame
		var frame = parts[0];
		var positionParts = frame.split(',');
		if (positionParts.length < 2) {
			return null;
		}
		lat = parseFloat(positionParts[0]);
		lon = parseFloat(positionParts[1]);
		if (positionParts.length >= 3) {
			zoom = parseInt(positionParts[2].replace('z', ''));
		} else {
			zoom = 14;
		}
		var mapType = 'r';
		if (positionParts.length === 4) {
			mapType = positionParts[3];
		}
		remaining = parts[1];
	} else {
		var end = route.indexOf('/', 2);
		if (end === -1) {
			end = route.length;
		}
		remaining = route.substring(0, end);
	}
	// Reconoce el clipping del frame
	var values = h.parseSingleLetterArgs(remaining);
	var clippingRegionId = h.getSafeValue(values, 'r', null);
	var clippingFeatureId = h.getSafeValue(values, 'f', null);
	var clippingCircle = this.getClippingCircle(h.getSafeValue(values, 'c', null));
	var clippingLevelName = h.getSafeValue(values, 'l', null);
	if ((zoom === null || lat === null || lon === null) &&
		(clippingRegionId === null && clippingFeatureId === null && clippingCircle === null)) {
		return null;
	}
	// devuelve un framing, que es un frame con atributos extra de 'center' y 'mapType'
	return {
		Center: {
			Lat: lat,
			Lon: lon
		},
		Zoom: zoom,
		MapType: mapType,
		ClippingRegionId: clippingRegionId,
		ClippingCircle: clippingCircle,
		ClippingLevelName: clippingLevelName,
		ClippingFeatureId: clippingFeatureId
	};
};

RestoreRoute.prototype.getClippingCircle = function (values) {
	if(values === null) {
		return null;
	}
	var parts = values.split(',');
	if(parts.length < 4) {
		return null;
	}

	return {
		Center: {
			Lat: parts[0],
			Lon: parts[1],
		},
		Radius: {
			Lat: parts[2],
			Lon: parts[3],
		},
	};
};
RestoreRoute.prototype.metricListFromRoute = function (route) {
	var start = route.indexOf('/l=');
	if (start === -1) {
		return [];
	}
	start += 3;
	var end = route.indexOf('/', start);
	if (end === -1) {
		end = route.length;
	}
	var metricsPart = route.substring(start, end);
	var metricsParts = metricsPart.split(';');
	var metrics = [];
	var metricRouter = new MetricRouter(null);
	for (var l = 0; l < metricsParts.length; l++) {
		var metric = metricRouter.parseMetric(metricsParts[l]);
		if (metric !== null) {
			metrics.push(metric);
		}
	}
	return metrics;
};

RestoreRoute.prototype.LoadClipping = function (frame) {
	if (this.clippingChanged(frame, this.segmentedMap.frame)) {
		this.segmentedMap.frame.ClippingFeatureId = frame.ClippingFeatureId;
		this.segmentedMap.frame.ClippingRegionId = frame.ClippingRegionId;
		this.segmentedMap.frame.ClippingCircle = frame.ClippingCircle;
		var loc = this;
		if (this.segmentedMap.Clipping.FrameHasNoClipping()) {
			this.segmentedMap.Clipping.ClippingCallback = function() {
				loc.segmentedMap.Clipping.RestoreClipping(frame.ClippingLevelName);
			};
		} else {
			var requiresUpdate = (frame.MapType === undefined);
			this.segmentedMap.Clipping.RestoreClipping(frame.ClippingLevelName, requiresUpdate);
			if (requiresUpdate) {
				this.segmentedMap.SaveRoute.UpdateRoute();
			}
		}
	}
};

RestoreRoute.prototype.clippingChanged = function (frame1, frame2) {
	if (frame1.ClippingRegionId !== frame2.ClippingRegionId ||
		frame1.ClippingFeatureId !== frame2.ClippingFeatureId) {
		return true;
	}
	if ((frame1.ClippingCircle === null) !== (frame2.ClippingCircle === null)) {
		return true;
	}
	if (frame1.ClippingCircle === null && frame2.ClippingCircle === null) {
		return false;
	}
	if (frame1.ClippingCircle.Center.Lat !== frame2.ClippingCircle.Center.Lat ||
		frame1.ClippingCircle.Center.Lon !== frame2.ClippingCircle.Center.Lon ||
		frame1.ClippingCircle.Radius.Lat !== frame2.ClippingCircle.Radius.Lat ||
		frame1.ClippingCircle.Radius.Lon !== frame2.ClippingCircle.Radius.Lon) {
		return true;
	}
	return false;
};

RestoreRoute.prototype.metricsChanged = function (metrics, currentMetrics) {
	if (metrics.length !== currentMetrics.length) {
		return true;
	}
	for (var l = 0; l < metrics.length; l++) {
		if (metrics[l].Id !== currentMetrics[l].Id) {
			return true;
		}
	}
	return false;
};

RestoreRoute.prototype.LoadMetrics = function (metrics) {
	// Se fija si cambian las métricas
	if (metrics.length === 0) {
		this.segmentedMap.Metrics.ClearUserMetrics();
		return;
	}
	var currentMetrics = this.metricListFromRoute(this.segmentedMap.SaveRoute.calculateMetricsState());
	// Si cambiaron, recarga todos
	// Una vez cargadas (o si no cambiaron) les setea los estados
	if (this.metricsChanged(metrics, currentMetrics)) {
		var loc = this;
		var metricIds = '';
		for (var l = 0; l < metrics.length; l++) {
			metricIds += metrics[l].Id + (l < metrics.length - 1 ? ',' : '');
		}
		window.SegMap.Get(window.host + '/services/metrics/GetSelectedMetrics', {
			params: { l: metricIds },
		}).then(function (res) {
			loc.segmentedMap.SaveRoute.Disabled = true;
			for (var n = 0; n < metrics.length; n++) {
				var selectedMetric = res.data[n];
				if (selectedMetric != null) {
					var activeMetric = new ActiveSelectedMetric(selectedMetric, false);
					activeMetric.$Router.RestoreMetricState(metrics[n]);
					activeMetric.properties.SelectedVersionIndex = parseInt(activeMetric.properties.SelectedVersionIndex);
					activeMetric.UpdateLevel();
					loc.segmentedMap.Metrics.AppendStandardMetric(activeMetric);
				}
			}
			loc.segmentedMap.Labels.UpdateMap();
			loc.segmentedMap.SaveRoute.Disabled = false;
		}).catch(function (error) {
			err.errDialog('GetSelectedMetrics', 'obtener la información para los indicadores seleccionados', error);
		});
	} else {
		this.restoreMetricStates(metrics);
	}
};

RestoreRoute.prototype.restoreMetricStates = function (states) {
	for (var n = 0; n < this.segmentedMap.Metrics.metrics.length; n++) {
		var activeMetric = this.segmentedMap.Metrics.metrics[n];
		var state = states[n];
		if (activeMetric.$Router.RestoreMetricState(state)) {
			activeMetric.UpdateMap();
		}
	}
};
