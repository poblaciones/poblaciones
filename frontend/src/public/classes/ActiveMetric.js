import LocationsComposer from '@/public/composers/LocationsComposer';
import DataShapeComposer from '@/public/composers/DataShapeComposer';
import SegmentsComposer from '@/public/composers/SegmentsComposer';
import Compare from './Compare.js';
import Vue from 'vue';

import h from '@/public/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';


export default ActiveMetric;

function ActiveMetric(selectedMetric) {
	if (!selectedMetric) {
		return;
	}
	this.objs = {};
	this.objs.Segment = null;
	this.objs.composer = null;
	this.properties = selectedMetric;
	this.index = -1;
	this.IsLocked = false;
	this.KillDuplicateds = true;
	this.overlay = null;
	this.Compare = new Compare(this);
};

ActiveMetric.prototype.GetAllLevels = function () {
	var ret = [];
	for (var n = 0; n < this.properties.Versions.length; n++) {
		ret = ret.concat(this.properties.Versions[n].Levels);
	}
	return ret;
};

ActiveMetric.prototype.GetAllVariables = function () {
	var levels = this.GetAllLevels();
	var ret = [];
	for (var n = 0; n < levels.length; n++) {
		ret = ret.concat(levels[n].Variables);
	}
	return ret;
};

ActiveMetric.prototype.UpdateOpacity = function (zoom) {
	var opacity = 0.7;
	var variable = this.SelectedVariable();
	if (!variable) {
		return;
	}
	if (variable.Opacity === 'H') {
		opacity = 0.95;
	} else if (variable.Opacity === 'L') {
		opacity = 0.3;
	}
	if (zoom <= 17) {
		variable.CurrentOpacity = opacity;
	} else {
		variable.CurrentOpacity = opacity * 0.6;
	}

	// Resuelve la de gradientes
	var gradientOpacity = 0.65;
	if (variable.GradientOpacity === 'H') {
		gradientOpacity = 0.80;
	} else if (variable.GradientOpacity === 'L') {
		gradientOpacity = 0.3;
	} else if (variable.GradientOpacity === 'N') {
		gradientOpacity = 0;
	}
	if (zoom >= 10) {
		variable.CurrentGradientOpacity = gradientOpacity;
	} else {
		variable.CurrentGradientOpacity = gradientOpacity * 1.2;
	}
};

ActiveMetric.prototype.SelectedShowInfo = function () {
	return this.SelectedLevel().Dataset.ShowInfo;
};

ActiveMetric.prototype.SelectedMarker = function () {
	return this.SelectedLevel().Dataset.Marker;
};

ActiveMetric.prototype.Icons = function () {
	return this.SelectedVersion().Work.Icons;
};


ActiveMetric.prototype.IsLocationType = function () {
	return this.SelectedLevel().Dataset.Type === 'L';
};

ActiveMetric.prototype.CheckTileIsOutOfClipping = function () {
	return (window.SegMap.Clipping.clipping.IsUpdating !== '1');
};


ActiveMetric.prototype.SetShowDescriptionsToSelectedVariableSet = function (value) {
	return this.SetValueToSelectedVariableSet("ShowDescriptions", value, true, false);
};

ActiveMetric.prototype.SetShowValuesToSelectedVariableSet = function (value) {
	return this.SetValueToSelectedVariableSet("ShowValues", value, false, true);
};

ActiveMetric.prototype.SetValueToSelectedVariableSet = function (attribute, value, requireDescriptions, requireNotToSimpleCounts) {
	if (!this.HasSelectedVariable()) {
		return;
	}
	// Establece el valor para todas las variables con igual
	// nombre, sin importar el nivel o la serie.
	var selectedVariable = this.SelectedVariable();
	var name = selectedVariable.Name;
	for (var version of this.properties.Versions) {
		for (var level of version.Levels) {
			if (!requireDescriptions || level.HasDescriptions) {
				for (var variable of level.Variables) {
					if (!requireNotToSimpleCounts || !variable.IsSimpleCount) {
						if (variable.Name === name) {
							variable[attribute] = value;
						}
					}
				}
			}
		}
	}
};

ActiveMetric.prototype.ChangeMetricVisibility = function () {
	this.properties.Visible = !this.properties.Visible;
	this.RefreshMap();
};

ActiveMetric.prototype.ChangeSelectedMultiLevelIndex = function (index) {
	var isUsingMultilevel = (this.SelectedVersion().SelectedMultiLevelIndex
															== this.SelectedVersion().SelectedLevelIndex);

	// Cambia el level, intentando mantener la variable seleccionado.
	// La mantiene si el caption coincide.
	var variable = this.SelectedVariable();
	var name = (variable !== null ? variable.Name : null);
	this.SelectedVersion().SelectedMultiLevelIndex = index;
	if (isUsingMultilevel) {
		this.SelectedVersion().SelectedLevelIndex = index;
	}
	this.SetSelectedVariableByName(name);
};

ActiveMetric.prototype.SetSelectedVariableByName = function (name) {
	var level = this.SelectedLevel();
	for (var l = 0; l < level.Variables.length; l++) {
		if (level.Variables[l].Name === name) {
			level.SelectedVariableIndex = l;
			break;
		}
	}
};

ActiveMetric.prototype.GetSelectedPartition = function () {
	var part = this.properties.SelectedPartition;
	var info = this.SelectedLevel().Partitions;
	if (info) {
		// se fija si existe el valor...
		for (var n of info.Values) {
			if (n.Value === part) {
				return part;
			}
		}
		// Si no existe, devuelve el primero
		if (info.Values.length > 0) {
			return info.Values[0].Value;
		}
	}
	return null;
};


ActiveMetric.prototype.Visible = function () {
	return this.properties.Visible && this.SelectedLevel().SelectedVariableIndex !== -1;
};

ActiveMetric.prototype.getHiddenValueLabels = function (variable) {
	var ret = '';
	var labels = this.getVariableValueLabels(variable);
	for (var n = 0; n < labels.length; n++)
		if (!labels[n].Visible) {
			ret += ',' + labels[n].Id;
		}
	if (ret.length > 0) {
		ret = ret.substring(1);
	}
	return ret;
};

ActiveMetric.prototype.getVariableValueLabels = function (variable) {
	if (this.Compare.Active) {
		if (variable.ComparableValueLabels) {
			return variable.ComparableValueLabels;
		} else {
			return [];
		}
	} else {
		return variable.ValueLabels;
	}
};

ActiveMetric.prototype.SelectVersion = function (index) {
	if (this.properties.SelectedVersionIndex + '' === index + '') {
		return;
	}
	this.properties.SelectedVersionIndex = index;
	window.SegMap.Session.Content.SelectSerie(this.SelectedVersion());

	this.UpdateSummary();
	this.UpdateMap();
};


ActiveMetric.prototype.GetFirstValidVersionIndexByWorkId = function (id) {
	// Prioriza el actualmente seleccionado
	if (this.SelectedVersion().Work.Id == id) {
		return this.properties.SelectedVersionIndex;
	}
	// Busca uno alternativo
	for (var l = 0; l < this.properties.Versions.length; l++) {
		if (this.properties.Versions[l].Work.Id === id) {
			return l;
		}
	}
	return -1;
};

ActiveMetric.prototype.GetVersionById = function (id) {
	var index = this.GetVersionIndex(id);
	if (index === -1) {
		return null;
	}
	return this.prop.Versions[index];
};

ActiveMetric.prototype.GetVariableById = function (variableId) {
	var versions = this.properties.Versions;
	for (var v = 0; v < versions.length; v++) {
		for (var l = 0; l < versions[v].Levels.length; l++) {
			var level = versions[v].Levels[l];
			for (var i = 0; i < level.Variables.length; i++) {
				if (level.Variables[i].Id == variableId) {
					return level.Variables[i];
				}
			}
		}
	}
	return null;
};

ActiveMetric.prototype.GetVersionIndex = function (id) {
	for (var l = 0; l < this.properties.Versions.length; l++) {
		if (this.properties.Versions[l].Version.Id === id) {
			return l;
		}
	}
	return -1;
};

ActiveMetric.prototype.SelectedVersion = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	return this.properties.Versions[this.properties.SelectedVersionIndex];
};

ActiveMetric.prototype.SelectedMultiLevelIndex = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var version = this.SelectedVersion();
	return version.SelectedMultiLevelIndex;
};

ActiveMetric.prototype.SelectedLevelIndex = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var version = this.SelectedVersion();
	return version.SelectedLevelIndex;
};

ActiveMetric.prototype.BottomLevel = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var version = this.SelectedVersion();
	return version.Levels[version.Levels.length - 1];
};

ActiveMetric.prototype.SelectedLevel = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var version = this.SelectedVersion();
	return version.Levels[version.SelectedLevelIndex];
};

ActiveMetric.prototype.SelectedMultiLevel = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var version = this.SelectedVersion();
	return version.Levels[version.SelectedMultiLevelIndex];
};

ActiveMetric.prototype.HasSelectedVersion = function () {
	return this.properties !== null && this.properties.SelectedVersionIndex >= 0 && this.properties.SelectedVersionIndex < this.properties.Versions.length;
};

ActiveMetric.prototype.HasSelectedLevel = function () {
	if (this.HasSelectedVersion() === false) {
		return false;
	}
	var version = this.SelectedVersion();
	return version.SelectedLevelIndex >= 0 && version.SelectedLevelIndex < version.Levels.length;
};

ActiveMetric.prototype.HasSelectedVariable = function () {
	if (this.HasSelectedLevel() === false) {
		return false;
	}
	var level = this.SelectedLevel();
	return level.SelectedVariableIndex >= 0 && level.SelectedVariableIndex < level.Variables.length;
};

ActiveMetric.prototype.SelectedVariable = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var level = this.SelectedLevel();
	if (level.SelectedVariableIndex === -1) {
		return null;
	} else {
		return level.Variables[level.SelectedVariableIndex];
	}
};

ActiveMetric.prototype.UpdateMap = function () {
	this.UpdateLevel();
	window.SegMap.Metrics.UpdateMetric(this);
	window.SegMap.InfoWindow.CheckUpdateNavigation();
	window.SegMap.SaveRoute.UpdateRoute();
};

ActiveMetric.prototype.RefreshMap = function () {
	if (this.IsDeckGLLayer()) {
		return this.UpdateMap();
	}
	this.UpdateLevel();
	if (this.overlay) {
		this.overlay.refresh();
	}
	window.SegMap.InfoWindow.CheckUpdateNavigation();
	window.SegMap.SaveRoute.UpdateRoute();
};

ActiveMetric.prototype.useTiles = function () {
	if (this.SelectedLevel().Dataset.AreSegments) {
		return true;
	} else if (this.isBaseMetric == true) {
		return false;
	} else if (this.SelectedLevel().Dataset.Type === 'L') {
		return false;
	} else {
		return true;
	}
};

ActiveMetric.prototype.CreateComposer = function () {
	var ret;
	if (this.SelectedLevel().Dataset.AreSegments) {
		ret = new SegmentsComposer(window.SegMap.MapsApi, this);
	} else if (this.SelectedLevel().Dataset.Type === 'L') {
		ret = new LocationsComposer(window.SegMap.MapsApi, this);
	} else {
		ret = new DataShapeComposer(window.SegMap.MapsApi, this);
	}
	this.objs.composer = ret;
	return ret;
};

ActiveMetric.prototype.showText = function () {
	var minZoom = this.SelectedLevel().MinZoom;
	var pattern = this.GetPattern();
	return (pattern === 2 || this.SelectedVariable().ShowValues == 1) &&
					(minZoom === null || window.SegMap.frame.Zoom >= parseInt(minZoom));
};

ActiveMetric.prototype.CreateParentInfo = function (variable, feature) {
	var parentInfo = {
		MetricId: this.properties.Metric.Id,
		MetricVersionId: this.SelectedVersion().Version.Id,
		LevelId: this.SelectedLevel().Id,
		VariableId: variable.Id,
		Id: feature.FID
	};
	if (variable.IsSequence) {
		parentInfo.LabelId = feature.LabelId;
		parentInfo.Sequence = feature.Sequence;
	}
	return parentInfo;
};

ActiveMetric.prototype.isClickeable = function () {
	var minZoom = this.SelectedLevel().MinZoom;
	return window.SegMap.frame.Zoom >= parseInt(minZoom);
};

ActiveMetric.prototype.IsFiltering = function () {
	var variable = this.SelectedVariable();
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		if (!value.Visible) {
			return true;
		}
	}
	return false;
};

ActiveMetric.prototype.ResolveVariableValues = function (variable) {
	return this.Compare.Active ? variable.ComparableValueLabels : variable.ValueLabels;
};

ActiveMetric.prototype.ResolveValueLabelVisibility = function (labelId) {
	var variable = this.SelectedVariable();
	var values = this.ResolveVariableValues(variable);
	for (let i = 0; i < values.length; i++) {
		var value = values[i];
		if (value['Id'] === labelId) {
			return value.Visible;
		}
	}
	err.errMessage('ResolveVisibility', 'Label did not match on metricVersion ' + this.SelectedVersion().Version.Id + ' of ' + this.properties.Metric.Name + '. Update views and/or fileCache clear may be required (getTileData cache).');
	return false;
};

ActiveMetric.prototype.ResolveValueLabelSymbol = function (labelId) {
	var variable = this.SelectedVariable();
	var values = this.ResolveVariableValues(variable);
	for (let i = 0; i < values.length; i++) {
		var value = values[i];
		if (value['Id'] === labelId) {
			return value.Symbol;
		}
	}
	err.errMessage('ResolveSymbol', 'Label did not match on metricVersion ' + this.SelectedVersion().Version.Id + ' of ' + this.properties.Metric.Name + '. Update views and/or fileCache clear may be required.');
	return false;
};

ActiveMetric.prototype.ResolveStyle = function (variable, labelId) {
	var values = this.ResolveVariableValues(variable);
	for (let i = 0; i < values.length; i++) {
		var value = values[i];
		if (value['Id'] === labelId) {
			var fillColor = value.FillColor;
			if (this.GetPattern(variable) === 1) {
				return /** @type {google.maps.Data.StyleOptions} */({
					fillColor: 'transparent',
					strokeColor: fillColor,
					strokeOpacity: variable.CurrentOpacity,
					fillOpacity: 0,
					strokeWeight: 3,
					zIndex: 10000 - this.index,
				});
			} else {
				return /** @type {google.maps.Data.StyleOptions} */({
					fillColor: fillColor,
					fillOpacity: variable.CurrentOpacity,
					strokeWeight: 1,
					strokeColor: '#808080',
					zIndex: 10000 - this.index,
				});
			}
		}
	}
	return null;
};

ActiveMetric.prototype.GetPattern = function (variable) {
	if (!variable) {
		variable = this.SelectedVariable();
	}
	if (variable.CustomPattern === '') {
		return variable.Pattern;
	} else {
		return variable.CustomPattern;
	}
};
ActiveMetric.prototype.ReleasePins = function () {
	for (var v = 0; v < this.properties.Versions.length; v++) {
		for (var l = 0; l < this.properties.Versions[v].Levels.length; l++) {
			var level = this.properties.Versions[v].Levels[l];
			if (level.Pinned) {
				level.Pinned = false;
			}
		}
	}
};
ActiveMetric.prototype.SetLevel = function (level) {
	for (var l = 0; l < this.SelectedVersion().Levels.length; l++) {
		var currentLevel = this.SelectedVersion().Levels[l];
		if (currentLevel == level) {
			var currentLevel = this.SelectedVersion().SelectedLevelIndex = l;
			break;
		}
	}
};

ActiveMetric.prototype.UpdateLevel = function () {
	if (this.SelectedMultiLevel().Pinned) {
		return false;
	}
	var l = this.CalculateProperLevel();
	if (l !== this.SelectedMultiLevelIndex()) {
		this.ChangeSelectedMultiLevelIndex(l);
		this.CheckValidMetric();
		return true;
	} else {
		return false;
	}
};

ActiveMetric.prototype.CheckValidMetric = function () {
	var metrics = this.getValidMetrics();
	var current = this.properties.SummaryMetric;
	for (var n = 0; n < metrics.length; n++) {
		if (current === metrics[n].Key) {
			return;
		}
	}
	this.properties.SummaryMetric = metrics[0].Key;
};

ActiveMetric.prototype.IsMultiLevel = function () {
	var currentVersion = this.SelectedVersion();
	return currentVersion.Levels.length > 1;
};

ActiveMetric.prototype.LastLevelDontMultilevel = function () {
	var currentVersion = this.SelectedVersion();
	return currentVersion.Levels[currentVersion.Levels.length - 1].Dataset.Type !== 'D';
};

ActiveMetric.prototype.CalculateProperLevel = function () {
	var currentVersion = this.SelectedVersion();
	if (!this.IsMultiLevel()) {
		return 0;
	}
	var currentLevel = null;
	var currentZoom = window.SegMap.frame.Zoom;
	var currentVersion = this.SelectedVersion();
	var validFrom = this.LevelValidFrom();
	if (currentZoom < currentVersion.Levels[validFrom].MinZoom) {
		// Si es más chico que el primero, devuelve ese
		return validFrom;
	}
	var levelCount = currentVersion.Levels.length - (this.LastLevelDontMultilevel() ? 1 : 0);
	var last = levelCount - 1;
	if (currentZoom > currentVersion.Levels[last].MaxZoom) {
		// Si es más grande que el máximo, devuelve ese
		return last;
	}
	for (var l = validFrom; l < levelCount; l++) {
		var currentLevel = currentVersion.Levels[l];
		if (currentZoom >= currentLevel.MinZoom && currentZoom <= currentLevel.MaxZoom) {
			return l;
		}
	}
	// Trata de devolver uno válido, incluso si no está en el rango de zoom
	return levelCount - 1;
};

ActiveMetric.prototype.LevelValidFrom = function() {
	if (!window.SegMap.Clipping.HasClippingLevels()) {
		// si no hay clipping region, todos valen
		return 0;
	}
	var currentVersion = this.SelectedVersion();
	for (var l = 0; l < currentVersion.Levels.length; l++) {
		var currentLevel = currentVersion.Levels[l];
		if (window.SegMap.Clipping.LevelMachLevels(currentLevel)) {
			return l;
		}
	}
	return 0;
};

ActiveMetric.prototype.getValidPatterns = function () {
	var ret = [];
	ret.push({ Key: 0, Caption: 'Pleno' });
	ret.push({ Key: 1, Caption: 'Contorno' });
	ret.push({ Key: 2, Caption: 'Semáforo' });
	if (this.SelectedVariable()) {
		var ipattern = parseInt(this.SelectedVariable().Pattern);
		if (ipattern >= 3 && ipattern <= 5) {
			ret.push({ Key: this.SelectedVariable().Pattern, Caption: 'Cañería' });
		} else {
			ret.push({ Key: 3, Caption: 'Cañería' });
		}
	} else {
		ret.push({ Key: 3, Caption: 'Cañería' });
	}

	ret.push({ Key: 7, Caption: 'Diagonal' });
	ret.push({ Key: 8, Caption: 'Horizontal' });
	ret.push({ Key: 9, Caption: 'Diagonal invertida' });
	ret.push({ Key: 10, Caption: 'Vertical' });
	ret.push({ Key: 11, Caption: 'Puntos' });
	//ret.push({ Key: 12, Caption: 'Puntos vacíos' });
	return ret;
};

ActiveMetric.prototype.getValidMetrics = function (variable) {
	var delta = (this.Compare.Active ? 'Diferencia en ' : '');
	var ret = [];
	if (!variable) {
		variable = this.SelectedVariable();
	}
	ret.push({ Key: 'N', Caption: 'Cantidad' });

	if (variable && variable.HasTotals) {
		ret.push({ Key: 'I', Caption: delta + 'Incidencia' });
	}

	ret.push({ Key: 'P', Caption: 'Distribución' });

	if (this.SelectedLevel().HasArea && this.SelectedVariable() && !this.SelectedVariable().IsArea
				&& !this.SelectedLevel().Dataset.AreSegments) {
		ret.push({ Key: 'K', Caption: 'Área' });
		ret.push({ Key: 'A', Caption: 'Distr. de áreas' });
		ret.push({ Key: 'D', Caption: 'Densidad' });
	}

	for (var n = 0; n < ret.length; n++) {
		var next = n + 1;
		if (next === ret.length) {
			next = 0;
		}
		ret[n].Next = ret[next];
		ret[n].Title = 'Métrica: ' + ret[n].Caption + ' (click para cambiar por ' + ret[next].Caption + ')';
	}
	return ret;
};

ActiveMetric.prototype.GetStyleColorList = function() {
	var variable = this.SelectedVariable();
	var ret = [];
	var values = this.ResolveVariableValues(variable);
	for (let i = 0; i < values.length; i++) {
		var value = values[i];
		ret.push({ cs: 'cs' + value['Id'], className: value['Id'], fillColor: value.FillColor });
	}
	return ret;
};

ActiveMetric.prototype.CurrentOpacity = function () {
	return this.SelectedVariable().CurrentOpacity;
};

ActiveMetric.prototype.GetStyleColorDictionary = function () {
	var variable = this.SelectedVariable();
	var ret = {};
	var values = this.ResolveVariableValues(variable);
	for (let i = 0; i < values.length; i++) {
		var value = values[i];
		ret[value['Id']] = value.FillColor;
	}
	return ret;
};

ActiveMetric.prototype.GetLayerData = function () {
	var url = this.GetLayerDataService();
	var currentVariableId = this.SelectedVariable().Id;
	var selectedLevel = this.SelectedLevel();

	return window.SegMap.Get(url.server + url.path, {
		params: url.params
	}, url.useStaticQueue).then(function (res) {
		var list = res.data.Data;
		if (selectedLevel.Variables.length > 1) {
			// filtra antes de devolverlo...
			var filtered = [];
			for (var n = 0; n < list.length; n++) {
				if (list[n].VID === currentVariableId) {
					filtered.push(list[n]);
				}
			}
			return filtered;
		} else {
			return list;
		}
	});
};

ActiveMetric.prototype.GetLayerDataService = function (seed) {
	var useStaticQueue = window.SegMap.Configuration.StaticWorks.indexOf(this.SelectedVersion().Work.Id) !== -1;
	var server = '';

	var path = '/services/frontend/metrics/GetLayerData';

	if (useStaticQueue) {
		server = h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed);
	} else {
		server = window.host;
	}
	this.properties.EffectivePartition = this.GetSelectedPartition();
	var params = h.getLayerDataParams(this.properties, window.SegMap.frame);
	return { server: server, path: path, useStaticQueue: useStaticQueue, params: params };
};

ActiveMetric.prototype.IsDeckGLLayer = function () {
	var deckGlDisabled = (window.Use.UseDeckgl == false);
	if (!this.useTiles() && !deckGlDisabled) {
		return true;
	} else {
		return false;
	}
};


ActiveMetric.prototype.GetSubset = function (coord) {
	if (this.UseBlockedRequests()) {
		return [coord.x, coord.y];
	} else {
		return null;
	}
};

ActiveMetric.prototype.ResolveSegment = function () {
	if (this.properties == null) {
		this.objs.Segment = window.SegMap.Metrics.ClippingSegment;
	} else {
		switch (this.SelectedLevel().Dataset.Type) {
		case 'L':
			this.objs.Segment = (this.isBaseMetric ? window.SegMap.Metrics.BaseLocationsSegment : window.SegMap.Metrics.LocationsSegment);
			break;
		case 'D':
			this.objs.Segment = (this.isBaseMetric ? window.SegMap.Metrics.BaseGeoShapesSegment : window.SegMap.Metrics.GeoShapesSegment);
			break;
		case 'S':
			this.objs.Segment = (this.isBaseMetric ? window.SegMap.Metrics.BaseGeoShapesSegment : window.SegMap.Metrics.GeoShapesSegment);
			break;
		default:
			throw new Error('Unknown dataset metric type');
		}
	}
};
