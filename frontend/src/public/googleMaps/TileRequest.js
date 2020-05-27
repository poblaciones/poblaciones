import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import err from '@/common/js/err';

export default TileRequest;

function TileRequest(queue, staticQueue, selectedMetricOverlay, coord, zoom, boundsRectRequired, key, div) {
	this.selectedMetricOverlay = selectedMetricOverlay;
	this.coord = coord;
	this.zoom = zoom;
	this.key = key;
	this.div = div;
	this.boundsRectRequired = boundsRectRequired;
	this.cancel1 = null;
	this.cancel2 = null;
	this.preCancel1Queue = null;
	this.preCancel2Queue = null;
	this.preCancel1 = null;
	this.preCancel2 = null;
	this.CancelToken1 = axios.CancelToken;
	this.CancelToken2 = axios.CancelToken;
	this.dataDone = null;
	this.mapDone = null;
	this.gradient = null;
	this.dataSubscribers = [];
	this.prevMapData = null;
	this.Page = 0;
	this.cancelled = false;
	this.dataBlockRequest = null;
	this.queue = queue;
	this.staticQueue = staticQueue;
}

TileRequest.prototype.CancelHttpRequests = function () {
	this.cancelled = true;
	if (this.dataBlockRequest) {
		// Si está suscripto a un pedido en bloque, pide
		// la cancelación del grupo
		this.dataBlockRequest.CancelHttpRequests();
	} else {
		// Si no, evalúa su propia cancelación
		if (this.allSubscribersAreCancelled() && this.cancelled) {
			if (this.cancel1 !== null) {
				this.cancel1('cancelled');
			}
			if (this.preCancel1 !== null) {
				this.preCancel1Queue.Release(this.preCancel1);
			}
		}
	}
	if (this.cancel2 !== null) {
		this.cancel2('cancelled');
	}
	if (this.preCancel2 !== null) {
		this.preCancel2Queue.Release(this.preCancel2);
	}
};

TileRequest.prototype.GetTile = function () {
	var loc = this;

	this.url = this.selectedMetricOverlay.activeSelectedMetric.GetDataService(this.boundsRectRequired, this.coord.x);
	this.params = this.selectedMetricOverlay.activeSelectedMetric.GetDataServiceParams(this.coord, this.boundsRectRequired);
	this.subset = (this.selectedMetricOverlay.activeSelectedMetric.GetSubset ? this.selectedMetricOverlay.activeSelectedMetric.GetSubset(this.coord, this.boundsRectRequired) : null);

	var info = this.url.path + JSON.stringify(this.params);

	// Resuelve el data
	var dataQueue = (!this.url.useStaticQueue ? this.queue : this.staticQueue);
	var existing = dataQueue.GetSameRequest(info);
	if (existing) {
		this.dataBlockRequest = existing;
		existing.dataSubscribe(this);
	} else {
		this.preCancel1Queue = dataQueue;
		dataQueue.Enlist(this, this.startDataRequest, null, function (p) { loc.preCancel1 = p; }, info);
	}
	// Resuelve el geography
	if (this.selectedMetricOverlay.geographyService.url) {
		var geoQueue = (this.selectedMetricOverlay.geographyService.isDatasetShapeRequest ? this.queue : this.staticQueue);
		this.preCancel2Queue = geoQueue;
		geoQueue.Enlist(this, this.startGeographyRequest, null, function (p) { loc.preCancel2 = p; });
	}
};

TileRequest.prototype.processDataResponse = function (data) {
	if (this.cancelled) {
		return;
	}
	if (this.subset) {
		data = data.Data[this.subset[0]][this.subset[1]];
	}
	this.dataDone = data;
	this.ProcessResultsIfCompleted();
};

TileRequest.prototype.requestIsComplete = function () {
	return this.dataDone &&
		(this.mapDone || this.selectedMetricOverlay.geographyService.url === null);
};

TileRequest.prototype.dataSubscribe = function (subscriber) {
	this.dataSubscribers.push(subscriber);
};

TileRequest.prototype.notifyDataSubscribers = function (data) {
	if (this.dataSubscribers.length > 0) {
		for (var n = 0; n < this.dataSubscribers.length; n++) {
			this.dataSubscribers[n].processDataResponse(data);
		}
	}
};
TileRequest.prototype.allSubscribersAreCancelled = function () {
	if (this.dataSubscribers.length > 0) {
		for (var n = 0; n < this.dataSubscribers.length; n++) {
			if (!this.dataSubscribers[n].cancelled) {
				return false;
			}
		}
	}
	return true;
};


TileRequest.prototype.startDataRequest = function (queue) {
	var loc = this;
	var params = this.params;

	window.SegMap.Get(this.url.server + this.url.path, {
		params: params,
		cancelToken: new this.CancelToken1(function executor(c) { loc.cancel1 = c; })
		},
		this.url.useStaticQueue
	).then(function (res) {
		queue.Release(loc.preCancel1);
		loc.notifyDataSubscribers(res.data);
		loc.processDataResponse(res.data);
	}).catch(function (error) {
		queue.Release(loc.preCancel1);
		var q = params;
		if (error.message !== 'cancelled') {
			loc.selectedMetricOverlay.SetDivFailure(loc.div);
		}
		err.err('GetTileData', error);
	});
};

TileRequest.prototype.startGeographyRequest = function (queue) {
	var loc = this;

	var geographyId = this.selectedMetricOverlay.activeSelectedMetric.SelectedLevel().GeographyId;
	var geographyParams = { x: this.coord.x, y: this.coord.y, z: this.zoom, w: this.selectedMetricOverlay.geographyService.revision };
	if (this.selectedMetricOverlay.geographyService.isDatasetShapeRequest) {
		geographyParams.d = this.selectedMetricOverlay.activeSelectedMetric.SelectedLevel().Dataset.Id;
	} else {
		geographyParams.a = geographyId;
	}
	if (this.Page > 0) {
		geographyParams.p = this.Page;
	}
	if (this.boundsRectRequired) {
		geographyParams.b = this.boundsRectRequired;
	};
	var url = this.selectedMetricOverlay.geographyService.url;

	url = h.selectMultiUrl(url, this.coord.x);
	var noCredentials = (this.queue == queue);

	window.SegMap.Get(url, {
		params: geographyParams,
		cancelToken: new this.CancelToken2(function executor(c) { loc.cancel2 = c; }),
		noCredentials
	}).then(function (res) {
		queue.Release(loc.preCancel2);
		loc.receiveMapData(res.data);
		var total = (res.data.TotalPages ? res.data.TotalPages : 1);
		var next = (res.data.Page ? res.data.Page + 1 : 1);
		if (total === next) {
			loc.mapDone = loc.prevMapData;
			loc.ProcessResultsIfCompleted();
		} else {
			loc.Page = next;
			queue.Enlist(loc, loc.startGeographyRequest, null, function (p) { loc.preCancel2 = p; });
		}
	}).catch(function (error1) {
		queue.Release(loc.preCancel2);
		if (error1.message !== 'cancelled') {
			loc.selectedMetricOverlay.SetDivFailure(loc.div);
		}
		err.err('GetGeography', error1);
	});
};


TileRequest.prototype.ProcessResultsIfCompleted = function () {
	if (this.requestIsComplete()) {
		this.selectedMetricOverlay.process(this.mapDone, this.dataDone, this.gradient, this.key, this.div, this.coord.x, this.coord.y, this.zoom);
	}
};

TileRequest.prototype.receiveMapData = function (newData) {
	if (newData.Gradient) {
		this.gradient = newData.Gradient;
	}
	if (this.prevMapData !== null) {
		this.prevMapData.Data.features = this.prevMapData.Data.features.concat(newData.Data.features);
	} else {
		this.prevMapData = newData;
	}
};
