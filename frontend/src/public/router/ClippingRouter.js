import h from '@/public/js/helper';

export default ClippingRouter;

function ClippingRouter() {

};

ClippingRouter.prototype.GetSettings = function() {
	return {
		blockSignature: ['@', '&'],
		startChar: '&',
		endChar: null,
		groupSeparator: null,
		itemSeparator: '!',
		useKeyValue: true
	};
};

ClippingRouter.prototype.ToRoute = function () {
	var segmentedMap = window.SegMap;
	var clippingLevel = '';
	if (segmentedMap.Clipping.clipping.Region.SelectedLevelIndex !== segmentedMap.Clipping.clipping.Region.Levels.length - 1 &&
		segmentedMap.Clipping.clipping.Region.Levels && segmentedMap.Clipping.clipping.Region.SelectedLevelIndex < segmentedMap.Clipping.clipping.Region.Levels.length) {
		clippingLevel = segmentedMap.Clipping.clipping.Region.Levels[segmentedMap.Clipping.clipping.Region.SelectedLevelIndex].Revision;
	}
	var ret = [];
	if (segmentedMap.Clipping.FrameHasNoClipping() === false || clippingLevel !== '') {
		ret.push(['l', clippingLevel, '']);
		if (segmentedMap.frame.ClippingRegionId) {
			ret.push(['r', segmentedMap.frame.ClippingRegionId]);
		}
		if (segmentedMap.frame.ClippingFeatureId) {
			ret.push(['f', segmentedMap.frame.ClippingFeatureId]);
		}
		if (segmentedMap.frame.ClippingCircle) {
			ret.push(['c', h.trimNumberCoords(segmentedMap.frame.ClippingCircle.Center.Lat) + ',' +
				 h.trimNumberCoords(segmentedMap.frame.ClippingCircle.Center.Lon) + ',' +
				segmentedMap.frame.ClippingCircle.Radius.Lat + ',' +
				segmentedMap.frame.ClippingCircle.Radius.Lon]);
		}
	}
	return ret;
};

ClippingRouter.prototype.FromRoute = function (args, updateRoute, skipRestore) {
	var segmentedMap = window.SegMap;

	// Reconoce el clipping del frame
	var clipping = this.clippingFromRoute(args);

	segmentedMap.SaveRoute.Disabled = true;
	if (this.clippingChanged(segmentedMap.frame, clipping)) {
		segmentedMap.frame.ClippingFeatureId = clipping.ClippingFeatureId;
		segmentedMap.frame.ClippingRegionId = clipping.ClippingRegionId;
		segmentedMap.frame.ClippingCircle = clipping.ClippingCircle;
		var loc = this;
		if (segmentedMap.Clipping.FrameHasNoClipping()) {
			segmentedMap.Clipping.ClippingCallback = function() {
				segmentedMap.Clipping.RestoreClipping(clipping.ClippingLevelName);
			};
		} else {
			var fitRegion = ! segmentedMap.Clipping.FrameHasLocation();
			segmentedMap.Clipping.RestoreClipping(clipping.ClippingLevelName, fitRegion);
		}
	}
	segmentedMap.SaveRoute.Disabled = false;
};

ClippingRouter.prototype.clippingFromRoute = function (args) {
	if (!args) {
		args = [];
	}
	var clippingRegionId = h.getSafeValue(args, 'r', null);
	var clippingFeatureId = h.getSafeValue(args, 'f', null);
	var clippingCircle = this.getClippingCircle(h.getSafeValue(args, 'c', null));
	var clippingLevelName = h.getSafeValue(args, 'l', null);

	var clipping = {
		ClippingRegionId: clippingRegionId,
		ClippingCircle: clippingCircle,
		ClippingLevelName: clippingLevelName,
		ClippingFeatureId: clippingFeatureId
	};
	return clipping;
};

ClippingRouter.prototype.clippingChanged = function (frame1, clipping) {
	if (frame1.ClippingRegionId !== clipping.ClippingRegionId ||
		frame1.ClippingRegionId !== clipping.ClippingLevelName || /* TODO Bugfix */
		frame1.ClippingFeatureId !== clipping.ClippingFeatureId) {
		return true;
	}
	if ((frame1.ClippingCircle === null) !== (clipping.ClippingCircle === null)) {
		return true;
	}
	if (frame1.ClippingCircle === null && clipping.ClippingCircle === null) {
		return false;
	}
	if (frame1.ClippingCircle.Center.Lat !== clipping.ClippingCircle.Center.Lat ||
		frame1.ClippingCircle.Center.Lon !== clipping.ClippingCircle.Center.Lon ||
		frame1.ClippingCircle.Radius.Lat !== clipping.ClippingCircle.Radius.Lat ||
		frame1.ClippingCircle.Radius.Lon !== clipping.ClippingCircle.Radius.Lon) {
		return true;
	}
	return false;
};

ClippingRouter.prototype.getClippingCircle = function (values) {
	if(values === null) {
		return null;
	}
	var parts = values.split(',');
	if(parts.length < 4) {
		return null;
	}

	return {
		Center: {
			Lat: parts[0],
			Lon: parts[1],
		},
		Radius: {
			Lat: parts[2],
			Lon: parts[3],
		},
	};
};
