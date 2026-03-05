import BoundariesComposer from '@/map/composers/BoundariesComposer';

import h from '@/map/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';

export default ActiveCatalog;


function ActiveCatalog() {
	this.Metrics = [];
	this.Boundaries = [];
};

ActiveCatalog.prototype.Receive = function (info) {
	arr.Fill(this.Metrics, info.Metrics);
	arr.Fill(this.Boundaries, info.Boundaries);
};
