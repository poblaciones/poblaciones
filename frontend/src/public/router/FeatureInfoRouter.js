import h from '@/public/js/helper';
import PanelType from '@/public/enums/PanelType';

export default FeatureInfoRouter;

function FeatureInfoRouter() {
};

FeatureInfoRouter.prototype.GetSettings = function() {
	return {
		blockSignature: 'f=',
		startChar: null,
		endChar: null,
		groupSeparator: null,
		itemSeparator: '!',
		useKeyValue: true
	};
};

FeatureInfoRouter.prototype.ToRoute = function () {
	var feature = window.Panels.Content.FeatureInfo;
	if (feature == null) {
		return null;
	}
	var vals = [];
	vals.push(['f', feature.fid]);
	vals.push(['l', feature.parent.MetricId]);
	vals.push(['a', feature.parent.LevelId]);
	vals.push(['v', feature.parent.MetricVersionId]);

	// vals.push([prefix + 'x', feature.position.Coordinates.Lat, 0]);
	// vals.push([prefix + 'y', feature.position.Coordinates.Lon, 0]);
	return vals;
};

FeatureInfoRouter.prototype.FromRoute = function (args) {
	if (!args) {
		return;
	}
	let parent = {
		MetricId: h.getSafeValue(args, 'l', 0),
		MetricVersionId: h.getSafeValue(args, 'v', 0),
		LevelId: h.getSafeValue(args, 'a', 0),
	};
	let fid = h.getSafeValue(args, 'f', 0);
	window.SegMap.InfoRequested({}, parent, fid, 0);
};
