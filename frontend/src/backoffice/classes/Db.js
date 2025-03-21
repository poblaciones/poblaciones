import axios from 'axios';
import ActiveWork from '@/backoffice/classes/ActiveWork';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/framework/arr';
import date from '@/common/framework/date';
import f from '@/backoffice/classes/Formatter';
import Vue from 'vue';

export default Db;

function Db() {
	this.Works = [];
	this.WorksCache = {};
	this.SelectedWorkIndex = -1;
};

Db.prototype.BindDataset = function (datasetId) {
	var dataset = window.Context.CurrentWork.GetActiveDatasetById(parseInt(datasetId));
	if (dataset) {
			window.Context.CurrentDataset = dataset;
			dataset.Selected();
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

Db.prototype.RebindAndGeorreferenceLastDataset = function (router) {
	var loc = this;
	return this.RebindCurrentWork().then(function () {
		if (window.Context.CurrentWork.Datasets.length === 0) {
			return this.RebindAndFocusMetadataContent(router);
		}
		var newDataset = window.Context.CurrentWork.Datasets[window.Context.CurrentWork.Datasets.length - 1];
		window.Db.BindDataset(newDataset.properties.Id);
		newDataset.GeoreferenceOnce = true;
		router.push({ path: '/cartographies/' + window.Context.CurrentWork.properties.Id + '/datasets/' + newDataset.properties.Id + '/georeference' });
	});
};

Db.prototype.ServerClipboardCopy = function (text) {
	return axiosClient.postPromise(window.host + '/services/backoffice/ClipboardCopy',
		{ t: text}, 'copiar la información');
};

Db.prototype.ServerClipboardPaste = function (user) {
	return axiosClient.getPromise(window.host + '/services/backoffice/ClipboardPaste',
		{}, 'pegar la información');
};

Db.prototype.RebindCurrentWork = function () {
	var workId = window.Context.CurrentWork.properties.Id;
	const loc = this;
	const vue = Vue;
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

Db.prototype.GetWorkPreview = function (workId) {
	return axiosClient.getPromise(window.host + '/services/backoffice/GetWorkPreview',
		{ 'w': workId }, 'obtener la vista previa');
};

Db.prototype.PromoteExample = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/PromoteExample',
		{ w: workId }, 'crear ejemplo').then(function () {
			if (callback) {
				callback();
			}
		});
};


Db.prototype.HideExample = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/HideExample',
		{ w: workId }, 'ocultar ejemplo').then(function () {
			if (callback) {
				callback();
			}
		});
};

Db.prototype.DemoteExample = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/DemoteExample',
		{ w: workId }, 'quitar ejemplo').then(function () {
			if (callback) {
				callback();
			}
		});
};

Db.prototype.ArchiveWork = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/ArchiveWork',
		{ w: workId }, 'archivar la cartografía').then(function () {
			if (callback) {
				callback();
			}
		});
};

Db.prototype.UnarchiveWork = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/UnarchiveWork',
		{ w: workId }, 'desarchivar la cartografía').then(function () {
			if (callback) {
				callback();
			}
		});
};

Db.prototype.PromoteWork = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/PromoteWork',
		{ w: workId }, 'promover la cartografía').then(function () {
			if (callback) {
				callback();
			}
		});
};

Db.prototype.HideExample = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/HideExample',
		{ w: workId }, 'quitar el ejemplo').then(function () {
			if (callback) {
				callback();
			}
		});
};

Db.prototype.DemoteWork = function (workId, callback = null) {
	return axiosClient.postPromise(window.host + '/services/backoffice/DemoteWork',
		{ w: workId }, 'revoca la promoción de la cartografía').then(function () {
			if (callback) {
				callback();
			}
		});
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
		arr.Fill(window.Context.Cartographies, loc.Works);
		window.Context.CartographiesStarted = true;
	});
};

Db.prototype.SetUserSetting = function (key, value) {
	var prevValue = window.Context.User.Settings[key];
	if (window.Context.User.Settings[key] !== value) {
		window.Context.User.Settings[key] = value;
		return axiosClient.postPromise(window.host + '/services/backoffice/SetUserSetting',
			{ k: key, v: JSON.stringify(value) }, 'guardar la preferencia de usuario').catch(error => {
				window.Context.User.Settings[key] = prevValue;
				throw error;
			});
	}
};

Db.prototype.GetUserSetting = function (key, defaultValue) {
	var val = window.Context.User.Settings[key];
	if (val !== undefined) {
		return val;
	}
	return defaultValue;
};

Db.prototype.CreateWork = function (newWorkName, type) {
	// Guarda en el servidor lo que esté en this.properties.Metadata
	return axiosClient.getPromise(window.host + '/services/backoffice/CreateWork', {
			 'c': newWorkName, 't': type }, 'crear el elemento')
		.then(function (res) {
				res.Updated = date.FormateDateTime(new Date());
				res.UpdateUser = f.formatFullName(window.Context.User);
				res.DatasetCount = 0;
				res.MetricCount = 0;
				res.GeorreferencedCount = 0;
				res.Caption = newWorkName;
				res.MetadataLastOnline = null;
				res.PreviewId = null;

				window.Context.Cartographies.push(res);
				return res;
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

