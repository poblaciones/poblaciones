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
	vals.push(['v', key.VariableId, null]);
	vals.push(['x', (key.Exceptions ? key.Exceptions : null), null]);
	return vals;
};

FeatureInfoRouter.prototype.FromRoute = function (args) {
	if (!args) {
		return;
	}
	let parent = {
		MetricId: parseInt(h.getSafeValue(args, 'l', null)),
		VariableId: parseInt(h.getSafeValue(args, 'v', null)),
		Exceptions: h.getSafeValue(args, 'x', null),
	};
	let fid = parseInt(h.getSafeValue(args, 'f', null));
	window.SegMap.InfoWindow.InfoRequested({}, parent, fid);
};
