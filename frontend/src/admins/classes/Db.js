import axios from 'axios';
import ActiveWork from '@/backoffice/classes/ActiveWork';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/js/arr';
import Vue from 'vue';

export default Db;

function Db() {

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

Db.prototype.CalculateSpaceUsage = function () {
	return axiosClient.getPromise(window.host + '/services/admin/UpdateWorkSpaceUsage',
			{  }, 'calcular el espacio por cartografía');
};

Db.prototype.GetWorks = function (filter, timeFilter) {
	return axiosClient.getPromise(window.host + '/services/admin/GetWorks',
			{ f: filter, t: timeFilter }, 'obtener la lista de cartografías');
};

Db.prototype.GetReviews = function () {
	return axiosClient.getPromise(window.host + '/services/admin/GetReviews',
			{ }, 'obtener la lista de revisiones');
};


Db.prototype.DeleteReview = function (review, callback) {
	return axiosClient.postPromise(window.host + '/services/admin/DeleteReview',
		{ r: review }, 'eliminar la revisión').then(function () {
			callback();
		});
};

Db.prototype.UpdateReview = function (review) {
	return axiosClient.postPromise(window.host + '/services/admin/UpdateReview',
		{ r: review }, 'modificar la revisión');
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




