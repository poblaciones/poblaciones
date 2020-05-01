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
	var key = window.Panels.Content.FeatureInfoKey;
	if (key == null) {
		return null;
	}
	var vals = [];
	vals.push(['f', key.Id]);
	vals.push(['l', key.MetricId, null]);
	vals.push(['a', key.LevelId, null]);
	vals.push(['v', key.MetricVersionId, null]);
	return vals;
};

FeatureInfoRouter.prototype.FromRoute = function (args) {
	if (!args) {
		return;
	}
	let parent = {
		MetricId: h.getSafeValue(args, 'l', null),
		MetricVersionId: h.getSafeValue(args, 'v', null),
		LevelId: h.getSafeValue(args, 'a', null),
	};
	let fid = h.getSafeValue(args, 'f', null);
	window.SegMap.InfoRequested({}, parent, fid, null);
};
