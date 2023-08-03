import ActiveSelectedMetric from '@/public/classes/ActiveSelectedMetric';
import ActiveLabels from '@/public/classes/ActiveLabels';
import ActiveBoundary from '@/public/classes/ActiveBoundary';
import MetricsList from '@/public/classes/MetricsList';
import SaveRoute from '@/public/classes/SaveRoute';
import Clipping from '@/public/classes/Clipping';
import Tutorial from '@/public/classes/Tutorial';
import RestoreRoute from '@/public/classes/RestoreRoute';
import Queue from './Queue';
import Session from '@/public/session/Session';
import OverlapRectangles from './OverlapRectangles';
import InfoWindow from './InfoWindow';
import axios from 'axios';
import str from '@/common/framework/str';
import { loadProgressBar } from '@/common/js/axiosProgressBar.js';

// import { loadProgressBar } from 'axios-progress-bar';

import h from '@/public/js/helper';
import m from '@/public/js/Mercator';
import err from '@/common/framework/err';

export default SegmentedMap;

function SegmentedMap(mapsApi, frame, clipping, toolbarStates, selectedMetricCollection, config) {
	this.frame = frame;
	this.Tutorial = new Tutorial(toolbarStates);
	this.InfoWindow = new InfoWindow();
	this.Clipping = new Clipping(frame, clipping);
	this.Signatures = config.Signatures;
	this.User = config.User;
	this.MapsApi = mapsApi;
	this.Work = null;
	this.Popups = {};
	this.IsSmallDevice = true;
	this.IsNotLarge = false;
	this.textCanvas = {};
	this.toolbarStates = toolbarStates;
	this.MapIsInitialized = false;
	this.DefaultTitle = 'Poblaciones';
	this._axios = this.CreateAxios(true);
	this._axiosNoCredentials = this.CreateAxios(false);
	loadProgressBar({ showSpinner: false, parent: '#holder' }, this._axios, 0);
	loadProgressBar({ showSpinner: false, parent: '#holder' }, this._axiosNoCredentials, 1);
	this.Metrics = new MetricsList(selectedMetricCollection);
	this.SaveRoute = new SaveRoute();
	this.RestoreRoute = new RestoreRoute();
	this.afterCallback = null;
	this.afterCallback2 = null;
	this.ZoomChangedSubscribers = [];
	this.OverlapRectangles = new OverlapRectangles();
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
	this.Session = new Session(config);
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

SegmentedMap.prototype.IsVariableVisible = function (metricId, variableId) {
	// se fija si el metric y el variable están visibiles...
	var metric = window.SegMap.Metrics.GetMetricById(metricId);
	if (!metric) {
		return false;
	}
	if (!metric.SelectedVariable()) {
		return false;
	}
	var variable = metric.GetVariableById(variableId);
	if (!variable) {
		return false;
	}
	return true;
};

SegmentedMap.prototype.Get = function (url, params, noCredencials, isRetry) {
	if (!params) { params = {}; }
	if (!params.headers) { params.headers = {}; }

	if (window.accessLink) {
		params.headers['Access-Link'] = window.accessLink;
	}
	if (!noCredencials) {
		params.headers['Full-Url'] = document.location.href;
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


SegmentedMap.prototype.Post = function (url, args, noCredencials) {
	if (!args) { args = {}; }
	var loc = this;
	var axios = (noCredencials ? this._axiosNoCredentials : this._axios);
	const config = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};
	if(!noCredencials) {
		config.headers['Full-Url'] = document.location.href;
	}
	if(window.accessLink) {
		config.headers['Access-Link'] = window.accessLink;
	}
	for (var n in args) {
		if (args.hasOwnProperty(n)) {
			var i = args[n];
			if (i !== null && (i instanceof Object || Array.isArray(i))) {
				args[n] = JSON.stringify(i);
			}
		}
	}
	const querystring = require('querystring');
	var params = querystring.stringify(args);
	return axios.post(url, params, config).then(function (res) {
		if (res.status === 200) {
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
		throw (res);
	});
};

SegmentedMap.prototype.CreateAxios = function (withCredentials) {
	var api = axios.create({ withCredentials: withCredentials });
	return api;
};

SegmentedMap.prototype.MapInitialized = function () {
	this.MapIsInitialized = true;
	this.TriggerResize();
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
	this.PanTo(coord, null, 13);
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

SegmentedMap.prototype.CheckSmallDevice = function () {
	// Se fija si contraer el selector de tipo de mapa
	var isNotLarge = window.innerWidth < 992;
	if (this.IsNotLarge !== isNotLarge) {
		if (isNotLarge) {
			this.SetTypeControlsDropDown();
		} else {
			this.SetTypeControlsDefault();
		}
		this.IsNotLarge = isNotLarge;
	}
	// Se fija por el panel
	var isSmallDevice = window.innerWidth < 768;
	if (this.IsSmallDevice !== isSmallDevice) {
		if (isSmallDevice) {
			this.toolbarStates.collapsed = true;
		} else {
			if (!window.Embedded.HideSidePanel) {
				this.toolbarStates.collapsed = false;
			}
		}
		this.IsSmallDevice = isSmallDevice;
	}

};

SegmentedMap.prototype.GetMapTypeState = function () {
	return this.MapsApi.GetMapTypeState();
};

SegmentedMap.prototype.SetMapTypeState = function (mapType) {
	this.MapsApi.SetMapTypeState(mapType);
	this.MapTypeChanged(mapType);
};

SegmentedMap.prototype.SetCenter = function (coord, zoom = null) {
	this.frame.Envelope.Min = coord;
	this.frame.Envelope.Max = coord;
	this.frame.Center = coord;
	if (zoom) {
		this.frame.Zoom = zoom;
	}
	this.MapsApi.SetCenter(coord, zoom);
};

SegmentedMap.prototype.PanTo = function (coord, offsetXpixels, zoom) {
	this.frame.Envelope.Min = coord;
	this.frame.Envelope.Max = coord;
	this.frame.Center = coord;
	if (zoom) {
		this.frame.Zoom = zoom;
	}
	this.MapsApi.PanTo(coord, offsetXpixels, zoom);
};

SegmentedMap.prototype.SetZoom = function (zoom) {
	this.MapsApi.SetZoom(zoom);
	this.frame.Zoom = zoom;
};

SegmentedMap.prototype.SetTypeControlsDropDown = function () {
this.MapsApi.SetTypeControlsDropDown();
};

SegmentedMap.prototype.SetTypeControlsDefault = function () {
	if (!this.IsNotLarge) {
		this.MapsApi.SetTypeControlsDefault();
	}
};

SegmentedMap.prototype.MapTypeChanged = function (mapTypeState) {
	if (mapTypeState === 's') {
		this.toolbarStates.showLabels = false;
	}
	if (mapTypeState === 'h') {
		this.toolbarStates.showLabels = true;
	}
	this.Session.UI.BasemapChanged(mapTypeState);
	this.UpdateLabelsVisibility();
};

SegmentedMap.prototype.ToggleShowLabels = function () {
	// Si está en modo satélite, el toggle implica un cambio de mapa
	var mapState = this.MapsApi.GetMapTypeState();
	if (mapState === 'h') {
		this.SetMapTypeState('s');
		return;
	}
	if (mapState === 's') {
		this.SetMapTypeState('h');
		return;
	}
	this.toolbarStates.showLabels = !this.toolbarStates.showLabels;
	this.UpdateLabelsVisibility();
	this.SaveRoute.UpdateRoute();
};

SegmentedMap.prototype.UpdateLabelsVisibility = function () {
	if (this.toolbarStates.showLabels) {
		if (!this.Labels.Visible()) {
			// Lo empieza a mostrar
			this.Labels.Show();
			this.MapsApi.UpdateLabelsVisibility(true);
		}
	} else {
		if (this.Labels.Visible()) {
			// Las oculta
			this.Labels.Hide();
			this.MapsApi.UpdateLabelsVisibility(false);
		}
	}
	this.Session.UI.LabelsChanged(this.toolbarStates.showLabels);
};

SegmentedMap.prototype.ZoomChanged = function (zoom) {
	if (this.frame.Zoom !== zoom) {
		this.frame.Zoom = zoom;
		//this.Labels.UpdateMap();
		this.Metrics.ZoomChanged();
		this.Session.UI.ZoomChanged(zoom);

		if (this.ZoomChangedSubscribers) {
			for (var subscriber of this.ZoomChangedSubscribers) {
				subscriber.ZoomChanged(zoom);
			}
		}
	}
};
SegmentedMap.prototype.FrameMoved = function (bounds) {
	if (!this.frame) {
		return;
	}
	this.frame.Envelope.Min = bounds.Min;
	this.frame.Envelope.Max = bounds.Max;

	this.Session.UI.BoundsChanged(bounds);

	if (this.Clipping.ProcessFrameMoved() === false) {
		;
	}
};

SegmentedMap.prototype.BoundsChanged = function () {
	this.SaveRoute.UpdateRoute();
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

SegmentedMap.prototype.GetActiveMetricByVariableId = function (variableId) {
	return this.Metrics.GetMetricByVariableId(variableId);
};

SegmentedMap.prototype.GetVariable = function (metricId, variableId) {
	var metric = this.Metrics.GetMetricById(metricId);
	if (metric === null) {
		return null;
	}
	var variable = metric.GetVariableById(variableId);
	if (variable === null) {
		return null;
	}
	return variable;
};

SegmentedMap.prototype.GetVariableName = function (metricId, variableId) {
	var variable = this.GetVariable(metricId, variableId);
	if (variable === null) {
		return '';
	} else {
		return variable.Name;
	}
};

SegmentedMap.prototype.AddMetricByIdAndWork = function (id, workId) {
	return this.doAddMetricById(id, function (activeSelectedMetric) {
		return activeSelectedMetric.GetFirstValidVersionIndexByWorkId(workId);
	});
};


SegmentedMap.prototype.SwitchSessionProvider = function () {
   return this.Get(window.host + '/services/frontend/SwitchSessionProvider');
};


SegmentedMap.prototype.AddMetricByIdAndVersion = function (id, versionId) {
	return this.doAddMetricById(id, function (activeSelectedMetric) {
		return activeSelectedMetric.GetVersionIndex(metricVersionId);
	});
};

SegmentedMap.prototype.AddMetricByFID = function (fid) {
	const loc = this;
	this.Get(window.host + '/services/metrics/GetSelectedMetricByFID', {
		params: { f: fid }
	}).then(function (res) {
		loc.AddMetricBySelectedMetricInfo(res.data);
	}).catch(function (error) {
		err.errDialog('GetSelectedMetricByFID', 'obtener el indicador solicitado', error);
	});
};

SegmentedMap.prototype.AddMetricById = function (id) {
	var loc = this;
	return this.doAddMetricById(id, null).then(function () {
		loc.Session.Content.AddMetric(id);
	});
};

SegmentedMap.prototype.AddBoundaryById = function (id, caption) {
	const loc = this;
	this.Get(window.host + '/services/boundaries/GetSelectedBoundary', {
		params: { a: id }
	}).then(function (res) {
		var activeBoundary = new ActiveBoundary(res.data);
		loc.Metrics.AddStandardMetric(activeBoundary);
		loc.Session.Content.AddBoundary(id);
	}).catch(function (error) {
		err.errDialog('GetSelectedBoundary', 'obtener las delimitaciones solicitadas', error);
	});

};

SegmentedMap.prototype.doAddMetricById = function (id, versionSelector) {
	const loc = this;
	return this.Get(window.host + '/services/metrics/GetSelectedMetric', {
		params: { l: id }
	}).then(function (res) {
		loc.AddMetricBySelectedMetricInfo(res.data, versionSelector);
	}).catch(function (error) {
		err.errDialog('GetSelectedMetric', 'obtener el indicador solicitado', error);
	});
};

SegmentedMap.prototype.AddMetricBySelectedMetricInfo = function (selectedMetricInfo, versionSelector) {
	var activeSelectedMetric = new ActiveSelectedMetric(selectedMetricInfo, false);
	if (versionSelector) {
		var index = versionSelector(activeSelectedMetric);
		if (index !== -1) {
			activeSelectedMetric.properties.SelectedVersionIndex = index;
		}
	}
	activeSelectedMetric.UpdateLevel();
	this.Metrics.AddStandardMetric(activeSelectedMetric);
};

SegmentedMap.prototype.ChangeMetricIndex = function (oldIndex, newIndex) {
	this.Metrics.MoveFrom(oldIndex, newIndex);
	this.UpdateMap();
	this.SaveRoute.UpdateRoute();
};

SegmentedMap.prototype.PostWorkPreview = function (work, blobPng) {
	const FormData2 = require('form-data');
	const formData = new FormData2();
	formData.append("ws", work.Id);
	formData.append('preview', blobPng, 'preview.png');
	const config = { headers: { 'content-type': 'multipart/form-data' }};

	return this._axios.post(window.host + '/services/backoffice/PostWorkPreview', formData, config);
};

SegmentedMap.prototype.SelectId = function (type, item, lat, lon, appendSelection) {
	if (this.MapsApi.draggingDelayed) {
		return;
	}
	if (type === 'C') {
		if (!window.Embedded.DisableClippingSelection) {
			// mueve el mapa y actualiza clipping.
			var itemParts2 = str.Split(item, ',');
			var clipping = itemParts2[0];
			this.Clipping.SetClippingRegion(clipping, true, false, appendSelection);
		}
	} else if (type === 'L') {
		// selecciona el metric y lo agrega...
		var itemParts1 = str.Split(item, ',');
		var metric = itemParts1[0];
		this.AddMetricById(metric);
	} else if (type === 'F') {
		// seleccionaron un feature
		var id;
		var parentInfo;
		if (item && ('' + item).startsWith('{')) {
			var asText = item.replaceAll('@', '"');
			parentInfo = JSON.parse(asText);
			id = parentInfo.Id;
		} else {
			id = item;
			parentInfo = {
				MetricId: null,
				MetricVersionId: null,
				LevelId: null,
				VariableId: null
			};
		}
		var position = { Coordinate: { Lat: lat, Lon: lon } };
		this.InfoWindow.InfoRequestedInteractive(position, parentInfo, id);
	} else if (type === 'P') {
		// punto...
		this.AddMetricById(item);
	} else if (type === 'B') {
		// delimitación...
		this.AddBoundaryById(item);
	} else {
		throw new Error('Tipo de respuesta no reconocida.');
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


