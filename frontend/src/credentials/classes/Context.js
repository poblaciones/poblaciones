import Vue from 'vue';
import Vuex from 'vuex';
import axiosClient from '@/common/js/axiosClient';

export default Context;

function Context() {
	// 	(window.Context.User.Privileges puede ser:
	// 'A': Administrador, 'E': Editor de datos públicos,
	// 'L': Lector de datos públicos, 'P': Usuario estándar
	this.User = null;
	this.ErrorSignaled = { value: 0 };
};

Context.prototype.CreateStore = function () {
	Vue.use(Vuex);
	const store = new Vuex.Store({
		modules: { },
	});
	return store;
};

Context.prototype.AccountExists = function(user, shouldBeActive) {
	var args = { u: user, active: shouldBeActive };
	return axiosClient.getPromise(window.host + '/services/authentication/AccountExists', args,
		'validar la cuenta');
};


Context.prototype.BeginRecover = function (user) {
	var args = { u: user, t: window.mainHost + '/users/' };
	return axiosClient.postPromise(window.host + '/services/authentication/BeginResetPassword', args,
		('iniciar la recuperación de contraseña'));
};

Context.prototype.ResetPassword = function (user, code, password) {
	// Trae sus variables
	var args = { u: user, p: password, c: code };
	return axiosClient.postPromise(window.host + '/services/authentication/ResetPassword', args,
		('restablecer contraseña'));
};

Context.prototype.ValidateCode = function (user, code) {
	var args = { u: user, c: code };
	return axiosClient.getPromise(window.host + '/services/authentication/ValidateCode', args,
		('validar el código'));
};

Context.prototype.Login = function (user, password) {
	// Trae sus variables
	var args = { u: user, p: password };
	return axiosClient.postPromise(window.host + '/services/authentication/Login', args,
		('iniciar sesión'));
};

Context.prototype.Register = function (email) {
	var args = { u: email, t: window.mainHost + '/users/' };
	return axiosClient.postPromise(window.host + '/services/authentication/BeginActivation', args,
		('crear la cuenta'));
};

Context.prototype.Activate = function (email, password, firstname, lastname, code, type) {
	// Trae sus variables
	var args = { f: firstname, l: lastname, u: email, p: password, c: code, t: type };
	return axiosClient.postPromise(window.host + '/services/authentication/Activate', args,
		('activar la cuenta'));
};
