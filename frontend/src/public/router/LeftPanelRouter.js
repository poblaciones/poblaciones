import h from '@/public/js/helper';
import PanelType from '@/public/enums/PanelType';

export default LeftPanelRouter;

function LeftPanelRouter() {
};

LeftPanelRouter.prototype.GetSettings = function() {
	return {
		blockSignature: 'p=',
		startChar: null,
		endChar: null,
		groupSeparator: null,
		itemSeparator: '!',
		useKeyValue: true
	};
};

LeftPanelRouter.prototype.ToRoute = function () {
	var vals = [];

	if (window.Panels.Left.hasContent) {
		vals.push(['c', (window.Panels.Left.collapsed ? 1 : 0), 0]);
		vals.push(['f', (window.Panels.Left.isFullFront ? 1 : 0), 0]);
		if(window.Panels.Left.Full !== null) {
			this.toValues(vals, 'f', window.Panels.Left.Full);
		}
		if(window.Panels.Left.Top !== null) {
			this.toValues(vals, 't', window.Panels.Left.Top);
		}
		if(window.Panels.Left.Bottom !== null) {
			this.toValues(vals, 'b', window.Panels.Left.Bottom);
		}
	}
	return vals;
};

LeftPanelRouter.prototype.FromRoute = function (args) {
	let ft = h.getSafeValue(args, 'ft', PanelType.None);
	let tt = h.getSafeValue(args, 'tt', PanelType.None);
	let bt = h.getSafeValue(args, 'bt', PanelType.None);
	window.Panels.Left.isFullFront = h.getSafeValueBool(args, 'f', false);

	//El orden importa para ver cuál
	//queda arriba
	if(window.Panels.Left.isFullFront) {
		if(tt !== PanelType.None) {
			this.fromValues(args, 't');
		}
		if(bt !== PanelType.None) {
			this.fromValues(args, 'b');
		}
		if(ft !== PanelType.None) {
			this.fromValues(args, 'f');
		}
	} else {
		if(ft !== PanelType.None) {
			this.fromValues(args, 'f');
		}
		if(tt !== PanelType.None) {
			this.fromValues(args, 't');
		}
		if(bt !== PanelType.None) {
			this.fromValues(args, 'b');
		}
	}

	window.Panels.Left.collapsed = h.getSafeValueBool(args, 'c', false);
};

LeftPanelRouter.prototype.toValues = function (vals, prefix, panel) {
	vals.push([prefix + 't', panel.panelType, PanelType.None]);
	vals.push([prefix + 'f', panel.fid, 0]);
	vals.push([prefix + 'l', panel.parent.MetricId, 0]);
	vals.push([prefix + 'a', panel.parent.LevelId, 0]);
	vals.push([prefix + 'v', panel.parent.MetricVersionId, 0]);
	vals.push([prefix + 'i', panel.detailIndex, null]);
	// vals.push([prefix + 'x', panel.position.Coordinates.Lat, 0]);
	// vals.push([prefix + 'y', panel.position.Coordinates.Lon, 0]);
};

LeftPanelRouter.prototype.fromValues = function (args, prefix, type) {
	let parent = {
		MetricId: h.getSafeValue(args, prefix + 'l', 0),
		LevelId: h.getSafeValue(args, prefix + 'a', 0),
		MetricVersionId: h.getSafeValue(args, prefix + 'v', 0),
	};
	let fid = h.getSafeValue(args, prefix + 'f', 0);
	window.SegMap.InfoRequested({}, parent, fid, 0);

	if(type == PanelType.ListPanel) {
		let val = h.getSafeValue(args, prefix + 'i', null);
		if(prefix == 'f') {
			window.Panel.Left.Full.detailIndex = val;
		}
		if(prefix == 't') {
			window.Panel.Left.Top.detailIndex = val;
		}
		if(prefix == 'b') {
			window.Panel.Left.Bottom.detailIndex = val;
		}
	}
};

