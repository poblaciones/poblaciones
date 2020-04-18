import axios from 'axios';
import ActiveWork from '@/backoffice/classes/ActiveWork';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/js/arr';
import Vue from 'vue';

export default Db;

function Db() {
	this.Works = [];
	this.WorksCache = {};
	this.SelectedWorkIndex = -1;
};

Db.prototype.BindDataset = function (datasetId) {
	for (var i = 0; i < window.Context.CurrentWork.Datasets.length; i++) {
		if (parseInt(datasetId) === window.Context.CurrentWork.Datasets[i].properties.Id) {
			window.Context.CurrentDataset = window.Context.CurrentWork.Datasets[i];
			window.Context.CurrentDataset.Selected();
			break;
		}
	}
};

Db.prototype.ReleaseWork = function (workId) {
	if (this.WorksCache[workId]) {
		delete this.WorksCache[workId];
	}
};

Db.prototype.BindWork = function (workId) {
	const loc = this;
	if (workId in loc.WorksCache) {
		window.Context.CurrentWork = loc.WorksCache[workId];
		var _resolve;
		var readyPromise = new Promise(resolve => {
			_resolve = resolve;
		});
		Vue.nextTick(() => {
			_resolve();
		});
		return readyPromise;
	}
	return axiosClient.getPromise(window.host + '/services/backoffice/GetWorkInfo', { w: workId },
		'consultar la cartografía').then(function (data) {
		loc.ReceiveCurrentWork(data);
	});
};

Db.prototype.RebindAndFocusMetadataContent = function (router) {
	var loc = this;
	return this.RebindCurrentWork().then(function () {
		router.push({ path: '/cartographies/' + window.Context.CurrentWork.properties.Id + '/content' });
	});
};

Db.prototype.RebindAndFocusLastDataset = function (router) {
	var loc = this;
	return this.RebindCurrentWork().then(function () {
		if (window.Context.CurrentWork.Datasets.length === 0) {
			return this.RebindAndFocusMetadataContent(router);
		}
		var newDataset = window.Context.CurrentWork.Datasets[window.Context.CurrentWork.Datasets.length - 1];
		window.Db.BindDataset(newDataset.properties.Id);
		router.push({ path: '/cartographies/' + window.Context.CurrentWork.properties.Id + '/datasets/' + newDataset.properties.Id });
	});
};

Db.prototype.RebindCurrentWork = function () {
	return window.Db.ReBindWork(window.Context.CurrentWork.properties.Id);
};

Db.prototype.ServerClipboardCopy = function (text) {
	return axiosClient.postPromise(window.host + '/services/backoffice/ClipboardCopy',
		{ t: text}, 'copiar la información');
};

Db.prototype.ServerClipboardPaste = function (user) {
	return axiosClient.getPromise(window.host + '/services/backoffice/ClipboardPaste',
		{}, 'pegar la información');
};

Db.prototype.UpdateWorkIndexing = function (item) {
	return axiosClient.getPromise(window.host + '/services/admin/UpdateWorkIndexing',
		{ w: item.Id, v: (item.IsIndexed ? '1' : '0') }, 'cambiar la indexación de la obra');
};

Db.prototype.UpdateWorkSegmentedCrawling = function (item) {
	return axiosClient.getPromise(window.host + '/services/admin/UpdateWorkSegmentedCrawling',
		{ w: item.Id, v: (item.SegmentedCrawling ? '1' : '0') }, 'cambiar el tipo indexación de la obra');
};

Db.prototype.GetClippingRegions = function () {
	return axiosClient.getPromise(window.host + '/services/admin/GetClippingRegions',
		{}, 'obtener la lista de regiones');
};
Db.prototype.GetUsers = function () {
	return axiosClient.getPromise(window.host + '/services/admin/GetUsers',
			{ }, 'obtener la lista de usuarios');
};

Db.prototype.GetWorks = function (filter, timeFilter) {
	return axiosClient.getPromise(window.host + '/services/admin/GetWorks',
			{ f: filter, t: timeFilter }, 'obtener la lista de cartografías');
};

Db.prototype.DeleteUser = function (user, callback) {
	return axiosClient.getPromise(window.host + '/services/admin/DeleteUser',
		{ u: user.Id }, 'eliminar al usuario').then(function () {
			callback();
		});
};

Db.prototype.UpdateClippingRegion = function (region) {
	return axiosClient.postPromise(window.host + '/services/admin/UpdateClippingRegion',
		{ r: region }, 'actualizar la región').then(function () {

		});
};

Db.prototype.UpdateUser = function (user, password, verification) {
	return axiosClient.postPromise(window.host + '/services/admin/UpdateUser',
		{ u: user, p: password, v: verification }, 'actualizar al usuario').then(function () {

		});
};

Db.prototype.LoginAs = function (user) {
	return axiosClient.getPromise(window.host + '/services/admin/LoginAs',
			{ u: user.Id }, 'ingresar como el usuario indicado');
};

Db.prototype.ReBindWork = function (workId) {
	const loc = this;
	this.ReleaseWork(workId);

	return axiosClient.getPromise(window.host + '/services/backoffice/GetWorkInfo',
			{ w: workId }, 'consultar la cartografía').then(function (workData) {
				loc.ReceiveCurrentWork(workData);
	});
};

Db.prototype.ReceiveCurrentWork = function (workData) {
	var workDataId = workData.Work.Id;
	// Si otro la trajo al caché, usa esa
	var work;
	if (workDataId in this.WorksCache) {
		work = this.WorksCache[workDataId];
	} else {
		work = new ActiveWork(workData, window.Context.Cartographies);
	}
	window.Context.CurrentWork = work;
	document.title = 'Poblaciones - ' + work.properties.Metadata.Title;
	this.WorksCache[workDataId] = work;
};

Db.prototype.GetStartWorkCloneUrl = function (workId, newName) {
	return window.host + '/services/backoffice/StartCloneWork?w=' + workId + '&n=' + encodeURIComponent(newName);
};

Db.prototype.GetStepWorkCloneUrl = function () {
	return window.host + '/services/backoffice/StepCloneWork';
};


Db.prototype.GetStartWorkDeleteUrl = function (workId) {
	return window.host + '/services/backoffice/StartDeleteWork?w=' + workId;
};

Db.prototype.GetStepWorkDeleteUrl = function () {
	return window.host + '/services/backoffice/StepDeleteWork';
};

Db.prototype.GetStartWorkPublishUrl = function (workId) {
	return window.host + '/services/backoffice/StartPublishWork?w=' + workId;
};

Db.prototype.GetStepWorkPublishUrl = function () {
	return window.host + '/services/backoffice/StepPublishWork';
};

Db.prototype.GetStartWorkRevokeUrl = function (workId) {
	return window.host + '/services/backoffice/StartRevokeWork?w=' + workId;
};

Db.prototype.GetStepWorkRevokeUrl = function () {
	return window.host + '/services/backoffice/StepRevokeWork';
};


Db.prototype.LoadWorks = function () {
	const loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/GetCurrentUserWorks',
		 {}, 'acceder al catálogo de datos disponibles').then(function (data) {
		// las pone en el array
		loc.Works = [];
		for (var i = 0; i < data.length; i++) {
			loc.Works.push(data[i]);
		}
		loc.SelectedWorkIndex = (loc.Works.length === 0 ? -1 : 0);
		arr.Clear(window.Context.Cartographies);
		arr.AddRange(window.Context.Cartographies, loc.Works);
		window.Context.CartographiesStarted = true;
	});
};

Db.prototype.CreateWork = function (newWorkName, type) {
	// Guarda en el servidor lo que esté en this.properties.Metadata
	return axiosClient.getPromise(window.host + '/services/backoffice/CreateWork', {
			 'c': newWorkName, 't': type }, 'crear el elemento')
		.then(function (res) {
				res.DatasetCount = 0;
				res.MetricCount = 0;
				res.GeorreferencedCount = 0;
				res.Caption = newWorkName;
				res.MetadataLastOnline = null;
				window.Context.Cartographies.push(res);
	});
};

Db.prototype.RenameWork = function (workId, newName) {
	for (var n = 0; n < window.Context.Cartographies.length; n++) {
		if (window.Context.Cartographies[n].Id === workId) {
			window.Context.Cartographies[n].Caption = newName;
			break;
		}
	}
};

