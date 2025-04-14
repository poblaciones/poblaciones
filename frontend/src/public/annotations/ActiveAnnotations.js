
import arr from '@/common/framework/arr';
import axios from 'axios';


export default ActiveAnnotations;

function ActiveAnnotations(work) {
	this.Work = work;
	this.Lists = work.Annotations;
};

ActiveAnnotations.prototype.Refresh = function () {
};

