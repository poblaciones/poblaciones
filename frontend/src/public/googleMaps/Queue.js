import h from '@/public/js/helper';
import arr from '@/common/js/arr';

export default Queue;

const MAX_REQUESTS = 5;

function Queue() {
	this.id = 0;
	this.queue = [];
	this.runningRequests = 0;
}

Queue.prototype.Enlist = function (context, callback, params, idSetter, info) {
	if (this.id > 100000000) { this.id = 1; }
	var id = ++this.id;
	idSetter(id);
	this.queue.push({ id: id, context: context, call: callback, params: params, info: info, running: false });
	this.startOne();
};

Queue.prototype.startOne = function () {
	if (this.runningRequests >= MAX_REQUESTS) {
		return;
	}
	for (var n = 0; n < this.queue.length; n++) {
		var queueItem = this.queue[n];
		if (queueItem.running === false) {
			queueItem.running = true;
			this.runningRequests++;
			queueItem.call.apply(queueItem.context, queueItem.params);
			// se fija si debe iniciar otros
			this.startOne();
			break;
		}
	}
};

Queue.prototype.Release = function (id) {
	for (var n = 0; n < this.queue.length; n++) {
		var queueItem = this.queue[n];
		if (queueItem.id === id) {
			arr.RemoveAt(this.queue, n);
			if (queueItem.running) {
				// Lo marca como apagado e inicia otro
				queueItem.running = false;
				this.runningRequests--;
				if (this.runningRequests < 0) {
					console.error(this.runningRequests + ' requests.');
				}
				this.startOne();
			}
		}
	}
};
