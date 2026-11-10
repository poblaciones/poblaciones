import Vue from 'vue';
import Vuex from 'vuex';
import axiosClient from '@/common/js/axiosClient';
import RegionStore from './RegionStore';
import MetricStore from './MetricStore';

export default Context;

function Context() {
	// 	(window.Context.User.Privileges puede ser:
	// 'A': Administrador, 'E': Editor de datos públicos,
	// 'L': Lector de datos públicos, 'P': Usuario estándar
	this.User = null;
	this.ErrorSignaled = { value: 0 };

	this.Metrics = [];
	this.Boundaries = [];
	// Jerarquía derivada de Boundaries (BoundaryHierarchy); se arma al cargarlas.
	this.BoundaryHierarchy = null;

	this.MetricStore = new MetricStore();
	this.RegionStore = new RegionStore();

};

Context.prototype.CreateStore = function () {
	Vue.use(Vuex);
	const store = new Vuex.Store({
		modules: { },
	});
	return store;
};
