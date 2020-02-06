import LocationsGeojsonComposer from '@/public/composers/LocationsGeojsonComposer';
import SvgFullGeojsonComposer from '@/public/composers/SvgFullGeojsonComposer';
import Vue from 'vue';

import MetricRouter from '@/public/classes/MetricRouter';
import h from '@/public/js/helper';
import err from '@/common/js/err';
import axios from 'axios';
import fontAwesomeIconsList from '@/common/js/fontAwesomeIconsList.js';
import flatIconsList from '@/common/js/flatIconsList.js';


export default ActiveSelectedMetric;

function ActiveSelectedMetric(selectedMetric, isBaseMetric) {

	this.$Segment = null;
	this.$Router = new MetricRouter(this);
	this.$calculatedSymbol = null;
	this.cancelUpdateSummary = null;
	this.cancelUpdateRanking = null;
	this.properties = selectedMetric;
	this.index = -1;
	this.IsUpdatingSummary = false;
	this.IsUpdatingRanking = false;
	this.isBaseMetric = isBaseMetric;
	this.currentOpacity = -1;
	this.ShowRanking = false;
	this.RankingSize = 10;
	this.RankingDirection = 'D';
	this.KillDuplicateds = true;
	this.fillEmptySummaries();
	this.blockSize = window.SegMap.tileDataBlockSize;
};

ActiveSelectedMetric.prototype.UpdateOpacity = function (zoom) {
	var opacity = 0.7;
	if (this.properties.Transparency === 'B') {
		opacity = 0.95;
	} else if (this.properties.Transparency === 'A') {
		opacity = 0.3;
	}

	if (zoom <= 17) {
		this.currentOpacity = opacity;
	} else {
		this.currentOpacity = opacity * 0.6;
	}
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

ActiveSelectedMetric.prototype.SetSelectedLevelIndex = function (index) {
	this.SelectedVersion().SelectedLevelIndex = index;
};

ActiveSelectedMetric.prototype.Visible = function () {
	return this.properties.Visible && this.SelectedLevel().SelectedVariableIndex !== -1 ;
};

ActiveSelectedMetric.prototype.UpdateSummary = function () {
	var metric = this.properties;
	var loc = this;
	var CancelToken = axios.CancelToken;
	if (this.cancelUpdateSummary !== null) {
		this.cancelUpdateSummary('cancelled');
	}
	this.IsUpdatingSummary = true;
	window.SegMap.Get(window.host + '/services/metrics/GetSummary', {
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


ActiveSelectedMetric.prototype.UpdateRanking = function () {
	if (!this.ShowRanking) {
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

	window.SegMap.Get(window.host + '/services/metrics/GetRanking', {
		params: h.getRankingParams(metric, window.SegMap.frame, this.RankingSize, this.RankingDirection),
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

ActiveSelectedMetric.prototype.SelectVersion = function (index) {
	if (this.properties.SelectedVersionIndex + '' === index + '') {
		return;
	}
	this.properties.SelectedVersionIndex = index;
	this.UpdateSummary();
	this.UpdateMap();
};


ActiveSelectedMetric.prototype.GetVersionIndexByWorkId = function (id) {
	for (var l = 0; l < this.properties.Versions.length; l++) {
		if (this.properties.Versions[l].Work.Id === id) {
			return l;
		}
	}
	return -1;
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
	window.SegMap.SaveRoute.UpdateRoute();
};

ActiveSelectedMetric.prototype.Remove = function () {
	window.SegMap.Metrics.Remove(this);
};

ActiveSelectedMetric.prototype.CreateComposer = function() {
	if (this.SelectedLevel().Dataset.Type === 'L') {
		//case 'L':
		return new LocationsGeojsonComposer(window.SegMap.MapsApi, this);
		/*case 'S':
	case 'D':*/
	} else {
		return new SvgFullGeojsonComposer(window.SegMap.MapsApi, this);
	}
	//if (Number(this.GetPattern()) > 1) {
	//	// Pattern
	//	return new SvgGeojsonComposer(window.SegMap.MapsApi, this);
	//} else {
	//	return new DataGeojsonComposer(window.SegMap.MapsApi, this);
	//}
	/*default:
		throw new Error('Unknown dataset metric type');*/
	//}
};

ActiveSelectedMetric.prototype.GetSymbolInfo = function () {
  // en this.properties.Symbol tiene el símbolo asignada.
	if (this.$calculatedSymbol !== null) {
		return this.$calculatedSymbol;
	}
	// Si del server vino null, lo pone vacío
	var ret = { 'family': 'Arial', 'unicode': ' ', 'weight': '400' };
	var symbol = this.SelectedLevel().Dataset.Symbol;
	if (symbol !== null) {
		var preffix = symbol.substr(0, 3);
		var unicode = null;
		if (preffix === 'fab' || preffix === 'fas') {
			unicode = fontAwesomeIconsList.icons[symbol];
		} else if (preffix === 'fla') {
			unicode = flatIconsList.icons[symbol];
		}
		var family;
		var weight = 'normal';
		switch (preffix) {
			case 'fab':
				family = 'Font Awesome\\ 5 Brands';
				weight = '400';
				break;
			case 'fas':
				family = 'Font Awesome\\ 5 Free';
				weight = '900';
				break;
			case 'fla':
				family = 'Flaticon';
				break;
			default:
				family = '';
				break;
		}
		if (unicode) {
			ret = { 'family': family, 'unicode': unicode, 'weight': weight };
		}
	}
	this.$calculatedSymbol = ret;
	return ret;
};


ActiveSelectedMetric.prototype.showText = function () {
	var minZoom = this.SelectedLevel().MinZoom;
	var pattern = this.GetPattern();
	return (pattern === 2 || this.SelectedVariable().ShowValues == 1) &&
					(minZoom === null || window.SegMap.frame.Zoom >= parseInt(minZoom));
};

ActiveSelectedMetric.prototype.isClickeable = function () {
	var minZoom = this.SelectedLevel().MinZoom;
	return window.SegMap.frame.Zoom >= parseInt(minZoom);
};

ActiveSelectedMetric.prototype.ResolveVisibility = function (labelId) {
	var variable = this.SelectedVariable();
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		if (value['Id'] === labelId) {
			return value.Visible;
		}
	}
	err.errMessage('ResolveVisibility', 'Label did not match on metricVersion ' + this.SelectedVersion().Version.Id + ' of ' + this.properties.Metric.Name + '. Update views and/or fileCache clear may be required.');
	return false;
};

ActiveSelectedMetric.prototype.ResolveStyle = function (labelId) {
	var variable = this.SelectedVariable();
	for (let i = 0; i < variable.ValueLabels.length; i++) {
		var value = variable.ValueLabels[i];
		if (value['Id'] === labelId) {
			var fillColor = value.FillColor;
			if (this.GetPattern() === 1) {
				return /** @type {google.maps.Data.StyleOptions} */({
					fillColor: 'transparent',
					strokeColor: fillColor,
					strokeOpacity: this.currentOpacity,
					fillOpacity: 0,
					strokeWeight: 3,
					zIndex: 10000 - this.index,
				});
			} else {
				return /** @type {google.maps.Data.StyleOptions} */({
					fillColor: fillColor,
					fillOpacity: this.currentOpacity,
					strokeWeight: 1,
					strokeColor: '#808080',
					zIndex: 10000 - this.index,
				});
			}
		}
	}
};

ActiveSelectedMetric.prototype.GetPattern = function () {
	if (this.SelectedVariable().CustomPattern === '') {
		return this.SelectedVariable().Pattern;
	} else {
		return this.SelectedVariable().CustomPattern;
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
	if (l !== this.SelectedLevel().Id) {
		this.SetSelectedLevelIndex(l);
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
	var clippingPassed = !window.SegMap.Clipping.HasClippingLevels();

	var currentLevel = null;
	var currentZoom = window.SegMap.frame.Zoom;
	var currentLevelIndex = null;
	for (var l = 0; l < currentVersion.Levels.length; l++) {
		currentLevelIndex = l;
		currentLevel = currentVersion.Levels[currentLevelIndex];
		if (clippingPassed && currentZoom <= currentLevel.MaxZoom) {
			break;
		}
		if (clippingPassed === false) {
			clippingPassed = window.SegMap.Clipping.LevelMachLevels(currentLevel);
		}
	}
	return currentLevelIndex;
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

	if (this.SelectedLevel().HasArea) {
		ret.push({ Key: 'K', Caption: 'Área' });
		ret.push({ Key: 'A', Caption: 'Distribución de áreas' });
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
		ret.push({ cs: 'cs' + value['Id'], className: 'c' + value['Id'], fillColor: value.FillColor });
	}
	return ret;
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
	switch (this.SelectedLevel().LevelType) {
	case 'L':
			return { url: null, useDatasetId: false, revision: null };
	case 'D':
		return { url: 'geographies/GetGeography', useDatasetId: false, revision: window.SegMap.Revisions.Geography };
	case 'S':
		return { url: 'shapes/GetDatasetShapes', useDatasetId: true, revision: this.properties.Metric.Revision };
	default:
		throw new Error('Unknown dataset metric type');
	}
};

ActiveSelectedMetric.prototype.UseBlockedRequests = function (boundsRectRequired) {
	return this.blockSize && !boundsRectRequired;
};

ActiveSelectedMetric.prototype.GetDataService = function (boundsRectRequired) {
	if (this.UseBlockedRequests(boundsRectRequired)) {
		return 'metrics/GetBlockTileData';
	} else {
		return 'metrics/GetTileData';
	}
};

ActiveSelectedMetric.prototype.GetDataServiceParams = function (coord, boundsRectRequired) {
	if (this.UseBlockedRequests(boundsRectRequired)) {
		return h.getBlockTileParams(this.properties, window.SegMap.frame, coord.x, coord.y, boundsRectRequired, this.blockSize);
	} else {
		return h.getTileParams(this.properties, window.SegMap.frame, coord.x, coord.y, boundsRectRequired);
	}
};

ActiveSelectedMetric.prototype.GetSubset = function (coord, boundsRectRequired) {
	if (this.UseBlockedRequests(boundsRectRequired)) {
		return [coord.x, coord.y];
	} else {
		return null;
	}
};

ActiveSelectedMetric.prototype.ResolveSegment = function () {
	if (this.properties == null) {
		this.$Segment = window.SegMap.Metrics.ClippingSegment;
	} else {
		switch (this.SelectedLevel().LevelType) {
		case 'L':
			this.$Segment = (this.isBaseMetric ? window.SegMap.Metrics.BaseLocationsSegment : window.SegMap.Metrics.LocationsSegment);
			break;
		case 'D':
			this.$Segment = (this.isBaseMetric ? window.SegMap.Metrics.BaseGeoShapesSegment : window.SegMap.Metrics.GeoShapesSegment);
			break;
		case 'S':
			this.$Segment = (this.isBaseMetric ? window.SegMap.Metrics.BaseGeoShapesSegment : window.SegMap.Metrics.GeoShapesSegment);
			break;
		default:
			throw new Error('Unknown dataset metric type');
		}
	}
};
