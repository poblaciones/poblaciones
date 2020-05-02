import LabelsComposer from '@/public/composers/LabelsComposer';
import h from '@/public/js/helper';

export default ActiveLabels;

function ActiveLabels(config) {
	this.$Segment = null;
	this.index = -1;
	this.isBaseMetric = true;
	this.visible = true;
	this.KillDuplicateds = false;
	if (config.Blocks.UseTileBlocks) {
		this.blockSize = config.Blocks.LabelsBlockSize;
	} else {
		this.blockSize = null;
	}
};

ActiveLabels.prototype.ResolveSegment = function () {
	this.$Segment = window.SegMap.Metrics.LabelsSegment;
};
ActiveLabels.prototype.Visible = function () {
	return this.visible;
};

ActiveLabels.prototype.UpdateMap = function () {
	if (window.SegMap && this.$Segment !== null) {
		window.SegMap.Metrics.UpdateMetric(this);
	}
};

ActiveLabels.prototype.CheckTileIsOutOfClipping = function() {
	return false;
};

ActiveLabels.prototype.UseBlockedRequests = function (boundsRectRequired) {
	return this.blockSize && !boundsRectRequired;
};

ActiveLabels.prototype.GetDataService = function (boundsRectRequired) {
	if (this.UseBlockedRequests(boundsRectRequired)) {
		return 'clipping/GetBlockLabels';
	} else {
		return 'clipping/GetLabels';
	}
};

ActiveLabels.prototype.GetDataServiceParams = function (coord, boundsRectRequired) {
	var rev = window.SegMap.Revisions.BigLabels;
	if (coord.z >= window.SegMap.Revisions.SmallLabelsFrom) {
		rev += '_' + window.SegMap.Revisions.SmallLabels;
	}
	if (this.UseBlockedRequests(boundsRectRequired)) {
		return h.getBlockLabelsParams(window.SegMap.frame, coord.x, coord.y, boundsRectRequired, rev, this.blockSize);
	} else {
		return h.getLabelsParams(window.SegMap.frame, coord.x, coord.y, boundsRectRequired, rev);
	}
};

ActiveLabels.prototype.GetSubset = function (coord, boundsRectRequired) {
	if (this.UseBlockedRequests(boundsRectRequired)) {
		return [coord.x, coord.y];
	} else {
		return null;
	}
};

ActiveLabels.prototype.Show = function () {
	this.visible = true;
	window.SegMap.Metrics.UpdateMetric(this);
};

ActiveLabels.prototype.Hide = function () {
	this.visible = false;
	window.SegMap.Metrics.Remove(this, true);
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

ActiveLabels.prototype.GetCartographyService = function () {
	return { url: null, revision: null };
};


