import app from './moduleApp.js';
import axiosClient from '@/common/js/axiosClient';
import err from '@/common/js/err';
import f from '@/backoffice/classes/Formatter';

export default AsyncCatalog;

function AsyncCatalog(url) {
	this.url = url;
	this.list = [];
	this.loading = false;
	this.notifyQueue = [];
}

AsyncCatalog.prototype.Refresh = function () {
	const loc = this;
	loc.loading = true;
	return axiosClient.getPromise(this.url,
		{}, 'consultar el listado de entidades').then(function (data) {
			loc.list = data;
			// procesa la cola
			for (var n = 0; n < loc.notifyQueue.length; n++) {
				var item = loc.notifyQueue[n];
				loc.resolve(item.callback, item.clone, item.key);
			}
			loc.notifyQueue = [];
			loc.loading = false;
	}).catch(function (error) {
		err.errDialog('Refresh', 'consultar el listado de entidades', error);
	});
};

AsyncCatalog.prototype.resolve = function (callback, clone, type) {
	if (type === undefined) {
		if (clone) {
			callback(f.clone(this.list));
		} else {
			callback(this.list);
		}
		return;
	}
	if (this.list[type] === undefined) {
		throw new Error('Element ' + type + ' is not defined in the catalog.');
	}
	var ret = this.list[type];
	if (clone) {
		ret = f.clone(ret);
	}
	callback(ret);
};

AsyncCatalog.prototype.Get = function (type, callback) {
	if (this.loading === false) {
		this.resolve(callback, false, type);
	} else {
	// Tiene que esperar
	this.notifyQueue.push({ type: type, callback: callback });
	}
};

AsyncCatalog.prototype.GetCopy = function (type, callback) {
	if (this.loading === false) {
		this.resolve(callback, true, type);
	} else {
	// Tiene que esperar
	this.notifyQueue.push({ type: type, callback: callback, clone: true });
	}
};

AsyncCatalog.prototype.GetAll = function (callback) {
	if (this.loading === false) {
		this.resolve(callback);
	} else {
	// Tiene que esperar
	this.notifyQueue.push({ callback: callback });
	}
};


AsyncCatalog.prototype.GetAllPromise = function () {
	var loc = this;
	var _resolve;
	var readyPromise = new Promise(resolve => {
		_resolve = resolve;
	});
	this.GetAll(_resolve);
	return readyPromise;
};


AsyncCatalog.prototype.GetCopyPromise = function (type) {
	var loc = this;
	var _resolve;
	var readyPromise = new Promise(resolve => {
		_resolve = resolve;
	});
	this.GetCopy(type, _resolve);
	return readyPromise;
};
