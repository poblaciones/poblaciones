import LocationsComposer from '@/public/composers/LocationsComposer';
import DataShapeComposer from '@/public/composers/DataShapeComposer';
import SegmentsComposer from '@/public/composers/SegmentsComposer';
import Vue from 'vue';

import h from '@/public/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';


export default ActiveSelectedMetric;

function ActiveSelectedMetric(selectedMetric, isBaseMetric) {
	this.objs = {};
	this.objs.Segment = null;
	this.objs.composer = null;
	this.cancelUpdateSummary = null;
	this.cancelUpdateRanking = null;
	this.properties = selectedMetric;
	this.index = -1;
	this.IsLocked = false;
	this.IsUpdatingSummary = false;
	this.IsUpdatingRanking = false;
	this.isBaseMetric = isBaseMetric;
	this.ShowRanking = false;
	this.RankingSize = 10;
	this.RankingDirection = 'D';
	this.KillDuplicateds = true;
	this.fillEmptySummaries();
	this.activeSequenceSteps = {};
	this.blockSize = window.SegMap.tileDataBlockSize;
};

ActiveSelectedMetric.prototype.GetAllLevels = function () {
	var ret = [];
	for (var n = 0; n < this.properties.Versions.length; n++) {
		ret = ret.concat(this.properties.Versions[n].Levels);
	}
	return ret;
};

ActiveSelectedMetric.prototype.GetAllVariables = function () {
	var levels = this.GetAllLevels();
	var ret = [];
	for (var n = 0; n < levels.length; n++) {
		ret = ret.concat(levels[n].Variables);
	}
	return ret;
};

ActiveSelectedMetric.prototype.UpdateOpacity = function (zoom) {
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

ActiveSelectedMetric.prototype.GetSelectedUrbanityInfo = function () {
	return this.GetUrbanityFilters()[this.properties.SelectedUrbanity];
};

ActiveSelectedMetric.prototype.GetUrbanityFilters = function (skipAllElement) {
	var ret = {
		'N': { label: 'Sin filtro', tooltip: '' },
		'UD': { label: 'Urbano total', tooltip: 'Áreas de 2 mil habitantes y más (URP=1)' },
		'U': { label: 'Urbano agrupado', tooltip: 'Áreas de 2 mil habitantes y más (URP=1) con 250 habitantes por km2 y más' },
		'D': { label: 'Urbano disperso', tooltip: 'Áreas de 2 mil habitantes y más (URP=1) con menos de 250 habitantes por km2', border: true },
		'RL': { label: 'Rural total', tooltip: 'Áreas de menos de 2 mil habitantes (URP=2+3)' },
		'R': { label: 'Rural agrupado', tooltip: 'Áreas de menos de 2 mil habitantes agrupadas (URP=2)' },
		'L': { label: 'Rural disperso', tooltip: 'Áreas de menos de 2 mil habitantes dispersas (URP=3)' }
	};
	if (skipAllElement) {
		arr.RemoveByKey(ret, 'N');
	}
	return ret;
};

ActiveSelectedMetric.prototype.fillEmptySummaries = function () {
	this.properties.Versions.forEach(function (version) {
		version.Levels.forEach(function (level) {
			level.Variables.forEach(function (variable) {
				variable.visible = false;
				variable.ValueLabels.forEach(function (label) {
					label.Values = {
						Value: '',
						Summary: '',
						Count: '',
						Total: '',
						Km2: '',
						VariableId: variable.Id,
						ValueId: label.Id,
					};
				});
			});
		});
	});
};

ActiveSelectedMetric.prototype.ChangeMetricVisibility = function () {
	this.properties.Visible = !this.properties.Visible;
	this.UpdateMap();
};

ActiveSelectedMetric.prototype.ChangeSelectedLevelIndex = function (index) {
	// Cambia el level, intentando mantener la variable seleccionado.
	// La mantiene si el caption coincide.
	var variable = this.SelectedVariable();
	var name = (variable !== null ? variable.Name : null);
	this.SelectedVersion().SelectedLevelIndex = index;
	this.SetSelectedVariableByName(name);
};

ActiveSelectedMetric.prototype.SetSelectedVariableByName = function (name) {
	var level = this.SelectedLevel();
	for (var l = 0; l < level.Variables.length; l++) {
		if (level.Variables[l].Name === name) {
			level.SelectedVariableIndex = l;
			break;
		}
	}
};

ActiveSelectedMetric.prototype.Visible = function () {
	return this.properties.Visible && this.SelectedLevel().SelectedVariableIndex !== -1;
};

ActiveSelectedMetric.prototype.UpdateSummary = function () {
	var metric = this.properties;
	var loc = this;
	var CancelToken = axios.CancelToken;
	if (this.cancelUpdateSummary !== null) {
		this.cancelUpdateSummary('cancelled');
	}
	this.IsUpdatingSummary = true;
	this.IsUpdatingRanking = true;

	window.SegMap.Get(window.host + '/services/frontend/metrics/GetSummary', {
		params: h.getSummaryParams(metric, window.SegMap.frame),
		cancelToken: new CancelToken(function executor(c) { loc.cancelUpdateSummary = c; }),
	}).then(function (res) {
		loc.cancelUpdateSummary = null;
		if (res.message === 'cancelled') {
			return;
		}
		loc.IsUpdatingSummary = false;
		loc.fillEmptySummaries();
		res.data.Items.forEach(function (num) {
			var variable = h.getVariable(metric.Versions[metric.SelectedVersionIndex].Levels[metric.Versions[metric.SelectedVersionIndex].SelectedLevelIndex].Variables, num.VariableId);
			if (variable !== null) {
				var label = h.getValueLabel(variable.ValueLabels, num.ValueId);
				if (label !== null) {
					label.Values = num;
				}
			}
		});
	}).catch(function (error) {
		err.errDialog('GetSummary', 'obtener las estadísticas de resumen', error);
	});
};

ActiveSelectedMetric.prototype.useRankings = function () {
	var variable = this.SelectedVariable();
	if (variable) {
		return !variable.IsSimpleCount && !variable.IsCategorical;
	} else {
		return false;
	}
};

ActiveSelectedMetric.prototype.UpdateRanking = function () {
	if (!this.ShowRanking || ! this.useRankings()) {
		return;
	}
	var metric = this.properties;
	var variable = this.SelectedVariable();
	if (!variable) {
		return;
	}
	var loc = this;
	var CancelToken = axios.CancelToken;
	if (this.cancelUpdateRanking !== null) {
		this.cancelUpdateRanking('cancelled');
	}
	this.IsUpdatingRanking = true;
	var hiddenValueLabels = this.getHiddenValueLabels(variable);

	window.SegMap.Get(window.host + '/services/frontend/metrics/GetRanking', {
		params: h.getRankingParams(metric, window.SegMap.frame, this.RankingSize, this.RankingDirection, hiddenValueLabels),
		cancelToken: new CancelToken(function executor(c) { loc.cancelUpdateRanking = c; }),
	}).then(function (res) {
		loc.cancelUpdateRanking = null;
		if (res.message === 'cancelled') {
			return;
		}
		loc.IsUpdatingRanking = false;

		variable.RankingItems = res.data.Items;
	}).catch(function (error) {
		err.errDialog('GetRanking', 'obtener el ranking', error);
	});
};

ActiveSelectedMetric.prototype.getHiddenValueLabels = function (variable) {
	var ret = '';
	for (var n = 0; n < variable.ValueLabels.length; n++)
		if (!variable.ValueLabels[n].Visible) {
			ret += ',' + variable.ValueLabels[n].Id;
		}
	if (ret.length > 0) {
		ret = ret.substring(1);
	}
	return ret;
};

ActiveSelectedMetric.prototype.SelectVersion = function (index) {
	if (this.properties.SelectedVersionIndex + '' === index + '') {
		return;
	}
	this.properties.SelectedVersionIndex = index;
	this.UpdateSummary();
	this.UpdateMap();
};


ActiveSelectedMetric.prototype.GetFirstValidVersionIndexByWorkId = function (id) {
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

ActiveSelectedMetric.prototype.GetVersionById = function (id) {
	var index = this.GetVersionIndex(id);
	if (index === -1) {
		return null;
	}
	return this.prop.Versions[index];
};

ActiveSelectedMetric.prototype.GetVariableById = function (variableId) {
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

ActiveSelectedMetric.prototype.GetVersionIndex = function (id) {
	for (var l = 0; l < this.properties.Versions.length; l++) {
		if (this.properties.Versions[l].Version.Id === id) {
			return l;
		}
	}
	return -1;
};

ActiveSelectedMetric.prototype.SelectedVersion = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	return this.properties.Versions[this.properties.SelectedVersionIndex];
};

ActiveSelectedMetric.prototype.SelectedLevelIndex = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var version = this.SelectedVersion();
	return version.SelectedLevelIndex;
};

ActiveSelectedMetric.prototype.SelectedLevel = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	var version = this.SelectedVersion();
	return version.Levels[version.SelectedLevelIndex];
};

ActiveSelectedMetric.prototype.HasSelectedVersion = function () {
	return this.properties !== null && this.properties.SelectedVersionIndex >= 0 && this.properties.SelectedVersionIndex < this.properties.Versions.length;
};

ActiveSelectedMetric.prototype.HasSelectedLevel = function () {
	if (this.HasSelectedVersion() === false) {
		return false;
	}
	var version = this.SelectedVersion();
	return version.SelectedLevelIndex >= 0 && version.SelectedLevelIndex < version.Levels.length;
};

ActiveSelectedMetric.prototype.HasSelectedVariable = function () {
	if (this.HasSelectedLevel() === false) {
		return false;
	}
	var level = this.SelectedLevel();
	return level.SelectedVariableIndex >= 0 && level.SelectedVariableIndex < level.Variables.length;
};

ActiveSelectedMetric.prototype.SelectedVariable = function () {
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

ActiveSelectedMetric.prototype.UpdateMap = function () {
	this.UpdateLevel();
	window.SegMap.Metrics.UpdateMetric(this);
	window.SegMap.InfoWindow.CheckUpdateNavigation();
	window.SegMap.SaveRoute.UpdateRoute();
};

ActiveSelectedMetric.prototype.Remove = function () {
	window.SegMap.Metrics.Remove(this);
};

ActiveSelectedMetric.prototype.useTiles = function () {
	if (this.SelectedLevel().Dataset.AreSegments) {
		return true;
	} else if (this.SelectedLevel().Dataset.Type === 'L') {
		return false;
	} else {
		return true;
	}
};

ActiveSelectedMetric.prototype.CreateComposer = function () {
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

ActiveSelectedMetric.prototype.GetActiveSequenceStep = function (variableId, labelId) {
	var variable = this.GetVariableById(variableId);
	if (!variable) {
		return 1;
	}
	for (var n = 0; n < variable.ValueLabels.length; n++) {
		if (variable.ValueLabels[n].Id === labelId) {
			return (variable.ValueLabels[n].ActiveStep ? variable.ValueLabels[n].ActiveStep : 1);
		}
	}
	return 1;
};

ActiveSelectedMetric.prototype.SetActiveSequenceStep = function (variableId, labelId, value) {
	// Establece la selección
	var variable = this.GetVariableById(variableId);
	if (!variable) {
		return;
	}
	// Verifica si hay cambio
	var keep = this.GetActiveSequenceStep(variableId, labelId);
	if (keep === value) {
		return;
	}
	// La setea
	for (var n = 0; n < variable.ValueLabels.length; n++) {
		if (variable.ValueLabels[n].Id === labelId) {
			variable.ValueLabels[n].ActiveStep = value;
		}
	}
	// Regenera el anterior y el nuevo seleccionado
	if (this.objs.composer) {
		this.objs.composer.SequenceHandler.RecreateSequenceMarker(labelId, keep);
		this.objs.composer.SequenceHandler.RecreateSequenceMarker(labelId, value);
	}
	window.SegMap.SaveRoute.UpdateRoute();
};

ActiveSelectedMetric.prototype.showText = function () {
	var minZoom = this.SelectedLevel().MinZoom;
	var pattern = this.GetPattern();
	return (pattern === 2 || this.SelectedVariable().ShowValues == 1) &&
					(minZoom === null || window.SegMap.frame.Zoom >= parseInt(minZoom));
};

ActiveSelectedMetric.prototype.CreateParentInfo = function (variable, feature) {
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

ActiveSelectedMetric.prototype.isClickeable = function () {
	var minZoom = this.SelectedLevel().MinZoom;
	return window.SegMap.frame.Zoom >= parseInt(minZoom);
};

ActiveSelectedMetric.prototype.IsFiltering = function () {
	var variable = this.SelectedVariable();
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		if (!value.Visible) {
			return true;
		}
	}
	return false;
};

ActiveSelectedMetric.prototype.ResolveValueLabelVisibility = function (labelId) {
	var variable = this.SelectedVariable();
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		if (value['Id'] === labelId) {
			return value.Visible;
		}
	}
	err.errMessage('ResolveVisibility', 'Label did not match on metricVersion ' + this.SelectedVersion().Version.Id + ' of ' + this.properties.Metric.Name + '. Update views and/or fileCache clear may be required (getTileData cache).');
	return false;
};

ActiveSelectedMetric.prototype.ResolveValueLabelSymbol = function (labelId) {
	var variable = this.SelectedVariable();
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		if (value['Id'] === labelId) {
			return value.Symbol;
		}
	}
	err.errMessage('ResolveSymbol', 'Label did not match on metricVersion ' + this.SelectedVersion().Version.Id + ' of ' + this.properties.Metric.Name + '. Update views and/or fileCache clear may be required.');
	return false;
};

ActiveSelectedMetric.prototype.ResolveStyle = function (variable, labelId) {
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
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

ActiveSelectedMetric.prototype.GetPattern = function (variable) {
	if (!variable) {
		variable = this.SelectedVariable();
	}
	if (variable.CustomPattern === '') {
		return variable.Pattern;
	} else {
		return variable.CustomPattern;
	}
};
ActiveSelectedMetric.prototype.ReleasePins = function () {
	for (var v = 0; v < this.properties.Versions.length; v++) {
		for (var l = 0; l < this.properties.Versions[v].Levels.length; l++) {
			var level = this.properties.Versions[v].Levels[l];
			if (level.Pinned) {
				level.Pinned = false;
			}
		}
	}
};

ActiveSelectedMetric.prototype.UpdateLevel = function () {
	if (this.SelectedLevel().Pinned) {
		return false;
	}
	var l = this.CalculateProperLevel();
	if (l !== this.SelectedLevelIndex()) {
		this.ChangeSelectedLevelIndex(l);
		this.CheckValidMetric();
		return true;
	} else {
		return false;
	}
};

ActiveSelectedMetric.prototype.CheckValidMetric = function () {
	var metrics = this.getValidMetrics();
	var current = this.properties.SummaryMetric;
	for (var n = 0; n < metrics.length; n++) {
		if (current === metrics[n].Key) {
			return;
		}
	}
	this.properties.SummaryMetric = metrics[0].Key;
};

ActiveSelectedMetric.prototype.CalculateProperLevel = function () {
	var currentVersion = this.SelectedVersion();
	if (currentVersion.Levels.length < 2) {
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
	var last = currentVersion.Levels.length - 1;
	if (currentZoom > currentVersion.Levels[last].MaxZoom) {
		// Si es más grande que el máximo, devuelve ese
		return last;
	}
	for (var l = validFrom; l < currentVersion.Levels.length; l++) {
		var currentLevel = currentVersion.Levels[l];
		if (currentZoom >= currentLevel.MinZoom && currentZoom <= currentLevel.MaxZoom) {
			return l;
		}
	}
	// Trata de devolver uno válido, incluso si no está en el rango de zoom
	return currentVersion.Levels.length - 1;
};

ActiveSelectedMetric.prototype.LevelValidFrom = function() {
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

ActiveSelectedMetric.prototype.getValidPatterns = function () {
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

ActiveSelectedMetric.prototype.getValidMetrics = function (variable) {
	var ret = [];
	if (!variable) {
		variable = this.SelectedVariable();
	}
	ret.push({ Key: 'N', Caption: 'Cantidad' });

	if (variable && variable.HasTotals) {
		ret.push({ Key: 'I', Caption: 'Incidencia' });
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

ActiveSelectedMetric.prototype.GetStyleColorList = function() {
	var variable = this.SelectedVariable();
	var ret = [];
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		ret.push({ cs: 'cs' + value['Id'], className: value['Id'], fillColor: value.FillColor });
	}
	return ret;
};

ActiveSelectedMetric.prototype.CurrentOpacity = function () {
	return this.SelectedVariable().CurrentOpacity;
};

ActiveSelectedMetric.prototype.GetStyleColorDictionary = function () {
	var variable = this.SelectedVariable();
	var ret = {};
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		ret[value['Id']] = value.FillColor;
	}
	return ret;
};

ActiveSelectedMetric.prototype.CheckTileIsOutOfClipping = function() {
	return (window.SegMap.Clipping.clipping.IsUpdating !== '1');
};

ActiveSelectedMetric.prototype.GetCartographyService = function () {
	if (this.SelectedLevel().Dataset.AreSegments) {
		return { url: null, revision: null };
	}
	switch (this.SelectedLevel().Dataset.Type) {
	case 'L':
			return { url: null, revision: null };
	case 'D':
		return { url: h.resolveMultiUrl(window.SegMap.Configuration.StaticServer, '/services/frontend/geographies/GetGeography'), revision: window.SegMap.Signatures.Geography };
		case 'S':
			var url = null;
			var uri = '/services/frontend/shapes/GetDatasetShapes';
			var useStaticQueue = window.SegMap.Configuration.StaticWorks.indexOf(this.SelectedVersion().Work.Id) !== -1;
			if (useStaticQueue) {
				url = h.resolveMultiUrl(window.SegMap.Configuration.StaticServer, uri);
			} else {
				url = window.host + uri;
			}
			return { url: url, isDatasetShapeRequest: true, revision: this.properties.Metric.Signature };
	default:
		throw new Error('Unknown dataset metric type');
	}
};

ActiveSelectedMetric.prototype.UseBlockedRequests = function () {
	return this.blockSize;
};

ActiveSelectedMetric.prototype.GetLayerData = function () {
	var url = this.GetLayerDataService();

	return window.SegMap.Get(url.server + url.path, {
		params: url.params }, url.useStaticQueue).then(function (res) {
		return res.data.Data;
	});
};

ActiveSelectedMetric.prototype.GetLayerDataService = function (seed) {
	var useStaticQueue = window.SegMap.Configuration.StaticWorks.indexOf(this.SelectedVersion().Work.Id) !== -1;
	var server = '';

	var path = '/services/frontend/metrics/GetLayerData';

	if (useStaticQueue) {
		server = h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed);
	} else {
		server = window.host;
	}
	var params = h.getLayerDataParams(this.properties, window.SegMap.frame);
	return { server: server, path: path, useStaticQueue: useStaticQueue, params: params };
};

ActiveSelectedMetric.prototype.GetDataService = function (seed) {
	var useStaticQueue = window.SegMap.Configuration.StaticWorks.indexOf(this.SelectedVersion().Work.Id) !== -1;
	var path = '';
	var server = '';

	if (this.UseBlockedRequests()) {
		path = '/services/frontend/metrics/GetBlockTileData';
		seed = seed / this.blockSize;
	} else {
		path = '/services/frontend/metrics/GetTileData';
	}

	if (useStaticQueue) {
		server = h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed);
	} else {
		server = window.host;
	}
	return { server: server, path: path, useStaticQueue: useStaticQueue };
};

ActiveSelectedMetric.prototype.GetDataServiceParams = function (coord) {
	var suffix = window.SegMap.Signatures.Suffix;
	if (this.UseBlockedRequests()) {
		return h.getBlockTileParams(this.properties, window.SegMap.frame, coord.x, coord.y, suffix, this.blockSize);
	} else {
		return h.getTileParams(this.properties, window.SegMap.frame, coord.x, coord.y, suffix);
	}
};

ActiveSelectedMetric.prototype.GetSubset = function (coord) {
	if (this.UseBlockedRequests()) {
		return [coord.x, coord.y];
	} else {
		return null;
	}
};

ActiveSelectedMetric.prototype.ResolveSegment = function () {
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
