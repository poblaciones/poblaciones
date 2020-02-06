import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import err from '@/common/js/err';

export default TileRequest;

function TileRequest(queue, selectedMetricOverlay, coord, zoom, boundsRectRequired, key, div) {
	this.selectedMetricOverlay = selectedMetricOverlay;
	this.coord = coord;
	this.zoom = zoom;
	this.key = key;
	this.div = div;
	this.boundsRectRequired = boundsRectRequired;
	this.cancel1 = null;
	this.cancel2 = null;
	this.preCancel1 = null;
	this.preCancel2 = null;
	this.CancelToken1 = axios.CancelToken;
	this.CancelToken2 = axios.CancelToken;
	this.dataDone = null;
	this.mapDone = null;
	this.dataSubscribers = [];
	this.prevMapData = null;
	this.Page = 0;
	this.cancelled = false;
	this.dataExisting = null;
	this.queue = queue;
}

TileRequest.prototype.CancelHttpRequests = function () {
	this.cancelled = true;
	if (this.dataExisting) {
		this.dataExisting.CancelHttpRequests();
		return;
	}
	if (this.allSubscribersAreCancelled() && this.cancelled) {
		if (this.cancel1 !== null) {
			this.cancel1('cancelled');
		}
		if (this.preCancel1 !== null) {
			this.queue.Release(this.preCancel1);
		}
	}
	if (this.cancel2 !== null) {
		this.cancel2('cancelled');
	}
	if (this.preCancel2 !== null) {
		this.queue.Release(this.preCancel2);
	}
};

TileRequest.prototype.GetTile = function () {
	var loc = this;

	this.url = this.selectedMetricOverlay.activeSelectedMetric.GetDataService(this.boundsRectRequired);
	this.params = this.selectedMetricOverlay.activeSelectedMetric.GetDataServiceParams(this.coord, this.boundsRectRequired);
	this.subset = (this.selectedMetricOverlay.activeSelectedMetric.GetSubset ? this.selectedMetricOverlay.activeSelectedMetric.GetSubset(this.coord, this.boundsRectRequired) : null);

	var info = this.url + JSON.stringify(this.params);

	var existing = this.queue.GetSameRequest(info);
	if (existing) {
		this.dataExisting = existing;
		existing.dataSubscribe(this);
	} else {
		this.queue.Enlist(this, this.startDataRequest, null, function (p) { loc.preCancel1 = p; }, info);
	}

	if (this.selectedMetricOverlay.geographyService.url) {
		this.queue.Enlist(this, this.startGeographyRequest, null, function (p) { loc.preCancel2 = p; });
	}
};

TileRequest.prototype.processDataResponse = function (data) {
	var loc = this;
	if (this.cancelled) {
		return;
	}
	if (this.subset) {
		data = data.Data[this.subset[0]][this.subset[1]];
	}
	this.dataDone = data;
	if (loc.mapDone || loc.selectedMetricOverlay.geographyService.url === null) {
		loc.selectedMetricOverlay.process(loc.div.dataMetric, loc.mapDone, loc.dataDone, loc.key, loc.div, loc.coord.x, loc.coord.y, loc.zoom);
	}
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


TileRequest.prototype.startDataRequest = function () {
	var loc = this;
	var params = this.params;
	window.SegMap.Get(window.host + '/services/' + this.url, {
		params: params,
		cancelToken: new this.CancelToken1(function executor(c) { loc.cancel1 = c; }),
	}).then(function (res) {
		loc.queue.Release(loc.preCancel1);
		loc.notifyDataSubscribers(res.data);
		loc.processDataResponse(res.data);
	}).catch(function (error) {
		loc.queue.Release(loc.preCancel1);
		var q = params;
		if (error.message !== 'cancelled') {
			loc.selectedMetricOverlay.SetDivFailure(loc.div);
		}
		err.err('GetTileData', error);
	});
};

TileRequest.prototype.startGeographyRequest = function () {
	var loc = this;

	var geographyId = this.selectedMetricOverlay.activeSelectedMetric.SelectedLevel().GeographyId;
	var geographyParams = { x: this.coord.x, y: this.coord.y, z: this.zoom, w: this.selectedMetricOverlay.geographyService.revision };
	if (this.selectedMetricOverlay.geographyService.useDatasetId) {
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
	var url = window.host + '/services/' + this.selectedMetricOverlay.geographyService.url;
	window.SegMap.Get(url, {
		params: geographyParams,
		cancelToken: new this.CancelToken2(function executor(c) { loc.cancel2 = c; }),
	}).then(function (res) {
		loc.queue.Release(loc.preCancel2);
		loc.receiveMapData(res.data);
		var total = (res.data.TotalPages ? res.data.TotalPages : 1);
		var next = (res.data.Page ? res.data.Page + 1 : 1);
		if (total === next) {
			loc.mapDone = loc.prevMapData;
			if (loc.dataDone) {
				loc.selectedMetricOverlay.process(loc.div.dataMetric, loc.mapDone, loc.dataDone, loc.key, loc.div, loc.coord.x, loc.coord.y, loc.zoom);
			}
		} else {
			loc.Page = next;
			this.queue.Enlist(loc, loc.startGeographyRequest, null, function (p) { loc.preCancel2 = p; });
		}
	}).catch(function (error1) {
		loc.queue.Release(loc.preCancel2);
		if (error1.message !== 'cancelled') {
			loc.selectedMetricOverlay.SetDivFailure(loc.div);
		}
		err.err('GetGeography', error1);
	});
};

TileRequest.prototype.receiveMapData = function (newData) {
	if (this.prevMapData !== null) {
		this.prevMapData.Data.features = this.prevMapData.Data.features.concat(newData.Data.features);
	} else {
		this.prevMapData = newData;
	}
};
