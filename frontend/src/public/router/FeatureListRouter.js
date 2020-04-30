import h from '@/public/js/helper';
import PanelType from '@/public/enums/PanelType';

export default FeatureListRouter;

function FeatureListRouter() {
};

FeatureListRouter.prototype.GetSettings = function() {
	return {
		blockSignature: 'i=',
		startChar: null,
		endChar: null,
		groupSeparator: null,
		itemSeparator: '!',
		useKeyValue: true
	};
};

FeatureListRouter.prototype.ToRoute = function () {
	var list = window.Panels.Content.ListInfo;
	if (list == null) {
		return null;
	}
	var vals = [];
	vals.push(['l', list.parent.MetricId]);
	vals.push(['a', list.parent.LevelId]);
	vals.push(['v', list.parent.MetricVersionId]);
	if(panel.detailIndex != null) {
		vals.push(['i', list.detailIndex]);
	}
	return vals;
};

FeatureListRouter.prototype.FromRoute = function (args) {
	if (!args) {
		return;
	}
	let parent = {
		MetricId: h.getSafeValue(args, 'l', 0),
		MetricVersionId: h.getSafeValue(args, 'v', 0),
		LevelId: h.getSafeValue(args, 'a', 0),
	};
	let val = h.getSafeValue(args, 'i', null);
	//panel.detailIndex = val;

	window.SegMap.InfoListRequested(parent);
};
