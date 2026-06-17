import Vue from 'vue';
import Vuex from 'vuex';
import axiosClient from '@/common/js/axiosClient';

export default RegionSelection;

function RegionSelection(region) {
	this.Region = region;
	this.Items = [];
};

RegionSelection.prototype.GetItemByFID = function (fid) {
	for (var i = 0; i < this.Region.Items.length; i++) {
		if (this.Region.Items[i].FID === fid) {
			return this.Region.Items[i];
		}
	}
	return null;
};

RegionSelection.prototype.SelectItems = function (itemIds) {
	this.Items = [];
	for (var i = 0; i < itemIds.length; i++) {
		var item = this.GetItemByFID(itemIds[i]);
		if (item !== null) {
			this.Items.push(item);
		}
	}
};

RegionSelection.prototype.SelectAllItems = function () {
	this.Items = this.Region.Items.slice(); // copia todos los items
};

RegionSelection.prototype.ClearSelection = function () {
	this.Items = [];
};

RegionSelection.prototype.IsItemSelected = function (fid) {
	for (var i = 0; i < this.Items.length; i++) {
		if (this.Items[i].FID === fid) {
			return true;
		}
	}
	return false;
};

RegionSelection.prototype.ToggleItem = function (fid) {
	var index = -1;
	for (var i = 0; i < this.Items.length; i++) {
		if (this.Items[i].FID === fid) {
			index = i;
			break;
		}
	}

	if (index !== -1) {
		this.Items.splice(index, 1);
	} else {
		var item = this.GetItemByFID(fid);
		if (item !== null) {
			this.Items.push(item);
		}
	}
};


