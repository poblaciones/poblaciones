import h from '@/public/js/helper';

export default FrameRouter;

function FrameRouter() {
};

FrameRouter.prototype.GetSettings = function() {
	return {
		blockSignature: ['@', '&'],
		startChar: null,
		endChar: '&',
		groupSeparator: null,
		itemSeparator: ',',
		useKeyValue: false
	};
};

FrameRouter.prototype.ToRoute = function (coord) {
	var segmentedMap = window.SegMap;
	if (coord === undefined) {
		coord = this.calculateCenterAsCoordinate(segmentedMap.frame.Envelope);
	}
	var ret = [];
	ret.push(h.trimNumberCoords(coord.Lat));
	ret.push(h.trimNumberCoords(coord.Lon));
	ret.push(segmentedMap.frame.Zoom + 'z');
	var mapType = segmentedMap.GetMapTypeState();
	if (mapType !== 'r') {
		ret.push(mapType);
	}
	return ret;
};

FrameRouter.prototype.calculateCenterAsCoordinate = function (envelope) {
	var coordinate = { Lat: (envelope.Min.Lat + envelope.Max.Lat) / 2, Lon: (envelope.Min.Lon + envelope.Max.Lon) / 2 };
	return coordinate;
};

FrameRouter.prototype.FromRoute = function (args, updateRoute, skipRestore) {
	if (!args || args.length < 2) {
		return;
	}
	var framing = this.frameFromRoute(args);
	var segmentedMap = window.SegMap;

	segmentedMap.SaveRoute.lastState = null;
	// Setea la posición, el zoom y el tipo de mapa
	segmentedMap.SaveRoute.Disabled = true;
	if (framing.Center.Lat && framing.Center.Lon) {
		segmentedMap.SetCenter(framing.Center);
	}
	if (framing.Zoom || framing.Zoom === 0) {
		segmentedMap.SetZoom(framing.Zoom);
	}
	if (framing.MapType) {
		segmentedMap.SetMapTypeState(framing.MapType);
	}
	segmentedMap.SaveRoute.Disabled = false;
};

FrameRouter.prototype.frameFromRoute = function (args) {
	if (!args || args.length < 2) {
		return null;
	}
	var lat = parseFloat(args[0]);
	var lon = parseFloat(args[1]);
	var zoom;
	if (args.length >= 3) {
		zoom = parseInt(args[2].replace('z', ''));
	} else {
		zoom = 14;
	}
	var mapType = 'r';
	if (args.length === 4) {
		mapType = args[3];
	}
	var frame = {
		Center: {
			Lat: lat,
			Lon: lon
		},
		Zoom: zoom,
		MapType: mapType,
		ClippingRegionIds: null,
		ClippingCircle: null,
		ClippingLevelName: null,
		ClippingFeatureId: null
	};
	return frame;
};
