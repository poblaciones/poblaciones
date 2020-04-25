import axios from 'axios';
import ActiveDataset from '@/backoffice/classes/ActiveDataset';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/js/arr';
import AsyncCatalog from './AsyncCatalog';
import Vue from 'vue';

export default ActiveWork;

function ActiveWork(workInfo, workListMetadata) {
	this.properties = workInfo.Work;
	this.Datasets = [];
	this.Bounded = false;
	this.pendingChanges = 0;
	Vue.set(this, "pendingChanges", 0);
	this.Sources = workInfo.Sources;
	this.MetricVersions = new AsyncCatalog(window.host + '/services/backoffice/GetWorkMetricVersions?w=' + workInfo.Work.Id);
	this.MetricVersions.Refresh();
	this.Files = workInfo.Files;
	this.Permissions = workInfo.Permissions;
	this.Startup = workInfo.Startup;
	this.ExtraMetrics = workInfo.ExtraMetrics;
	this.workListMetadata = workListMetadata;
	if (workInfo.Datasets) {
		for (var i = 0; i < workInfo.Datasets.length; i++) {
			this.Datasets[i] = new ActiveDataset(this, workInfo.Datasets[i]);
		}
	} else {
		this.Datasets[i] = [];
	}

	this.SelectedDatasetIndex = -1;
	if (workInfo.Datasets !== undefined) {
		this.SelectedDatasetIndex = (workInfo.Datasets.length === 0 ? -1 : 0);
	}
};

ActiveWork.prototype.CreateNewDataset = function (caption) {
	let url = window.host + '/services/backoffice/CreateDataset';
	this.WorkChanged();
	return axiosClient.getPromise(url, { 'w': this.properties.Id, 't': caption },
		'crear el dataset').then(function (data) {
			window.Db.LoadWorks();
			return data;
		});
};

ActiveWork.prototype.ContainsSource = function (source) {
	for (var i = 0; i < this.Sources.length; i++) {
		if (this.Sources[i].Id === source.Id) {
			return true;
		}
	}
	return false;
};

ActiveWork.prototype.IsPublicData = function () {
	return (this.properties ? this.properties.Type === 'P' : false);
};

ActiveWork.prototype.ThisWorkLabel = function () {
	if (this.IsPublicData()) {
		return 'estos datos públicos';
	} else {
		return 'esta cartografía';
	}
};

ActiveWork.prototype.CanEdit = function () {
	if (window.Context.User.Privileges === 'A' ||
		(this.IsPublicData() && window.Context.User.Privileges === 'E')) {
		return true;
	}
	for (var i = 0; i < this.Permissions.length; i++) {
		if (this.Permissions[i].User.Email === window.Context.User.User
			&& this.Permissions[i].Permission !== 'V') {
			return true;
		}
	}
	return false;
};

ActiveWork.prototype.HasChanges = function () {
	return this.pendingChanges || this.properties.Metadata.LastOnline === null ||
		this.properties.MetadataChanged || this.properties.DatasetLabelsChanged ||
		this.properties.DatasetDataChanged || this.properties.MetricLabelsChanged ||
		this.properties.MetricDataChanged;
};

ActiveWork.prototype.GetMetricsList = function () {
	// Trae sus variables
	var args = { 'w': this.properties.Id };
	return axiosClient.getPromise(window.host + '/services/backoffice/GetWorkMetricsList', args,
		'obtener la lista de métricas');
};

ActiveWork.prototype.CanAdmin = function () {
	if (window.Context.User.Privileges === 'A') {
		return true;
	}
	for (var i = 0; i < this.Permissions.length; i++) {
		if (this.Permissions[i].User.Email === window.Context.User.User && this.Permissions[i].Permission === 'A') {
			return true;
		}
	}
	return false;
};


ActiveWork.prototype.IsLastAdministrator = function (item) {
	if (item.Permission !== 'A') {
		return false;
	}
	for (var i = 0; i < this.Permissions.length; i++) {
		if (this.Permissions[i] !== item && this.Permissions[i].Permission === 'A') {
			return false;
		}
	}
	return true;
};

ActiveWork.prototype.SelectedDataset = function () {
	if (this.SelectedDatasetIndex !== -1) {
		return this.Datasets[this.SelectedDatasetIndex];
	} else {
		return null;
	}
};

ActiveWork.prototype.GetStartWorkTestUrl = function () {
	return window.host + '/services/backoffice/StartTestWork?w=' + this.properties.Id;
};

ActiveWork.prototype.GetStepWorkTestUrl = function () {
	return window.host + '/services/backoffice/StepTestWork';
};

ActiveWork.prototype.GetUploadUrl = function () {
	return window.host + '/services/backoffice/UploadFile';
};


ActiveWork.prototype.GetCreateFileUrl = function (bucketId) {
	return window.host + '/services/backoffice/PostImportChunk?b=' + bucketId;
};

ActiveWork.prototype.GetDatasetFileImportUrl = function (keepLabels) {
	return window.host + '/services/backoffice/Dataset/CreateMultiImportFile?k=' + (keepLabels ? '1' : 0);
};

ActiveWork.prototype.GetStepDatasetFileImportUrl = function () {
	return window.host + '/services/backoffice/Dataset/StepMultiImportFile';
};

ActiveWork.prototype.GetHighestLevelForVersion = function(metricVersion) {
	// Encuentra el level
	var loc = this;
	return this.MetricVersions.GetAllPromise().then(
		function (allVersions) {
			var level = loc.GetLevelToUse(allVersions, metricVersion);
			// Trae sus variables
			var args = { 'w': loc.properties.Id, l: level.Id };
			return axiosClient.getPromise(window.host + '/services/backoffice/GetMetricVersionLevelVariables', args,
				'obtener variables del nivel').then(function (data) {
					level.Variables = data;
					return level;
				});
		});
};

ActiveWork.prototype.GetLevelToUse = function (allVersions, metricVersion) {
	// de MetricVersions
	var ret = null;
	for (var v = 0; v < allVersions.length; v++) {
		var mv = allVersions[v];
		// Todo es del work actual
		for (var l = 0; l < mv.Levels.length; l++) {
			var lv = mv.Levels[l];
			if (lv.MetricVersion.Id === metricVersion.Id) {
				// Es uno de los posibles
				ret = lv;
			}
		}
	}
	if (ret !== null) {
		return ret;
	} else {
		throw new Error('No se ha encontrado el nivel para este indicador.');
	}
};

ActiveWork.prototype.UpdateInstitution = function (institution, container) {
	var args = { 'w': this.properties.Id, 'i': institution };
	var loc = this;
	this.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateInstitution', args,
		'actualizar la institución').then(function (savedInstitution) {
			// se fija si tiene que actualizar el institution
			container.Institution = savedInstitution;
			window.Context.Institutions.Refresh();
		});
};

ActiveWork.prototype.UpdateSource = function (source) {
	var args = { 'w': this.properties.Id, 's': source };
	var loc = this;
	this.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateWorkSource', args,
		'actualizar la fuente').then(function (savedSource) {
			// se fija si tiene que actualizar el institution
			if (source.Id === null || source.Id === 0) {
				// lo agrega en la lista
				loc.Sources.push(savedSource);
				window.Context.Sources.Refresh();
			} else {
				// actualiza en sources
				for (var n = 0; n < loc.Sources.length; n++) {
					if (loc.Sources[n].Id === savedSource.Id) {
						Vue.set(loc.Sources, n, savedSource);
						break;
					}
				}
				// verifica institution
				if (source.Institution !== null && (source.Institution.Id === 0 || source.Institution.Id === null)) {
					source.Institution.Id = savedSource.Institution.Id;
				}
				// actualiza el padrón general
				window.Context.Sources.Refresh();
			}
		});
};

ActiveWork.prototype.AppendExtraMetric = function (metric) {
	var args = { 'w': this.properties.Id, 'm': metric.Id };
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/AppendExtraMetric', args,
		'agregar el indicador adicional');
};

ActiveWork.prototype.UpdateExtraMetricStart = function (metric) {
	var args = { 'w': this.properties.Id, 'm': metric.Id, 'a': (metric.StartActive ? 1 : 0) };
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/UpdateExtraMetricStart', args,
		'actualizar el indicador adicional');
};

ActiveWork.prototype.RemoveExtraMetric = function (metric) {
	var args = { 'w': this.properties.Id, 'm': metric.Id };
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/RemoveExtraMetric', args,
		'remover el indicador adicional');
};

ActiveWork.prototype.UpdateStartup = function () {
	var args = { 'w': this.properties.Id, 's': this.properties.Startup };
	this.WorkChanged();
	// Guarda en el servidor lo que esté en this.properties.Startup
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateStartup', args,
		'actualizar los atributos de inicio');
};


ActiveWork.prototype.UpdateMetadata = function () {
	var args = { 'w': this.properties.Id, 'm': this.properties.Metadata };
	this.WorkChanged();
	// Guarda en el servidor lo que esté en this.properties.Metadata
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateMetadata', args,
		'actualizar los atributos indicados');
};

ActiveWork.prototype.GetGeographyItems = function (geographyId) {
	return axiosClient.getPromise(window.host + '/services/backoffice/GetGeographyItems',
		{ 'g': geographyId }, 'obtener los ítems de la geografía');
};


ActiveWork.prototype.UpdateMultilevelMatrix = function () {
	var datasetMatrix = {};
	for (var n = 0; n < this.Dataset.length; n++) {
		datasetMatrix[this.Dataset[n].properties.Id] = this.Dataset[n].properties.MultilevelMatrix;
	}
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/UpdateMultilevelMatrix',
		{ 'w': this.properties.Id, 'd': datasetMatrix }, 'actualizar las relaciones de multinivel');
};

ActiveWork.prototype.AddPermission = function (user, permission) {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/AddWorkPermission',
		{ 'u': user, 'w': this.properties.Id, 'p': permission }, 'agregar el permiso')
		.then(function (data) {
			loc.Permissions.push(data);
		});
};

ActiveWork.prototype.RequestReview = function () {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/RequestReview',
		{ 'w': this.properties.Id }, 'solicitar la revisión');
};

ActiveWork.prototype.UpdateVisibility = function () {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/UpdateWorkVisibility',
		{ 'w': this.properties.Id, 'l': this.properties.AccessLink, 'p': (this.properties.IsPrivate ? '1' : '0') }, 'actualizar la visibilidad').then(
		function () {
			window.Context.UpdatePrivacy(loc.properties.Id, loc.properties.IsPrivate);
		});
};

ActiveWork.prototype.DeletePermission = function (permission) {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/RemoveWorkPermission',
		{ 'p': permission.Id, 'w': this.properties.Id }, 'quitar el permiso').then(function (data) {
			arr.Remove(loc.Permissions, permission);
		});
};


ActiveWork.prototype.AddSource = function (source) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/AddWorkSource',
		{ 'w': this.properties.Id, 's': source.Id }, 'agregar la fuente')
		.then(function (data) {
			loc.Sources.push(source);
		});
};

ActiveWork.prototype.RemoveSource = function (source) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/RemoveSourceFromWork',
		{ 's': source.Id, 'w': this.properties.Id }, 'quitar la fuente').then(function (data) {
			arr.Remove(loc.Sources, source);
		});
};

ActiveWork.prototype.UpdateFile = function (item, bucketId) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateMetadataFile',
		{ 'f': item, 'w': this.properties.Id, 'b': bucketId }, 'actualizar el adjunto')
		.then(function (data) {
			// recibe el id y se lo pone
			if (item.Id === 0 || item.Id === null) {
				loc.Files.push(item);
				item.Id = data.Id;
				item.File = data.File;
			} else {
				var original = loc.GetAttachmentById(data.Id);
				if (original !== null) {
					original.File = data.File;
					original.Caption = data.Caption;
				}
			}
		});
};

ActiveWork.prototype.GetAttachmentById = function (id) {
	for (var n = 0; n < this.Files.length; n++) {
		if (this.Files[n].Id === id) {
			return this.Files[n];
		}
	}
	return null;
};
ActiveWork.prototype.DeleteFile = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/DeleteMetadataFile',
		{ 'f': item.Id, 'w': this.properties.Id }, 'eliminar el adjunto')
		.then(function (data) {
			arr.Remove(loc.Files, item);
		});
};

ActiveWork.prototype.MoveFileUp = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/MoveMetadataFileUp',
		{ 'f': item.Id, 'w': this.properties.Id }, 'cambiar la ubicación del adjunto')
		.then(function (data) {
			arr.MoveUp(loc.Files, item);
		});
};

ActiveWork.prototype.MoveFileDown = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/MoveMetadataFileDown',
		{ 'f': item.Id, 'w': this.properties.Id }, 'cambiar la ubicación del adjunto')
		.then(function (data) {
			arr.MoveDown(loc.Files, item);
		});
};


ActiveWork.prototype.MoveSourceUp = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/MoveSourceUp',
		{ 's': item.Id, 'w': this.properties.Id }, 'cambiar la ubicación de la fuente')
		.then(function (data) {
			arr.MoveUp(loc.Sources, item);
		});
};

ActiveWork.prototype.MoveSourceDown = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/MoveSourceDown',
		{ 's': item.Id, 'w': this.properties.Id }, 'cambiar la ubicación de la fuente')
		.then(function (data) {
			arr.MoveDown(loc.Sources, item);
		});
};

ActiveWork.prototype.WorkChanged = function () {
	this.UpdateHasChanges(1);
};

ActiveWork.prototype.WorkPublished = function () {
	this.UpdateHasChanges(0);
};


ActiveWork.prototype.UpdateDatasetGeorreferencedCount = function () {
	// Cuenta...
	var DatasetCount = this.Datasets.length;
	var GeorreferencedCount = 0;
	for (var n = 0; n < this.Datasets.length; n++) {
		if (this.Datasets[n].properties.Geocoded) GeorreferencedCount++;
	}
	// Actualiza
	for (var n = 0; n < this.workListMetadata.length; n++) {
		if (this.workListMetadata[n].Id === this.properties.Id) {
			this.workListMetadata[n].DatasetCount = DatasetCount;
			this.workListMetadata[n].GeorreferencedCount = DatasetCount;
			break;
		}
	}
	// Devuelve
	return { DatasetCount: DatasetCount, GeorreferencedCount: GeorreferencedCount };
};

ActiveWork.prototype.UpdateHasChanges = function (value) {
	//this.pendingChanges = value;
	// TODO: este update no está funcionando:
	Vue.set(this, "pendingChanges", value);
	for (var n = 0; n < this.workListMetadata.length; n++) {
		if (this.workListMetadata[n].Id === this.properties.Id) {
			this.workListMetadata[n].HasChanges = value;
			break;
		}
	}
};
