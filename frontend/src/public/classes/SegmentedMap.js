import ActiveSelectedMetric from '@/public/classes/ActiveSelectedMetric';
import ActiveLabels from '@/public/classes/ActiveLabels';
import MetricsList from '@/public/classes/MetricsList';
import SaveRoute from '@/public/classes/SaveRoute';
import Clipping from '@/public/classes/Clipping';
import Tutorial from '@/public/classes/Tutorial';
import RestoreRoute from '@/public/classes/RestoreRoute';
import Queue from './Queue';
import axios from 'axios';
import str from '@/common/js/str';
import Vue from "vue";
import PanelType from '@/public/enums/PanelType';

import h from '@/public/js/helper';
import m from '@/public/js/Mercator';
import err from '@/common/js/err';

export default SegmentedMap;

function SegmentedMap(mapsApi, frame, clipping, toolbarStates, selectedMetricCollection, config) {
	this.frame = frame;
	this.Tutorial = new Tutorial(toolbarStates);
	this.Clipping = new Clipping(this, frame, clipping);
	this.Signatures = config.Signatures;
	this.User = config.User;
	this.MapsApi = mapsApi;
	this.Work = null;
	this.Popups = {};
	this.textCanvas = {};
	this.toolbarStates = toolbarStates;
	this.MapIsInitialized = false;
	this.DefaultTitle = 'Poblaciones';
	this._axios = this.CreateAxios(true);
	this._axiosNoCredentials = this.CreateAxios(false);
	this.Metrics = new MetricsList(this, selectedMetricCollection);
	this.SaveRoute = new SaveRoute();
	this.RestoreRoute = new RestoreRoute();
	this.afterCallback = null;
	this.afterCallback2 = null;
	this.Labels = new ActiveLabels(config);
	if (config.Blocks.UseDataTileBlocks) {
		this.tileDataBlockSize = config.Blocks.TileDataBlockSize;
	} else {
		this.tileDataBlockSize = null;
	}
	this.Configuration = config;
	window.Use = config;
	this.Queue = new Queue(config.MaxQueueRequests);
	if (Array.isArray(config.StaticServer) || window.host !== config.StaticServer) {
		this.StaticQueue = new Queue(config.MaxStaticQueueRequests);
	} else {
		this.StaticQueue = this.Queue;
	}
};

SegmentedMap.prototype.WaitForFullLoading = function () {
	var loc = this;
	return this.Queue.RequestOnceNotificationIdle().then(function () {
		return loc.StaticQueue.RequestOnceNotificationIdle();
	});
};

SegmentedMap.prototype.SetTimeout = function (delay) {
	return new Promise(function (resolve) {
		setTimeout(resolve, delay);
	});
};

SegmentedMap.prototype.Get = function (url, params, noCredencials, isRetry) {
	if (window.accessLink) {
		if (!params) { params = {}; }
		if (!params.headers) { params.headers = {}; }
		params.headers['Access-Link'] = window.accessLink;
	}
	var loc = this;
	var axios = (noCredencials ? this._axiosNoCredentials : this._axios);
	return axios.get(url, params).then(function (res) {
		if ((!res.response || res.response.status === undefined) && res.message === 'cancelled') {
			throw { message: 'cancelled', origin: 'segmented' };
		} else if (res.status === 200) {
			return res;
		}
		var status = 0;
		if (res.status) {
			status = res.status;
		} else if (res.response.status) {
			status = res.response.status;
		}
		var data = null;
		if (res.response) {
			data = res.response.data;
			if (data !== null && typeof data === 'string' && data.length < 25000) {
				var debug = 'Whoops, looks like something went wrong.';
				var debugText = '<p class="break-long-words trace-message">';
				if (data.includes(debug) && data.includes(debugText)) {
					var from = data.indexOf(debugText) + debugText.length;
					var end = data.indexOf('<', from);
					var len = end - from;
					data = '[ME-E]:' + data.substr(from, len);
				}
			}
		}

		throw {
			message: res.message, status: status, response: {
				status: status,
				data: data
			}
		};
	}).catch(function (res) {
		var cancellation = res && res.message === 'cancelled';

		if (!isRetry && !cancellation) {
			let prom = new Promise((resolve, reject) => {
				setTimeout(function () {
					loc.Get(url, params, noCredencials, true).then(
						function (res) { resolve(res); }
					).catch(
						function (res) { reject(res); }
					);
				}, 3500);
			});
			return prom;
		}
		throw(res);
	});
};

SegmentedMap.prototype.CreateAxios = function (withCredentials) {
	var api = axios.create({ withCredentials: withCredentials });
	return api;
};

SegmentedMap.prototype.MapInitialized = function () {
	this.MapIsInitialized = true;
	this.Metrics.AppendNonStandardMetric(this.Labels);
	if (this.afterCallback !== null) {
		this.afterCallback();
	}
	if (this.afterCallback2 !== null) {
		this.afterCallback2();
	}
};

SegmentedMap.prototype.FitCurrentEnvelope = function () {
	this.MapsApi.FitEnvelope(this.frame.Envelope);
};
SegmentedMap.prototype.ClearMyLocation = function () {
	this.MapsApi.ClearMyLocationMarker();
};

SegmentedMap.prototype.SetMyLocation = function (coord) {
	this.SaveRoute.Disabled = true;
	this.Clipping.ResetClippingCircle();
	this.Clipping.ResetClippingRegion();
	this.SaveRoute.Disabled = false;

	this.MapsApi.CreateMyLocationMarker(coord);
	this.SetZoom(13);
	this.PanTo(coord);
	this.SaveRoute.UpdateRoute(coord);
};

SegmentedMap.prototype.TriggerResize = function () {
	this.MapsApi.TriggerResize();
};

SegmentedMap.prototype.ReleasePins = function () {
	var metrics = this.Metrics.metrics;
	for (var l = 0; l < metrics.length; l++) {
		metrics[l].ReleasePins();
	}
};


SegmentedMap.prototype.GetMapTypeState = function () {
	return this.MapsApi.GetMapTypeState();
};
SegmentedMap.prototype.SetMapTypeState = function (mapType) {
	this.MapsApi.SetMapTypeState(mapType);
	this.MapTypeChanged(mapType);

};

SegmentedMap.prototype.SetCenter = function (coord) {
	this.frame.Envelope.Min = coord;
	this.frame.Envelope.Max = coord;
	this.frame.Center = coord;
	this.MapsApi.SetCenter(coord);
};

SegmentedMap.prototype.PanTo = function (coord) {
	this.MapsApi.PanTo(coord);
};

SegmentedMap.prototype.SetZoom = function (zoom) {
	this.MapsApi.SetZoom(zoom);
	this.frame.Zoom = zoom;
};

SegmentedMap.prototype.SetTypeControlsDropDown = function () {
this.MapsApi.SetTypeControlsDropDown();
};

SegmentedMap.prototype.SetTypeControlsDefault = function () {
	this.MapsApi.SetTypeControlsDefault();
};

SegmentedMap.prototype.MapTypeChanged = function (mapTypeState) {
	var showLabels = !mapTypeState.startsWith('s');
	if (showLabels) {
		if (!this.Labels.Visible()) {
			// Lo empieza a mostrar
			this.Labels.Show();
		}
	} else {
		if (this.Labels.Visible()) {
			// Las oculta
			this.Labels.Hide();
		}
	}
};
SegmentedMap.prototype.ZoomChanged = function (zoom) {
	if (this.frame.Zoom !== zoom) {
		this.frame.Zoom = zoom;
		this.Labels.UpdateMap();
		this.Metrics.ZoomChanged();
	}
};
SegmentedMap.prototype.FrameMoved = function (bounds) {
	this.frame.Envelope.Min = bounds.Min;
	this.frame.Envelope.Max = bounds.Max;
	if (this.Clipping.ProcessFrameMoved() === false) {
		;
	}
};

SegmentedMap.prototype.BoundsChanged = function () {
	this.SaveRoute.UpdateRoute();
};

SegmentedMap.prototype.AxiosClone = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};


SegmentedMap.prototype.StartClickSelecting = function () {
	this.MapsApi.selector.SetSelectorCanvas();
};

SegmentedMap.prototype.SetSelectionMode = function (mode) {
	if (this.toolbarStates.selectionMode !== mode) {
		this.toolbarStates.selectionMode = mode;
	}
};

SegmentedMap.prototype.EndSelecting = function () {
	this.MapsApi.selector.ClearSelectorCanvas();
};

SegmentedMap.prototype.InfoRequestedInteractive = function (position, parent, fid, offset) {
	if (position) {
		if (position.Envelope && (position.Envelope.Min.Lat !== position.Envelope.Max.Lat
					|| position.Envelope.Min.Lon !== position.Envelope.Max.Lon)) {
			this.MapsApi.FitEnvelope(position.Envelope);
		} else if (!position.Point || position.Point.X < 350) {
			this.PanTo(position.Coordinate);
		}
	}
	this.InfoRequested(position, parent, fid, offset, true);
};

SegmentedMap.prototype.InfoRequested = function (position, parent, fid, offset, forceExpand) {
	const loc = this;
	// Establece qué está obteniendo
	var key = parent;
	key.Id = fid;
	window.Panels.Content.FeatureInfoKey = key;
	// Lo busca
	window.SegMap.Get(window.host + '/services/metrics/GetInfoWindowData', {
		params: { f: fid, l: parent.MetricId, a: parent.LevelId, v: parent.MetricVersionId }
	}).then(function (res) {
		// Lo obtuvo
		res.data.position = position;
		res.data.Key = key;
		res.data.panelType = PanelType.InfoPanel;
		window.Panels.Left.Add(res.data);
		// Si viene interactivo, lo abre y lo pone en la ruta
		if (forceExpand) {
			window.Panels.Left.collapsed = false;
			loc.SaveRoute.UpdateRoute();
		}
	});
};

SegmentedMap.prototype.InfoListRequested = function (parent, forceExpand) {
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

SegmentedMap.prototype.GetVariableName = function (metricId, variableId) {
	var metric = this.Metrics.GetMetricById(metricId);
	if (metric === null) {
		return '';
	}
	var variable = metric.GetVariableById(variableId);
	if (variable === null) {
		return '';
	}
	return variable.Name;
};

SegmentedMap.prototype.AddMetricByIdAndWork = function (id, workId) {
	return this.doAddMetricById(id, function (activeSelectedMetric) {
		return activeSelectedMetric.GetFirstValidVersionIndexByWorkId(workId);
	});
};

SegmentedMap.prototype.AddMetricByIdAndVersion = function (id, versionId) {
	return this.doAddMetricById(id, function (activeSelectedMetric) {
		return activeSelectedMetric.GetVersionIndex(metricVersionId);
	});
};

SegmentedMap.prototype.AddMetricById = function (id) {
	return this.doAddMetricById(id, null);
};

SegmentedMap.prototype.doAddMetricById = function (id, versionSelector) {
	const loc = this;
	this.Get(window.host + '/services/metrics/GetSelectedMetric', {
		params: { l: id }
	}).then(function (res) {
		var activeSelectedMetric = new ActiveSelectedMetric(loc.AxiosClone(res.data), false);
		if (versionSelector) {
			var index = versionSelector(activeSelectedMetric);
			if (index !== -1) {
				activeSelectedMetric.properties.SelectedVersionIndex = index;
			}
		}
		activeSelectedMetric.UpdateLevel();
		loc.Metrics.AddStandardMetric(activeSelectedMetric);
	}).catch(function (error) {
		err.errDialog('GetSelectedMetric', 'obtener el indicador solicitado', error);
	});
};

SegmentedMap.prototype.ChangeMetricIndex = function (oldIndex, newIndex) {
	this.Metrics.MoveFrom(oldIndex, newIndex);
	this.UpdateMap();
	this.SaveRoute.UpdateRoute();
};

SegmentedMap.prototype.SelectId = function (type, item, lat, lon, appendSelection) {
	if (type === 'C') {
		// mueve el mapa y actualiza clipping.
		var itemParts2 = str.Split(item, ',');
		var clipping = itemParts2[0];
		this.Clipping.SetClippingRegion(clipping, true, false, appendSelection);
	} else if (type === 'L') {
		// selecciona el metric y lo agrega...
		var itemParts1 = str.Split(item, ',');
		var metric = itemParts1[0];
		this.AddMetricById(metric);
	} else if (type === 'F') {
		// seleccionaron un feature
		var id = item;
		var parentInfo = {
			MetricId: null,
			MetricVersionId: null,
			LevelId: null,
			VariableId: null
		};
		var position = { Coordinate: { Lat: lat, Lon: lon } };
		this.InfoRequestedInteractive(position, parentInfo, id, null);
	} else if (type === 'P') {
		// punto...
		this.AddMetricById(item);
	}
/*	if (lat && lon) {
		this.PanTo({ Lat: lat, Lon: lon });
		this.SetZoom(15);
	}*/
};


SegmentedMap.prototype.UpdateMapLevels = function () {
	var metrics = this.Metrics.metrics;
	for (var l = 0; l < metrics.length; l++) {
		if (metrics[l].UpdateLevel())
			metrics[l].UpdateMap();
	}
};

SegmentedMap.prototype.UpdateMap = function () {
	var metrics = this.Metrics.metrics;
	for (var l = 0; l < metrics.length; l++) {
		metrics[l].UpdateMap();
	}
};

SegmentedMap.prototype.InvalidateSummaries = function () {
	for (var i = 0; i < this.Metrics.metrics.length; i++) {
		this.Metrics.metrics[i].IsUpdatingSummary = true;
	}
};

SegmentedMap.prototype.RefreshSummaries = function () {
	for (var i = 0; i < this.Metrics.metrics.length; i++) {
		this.Metrics.metrics[i].UpdateSummary();
		this.Metrics.metrics[i].UpdateRanking();
	}
};

SegmentedMap.prototype.StopDrawing = function () {
	return this.MapsApi.StopDrawing();
};

SegmentedMap.prototype.BeginDrawingCircle = function () {
	return this.MapsApi.BeginDrawingCircle();
};

SegmentedMap.prototype.TileBoundsRequiredString = function (tile) {
	return this.MapsApi.TileBoundsRequiredString(tile);
};

