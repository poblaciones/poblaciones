import LabelsComposer from '@/map/composers/LabelsComposer';
import h from '@/map/js/helper';

export default ActiveLabels;

function ActiveLabels(config) {
	this.objs = {};
	this.objs.Segment = null;
	this.index = -1;
	this.isBaseMetric = true;
	this.visible = true;
	this.KillDuplicateds = false;
	if (config.Blocks.UseLabelTileBlocks) {
		this.blockSize = config.Blocks.LabelsBlockSize;
	} else {
		this.blockSize = null;
	}
};

ActiveLabels.prototype.ResolveSegment = function () {
	this.objs.Segment = window.SegMap.Metrics.LabelsSegment;
};
ActiveLabels.prototype.Visible = function () {
	return this.visible;
};

ActiveLabels.prototype.UpdateMap = function () {
	if (window.SegMap && this.objs.Segment !== null) {

		window.SegMap.Metrics.UpdateMetric(this);
	}
};

ActiveLabels.prototype.CheckTileIsOutOfClipping = function() {
	return false;
};

ActiveLabels.prototype.UseBlockedRequests = function () {
	return this.blockSize;
};

ActiveLabels.prototype.useTiles = function () {
	return true;
};

ActiveLabels.prototype.GetDataService = function (seed) {
	if (this.UseBlockedRequests()) {
		return { server: h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed / this.blockSize), path: '/services/frontend/clipping/GetBlockLabels', useStaticQueue: true };
	} else {
		return { server: h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed), path: '/services/frontend/clipping/GetLabels', useStaticQueue: true };
	}
};

ActiveLabels.prototype.GetDataServiceParams = function (coord) {
	var rev = window.SegMap.Signatures.BigLabels;
	if (coord.z >= window.SegMap.Signatures.SmallLabelsFrom) {
		rev = parseInt(rev) + 100000 * parseInt(window.SegMap.Signatures.SmallLabels);
	}
	var suffix = window.SegMap.Signatures.Suffix;
	if (this.UseBlockedRequests()) {
		return h.getBlockLabelsParams(window.SegMap.frame, coord.x, coord.y, rev, suffix, this.blockSize);
	} else {
		return h.getLabelsParams(window.SegMap.frame, coord.x, coord.y, rev, suffix);
	}
};

ActiveLabels.prototype.GetSubset = function (coord) {
	if (this.UseBlockedRequests()) {
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


