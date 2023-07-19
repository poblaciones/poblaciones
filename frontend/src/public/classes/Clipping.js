import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';

export default Clipping;

function Clipping(frame, clipping) {
	this.frame = frame;
	this.clipping = clipping;
	this.ClippingRequest = null;
	this.ClippingCallback = null;
	this.cancelCreateClipping = null;
};

Clipping.prototype.FitEnvelope = function(envelope) {
	window.SegMap.MapsApi.FitEnvelope(envelope, false, (window.Panels.Left.collapsed ? 0 : window.Panels.Left.width));
};

Clipping.prototype.FitCurrentRegion = function() {
	this.FitEnvelope(this.clipping.Region.Envelope);
};

Clipping.prototype.SetClippingCanvas = function (canvas) {
	if (canvas !== null) {
		window.SegMap.MapsApi.SetClippingCanvas(canvas);
	} else {
		window.SegMap.MapsApi.ClearClippingCanvas();
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

Clipping.prototype.SetClippingCircleKms = function (center, radius) {
	var m = new Mercator();
	var degreesLat = h.trimNumberCoords(m.metersToDegreesLatitude(radius * 1000));
	var degreesLon = h.trimNumberCoords(m.metersToDegreesLongitude(center.Lat, radius * 1000));
	var clippingCircle = {
		Center: center,
		Radius: {
			Lat: degreesLat,
			Lon: degreesLon,
		},
	};
	this.SetClippingCircle(clippingCircle);
};

Clipping.prototype.SetClippingCircle = function (clippingCircle) {
	this.frame.ClippingCircle = clippingCircle;
	window.SegMap.Session.Content.SelectCircle(clippingCircle);
	window.SegMap.ClearMyLocation();
	this.CreateClipping(true, true);
};

Clipping.prototype.HasClippingLevels = function () {
	var levels = this.GetClippingLevels();
	return levels !== null && levels.length > 0;
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
	if (this.frame.ClippingRegionIds !== null && this.frame.ClippingCircle === null) {
		clippingLevels = this.clipping.Region.Levels;
	}
	return clippingLevels;
};

Clipping.prototype.ResetClippingCircle = function () {
	this.frame.ClippingCircle = null;
	window.SegMap.MapsApi.ClearClippingCanvas();
	window.SegMap.Session.Content.ClearCircle();
	if (this.frame.ClippingRegionIds !== null) {
		this.SetClippingRegion(this.frame.ClippingRegionIds, false);
	} else {
		this.ClippingChanged();
		window.SegMap.UpdateMap();
	}
	window.SegMap.SaveRoute.UpdateRoute();
};

Clipping.prototype.ResetClippingRegion = function (regionToRemove) {
	window.SegMap.Session.Content.ClearRegions([regionToRemove]);
	if (regionToRemove && this.frame.ClippingRegionIds !== null &&
				this.frame.ClippingRegionIds.length > 1) {
		this.SetClippingRegion(regionToRemove, true, false, true);
		return;
	}
	this.frame.ClippingRegionIds = null;
	window.SegMap.MapsApi.ClearClippingCanvas();
	this.ClippingChanged();
	window.SegMap.SaveRoute.UpdateRoute();
	window.SegMap.UpdateMap();
};
Clipping.prototype.SetClippingRegion = function (clippingRegionId, moveCenter, clipForZoomOnly, appendSelection) {
	if (!window.Use.UseMultiselect) {
		appendSelection = false;
	}

	this.frame.ClippingCircle = null;
	window.SegMap.ClearMyLocation();
	window.SegMap.Session.Content.SelectRegion([clippingRegionId]);
	var newClippingRegionIds = clippingRegionId;
	if (!Array.isArray(clippingRegionId)) {
		clippingRegionId = parseInt(clippingRegionId, 10);
		if (appendSelection && this.frame.ClippingRegionIds !== null) {
			// si ya lo tiene, lo saca
			if (this.frame.ClippingRegionIds.includes(clippingRegionId)) {
				arr.Remove(this.frame.ClippingRegionIds, clippingRegionId);
				newClippingRegionIds = this.frame.ClippingRegionIds;
				if (newClippingRegionIds.length === 0) {
					newClippingRegionIds = null;
				}
			} else {
				// si no lo tiene, lo agrega
				newClippingRegionIds = this.frame.ClippingRegionIds;
				newClippingRegionIds.push(clippingRegionId);
			}
		} else {
			newClippingRegionIds = [clippingRegionId];
		}
	}
	this.frame.ClippingRegionIds = newClippingRegionIds;
	this.CreateClipping(true, moveCenter, clipForZoomOnly);
};

Clipping.prototype.ClippingChanged = function (doNotUpdateMap) {
	this.CreateClipping(false, true, false, doNotUpdateMap);
};


Clipping.prototype.CreateClipping = function (fitRegion, moveCenter, clipForZoomOnly, doNotUpdateMap) {
	var args = h.getCreateClippingParams(window.SegMap.frame, this.clipping, window.SegMap.Signatures.Clipping,
		window.SegMap.Signatures.Suffix);
	if (this.ClippingRequest === '*' || this.ClippingRequest === args) {
		return;
	}

	var CancelToken = axios.CancelToken;
	if (this.cancelCreateClipping !== null) {
		this.cancelCreateClipping('cancelled');
	}
	this.SetClippingRequest(args);
	window.SegMap.InvalidateSummaries();

	const loc = this;
	var url = h.resolveMultiUrl(window.SegMap.Configuration.StaticServer, '/services/frontend/clipping/CreateClipping');
	url = h.selectMultiUrl(url, window.SegMap.frame.ClippingRegionIds);

	window.SegMap.Get(url, {
		params: args,
		cancelToken: new CancelToken(function executor(c) { loc.cancelCreateClipping = c; })},
		true
	).then(function (res) {
		loc.ResetClippingRequest(args);
		if (clipForZoomOnly) {
			window.SegMap.MapsApi.FitEnvelope(res.data.Envelope);
			loc.ResetClippingRegion();
		} else {
			loc.ResetClippingRequest(args);
			loc.ProcessClipping(res.data, fitRegion, moveCenter);

			if (!doNotUpdateMap) {
				window.SegMap.UpdateMap();
			}
			window.SegMap.RefreshSummaries();
		}
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
		this.frame.ClippingRegionIds === null;
};

Clipping.prototype.FrameHasLocation = function () {
	return this.frame.Zoom && this.frame.Center && this.frame.Center.Lat && this.frame.Center.Lon;
};

Clipping.prototype.FrameHasClippingCircle = function () {
	return this.frame.ClippingCircle !== null;
};
Clipping.prototype.FrameHasClippingRegionId = function () {
	return this.frame.ClippingRegionIds !== null;
};

Clipping.prototype.RestoreClipping = function (clippingName, fitRegion) {
	const loc = this;
	var CancelToken = axios.CancelToken;
	if (this.cancelCreateClipping !== null) {
		this.cancelCreateClipping('cancelled');
	}
	this.SetClippingRequest('*');
	window.SegMap.MapsApi.ClearClippingCanvas();
	window.SegMap.RefreshSummaries();
	window.SegMap.Get(window.host + '/services/frontend/clipping/CreateClipping', {
		params: h.getCreateClippingParamsByName(loc.frame, clippingName,
			window.SegMap.Signatures.Clipping, window.SegMap.Signatures.Suffix),
		cancelToken: new CancelToken(function executor(c) { loc.cancelCreateClipping = c; }),
	}).then(function (res) {
		loc.ProcessClipping(res.data, fitRegion, fitRegion === true);
		loc.ResetClippingRequest('*');
	}).catch(function (error) {
		loc.ResetClippingRequest('*');
		err.errDialog('RestoreClipping', 'crear la región de selección', error);
	});
};

Clipping.prototype.GetClippingName = function () {
	var regiones = this.clipping.Region.Summary.Regions;
	if (!regiones || regiones.length === 0) {
		return null;
	}
	if (regiones[0].Name === null) {
		return null;
	}
	if (regiones.length > 1) {
		var ret = [];
		for (var n = 0; n < regiones.length; n++)
			ret.push(regiones[n].Name);
		return ret.join(', ');
	} else {
		return regiones[0].Name;
	}
};

Clipping.prototype.ProcessClipping = function (data, fitRegion, moveCenter) {
	this.cancelCreateClipping = null;
	var canvas = data.Canvas;
	data.Canvas = null;
	if (data.Summary !== null) {
		this.clipping.Region = data;
		var name = this.GetClippingName();
		if (name) {
			document.title = name;
		} else {
			document.title = window.SegMap.DefaultTitle;
		}
		if (fitRegion) {
			if (moveCenter) {
				this.FitCurrentRegion();
			}
		}
		window.SegMap.UpdateMapLevels();
		this.SetClippingCanvas(canvas);
	}

};
