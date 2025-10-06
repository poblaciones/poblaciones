import date from '@/common/framework/date';
import ActiveDataset from '@/backoffice/classes/ActiveDataset';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/framework/arr';
import AsyncCatalog from './AsyncCatalog';
import Vue from 'vue';
import f from '@/backoffice/classes/Formatter';
export default ActiveMetadata;

function ActiveMetadata(activeWork, metadata, lists) {
	this.properties = metadata;
	this.Files = lists.Files;
	this.Sources = lists.Sources;
	this.Institutions = lists.Institutions;
	this.Work = activeWork;
};


ActiveMetadata.prototype.WorkId = function () {
	if (this.Work) {
		return this.Work.properties.Id;
	}
	else {
		return null;
	}
};


ActiveMetadata.prototype.Path = function () {
	if (this.Work) {
		return 'backoffice';
	}
	else {
		return 'admin';
	}
};

ActiveMetadata.prototype.UpdateMetadata = function () {
	var args = { 'w': this.WorkId(), 'm': this.properties };
	this.WorkChanged();
	// Guarda en el servidor lo que esté en this.properties
	return axiosClient.postPromise(window.host + '/services/' + this.Path() + '/UpdateMetadata', args,
		'actualizar los atributos indicados');
};

ActiveMetadata.prototype.UpdateFile = function (item, bucketId) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/' + this.Path() + '/UpdateMetadataFile',
		{ 'f': item, 'w': this.WorkId(), 'm': this.properties.Id, 'b': bucketId }, 'actualizar el adjunto')
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



ActiveMetadata.prototype.MoveInstitutionUp = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/MoveInstitutionUp',
		{ 'i': item.Id, 'w': this.WorkId(), 'm': this.properties.Id }, 'cambiar la ubicación de la institución')
		.then(function (data) {
			arr.MoveUp(loc.Institutions, item);
		});
};

ActiveMetadata.prototype.MoveInstitutionDown = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/MoveInstitutionDown',
		{ 'i': item.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'cambiar la ubicación de la institución')
		.then(function (data) {
			arr.MoveDown(loc.Institutions, item);
		});
};


ActiveMetadata.prototype.ContainsSource = function (source) {
	for (var i = 0; i < this.Sources.length; i++) {
		if (this.Sources[i].Id === source.Id) {
			return true;
		}
	}
	return false;
};

ActiveMetadata.prototype.AddSource = function (source) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/AddWorkSource',
		{ 'w': this.WorkId(), 'm': this.properties.Id, 's': source.Id }, 'agregar la fuente')
		.then(function (data) {
			loc.Sources.push(source);
		});
};

ActiveMetadata.prototype.RemoveSource = function (source) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/RemoveSourceFromWork',
		{ 's': source.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'quitar la fuente').then(function (data) {
			arr.Remove(loc.Sources, source);
		});
};


ActiveMetadata.prototype.AddInstitution = function (institution) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/AddWorkInstitution',
		{ 'w': this.WorkId(), 'm': this.properties.Id, 'i': institution.Id }, 'agregar la institución')
		.then(function (data) {
			loc.Institutions.push(institution);
		});
};

ActiveMetadata.prototype.RemoveInstitution = function (institution) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/RemoveInstitutionFromWork',
		{ 'i': institution.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'quitar la institución').then(function (data) {
			arr.Remove(loc.Institutions, institution);
		});
};

ActiveMetadata.prototype.UpdateMetadataInstitution = function (institution) {
	var args = { 'w': this.WorkId(), 'm': this.properties.Id, 'i': institution };
	var loc = this;
	this.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/' + this.Path() + '/UpdateWorkInstitution', args,
		'actualizar la institución').then(function (savedInstitution) {
			// se fija si tiene que actualizar el institution
			if (institution.Id === null || institution.Id === 0) {
				// lo agrega en la lista
				loc.Institutions.push(savedInstitution);
				window.Context.Institutions.Refresh();
			} else {
				// actualiza en institutions
				for (var n = 0; n < loc.Institutions.length; n++) {
					if (loc.Institutions[n].Id === savedInstitution.Id) {
						Vue.set(loc.Institutions, n, savedInstitution);
						break;
					}
				}
				// actualiza el padrón general
				window.Context.Institutions.Refresh();
			}
			return savedInstitution;
		});
};

ActiveMetadata.prototype.UpdateInstitution = function (institution, container, watermarkImage) {
	var args = { 'w': this.WorkId(), 'm': this.properties.Id, 'i': institution, 'iwm': watermarkImage };
	var loc = this;
	this.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/' + this.Path() + '/UpdateInstitution', args,
		'actualizar la institución').then(function (savedInstitution) {
			// se fija si tiene que actualizar el institution
			container.Institution = savedInstitution;
			window.Context.Institutions.Refresh();
			return savedInstitution;
		});
};

ActiveMetadata.prototype.UpdateSource = function (source) {
	var args = { 'w': this.WorkId(), 'm': this.properties.Id, 's': source };
	var loc = this;
	this.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/' + this.Path() + '/UpdateWorkSource', args,
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

ActiveMetadata.prototype.WorkChanged = function () {
	if (this.Work) {
		this.Work.WorkChanged();
	}
};

ActiveMetadata.prototype.GetInstitutionWatermark = function (institution) {
	var args = { 'w': this.WorkId(), 'm': this.properties.Id, 'iwmid': institution.Watermark.Id };
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/GetInstitutionWatermark', args,
		'obtener el logo de la institución');
};

ActiveMetadata.prototype.GetAttachmentById = function (id) {
	for (var n = 0; n < this.Files.length; n++) {
		if (this.Files[n].Id === id) {
			return this.Files[n];
		}
	}
	return null;
};

ActiveMetadata.prototype.DeleteFile = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/DeleteMetadataFile',
		{ 'f': item.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'eliminar el adjunto')
		.then(function (data) {
			arr.Remove(loc.Files, item);
		});
};

ActiveMetadata.prototype.MoveFileUp = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/MoveMetadataFileUp',
		{ 'f': item.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'cambiar la ubicación del adjunto')
		.then(function (data) {
			arr.MoveUp(loc.Files, item);
		});
};

ActiveMetadata.prototype.MoveFileDown = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/MoveMetadataFileDown',
		{ 'f': item.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'cambiar la ubicación del adjunto')
		.then(function (data) {
			arr.MoveDown(loc.Files, item);
		});
};


ActiveMetadata.prototype.MoveSourceUp = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/MoveSourceUp',
		{ 's': item.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'cambiar la ubicación de la fuente')
		.then(function (data) {
			arr.MoveUp(loc.Sources, item);
		});
};

ActiveMetadata.prototype.MoveSourceDown = function (item) {
	var loc = this;
	this.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/' + this.Path() + '/MoveSourceDown',
		{ 's': item.Id, 'w': this.WorkId(), 'm': this.properties.Id}, 'cambiar la ubicación de la fuente')
		.then(function (data) {
			arr.MoveDown(loc.Sources, item);
		});
};
