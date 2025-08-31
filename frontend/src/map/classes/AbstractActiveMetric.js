export default AbstractActiveMetric;

function AbstractActiveMetric(selectedMetric) {
	// IMPLEMENT
	this.objs = {};
	this.objs.Segment = null;
	this.index = -1;
	this.isBaseMetric = true;
	this.KillDuplicateds = false;
};
AbstractActiveMetric.prototype.showText = function () {
	// IMPLEMENT
};

AbstractActiveMetric.prototype.CheckTileIsOutOfClipping = function() {
	// IMPLEMENT
};

AbstractActiveMetric.prototype.GetPattern = function () {
	// IMPLEMENT
};

AbstractActiveMetric.prototype.CreateComposer = function() {
  // IMPLEMENT
};

AbstractActiveMetric.prototype.GetCartographyService = function () {
	// IMPLEMENT
};

AbstractActiveMetric.prototype.GetDataService = function () {
	// IMPLEMENT
};

