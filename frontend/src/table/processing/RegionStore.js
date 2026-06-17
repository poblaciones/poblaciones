import Vue from 'vue';
import Vuex from 'vuex';
import axiosClient from '@/common/js/axiosClient';
import promises from '@/common/framework/promises';
import arr from '@/common/framework/arr';
import ActiveBoundary from '@/map/classes/ActiveBoundary';

import RegionSet from './RegionSet';

export default RegionStore;

function RegionStore() {
	this.Boundaries = [];
	this.Regions = [];
};

RegionStore.prototype.GetRegionById = function (boundaryVersionId) {
	for (var n = 0; n < this.Regions.length; n++) {
		if (this.Regions[n].Id === boundaryVersionId) {
			return this.Regions[n];
		}
	}
	return null;
};

RegionStore.prototype.GetBoundaryInfoById = function (boundaryId) {
	for (var n = 0; n < this.Boundaries.length; n++) {
		if (this.Boundaries[n].Id === boundaryId) {
			return this.Boundaries[n];
		}
	}
	return null;
};

RegionStore.prototype.GetBoundaryOrRetrieve = function (boundaryId) {
	var loc = this;
	var ret = this.GetBoundaryInfoById(boundaryId);
	if (ret !== null) {
		var activeBoundary = new ActiveBoundary(ret);
		return promises.ReadyPromise(activeBoundary);
	}
	var ret = this.GetRegionById(boundaryId);
	return axiosClient.getPromise(window.host + '/services/boundaries/GetSelectedBoundary', { a: boundaryId }).then(function (data) {
			loc.Boundaries.push(data);
			var activeBoundary = new ActiveBoundary(data);
			return activeBoundary;
		});
};

RegionStore.prototype.GetRegionOrRetrieve = function (boundaryVersionId, includedGeographyRelations = []) {
	var ret = this.GetRegionById(boundaryVersionId);
	if (ret !== null) {
		// Si le falta algunos, los pide...
		var faltantes = arr.Substract(arr.ToIntArray(Object.keys(ret.GeographyRelations)), includedGeographyRelations);
		if (faltantes.length > 0) {
			return this.GetRegionGeographyRelations(boundaryVersionId, faltantes).then(function () {
				return ret;
			});
		} else {
			return new promises.ReadyPromise(ret);
		}
	}
	// Trae la región con todos los solicitados...
	var args = { id: boundaryVersionId, includedGeographyRelations: includedGeographyRelations };
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/frontend/processor/GetRegion', args,
		('traer las regiones')).then(function (data) {
			var regionSet = new RegionSet(loc, data);
			loc.Regions.push(regionSet);
			return regionSet;
		});
};

RegionStore.prototype.GetRegionGeographyRelations = function (boundaryVersionId, includedGeographyRelations) {
	var args = { id: boundaryVersionId, includedGeographyRelations: includedGeographyRelations };
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/frontend/processor/GetRegionGeographyRelations', args,
		('traer las regiones')).then(function (data) {
			var region = loc.GetRegionById(boundaryVersionId);
			Object.entries(data).forEach(([key, value]) => {
				region.GeographyRelations[key] = value;
			});
		});
};

RegionStore.prototype.GetMultipleRegions = function (boundaryIds, includedGeographyRelations = []) {
	var loc = this;
	var promises = [];
	for (var i = 0; i < boundaryIds.length; i++) {
		promises.push(loc.GetRegionOrRetrieve(boundaryIds[i], includedGeographyRelations));
	}
	return Promise.all(promises);
};


