import LocationsComposer from '@/public/composers/LocationsComposer';
import DataShapeComposer from '@/public/composers/DataShapeComposer';
import SegmentsComposer from '@/public/composers/SegmentsComposer';
import ActiveMetric from './ActiveMetric';
import Compare from './Compare.js';
import Vue from 'vue';

import h from '@/public/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';


export default ActiveSelectedMetric;

function ActiveSelectedMetric(selectedMetric) {
	ActiveMetric.call(this, selectedMetric);
	// Pone lo específico
	this.cancelUpdateSummary = null;
	this.cancelUpdateRanking = null;
	this.IsUpdatingSummary = false;
	this.IsUpdatingRanking = false;
	this.isBaseMetric = false;
	this.ShowRanking = false;
	this.RankingSize = 10;
	this.RankingDirection = 'D';
	this.activeSequenceSteps = {};
	this.overlay = null;
	this.blockSize = window.SegMap.tileDataBlockSize;
	this.fillEmptySummaries();
};

ActiveSelectedMetric.prototype = new ActiveMetric();

ActiveSelectedMetric.prototype.GetSelectedUrbanityInfo = function () {
	var ret = this.GetUrbanityFilters()[this.properties.SelectedUrbanity];
	if (!ret) {
		return this.GetUrbanityFilters()['N'];
	} else {
		return ret;
	}
};

ActiveSelectedMetric.prototype.GetUrbanityFilters = function (skipAllElement) {
	var ret = {
		'N': { label: 'Sin filtro', tooltip: '' },
		'UD': { label: 'Urbano total', tooltip: 'Áreas de 2 mil habitantes y más (URP=1)' },
		'U': { label: 'Urbano agrupado', tooltip: 'Áreas de 2 mil habitantes y más (URP=1) con 250 habitantes por km2 y más' },
		'D': { label: 'Urbano disperso', tooltip: 'Áreas de 2 mil habitantes y más (URP=1) con menos de 250 habitantes por km2' },
		'X': { separator: true },
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
				if (variable.ComparableValueLabels) {
					variable.ComparableValueLabels.forEach(function (label) {
						label.Values = {
							Value: '',
							ValueCompare: '',
							Summary: '',
							Count: '',
							Total: '',
							TotalCompare: '',
							Km2: '',
							VariableId: variable.Id,
							ValueId: label.Id,
						};
					});
				}
			});
		});
	});
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

	this.properties.EffectivePartition = this.GetSelectedPartition();

	window.SegMap.Get(window.host + '/services/frontend/metrics/GetSummary', {
		params: h.getSummaryParams(this, window.SegMap.frame),
		cancelToken: new CancelToken(function executor(c) { loc.cancelUpdateSummary = c; }),
	}).then(function (res) {
		loc.cancelUpdateSummary = null;
		if (res.message === 'cancelled') {
			return;
		}
		loc.IsUpdatingSummary = false;
		loc.fillEmptySummaries();
		res.data.Items.forEach(function (num) {
			var level = loc.SelectedLevel();
			var variable = h.getVariable(level.Variables, num.VariableId);
			if (variable !== null) {
				var values = loc.ResolveVariableValues(variable);
				var label = h.getValueLabel(values, num.ValueId);
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

	this.properties.EffectivePartition = this.GetSelectedPartition();

	window.SegMap.Get(window.host + '/services/frontend/metrics/GetRanking', {
		params: h.getRankingParams(this, window.SegMap.frame, this.RankingSize, this.RankingDirection, hiddenValueLabels),
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

ActiveSelectedMetric.prototype.Remove = function () {
	window.SegMap.Session.Content.RemoveMetric(this.properties.Metric.Id);
	window.SegMap.Metrics.Remove(this);
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

ActiveSelectedMetric.prototype.GetDataService = function (seed) {
	var isDeckGLLayer = this.IsDeckGLLayer();
	if (isDeckGLLayer) {
		var v = this.SelectedVariable();
		if (v && (!v.ShowDescriptions || v.ShowDescriptions == '0')) {
			return null;
		}
	}
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
	this.properties.EffectivePartition = this.GetSelectedPartition();
	if (this.UseBlockedRequests()) {
		return h.getBlockTileParams(this, window.SegMap.frame, coord.x, coord.y, suffix, this.blockSize);
	} else {
		return h.getTileParams(this, window.SegMap.frame, coord.x, coord.y, suffix);
	}
};

ActiveSelectedMetric.prototype.GetSubset = function (coord) {
	if (this.UseBlockedRequests()) {
		return [coord.x, coord.y];
	} else {
		return null;
	}
};

