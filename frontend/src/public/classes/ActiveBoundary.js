import BoundariesComposer from '@/public/composers/BoundariesComposer';
import h from '@/public/js/helper';

export default ActiveBoundary;

function ActiveBoundary(data) {
	this.$Segment = null;
	this.index = -1;
	this.isBoundary = true;
	this.visible = true;
	this.opacity = .7;
	this.showDescriptions = true;
	this.properties = data;
	this.KillDuplicateds = false;
	this.colors = [{ Id: 1, Value: '#95a3c1' }];
};

ActiveBoundary.prototype.ResolveSegment = function () {
	this.$Segment = window.SegMap.Metrics.PatternsSegment;
};
ActiveBoundary.prototype.Visible = function () {
	return this.visible;
};

ActiveBoundary.prototype.GetStyleColorDictionary = function () {
	var ret = {};
	for (let i = 0; i < this.colors.length; i++) {
		ret[this.colors[i].Id] = this.colors[i].Value;
	}
	return ret;
};


ActiveBoundary.prototype.CurrentOpacity = function () {
	return this.opacity;
};

ActiveBoundary.prototype.UpdateRanking = function () {
};

ActiveBoundary.prototype.UpdateSummary = function () {
};

ActiveBoundary.prototype.GetStyleColorList = function() {
	var ret = [];
	for (let i = 0; i < this.colors.length; i++) {
		ret.push({
			cs: 'cs' + this.colors[i].Id,
			className: this.colors[i].Id, fillColor: this.colors[i].Value
		});
	}
	return ret;
};

ActiveBoundary.prototype.UpdateMap = function () {
	if (window.SegMap && this.$Segment !== null) {
		window.SegMap.Metrics.UpdateMetric(this);
		window.SegMap.SaveRoute.UpdateRoute();
	}
};

ActiveBoundary.prototype.ChangeVisibility = function () {
	this.visible = !this.visible;
	this.UpdateMap();
};

ActiveBoundary.prototype.CheckTileIsOutOfClipping = function() {
	return false;
};

ActiveBoundary.prototype.GetDataService = function (boundsRectRequired, seed) {
	// h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed)
	return { server: window.host, path: '/services/frontend/boundaries/GetBoundary', useStaticQueue: false };
};

ActiveBoundary.prototype.GetDataServiceParams = function (coord, boundsRectRequired) {
	var rev = window.SegMap.Signatures.Boundary;
	return h.getBoundaryParams(this, window.SegMap.frame, coord.x, coord.y, boundsRectRequired, rev);
};

ActiveBoundary.prototype.Show = function () {
	this.visible = true;
	window.SegMap.Metrics.UpdateMetric(this);
};

ActiveBoundary.prototype.Hide = function () {
	this.visible = false;
	window.SegMap.Metrics.Remove(this, true);
};

ActiveBoundary.prototype.UpdateLevel = function () {
	return false;
};

ActiveBoundary.prototype.Remove = function () {
	window.SegMap.Metrics.Remove(this);
};

ActiveBoundary.prototype.UpdateOpacity = function (zoom) {
	return;
};

ActiveBoundary.prototype.showText = function () {
	return true;
};

ActiveBoundary.prototype.GetPattern = function () {
	return 1;
};


ActiveBoundary.prototype.CreateComposer = function() {
	return new BoundariesComposer(window.SegMap.MapsApi, this);
};

ActiveBoundary.prototype.GetCartographyService = function () {
	return { url: null, revision: null };
};
