import BoundariesComposer from '@/map/composers/BoundariesComposer';

import h from '@/map/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';
import ActiveBoundary from './ActiveBoundary';

export default ActiveBaseBoundary;

function ActiveBaseBoundary(data) {
	ActiveBoundary.call(this, data);
	this.isBaseMetric = true;
	this.dynamicWidth = false;
	this.dashedLine = false;
	this.lineWidth = 2;
};

ActiveBaseBoundary.prototype = new ActiveBoundary();

ActiveBaseBoundary.prototype.Show = function () {
	this.properties.Visible = true;
	window.SegMap.Metrics.InsertNonStandardMetric(this, -1);
};

ActiveBaseBoundary.prototype.Hide = function () {
	this.properties.Visible = false;
	window.SegMap.Metrics.Remove(this, true);
};
