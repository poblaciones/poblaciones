import h from '@/public/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';
import LocationsComposer from '@/public/composers/LocationsComposer';
import DataShapeComposer from '@/public/composers/DataShapeComposer';


export default ActiveAnnotations;

ActiveAnnotations.DEFAULT_COLOR = '#95a3c1';

function ActiveAnnotations(data) {
	this.objs = {};
	this.objs.Segment = null;
	this.index = -1;
	this.visible = true;
	this.opacity = .7;
	this.showDescriptions = true;
	this.properties = data;
	this.borderWidth = 2;
	this.color = ActiveAnnotations.DEFAULT_COLOR;
};

ActiveAnnotations.prototype.Refresh = function () {
};

ActiveAnnotations.prototype.HasSelectedVariable = function () {
	return false;
};

ActiveAnnotations.prototype.IsFiltering = function () {
	return false;
};

ActiveAnnotations.prototype.SelectedVariable = function () {
	return null;
};

ActiveAnnotations.prototype.SelectedShowInfo = function () {
	return true;
};

ActiveAnnotations.prototype.UpdateItem = function (element) {
	/* color
coordenadas Array(1) lan lng
descripcion
forma
id
lista
nombre
tipo
 */
	var loc = this;
	var args = {
		'w': this.properties.WorkId, 'a': this.properties.Id,
		'id' : element.Id,
		'n': element.Description,
		'd': element.DescriptionLong,
		'c': element.Color,
		'g': element.Coordinates,

			};

	window.SegMap.Post(window.host + '/services/frontend/works/AnnotationUpdateItem', args).then(function (res) {
		arr.RemoveById(loc.properties.Items, elementId);
		loc.Refresh();
	}).catch(function (error) {

		err.errDialog('AnnotationUpdateItem', 'actualizar la anotación', error);
	});
};

ActiveAnnotations.prototype.DeleteItem = function (elementId) {
	var loc = this;
	args = { 'w': this.properties.WorkId, 'a': this.properties.Id };
	window.SegMap.Post(window.host + '/services/frontend/works/AnnotationDeleteItem', args).then(function (res) {
		arr.RemoveById(loc.properties.Items, elementId);
		loc.Refresh();
	}).catch(function (error) {
		err.errDialog('AnnotationDeleteItem', 'eliminar la anotación', error);
	});
};

ActiveAnnotations.prototype.IsLocationType = function () {
	switch (this.properties.AllowedTypes) {
		case 'M':
		case 'C':
		case 'Q':
			return true;
		default:
			return false;
	}
};

ActiveAnnotations.prototype.CreateParentInfo = function (variable, feature) {
	var parentInfo = {
		AnnotationId: this.properties.Id,
		MetricId: null,
		MetricVersionId: null,
		LevelId: null,
		VariableId: null,
		Id: feature.FID
	};
	return parentInfo;
};

ActiveAnnotations.prototype.ResolveStyle = function (variable, labelId) {

			return /** @type {google.maps.Data.StyleOptions} */({
				fillColor: this.color,
				fillOpacity: this.opacity,
				strokeWeight: 1,
				strokeColor: this.color,
				zIndex: 10000 - this.index,
			});
};


ActiveAnnotations.prototype.ResolveValueLabelSymbol = function (labelId) {
	return "";
};

ActiveAnnotations.prototype.SelectedMarker = function () {
	return {
		"Type": "T",
		"Source": "F",
		"Symbol": "",
		"Text": "M",
		"Image": null,
		"Size": "L",
		"Frame": "P",
		"DescriptionVerticalAlignment": "B",
		"AutoScale": 1,
		"ContentId": null
	};
};

ActiveAnnotations.prototype.Icons = function () {
	return [];
};


ActiveAnnotations.prototype.ResolveSegment = function () {
	if (this.IsLocationType()) {
		this.objs.Segment = window.SegMap.Metrics.AnnotationsLocationsSegment;
	} else {
		this.objs.Segment = window.SegMap.Metrics.AnnotationsShapesSegment;
	}
};

ActiveAnnotations.prototype.GetDataService = function () {
	return null;
};


ActiveAnnotations.prototype.useTiles = function () {
	return false;
};

ActiveAnnotations.prototype.Visible = function () {
	return this.visible;
};

ActiveAnnotations.prototype.GetStyleColorDictionary = function () {
	var ret = {};
	ret[1] = this.color;
	return ret;
};


ActiveAnnotations.prototype.CurrentOpacity = function () {
	return this.opacity;
};

ActiveAnnotations.prototype.UpdateRanking = function () {
};


ActiveAnnotations.prototype.UpdateSummary = function () {
	return;
};

ActiveAnnotations.prototype.GetStyleColorList = function () {
	var ret = [];
	ret.push({ cs: 'cs1', className: 1, fillColor: this.color });
	return ret;
};

ActiveAnnotations.prototype.UpdateMap = function () {
	if (window.SegMap && this.objs.Segment !== null) {
		window.SegMap.Metrics.UpdateMetric(this);
		window.SegMap.SaveRoute.UpdateRoute();
	}
};

ActiveAnnotations.prototype.ChangeVisibility = function () {
	this.visible = !this.visible;
	this.UpdateMap();
};

ActiveAnnotations.prototype.CheckTileIsOutOfClipping = function () {
	return false;
};

ActiveAnnotations.prototype.GetLayerData = function () {
	var url = this.GetLayerDataService();

	return window.SegMap.Get(url.server + url.path, {
		params: url.params
	}, url.useStaticQueue).then(function (res) {
		var list = res.data.Data;
		return list;
	});
};

ActiveAnnotations.prototype.GetLayerDataService = function () {
	var path = '/services/works/GetAnnotationItems';
	var server = window.host;

	var params = h.getWorkAnnotationParams(this.properties);
	return { server: server, path: path, useStaticQueue: false, params: params };
};

ActiveAnnotations.prototype.IsDeckGLLayer = function () {
	var deckGlDisabled = (window.Use.UseDeckgl == false);
	if (!this.useTiles() && !deckGlDisabled) {
		return true;
	} else {
		return false;
	}
};

ActiveAnnotations.prototype.Show = function () {
	this.visible = true;
	window.SegMap.Metrics.UpdateMetric(this);
};

ActiveAnnotations.prototype.Hide = function () {
	this.visible = false;
	window.SegMap.Metrics.Remove(this, true);
};

ActiveAnnotations.prototype.UpdateLevel = function () {
	return false;
};

ActiveAnnotations.prototype.Remove = function () {
	window.SegMap.Session.Content.RemoveBoundary(this.properties.Id);
	window.SegMap.Metrics.Remove(this);
};

ActiveAnnotations.prototype.UpdateOpacity = function (zoom) {
	return;
};

ActiveAnnotations.prototype.showText = function () {
	return true;
};

ActiveAnnotations.prototype.GetPattern = function () {
	return 1;
};

ActiveAnnotations.prototype.CreateComposer = function () {
	var ret;
	if (this.IsLocationType()) {
		ret = new LocationsComposer(window.SegMap.MapsApi, this);
	} else {
		ret = new DataShapeComposer(window.SegMap.MapsApi, this);
	}
	this.objs.composer = ret;
	return ret;
};

ActiveAnnotations.prototype.GetCartographyService = function () {
	return { url: null, revision: null };
};
