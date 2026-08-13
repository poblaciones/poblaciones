import BoundariesComposer from '@/map/composers/BoundariesComposer';

import h from '@/map/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';
import ActiveMetric from './ActiveMetric';

export default ActiveBaseMetric;

ActiveBaseMetric.DEFAULT_COLOR = '#95a3c1';

function ActiveBaseMetric(selectedMetric) {
	ActiveMetric.call(this, selectedMetric);
	this.objs.Segment = null;
	this.isBaseMetric = true;
	this.dynamicWidth = false;
	this.aliases = [];
	this.showInMapLabels = false;
	this.lightInMapLabels = false;
	this.lineWidth = 2;
	this.color = ActiveBaseMetric.DEFAULT_COLOR;
};

ActiveBaseMetric.prototype = new ActiveMetric();

ActiveBaseMetric.prototype.useTiles = function () {
	return false;
};

ActiveBaseMetric.prototype.GetDataService = function (seed) {
	return null;
};

ActiveBaseMetric.prototype.Remove = function () {
	window.SegMap.Session.Content.RemoveBaseMetric(this.properties.Metric.Id);
	window.SegMap.Metrics.Remove(this);
};

ActiveBaseMetric.prototype.UpdateOpacity = function (zoom) {
	return;
};

ActiveBaseMetric.prototype.GetCartographyService = function () {
	return {};
};

ActiveBaseMetric.prototype.Show = function () {
	this.visible = true;
	window.SegMap.Metrics.UpdateMetric(this);
};

ActiveBaseMetric.prototype.Hide = function () {
	this.visible = false;
	window.SegMap.Metrics.Remove(this, true);
};
