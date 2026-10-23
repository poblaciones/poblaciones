import app from './moduleApp.js';
import axiosClient from '@/common/js/axiosClient';
import f from '@/backoffice/classes/Formatter';

export default AsyncCatalog;

function AsyncCatalog(url) {
	this.url = url;
	this.list = [];
	this.hasData = false;
	this.loading = false;
	this.notifyQueue = [];
}

AsyncCatalog.prototype.Refresh = function () {
	const loc = this;
	loc.loading = true;
	return axiosClient.getPromise(this.url,
		{}, 'consultar el listado de entidades').then(function (data) {
			loc.list = data;
			loc.hasData = true;
			loc.loading = false;
			var pending = loc.notifyQueue;
			loc.notifyQueue = [];
			for (var n = 0; n < pending.length; n++) {
				loc.resolve(pending[n].callback, pending[n].clone, pending[n].type);
			}
	}, function () {
		// getPromise ya informó el error al usuario. Se libera la carga para que
		// la próxima consulta reintente; la cola se conserva hasta que haya datos.
		loc.loading = false;
	});
};

// Expira el caché sin pedir nada todavía: la próxima llamada a Get/GetAll/
// GetCopy dispara un Refresh real. Pensado para usar tras un alta, baja o
// modificación de las entidades del catálogo, para no quedar sirviendo
// datos desactualizados.
AsyncCatalog.prototype.Invalidate = function () {
	this.hasData = false;
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
	if (!this.hasData && !this.loading) {
		this.Refresh();
	}
	if (this.loading === false) {
		this.resolve(callback, false, type);
	} else {
	// Tiene que esperar
	this.notifyQueue.push({ type: type, callback: callback });
	}
};

AsyncCatalog.prototype.GetCopy = function (type, callback) {
	if (!this.hasData && !this.loading) {
		this.Refresh();
	}
	if (this.loading === false) {
		this.resolve(callback, true, type);
	} else {
	// Tiene que esperar
	this.notifyQueue.push({ type: type, callback: callback, clone: true });
	}
};

AsyncCatalog.prototype.GetAll = function (callback) {
	if (!this.hasData && !this.loading) {
		this.Refresh();
	}
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
	if (!this.hasData && !this.loading) {
		this.Refresh();
	}
	this.GetAll(_resolve);
	return readyPromise;
};


AsyncCatalog.prototype.GetCopyPromise = function (type) {
	var loc = this;
	var _resolve;
	var readyPromise = new Promise(resolve => {
		_resolve = resolve;
	});
	if (!this.hasData && !this.loading) {
		this.Refresh();
	}
	this.GetCopy(type, _resolve);
	return readyPromise;
};
