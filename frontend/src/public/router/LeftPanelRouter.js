import h from '@/public/js/helper';

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
	var leftPanelStates = [];

	if (window.Panels.Left.open) {
		leftPanelStates.push(['c', (window.Panels.Left.collapsed ? 1 : 0), 0]);
	}
	return leftPanelStates;
};

LeftPanelRouter.prototype.FromRoute = function (args) {
	window.Panels.Left.collapsed = h.getSafeValueBool(args, 'c', false);
};
