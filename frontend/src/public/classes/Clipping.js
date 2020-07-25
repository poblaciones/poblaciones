import axios from 'axios';
import h from '@/public/js/helper';
import err from '@/common/js/err';

export default Clipping;

function Clipping(segmentedMap, frame, clipping) {
	this.frame = frame;
	this.clipping = clipping;
	this.SegmentedMap = segmentedMap;
	this.ClippingRequest = null;
	this.ClippingCallback = null;
	this.cancelCreateClipping = null;
};

Clipping.prototype.FitCurrentRegion = function() {
	this.SegmentedMap.MapsApi.FitEnvelope(this.clipping.Region.Envelope);
};

Clipping.prototype.SetClippingCanvas = function (canvas) {
	if (canvas !== null) {
		this.SegmentedMap.MapsApi.SetClippingCanvas(canvas);
	} else {
		this.SegmentedMap.MapsApi.ClearClippingCanvas();
	}
};

Clipping.prototype.ProcessFrameMoved = function (bounds) {
	if (this.ClippingCallback != null) {
		this.ClippingCallback();
		this.ClippingCallback = null;
		return true;
	} else if (this.FrameHasNoClipping()) {
		this.ClippingChanged(true);
		return false;
	} else {
		return false;
	}
};

Clipping.prototype.SetClippingCircle = function (clippingCircle) {
	this.frame.ClippingCircle = clippingCircle;
	this.SegmentedMap.ClearMyLocation();
	this.CreateClipping(true, true);
};

Clipping.prototype.HasClippingLevels = function () {
	return this.GetClippingLevels() !== null;
};

Clipping.prototype.LevelMachLevels = function (level) {
	var levels = this.GetClippingLevels();
	if (levels) {
		for (var l = 0; l < levels.length; l++) {
			if (levels[l].Id === level.GeographyId) {
				return true;
			}
		}
	}
	return false;
};

Clipping.prototype.GetClippingLevels = function () {
	var clippingLevels = null;
	if (this.frame.ClippingRegionId !== null && this.frame.ClippingCircle === null) {
		clippingLevels = this.clipping.Region.Levels;
	}
	return clippingLevels;
};

Clipping.prototype.ResetClippingCircle = function () {
	this.frame.ClippingCircle = null;
	this.SegmentedMap.MapsApi.ClearClippingCanvas();
	if (this.frame.ClippingRegionId !== null) {
		this.SetClippingRegion(this.frame.ClippingRegionId, false);
	} else {
		this.ClippingChanged();
		this.SegmentedMap.UpdateMap();
	}
	this.SegmentedMap.SaveRoute.UpdateRoute();
};

Clipping.prototype.ResetClippingRegion = function () {
	this.frame.ClippingRegionId = null;
	this.SegmentedMap.MapsApi.ClearClippingCanvas();
	this.ClippingChanged();
	this.SegmentedMap.SaveRoute.UpdateRoute();
	this.SegmentedMap.UpdateMap();
};
Clipping.prototype.SetClippingRegion = function (clippingRegionId, moveCenter, clipForZoomOnly) {
	this.frame.ClippingCircle = null;
	this.SegmentedMap.ClearMyLocation();
	this.frame.ClippingRegionId = clippingRegionId;
	this.CreateClipping(true, moveCenter, clipForZoomOnly);
};

Clipping.prototype.ClippingChanged = function (doNotUpdateMap) {
	this.CreateClipping(false, true, false, doNotUpdateMap);
};


Clipping.prototype.CreateClipping = function (fitRegion, moveCenter, clipForZoomOnly, doNotUpdateMap) {
	var args = h.getCreateClippingParams(this.SegmentedMap.frame, this.clipping, this.SegmentedMap.Revisions.Clipping);
	if (this.ClippingRequest === '*' || this.ClippingRequest === args) {
		return;
	}

	var CancelToken = axios.CancelToken;
	if (this.cancelCreateClipping !== null) {
		this.cancelCreateClipping('cancelled');
	}
	this.SetClippingRequest(args);
	this.SegmentedMap.InvalidateSummaries();

	const loc = this;
	var url = h.resolveMultiUrl(this.SegmentedMap.Configuration.StaticServer, '/services/frontend/clipping/CreateClipping');
	url = h.selectMultiUrl(url, this.SegmentedMap.frame.ClippingRegionId);

	this.SegmentedMap.Get(url, {
		params: args,
		cancelToken: new CancelToken(function executor(c) { loc.cancelCreateClipping = c; })},
		true
	).then(function (res) {
		loc.ProcessClipping(res.data, fitRegion, moveCenter);
		loc.ResetClippingRequest(args);
		if (clipForZoomOnly) {
			loc.ResetClippingRegion();
		}
		if (!doNotUpdateMap) {
			loc.SegmentedMap.UpdateMap();
		}
		loc.SegmentedMap.RefreshSummaries();
}).catch(function (error) {
		loc.ResetClippingRequest(args);
		err.errDialog('CreateClipping', 'crear la región seleccionada', error);
	});
};

Clipping.prototype.SetClippingRequest = function (request) {
	this.ClippingRequest = request;
	this.clipping.IsUpdating = (request !== null ? '1' : '0');
};
Clipping.prototype.ResetClippingRequest = function (request) {
	if (this.ClippingRequest === request) {
		this.SetClippingRequest(null);
	}
};

Clipping.prototype.FrameHasNoClipping = function () {
	return this.frame.ClippingCircle === null &&
		this.frame.ClippingRegionId === null;
};

Clipping.prototype.FrameHasLocation = function () {
	return this.frame.Zoom && this.frame.Center && this.frame.Center.Lat && this.frame.Center.Lon;
};

Clipping.prototype.FrameHasClippingCircle = function () {
	return this.frame.ClippingCircle !== null;
};
Clipping.prototype.FrameHasClippingRegionId = function () {
	return this.frame.ClippingRegionId !== null;
};

Clipping.prototype.RestoreClipping = function (clippingName, fitRegion) {
	const loc = this;
	var CancelToken = axios.CancelToken;
	if (this.cancelCreateClipping !== null) {
		this.cancelCreateClipping('cancelled');
	}
	this.SetClippingRequest('*');
	this.SegmentedMap.MapsApi.ClearClippingCanvas();
	this.SegmentedMap.RefreshSummaries();
	this.SegmentedMap.Get(window.host + '/services/frontend/clipping/CreateClipping', {
		params: h.getCreateClippingParamsByName(loc.frame, clippingName, this.SegmentedMap.Revisions.Clipping),
		cancelToken: new CancelToken(function executor(c) { loc.cancelCreateClipping = c; }),
	}).then(function (res) {
		loc.ProcessClipping(res.data, fitRegion, fitRegion === true);
		loc.ResetClippingRequest('*');
	}).catch(function (error) {
		loc.ResetClippingRequest('*');
		err.errDialog('RestoreClipping', 'crear la región de selección', error);
	});
};

Clipping.prototype.ProcessClipping = function (data, fitRegion, moveCenter) {
	this.cancelCreateClipping = null;
	var canvas = data.Canvas;
	data.Canvas = null;
	if (data.Summary !== null) {
		this.clipping.Region = data;
		if (this.clipping.Region.Summary.Name) {
			document.title = this.clipping.Region.Summary.Name;
		} else {
			document.title = this.SegmentedMap.DefaultTitle;
		}
		if (fitRegion) {
			if (moveCenter) {
				this.FitCurrentRegion();
			}
		}
		this.SetClippingCanvas(canvas);
	}
};
