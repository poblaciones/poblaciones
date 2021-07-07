import h from '@/public/js/helper';
import arr from '@/common/framework/arr';

export default Queue;

function Queue(max) {
	this.id = 0;
	this.queue = [];
	this.onceNotificationIdle = [];
	this.runningRequests = 0;
	this.maxRequests = max;
	if (max <= 0) max = 10000;
}

Queue.prototype.RequestOnceNotificationIdle = function () {
	var targetCall;
	var readyPromise = new Promise(resolve => {
		targetCall = resolve;
	});
	this.onceNotificationIdle.push(targetCall);
	this.CheckQueueIdle();
	return readyPromise;
};

Queue.prototype.CheckQueueIdle = function () {
	if (this.runningRequests === 0 && this.queue.length === 0) {
		for (var n = 0; n < this.onceNotificationIdle.length; n++) {
			this.onceNotificationIdle[n]();
		}
		this.onceNotificationIdle = [];
	}
};

Queue.prototype.Enlist = function (context, callback, params, idSetter, info) {
	if (this.id > 100000000) { this.id = 1; }
	var id = ++this.id;
	idSetter(id);
	this.queue.push({ id: id, context: context, call: callback, params: params, info: info, running: false });
	this.startOne();
};

Queue.prototype.startOne = function () {
	if (this.runningRequests >= this.maxRequests) {
		return;
	}
	for (var n = 0; n < this.queue.length; n++) {
		var queueItem = this.queue[n];
		if (queueItem.running === false) {
			queueItem.running = true;
			this.runningRequests++;
			var params = queueItem.params;
			if (Array.isArray(queueItem.params)) {
				params = params.unshift(this);
			} else {
				params = [this, params];
			}
			queueItem.call.apply(queueItem.context, params);
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
			this.CheckQueueIdle();
		}
	}
};

Queue.prototype.GetSameRequest = function (info) {
	for (var n = 0; n < this.queue.length; n++) {
		var queueItem = this.queue[n];
		if (queueItem.info === info) {
			return queueItem.context;
		}
	}
	return null;
};

