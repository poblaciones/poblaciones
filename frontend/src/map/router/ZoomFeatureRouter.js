import h from '@/map/js/helper';
import PanelType from '@/map/enums/PanelType';

export default ZoomFeatureRouter;

function ZoomFeatureRouter() {
};

ZoomFeatureRouter.prototype.GetSettings = function() {
	return {
		blockSignature: 'j=',
		startChar: null,
		endChar: null,
		groupSeparator: null,
		itemSeparator: '!',
		useKeyValue: true
	};
};

ZoomFeatureRouter.prototype.ToRoute = function () {
	return null;
	//vals.push(['f', key.Id]);
};

ZoomFeatureRouter.prototype.FromRoute = function (args) {
	if (!args) {
		return;
	}
	var clippingRegionId = h.getSafeValueInt(args, 'r', null);
	if (clippingRegionId) {
		window.SegMap.Clipping.SetClippingRegion(clippingRegionId, true, false);
	}
};
