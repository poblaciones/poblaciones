import axiosClient from '@/common/js/axiosClient';
import promises from '@/common/framework/promises';


export default RegionSet;

function RegionSet(rs, data) {
	this.Caption = data.Caption;
	this.Items = data.Items;
	this.Id = data.Id;
	this.GeographyRelations = data.GeographyRelations;

	this.Store = rs;

	// un GeographyRelation es:
	//	{ [geographyId] = [ clipping_region_item_id = [geographyItemId, geographyItemId, geographyItemId ]];
	//	}
};

RegionSet.prototype.EnsureContainsGeographyRelations = function (geographyId) {
	if (geographyId in this.GeographyRelations) {
		return promises.ReadyPromise();
	} else {
		return this.Store.GetRegionGeographyRelations(this.Id, [geographyId]);
	}
};

RegionSet.prototype.GetGeographyIdsForItem = function (regionItemId, geographyId) {
	if (!regionItemId in this.GeographyRelations[geographyId]) {
		return [];
	} else {
		return this.GeographyRelations[geographyId][regionItemId];
	}
};


RegionSet.prototype.GetItemById = function (itemId) {
	for (var i = 0; i < this.Items.length; i++) {
		if (this.Items[i].Id === itemId) {
			return this.Items[i];
		}
	}
	return null;
};

RegionSet.prototype.GetGeographyIdsForItem = function (itemId, geographyId) {
	if (!this.GeographyRelations[geographyId]) {
		return [];
	}

	var relations = this.GeographyRelations[geographyId];
	if (relations[itemId]) {
		return relations[itemId];
	}

	return [];
};

RegionSet.prototype.LoadItems = function () {
	// Si ya tiene items, no hace nada
	if (this.Items.length > 0) {
		return promises.ReadyPromise(this.Items);
	}

	var args = { boundaryId: this.properties.Boundary.Id };
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/frontend/processor/GetBoundaryItems', args,
		('traer items de región')).then(function (res) {
			loc.Items = res.data;
			return loc.Items;
		});
};
