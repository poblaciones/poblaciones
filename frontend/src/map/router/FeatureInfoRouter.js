import h from '@/map/js/helper';
import PanelType from '@/map/enums/PanelType';

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
		MetricId: h.getSafeValueInt(args, 'l', null),
		VariableId: h.getSafeValueInt(args, 'v', null),
		Exceptions: h.getSafeValue(args, 'x', null)
	};
	//let fid = h.getSafeValueInt(args, 'f', null);
	let fid = h.getSafeValue(args, 'f', null);
	if (fid && fid.startsWith('[@')) {
		// soporte para rutas viejas
		fid = fid.replace('[@', '').replace('@]', '');
	};
	if (fid !== null) {
		fid = parseInt(fid);
	}
	window.SegMap.InfoWindow.InfoRequested({}, parent, fid);
};
