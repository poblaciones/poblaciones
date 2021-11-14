import BoundariesComposer from '@/public/composers/BoundariesComposer';

import h from '@/public/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';

export default ActiveBoundary;

ActiveBoundary.DEFAULT_COLOR = '#95a3c1';

function ActiveBoundary(data) {
	this.objs = {};
	this.objs.Segment = null;
	this.index = -1;
	this.isBoundary = true;
	this.visible = true;
	this.IsUpdatingSummary = false;
	this.opacity = .7;
	this.cancelUpdateSummary = null;
	this.showDescriptions = true;
	this.properties = data;
	this.KillDuplicateds = false;
	this.borderWidth = 2;
	this.color = ActiveBoundary.DEFAULT_COLOR;
};

ActiveBoundary.prototype.ResolveSegment = function () {
	this.objs.Segment = window.SegMap.Metrics.PatternsSegment;
};
ActiveBoundary.prototype.Visible = function () {
	return this.visible;
};

ActiveBoundary.prototype.GetStyleColorDictionary = function () {
	var ret = {};
	ret[1] = this.color;
	return ret;
};


ActiveBoundary.prototype.CurrentOpacity = function () {
	return this.opacity;
};

ActiveBoundary.prototype.UpdateRanking = function () {
};


ActiveBoundary.prototype.UpdateSummary = function () {
	var boundary = this.properties;
	var loc = this;
	var CancelToken = axios.CancelToken;
	if (this.cancelUpdateSummary !== null) {
		this.cancelUpdateSummary('cancelled');
	}
	this.IsUpdatingSummary = true;

	var rev = window.SegMap.Signatures.Boundary;
	var suffix = window.SegMap.Signatures.Suffix;

	window.SegMap.Get(window.host + '/services/frontend/boundaries/GetBoundarySummary', {
		params: h.getBoundarySummaryParams(boundary, window.SegMap.frame, rev, suffix),
		cancelToken: new CancelToken(function executor(c) { loc.cancelUpdateSummary = c; }),
	}).then(function (res) {
		loc.cancelUpdateSummary = null;
		if (res.message === 'cancelled') {
			return;
		}
		loc.IsUpdatingSummary = false;
		loc.properties.Count = res.data.Count;
	}).catch(function (error) {
		err.errDialog('GetBoundarySummary', 'obtener las estadísticas de resumen de delimitación', error);
	});
};

ActiveBoundary.prototype.GetStyleColorList = function() {
	var ret = [];
	ret.push({ cs: 'cs1', className: 1, fillColor: this.color });
	return ret;
};

ActiveBoundary.prototype.UpdateMap = function () {
	if (window.SegMap && this.objs.Segment !== null) {
		window.SegMap.Metrics.UpdateMetric(this);
		window.SegMap.SaveRoute.UpdateRoute();
	}
};

ActiveBoundary.prototype.ChangeVisibility = function () {
	this.visible = !this.visible;
	this.UpdateMap();
};

ActiveBoundary.prototype.CheckTileIsOutOfClipping = function() {
	return false;
};

ActiveBoundary.prototype.GetDataService = function (seed) {
	// h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed)
	return { server: window.host, path: '/services/frontend/boundaries/GetBoundary', useStaticQueue: false };
};

ActiveBoundary.prototype.GetDataServiceParams = function (coord) {
	var rev = window.SegMap.Signatures.Boundary;
	var preffix = window.SegMap.Signatures.Preffix;
	return h.getBoundaryParams(this, window.SegMap.frame, coord.x, coord.y, rev, preffix);
};

ActiveBoundary.prototype.Show = function () {
	this.visible = true;
	window.SegMap.Metrics.UpdateMetric(this);
};

ActiveBoundary.prototype.Hide = function () {
	this.visible = false;
	window.SegMap.Metrics.Remove(this, true);
};

ActiveBoundary.prototype.UpdateLevel = function () {
	return false;
};

ActiveBoundary.prototype.Remove = function () {
	window.SegMap.Metrics.Remove(this);
};

ActiveBoundary.prototype.UpdateOpacity = function (zoom) {
	return;
};

ActiveBoundary.prototype.showText = function () {
	return true;
};

ActiveBoundary.prototype.GetPattern = function () {
	return 1;
};


ActiveBoundary.prototype.CreateComposer = function() {
	return new BoundariesComposer(window.SegMap.MapsApi, this);
};

ActiveBoundary.prototype.GetCartographyService = function () {
	return { url: null, revision: null };
};
