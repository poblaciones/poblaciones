import LabelsComposer from '@/public/composers/LabelsComposer';
import h from '@/public/js/helper';

export default ActiveLabels;

function ActiveLabels(selectedMetric) {
	this.$Segment = null;
	this.index = -1;
	this.isBaseMetric = true;
	this.KillDuplicateds = false;
};

ActiveLabels.prototype.ResolveSegment = function () {
	this.$Segment = window.SegMap.Metrics.LabelsSegment;
};
ActiveLabels.prototype.Visible = function () {
	return true;
};

ActiveLabels.prototype.UpdateMap = function () {
	if (window.SegMap && this.$Segment !== null) {
		window.SegMap.Metrics.UpdateMetric(this);
	}
};

ActiveLabels.prototype.CheckTileIsOutOfClipping = function() {
	return false;
};

ActiveLabels.prototype.getDataServiceParams = function (coord, boundsRectRequired) {
	return h.getLabelsParams(window.SegMap.frame, coord.x, coord.y, boundsRectRequired);
};

ActiveLabels.prototype.UpdateOpacity = function (zoom) {
	return;
};

ActiveLabels.prototype.showText = function () {
	return true;
};

ActiveLabels.prototype.GetPattern = function () {
	return '0';
};


ActiveLabels.prototype.CreateComposer = function() {
	return new LabelsComposer(window.SegMap.MapsApi, this);
};

ActiveLabels.prototype.GetCartoService = function () {
	return { url: null, useDatasetId: false };
};

ActiveLabels.prototype.GetDataService = function () {
	return 'clipping/GetLabels';
};

