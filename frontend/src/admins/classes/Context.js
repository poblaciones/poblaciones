import Vue from 'vue';
import Vuex from 'vuex';
import AsyncCatalog from '@/backoffice/classes/AsyncCatalog.js';
export default Context;

function Context() {
	// 	(window.Context.User.Privileges puede ser:
	// 'A': Administrador, 'E': Editor de datos públicos,
	// 'L': Lector de datos públicos, 'P': Usuario estándar
	this.User = null;
	this.Cartographies = [];
	this.CartographiesStarted = false;
	this.ErrorSignaled = { value: 0 };
}

Context.prototype.Initialize = function () {
	this.Factory = new AsyncCatalog(window.host + '/services/backoffice/GetFactories');
	this.Geographies = new AsyncCatalog(window.host + '/services/backoffice/GetAllGeographies');
	this.PublicMetrics = new AsyncCatalog(window.host + '/services/backoffice/GetPublicMetrics');
	this.CartographyMetrics = new AsyncCatalog(window.host + '/services/backoffice/GetCartographyMetrics');
	this.MetricGroups = new AsyncCatalog(window.host + '/services/backoffice/GetAllMetricGroups');
	this.BoundaryGroups = new AsyncCatalog(window.host + '/services/admin/GetBoundaryGroups');
};

Context.prototype.CreateStore = function () {
	Vue.use(Vuex);
	const store = new Vuex.Store({
		modules: { },
	});
	return store;
};

Context.prototype.IsAdmin = function () {
	return (this.User.Privileges === 'A');
};

Context.prototype.IsAdminReader = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E' || this.User.Privileges === 'L');
};

Context.prototype.IsDataAdmin = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E');
};

Context.prototype.CanCreatePublicData = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E');
};

Context.prototype.CanAccessAdminSite = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E' || this.User.Privileges === 'L');
};
