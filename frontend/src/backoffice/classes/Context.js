import Vue from 'vue';
import Vuex from 'vuex';
import app from './moduleApp.js';
import AsyncCatalog from './AsyncCatalog.js';
import axios from 'axios';
import axiosClient from '@/common/js/axiosClient';
export default Context;

function Context() {
	// 	(window.Context.User.Privileges puede ser:
	// 'A': Administrador, 'E': Editor de datos públicos,
	// 'L': Lector de datos públicos, 'P': Usuario estándar
	this.User = null;
	this.BooleanKeys = { WorkTopBarPublish: 1 };
	this.Cartographies = [];
	this.CartographiesStarted = false;
	this.ErrorSignaled = { value: 0 };
	this.CurrentDataset = null;
	this.CurrentWork = null;
	this.Factory = new AsyncCatalog(window.host + '/services/backoffice/GetFactories');
	this.Sources = new AsyncCatalog(window.host + '/services/backoffice/GetAllSourcesByCurrentUser');
	this.Geographies = new AsyncCatalog(window.host + '/services/backoffice/GetAllGeographies');
	this.Institutions = new AsyncCatalog(window.host + '/services/backoffice/GetAllInstitutionsByCurrentUser');
	this.PublicMetrics = new AsyncCatalog(window.host + '/services/backoffice/GetPublicMetrics');
	this.CartographyMetrics = new AsyncCatalog(window.host + '/services/backoffice/GetCartographyMetrics');
	this.MetricGroups = new AsyncCatalog(window.host + '/services/backoffice/GetAllMetricGroups');
	this.MetricProviders = new AsyncCatalog(window.host + '/services/backoffice/GetAllMetricProviders');
}

Context.prototype.GetTrackingLevelGeography = function () {
	if (this.Geographies.loading) {
		throw new Error("La tabla de geografías aún no se ha cargado.");
	}
	for (var i = 0; i < this.Geographies.list.length; i++) {
		if (this.Geographies.list[i].IsTrackingLevel) {
			return this.Geographies.list[i];
		}
	}
	throw new Error('No hay un tracking level definido.');
};

Context.prototype.CreateStore = function () {

	Vue.use(Vuex);

	const getters = {
		sidebar: state => state.app.sidebar,
		device: state => state.app.device
	};

	const store = new Vuex.Store({
		modules: {
			app
		},
		getters
	});

	return store;
};


Context.prototype.IsAdmin = function () {
	return (this.User.Privileges === 'A');
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

Context.prototype.LoadStaticLists = function () {
	this.Sources.Refresh();
	this.Institutions.Refresh();
	this.Geographies.Refresh();
	this.Factory.Refresh();
	this.PublicMetrics.Refresh();
	this.CartographyMetrics.Refresh();
	this.MetricGroups.Refresh();
	this.MetricProviders.Refresh();
};

Context.prototype.RefreshMetrics = function()
{
	if (this.CurrentWork.properties.Type === 'P') {
		this.PublicMetrics.Refresh();
	} else if (this.CurrentWork.properties.Type === 'R') {
		this.CartographyMetrics.Refresh();
	} else {
		alert('Invalid work type');
	}
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

Context.prototype.UpdatePrivacy = function (workId, value) {
	if (this.CartographiesStarted) {
		for (var i = 0; i < this.Cartographies.length; i++) {
			if (this.Cartographies[i].Id === workId) {
				this.Cartographies[i].IsPrivate = value;
				return;
			}
		}
	}
};

