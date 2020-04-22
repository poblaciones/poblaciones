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
			ret.push(['c', this.coordinateToParam(segmentedMap.frame.ClippingCircle.Center) + ',' +
				segmentedMap.frame.ClippingCircle.Radius.Lat + ',' +
				segmentedMap.frame.ClippingCircle.Radius.Lon]);
		}
	}
	return ret;
};

ClippingRouter.prototype.FromRoute = function (args, updateRoute, skipRestore) {
	var segmentedMap = window.SegMap;

	// Reconoce el clipping del frame
	var clippingRegionId = h.getSafeValue(args, 'r', null);
	var clippingFeatureId = h.getSafeValue(args, 'f', null);
	var clippingCircle = this.getClippingCircle(h.getSafeValue(args, 'c', null));
	var clippingLevelName = h.getSafeValue(args, 'l', null);
	if (clippingRegionId === null && clippingFeatureId === null && clippingCircle === null) {
		return;
	}
	segmentedMap.SaveRoute.Disabled = true;
	if (this.clippingChanged(segmentedMap.frame,
				 clippingRegionId, clippingFeatureId, clippingCircle, clippingLevelName)) {
		segmentedMap.frame.ClippingFeatureId = clippingFeatureId;
		segmentedMap.frame.ClippingRegionId = clippingRegionId;
		segmentedMap.frame.ClippingCircle = clippingCircle;
		var loc = this;
		if (segmentedMap.Clipping.FrameHasNoClipping()) {
			segmentedMap.Clipping.ClippingCallback = function() {
				segmentedMap.Clipping.RestoreClipping(clippingLevelName);
			};
		} else {
			segmentedMap.Clipping.RestoreClipping(clippingLevelName, false);
		}
	}
	segmentedMap.SaveRoute.Disabled = false;
};

ClippingRouter.prototype.clippingChanged = function (frame1, clippingRegionId, clippingFeatureId, clippingCircle, clippingLevelName) {
	if (frame1.ClippingRegionId !== clippingRegionId ||
		frame1.ClippingFeatureId !== clippingFeatureId) {
		return true;
	}
	if ((frame1.ClippingCircle === null) !== (clippingCircle === null)) {
		return true;
	}
	if (frame1.ClippingCircle === null && clippingCircle === null) {
		return false;
	}
	if (frame1.ClippingCircle.Center.Lat !== clippingCircle.Center.Lat ||
		frame1.ClippingCircle.Center.Lon !== clippingCircle.Center.Lon ||
		frame1.ClippingCircle.Radius.Lat !== clippingCircle.Radius.Lat ||
		frame1.ClippingCircle.Radius.Lon !== clippingCircle.Radius.Lon) {
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
