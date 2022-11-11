import str from '@/common/framework/str';
import arr from '@/common/framework/arr';
import PanelType from '@/public/enums/PanelType';
import axios from 'axios';

import h from '@/public/js/helper';
import err from '@/common/framework/err';

export default InfoWindow;

function InfoWindow() {
	this.cancel1 = null;
	this.cancel2 = null;
	this.CancelToken1 = axios.CancelToken;
	this.CancelToken2 = axios.CancelToken;
};

InfoWindow.prototype.CheckUpdateNavigation = function () {
	var navigatonKey = this.resolveCurrentFeatureNavigationKey();
	if (!navigatonKey) {
		window.Panels.Content.FeatureNavigation.Key = null;
		arr.Clear(window.Panels.Content.FeatureNavigation.Values);
		return;
	}
	// si no tiene información de navagación para ese conjunto de valores, lo pide
	if (window.Panels.Content.FeatureNavigation.Key !== navigatonKey &&
				window.Panels.Content.FeatureNavigation.GettingKey !== navigatonKey) {
		// Lo actualiza
		var key = window.Panels.Content.FeatureInfoKey;
		var metric = window.SegMap.Metrics.GetMetricById(key.MetricId);
		if (!metric) {
			return;
		}
		window.Panels.Content.FeatureNavigation.GettingKey = navigatonKey;
		const loc = this;
		metric.properties.EffectivePartition = metric.GetSelectedPartition();

		var exceptions = this.GetExceptions(key.MetricId, key.VariableId);
		var params2 = h.getNavigationParams(metric.properties, window.SegMap.frame, exceptions);
		if (this.cancel2 !== null) {
			this.cancel2('cancelled');
		}
		window.SegMap.Get(window.host + '/services/metrics/GetMetricNavigationInfo', {
			params: params2,
			cancelToken: new this.CancelToken2(function executor(c) { loc.cancel2 = c; })
		}).then(function (res) {
			loc.cancel2 = null;
			window.Panels.Content.FeatureNavigation.GettingKey = null;
			var actualNavigatonKey = loc.resolveCurrentFeatureNavigationKey();
			if (actualNavigatonKey === navigatonKey) {
				window.Panels.Content.FeatureNavigation.Key = navigatonKey;
				key.Exceptions = exceptions;
				arr.Fill(window.Panels.Content.FeatureNavigation.Values, res.data);
			}
		});
	}
};

InfoWindow.prototype.resolveCurrentFeatureNavigationKey = function () {
	var key = window.Panels.Content.FeatureInfoKey;
	if (!key || !key.VariableId) {
		return null;
	}
	var metric = window.SegMap.Metrics.GetMetricById(key.MetricId);
	if (metric === null || metric.properties === null || metric.SelectedVariable() === null) {
		return null;
	}
	metric.properties.EffectivePartition = metric.GetSelectedPartition();
	var exceptions = this.GetExceptions(key.MetricId, key.VariableId);
	var params = h.getNavigationParams(metric.properties, window.SegMap.frame, exceptions);
	return JSON.stringify(params);
};

InfoWindow.prototype.GetExceptions = function (metricId, variableId) {
	var excep = this.GetUnselectedCategoriesByVariableId(metricId, variableId);
	if (excep == null) {
		var key = window.Panels.Content.FeatureInfoKey;
		if (!key || !key.VariableId) {
			return '';
		}
		excep = key.Exceptions;
	}
	return (excep ? excep : '');
};

InfoWindow.prototype.Focus = function () {
	var newElement = this.getElement(-1);
	if (newElement === null) {
		return;
	}
	var newKey = window.Panels.Content.FeatureInfoKey;
	newKey.Id = newElement.FID;
	newKey.Sequence = newElement.Sequence;

	this.InfoRequestedInteractive(newElement, newKey, newKey.Id, null);
};

InfoWindow.prototype.Previous = function () {
	var newElement = this.getElement(-1);
	if (newElement === null) {
		return;
	}
	var newKey = window.Panels.Content.FeatureInfoKey;
	newKey.Id = newElement.FID;
	newKey.Sequence = newElement.Sequence;

	this.InfoRequestedInteractive(newElement, newKey, newKey.Id, null);
};


InfoWindow.prototype.Next = function () {
	var newElement = this.getElement(+1);
	if (newElement === null) {
		return;
	}
	var newKey = window.Panels.Content.FeatureInfoKey;
	newKey.Id = newElement.FID;
	newKey.Sequence = newElement.Sequence;
	newKey.LabelId = newElement.ValueId;
	this.InfoRequestedInteractive(newElement, newKey, newKey.Id, null);
};

InfoWindow.prototype.getElement = function (offset) {
	var key = window.Panels.Content.FeatureInfoKey;
	var vals = window.Panels.Content.FeatureNavigation.Values;
	var curPos = arr.IndexByProperty(vals, 'FID', key.Id);
	if (curPos == -1) {
		return null;
	}
	curPos += offset;
	if (curPos === vals.length || curPos < 0) {
		return;
	}
	return vals[curPos];
};

InfoWindow.prototype.FocusView = function (position, key, title) {

	if (position) {
		if (position.Envelope && (position.Envelope.Min.Lat !== position.Envelope.Max.Lat
			|| position.Envelope.Min.Lon !== position.Envelope.Max.Lon)) {
			window.SegMap.MapsApi.FitEnvelope(position.Envelope, true, window.Panels.Left.width);
			setTimeout(() => {
				window.SegMap.MapsApi.selector.tooltipCandidate = { id: key.Id };
				window.SegMap.MapsApi.selector.setTooltipOverlays();
			}, 750);
		} else if (!position.Point || position.Point.X < 350) {
			const MIN_PAN_ZOOM = 15;
			var setZoom = (window.SegMap.frame.Zoom < MIN_PAN_ZOOM ? MIN_PAN_ZOOM : null);
			window.SegMap.PanTo(position.Coordinate, window.Panels.Left.width, setZoom);
		}
		window.SegMap.MapsApi.SetSelectedFeature(position, key, title);
	}
};

InfoWindow.prototype.InfoRequestedInteractive = function (position, parent, fid) {
	this.InfoRequested(position, parent, fid, true);
};

InfoWindow.prototype.InfoRequested = function (position, key, fid, forceExpand) {
	// Establece qué está obteniendo
	key.Id = fid;
	window.Panels.Content.FeatureInfoKey = key;
	this.CheckUpdateNavigation();
	var service;
	var params;

	if (key.VariableId === null) {
		// es una etiqueta de información
		service = 'GetLabelInfo';
		params = { f: fid };
	} else {
		// es un elemento de metric
		service = 'GetMetricItemInfo';
		params = { f: fid, m: key.MetricId, v: key.VariableId };
		if (key.Sequence) {
			var metric = window.SegMap.Metrics.GetMetricById(key.MetricId);
			if (metric) {
				metric.SetActiveSequenceStep(key.VariableId, key.LabelId, key.Sequence);
			}
		}
	}
	// Lo busca
	if (this.cancel1 !== null) {
		this.cancel1('cancelled');
	}
	const loc = this;
	window.Panels.Left.Disable();
	window.SegMap.Get(window.host + '/services/metrics/' + service, {
		params: params,
		cancelToken: new this.CancelToken1(function executor(c) { loc.cancel1 = c; })
	}).then(function (res) {
		loc.cancel1 = null;
		loc.ReceiveInfoWindowData(res, position, key, forceExpand);
	}).finally(function() {
		window.Panels.Left.Enable();
	});
};

InfoWindow.prototype.ReceiveInfoWindowData = function (res, position, key, forceExpand) {
	// Lo obtuvo
	if (res.data.Centroid) {
		res.data.position = {
			Coordinate: res.data.Centroid,
			Envelope: res.data.Envelope,
			Canvas: res.data.Canvas
		};
		delete res.data.Envelope;
		delete res.data.Geometry;
		delete res.data.Canvas;
	} else {
		res.data.position = position;
	}
	res.data.Key = key;
	res.data.panelType = PanelType.InfoPanel;
	// Lo marca en el mapa
	window.SegMap.MapsApi.SetSelectedFeature(res.data.position, key, res.data.Title);
	// Lo agrega al panel
	window.Panels.Left.Add(res.data);
	// Si viene interactivo, lo abre y lo pone en la ruta
	if (forceExpand) {
		window.Panels.Left.collapsed = false;
		window.SegMap.SaveRoute.UpdateRoute();
		this.FocusView(res.data.position, key, res.data.Title);
	}
};

InfoWindow.prototype.GetUnselectedCategoriesByVariableId = function(metricId, variableId) {
	var metric = window.SegMap.Metrics.GetMetricById(metricId);
	if (metric) {
		var variable = metric.GetVariableById(variableId);
		if (variable) {
			return metric.getHiddenValueLabels(variable);
		}
	}
	return null;
};

InfoWindow.prototype.InfoListRequested = function (parent, forceExpand) {
	const loc = this;
	var page = 0;
	window.SegMap.Get(window.host + '/services/metrics/GetInfoListData', {
		params: { l: parent.MetricId, a: parent.LevelId, v: parent.MetricVersionId, p: page }
	}).then(function (res) {
			res.data.parent = parent;
			res.data.panelType = PanelType.InfoPanel;
			window.Panels.Content.FeatureList = res.data;
			window.Panels.Left.Add(res.data);
			if (forceExpand) {
				window.Panels.Left.collapsed = false;
			}
	}).catch(function (error) {
		err.errDialog('GetInfoWindowData', 'traer la información para el elemento seleccionado', error);
	});
};
