import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import Queue from './Queue';
import err from '@/common/js/err';

export default TileRequest;

var queue = new Queue();

function TileRequest(selectedMetricOverlay, coord, zoom, boundsRectRequired, key, div) {
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
}

TileRequest.prototype.CancelHttpRequests = function () {
	if (this.cancel1 !== null) {
		this.cancel1('cancelled');
	}
	if (this.preCancel1 !== null) {
		queue.Release(this.preCancel1);
	}
	if (this.cancel2 !== null) {
		this.cancel2('cancelled');
	}
	if (this.preCancel2 !== null) {
		queue.Release(this.preCancel2);
	}
};

TileRequest.prototype.GetTile = function () {
	var loc = this;
	queue.Enlist(this, this.startDataRequest, null, function (p) { loc.preCancel1 = p; },
	this.selectedMetricOverlay.dataService);

	if (this.selectedMetricOverlay.geographyService) {
		queue.Enlist(this, this.startGeographyRequest, null, function (p) { loc.preCancel2 = p; },
			this.selectedMetricOverlay.geographyService);
	}
};

TileRequest.prototype.startDataRequest = function () {
	var loc = this;
	window.SegMap.Get(window.host + '/services/' + this.selectedMetricOverlay.dataService, {
		params: this.selectedMetricOverlay.activeSelectedMetric.getDataServiceParams(this.coord, this.boundsRectRequired),
		cancelToken: new this.CancelToken1(function executor(c) { loc.cancel1 = c; }),
	}).then(function (res) {
		queue.Release(loc.preCancel1);
		loc.dataDone = res.data;
		if (loc.mapDone || loc.selectedMetricOverlay.geographyService === null) {
			loc.selectedMetricOverlay.process(loc.div.dataMetric, loc.mapDone, loc.dataDone, loc.key, loc.div, loc.coord.x, loc.coord.y, loc.zoom);
		}
	}).catch(function (error) {
		queue.Release(loc.preCancel1);
		if (error.message !== 'cancelled') {
			loc.selectedMetricOverlay.SetDivFailure(loc.div);
		}
		err.err('GetTileData', error);
	});
};

TileRequest.prototype.startGeographyRequest = function () {
	var loc = this;

	var geographyId = this.selectedMetricOverlay.activeSelectedMetric.SelectedLevel().GeographyId;
	var geographyParams = { x: this.coord.x, y: this.coord.y, z: this.zoom };
	if (this.selectedMetricOverlay.useDatasetId) {
		geographyParams.d = this.selectedMetricOverlay.activeSelectedMetric.SelectedLevel().Dataset.Id;
	} else {
		geographyParams.a = geographyId;
	}
	if (this.boundsRectRequired) {
		geographyParams.b = this.boundsRectRequired;
	};
	var url = window.host + '/services/' + this.selectedMetricOverlay.geographyService;
	window.SegMap.Get(url, {
		params: geographyParams,
		cancelToken: new this.CancelToken2(function executor(c) { loc.cancel2 = c; }),
	}).then(function (res) {
		queue.Release(loc.preCancel2);
		loc.mapDone = res.data;
		if (loc.dataDone) {
			loc.selectedMetricOverlay.process(loc.div.dataMetric, loc.mapDone, loc.dataDone, loc.key, loc.div, loc.coord.x, loc.coord.y, loc.zoom);
		}
	}).catch(function (error1) {
		queue.Release(loc.preCancel2);
		loc.selectedMetricOverlay.SetDivFailure(loc.div);
		err.err('GetGeography', error1);
	});
};
