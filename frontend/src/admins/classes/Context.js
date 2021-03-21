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
	this.Factory = new AsyncCatalog(window.host + '/services/backoffice/GetFactories');
	this.Sources = new AsyncCatalog(window.host + '/services/backoffice/GetAllSourcesByCurrentUser');
	this.Geographies = new AsyncCatalog(window.host + '/services/backoffice/GetAllGeographies');
	this.PublicMetrics = new AsyncCatalog(window.host + '/services/backoffice/GetPublicMetrics');
	this.CartographyMetrics = new AsyncCatalog(window.host + '/services/backoffice/GetCartographyMetrics');
	this.MetricGroups = new AsyncCatalog(window.host + '/services/backoffice/GetAllMetricGroups');
	this.BoundaryGroups = new AsyncCatalog(window.host + '/services/admin/GetBoundaryGroups');
	this.CurrentMetricVersionLevel = null;
	this.EditableMetricVersionLevel = null;
}

Context.prototype.CreateStore = function () {

	Vue.use(Vuex);


	const store = new Vuex.Store({
		modules: {

		},

	});

	return store;
};


Context.prototype.IsAdmin = function () {
	return (this.User.Privileges === 'A');
};

Context.prototype.CanCreatePublicData = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E');
};

Context.prototype.CanCreatePublicData = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E');
};

Context.prototype.CanAccessAdminSite = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E' || this.User.Privileges === 'L');
};

Context.prototype.CanViewPublicData = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E' || this.User.Privileges === 'L') ||
		this.HasPublicData();
};

Context.prototype.CanEditStaticLists = function () {
	return (this.User.Privileges === 'A' || this.User.Privileges === 'E');
};

Context.prototype.HasPublicData = function () {
	if (this.CartographiesStarted) {
		for (var i = 0; i < this.Cartographies.length; i++) {
			if (this.Cartographies[i].Type === 'P') {
				return true;
			}
		}
	}
	return false;
};


