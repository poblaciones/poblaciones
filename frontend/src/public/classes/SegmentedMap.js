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
import InfoPanel from '@/public/components/panels/infoPanel';

import h from '@/public/js/helper';
import err from '@/common/js/err';

export default SegmentedMap;

function SegmentedMap(mapsApi, frame, clipping, toolbarStates, selectedMetricCollection, config) {
	this.frame = frame;
	this.Tutorial = new Tutorial(toolbarStates);
	this.Clipping = new Clipping(this, frame, clipping);
	this.Revisions = config.Revisions;
	this.User = config.User;
	this.MapsApi = mapsApi;
	this.Work = null;
	this.Popups = {};
	this.textCanvas = {};
	this.toolbarStates = toolbarStates;
	this.MapIsInitialized = false;
	this.DefaultTitle = 'Poblaciones';
	this._axios = this.CreateAxios();
	this.Metrics = new MetricsList(this, selectedMetricCollection);
	this.SaveRoute = new SaveRoute(this);
	this.RestoreRoute = new RestoreRoute(this);
	this.afterCallback = null;
	this.afterCallback2 = null;
	this.Labels = new ActiveLabels(config);
	if (config.Blocks.UseTileBlocks) {
		this.tileDataBlockSize = config.Blocks.TileDataBlockSize;
	} else {
		this.tileDataBlockSize = null;
	}
	this.UseGradients = config.UseGradients;
	this.UsePanels = config.UsePanels;
	this.Queue = new Queue(config.MaxQueueRequests);
};

SegmentedMap.prototype.Get = function (url, params) {
	if (window.accessLink) {
		if (!params) { params = {}; }
		if (!params.headers) { params.headers = {}; }
		params.headers['Access-Link'] = window.accessLink;
	}
	return this._axios.get(url, params).then(function (res) {
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
			if (data !== null && typeof data === 'string') {
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
	});
};

SegmentedMap.prototype.CreateAxios = function () {
	var api = axios.create({ withCredentials: true });
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
	window.SegMap.SetZoom(13);
	window.SegMap.PanTo(coord);
	window.SegMap.SaveRoute.UpdateRoute(coord);
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
};

SegmentedMap.prototype.SetCenter = function (coord) {
//	this.SaveRoute.lastCenter = coord;
	this.frame.Envelope.Min = coord;
	this.frame.Envelope.Max = coord;
	this.MapsApi.SetCenter(coord);
};

SegmentedMap.prototype.PanTo = function (coord) {
	this.MapsApi.PanTo(coord);
};

SegmentedMap.prototype.SetZoom = function (zoom) {
	this.MapsApi.SetZoom(zoom);
	this.frame.Zoom = zoom;
};

SegmentedMap.prototype.MapTypeChanged = function(mapTypeState) {
	this.SaveRoute.UpdateRoute();
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

SegmentedMap.prototype.InfoRequested = function (position, parent, fid, offset) {
	const loc = this;
	window.SegMap.Get(window.host + '/services/metrics/GetInfoWindowData', {
		params: { f: fid, l: parent.MetricId, a: parent.LevelId, v: parent.MetricVersionId }
	}).then(function (res) {
		if(loc.UsePanels) {
			res.data.position = position;
			res.data.fid = fid;
			res.data.type = PanelType.InfoPanel;
			window.Panels.Left.Add(res.data);
		} else {
			var text = '';
			var data = res.data;
			text += "<div style='max-width: 250px;'>";
			text += "<div style='padding-bottom: 0px; padding-top:2px; font-size: 9px; text-transform: uppercase'>" + data.Type + '</div>';
			text += "<div style='padding-bottom: 3px; padding-top:2px; font-size: 15px; font-weight: 500'>";
			if (data.Title) {
				text += data.Title;
			} else if (data.Code) {
				text += data.Code;
			}
			text += '</div>';

			text += "<div style='max-height: 300px;'>";
			if (data.Code && data.Title) {
				text += loc.InfoRequestedFormatLine({ Name: 'Código', Value: data.Code });
			}
			data.Items.forEach(function (item) {
				text += loc.InfoRequestedFormatLine(item);
			});
			text += "<div style='padding-top: 11px; font-size: 11px;text-align: center'>Posición: "
				+ h.trimNumber(position.Coordinate.Lat) + ',' + h.trimNumber(position.Coordinate.Lon) + '.</div>';
			text += '</div>';
			text += '</div>';
			loc.MapsApi.ShowInfoWindow(text, position.Coordinate, offset);
		}
	}).catch(function (error) {
		err.errDialog('GetInfoWindowData', 'traer la información para el elemento seleccionado', error);
	});
};

SegmentedMap.prototype.InfoRequestedFormatLine = function (item) {
	var text = "<div style='padding-top: 4px'>";
	var val = (item.Caption !== null && item.Caption !== undefined ? item.Caption : item.Value);
	if (val === null) {
		val = '-';
	}
	val = (val + '').trim();
	if (val.length > 0 && val.substr(val.length - 1) !== '.') {
		val += '.';
	}
	text += h.capitalize(item.Name) + ': ' + val;
	text += '</div>';
	return text;
};

SegmentedMap.prototype.AddMetricByIdAndWork = function (id, workId) {
	return this.doAddMetricById(id, function (activeSelectedMetric) {
		return activeSelectedMetric.GetVersionIndexByWorkId(workId);
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

SegmentedMap.prototype.SelectId = function (type, item, lat, lon) {
	if (type === 'C') {
		// mueve el mapa y actualiza clipping.
		var itemParts2 = str.Split(item, ',');
		var clipping = itemParts2[0];
		this.Clipping.SetClippingRegion(clipping, true);
	} else if (type === 'L') {
		var itemParts1 = str.Split(item, ',');
		var metric = itemParts1[0];
		// selecciona el metric y lo agrega...
		this.AddMetricById(metric);
	} else if (type === 'F') {
		var id = item;

		var parentInfo = {
			MetricId: null,
			MetricVersionId: null,
			LevelId: null,
			VariableId: null
		};
		var position = { Coordinate: { Lat: lat, Lon: lon } };
		this.InfoRequested(position, parentInfo, id, null);
	} else if (type === 'P') {
		// punto...
		this.AddMetricById(item);
	}
/*	if (lat && lon) {
		this.PanTo({ Lat: lat, Lon: lon });
		this.SetZoom(15);
	}*/
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

