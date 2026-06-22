import ActiveMetric from './ActiveMetric';
import Summary from './Summary';

import h from '@/map/js/helper';
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
	this.ShowChart = true;
	this.RankingSize = 10;
	this.RankingDirection = 'D';
	this.Summary = new Summary(this);
	this.activeSequenceSteps = {};
	this.overlay = null;
	this.blockSize = (window.SegMap ? window.SegMap.tileDataBlockSize : null);
	this.fillEmptySummaries();

	// Estado de selección extendida usado por la pivot (multi-versión, multi-
	// categoría). En el mapa estos campos quedan presentes pero inactivos,
	// porque el flag AllowRowPercent / la lectura de SelectedVersionIndices
	// la hace solo el consumidor que la necesite.
	// Garantiza un SelectedVersionIndex válido: el backend puede no traerlo, y
	// el header lo setea a 0 recién en mounted; sin esto, GetTuples vería
	// Versions[undefined] y no generaría tuplas.
	if (this.properties.SelectedVersionIndex == null ||
		this.properties.SelectedVersionIndex < 0 ||
		this.properties.SelectedVersionIndex >= this.properties.Versions.length) {
		this.properties.SelectedVersionIndex = 0;
	}
	this.properties.SelectedVersionIndices = [this.properties.SelectedVersionIndex];
	this.properties.MultiVersion = false;
	this.properties.IncludeTotal = true;
	this.properties.SelectedLabelIds = {};
	this._initSelectedLabelIds();
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

ActiveSelectedMetric.prototype.useComparer = function () {
	return window.Use.UseCompareSeries && this.properties.Comparable && this.properties.Versions.length > 1;
};

ActiveSelectedMetric.prototype.hasComparableVariables = function () {
	return this.SelectedLevelCanBeCompared() && (this.SelectedLevel().Variables.length > this.getNonComparableVariables().length);
};

ActiveSelectedMetric.prototype.hasNonComparableVariables = function () {
	return this.getNonComparableVariables().length > 0;
};

ActiveSelectedMetric.prototype.getNonComparableVariables = function () {
	var ret = [];
	for (var variable of this.SelectedLevel().Variables) {
		if (!this.matchesComparableFilter(variable)) {
			ret.push(variable);
		}
	}
	return ret;
};

ActiveSelectedMetric.prototype.matchesComparableFilter = function (variable) {
	if (!this.useComparer()) {
		return true;
	}
	return (!this.Compare.Active || variable.Comparable);
};

ActiveSelectedMetric.prototype.SelectedLevelCanBeCompared = function () {
	if (!this.useComparer()) return false;
	if (this.IsMultiLevel() && this.LastLevelDontMultilevel()) {
		return this.SelectedLevel() !== this.BottomLevel();
	}
	return true;
};


ActiveSelectedMetric.prototype.useChart = function () {
	var variable = this.SelectedVariable();
	if (variable) {
		var values = this.getVariableValueLabels(variable);
		return values.length > 1;
	} else {
		return false;
	}
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
	// Define si usa servidores secundarios...
	var useStaticQueue = window.SegMap.Configuration.StaticWorks.indexOf(this.SelectedVersion().Work.Id) !== -1;
	// Tiene que estar las dos...
	if (this.Compare.Active && this.SelectedLevelCanBeCompared()) {
		if (window.SegMap.Configuration.StaticWorks.indexOf(this.Compare.SelectedVersion().Work.Id) === -1) {
			useStaticQueue = false;
		}
	}
	// Listo
	var path = '';
	var server = '';

	var service = (this.isBaseMetric ? 'Base' : '');
	if (this.UseBlockedRequests()) {
		path = '/services/frontend/metrics/Get' + service + 'BlockTileData';
		seed = seed / this.blockSize;
	} else {
		path = '/services/frontend/metrics/Get' + service + 'TileData';
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

ActiveSelectedMetric.prototype.ResolveSegment = function () {
	if (this.properties == null) {
		this.objs.Segment = window.SegMap.Metrics.ClippingSegment;
	} else {
		switch (this.SelectedLevel().Dataset.Type) {
			case 'L':
				this.objs.Segment = window.SegMap.Metrics.LocationsSegment;
				break;
			case 'D':
				this.objs.Segment = window.SegMap.Metrics.GeoShapesSegment;
				break;
			case 'S':
				this.objs.Segment = window.SegMap.Metrics.GeoShapesSegment;
				break;
			default:
				throw new Error('Unknown dataset metric type');
		}
	}
};

// ─── Selección extendida (multi-versión, multi-categoría) ───────────────────
// Estos métodos solo participan cuando un consumidor (la pivot) los usa; el
// mapa sigue mirando SelectedVersionIndex / SelectedLevel / SelectedVariable
// como hasta ahora.

// Inicializa SelectedLabelIds[versionId] = { labels: [], includeTotal: true }
// para cada versión que aún no tenga selección. labels vacío significa "solo
// la columna Total agregada"; la apertura efectiva de categorías la habilita
// la UI cuando el usuario interactúa con el combo Categorías.
ActiveSelectedMetric.prototype._initSelectedLabelIds = function () {
	var props = this.properties;
	props.SelectedLabelIds = props.SelectedLabelIds || {};
	for (var vi = 0; vi < props.Versions.length; vi++) {
		var v = props.Versions[vi];
		var versionId = v.Version.Id;
		if (props.SelectedLabelIds[versionId]) continue;
		props.SelectedLabelIds[versionId] = { labels: [], includeTotal: props.IncludeTotal !== false };
	}
};

// Re-aplica la selección de categorías de una versión "fuente" a una versión
// "destino" buscando coincidencias por Name (los Id son específicos por
// versión). Se usa al cambiar de versión en single-mode para preservar la
// experiencia del usuario.
ActiveSelectedMetric.prototype.RematchSelectedLabelsByName = function (fromVersionId, toVersionId) {
	var props = this.properties;
	var fromSel = props.SelectedLabelIds[fromVersionId];
	if (!fromSel) return;

	var fromVersion = null, toVersion = null;
	for (var i = 0; i < props.Versions.length; i++) {
		if (props.Versions[i].Version.Id === fromVersionId) fromVersion = props.Versions[i];
		if (props.Versions[i].Version.Id === toVersionId)   toVersion   = props.Versions[i];
	}
	if (!fromVersion || !toVersion) return;

	var fromLevel = fromVersion.Levels[fromVersion.SelectedLevelIndex];
	var toLevel   = toVersion.Levels[toVersion.SelectedLevelIndex];
	if (!fromLevel || !toLevel) return;
	var fromVar = fromLevel.Variables[fromLevel.SelectedVariableIndex];
	var toVar   = toLevel.Variables[toLevel.SelectedVariableIndex];
	if (!fromVar || !toVar) return;

	var selectedNames = {};
	var fromLabels = fromVar.ValueLabels || [];
	for (var j = 0; j < fromLabels.length; j++) {
		if (fromSel.labels.indexOf(fromLabels[j].Id) !== -1) {
			selectedNames[fromLabels[j].Name] = true;
		}
	}

	var newSelected = [];
	var toLabels = toVar.ValueLabels || [];
	for (var k = 0; k < toLabels.length; k++) {
		if (selectedNames[toLabels[k].Name]) newSelected.push(toLabels[k].Id);
	}

	props.SelectedLabelIds[toVersionId] = { labels: newSelected, includeTotal: fromSel.includeTotal !== false };
};

// Devuelve los índices de versión activos según el estado actual (single o
// multi). Cuando MultiVersion es false, devuelve [SelectedVersionIndex].
ActiveSelectedMetric.prototype.ActiveVersionIndices = function () {
	var props = this.properties;
	if (props.MultiVersion) {
		// En multi-versión la lista manda, incluso si quedó vacía (sin columnas).
		return Array.isArray(props.SelectedVersionIndices) ? props.SelectedVersionIndices.slice() : [];
	}
	return [props.SelectedVersionIndex];
};

// Emite las tuplas de métrica que este indicador aporta al pivot. Cada tupla
// combina versión × categoría (incluyendo opcionalmente la "Total" del grupo) y
// el dataset la proyecta luego a una columna física.
//
// tuple.key es la clave estable: m:<mId>|v:<vId>|l:<lId>|a:<aId>|s:<mode>|c:<cId>
//   donde cId es: <labelId> | 'total' | 'none'
ActiveSelectedMetric.prototype.GetTuples = function () {
	var props = this.properties;
	var ret = [];
	var versionIndices = this.ActiveVersionIndices();

	// Sin versiones activas (multi-versión con todo desmarcado): una tupla
	// placeholder marcada isEmpty, para que el indicador siga visible en el
	// encabezado (con su control de versión en "Ninguno") y se puedan volver a
	// elegir ediciones. No produce datos; los consumidores la ignoran por isEmpty.
	if (versionIndices.length === 0) {
		ret.push(this._makeEmptyTuple());
		return ret;
	}

	for (var i = 0; i < versionIndices.length; i++) {
		var vIdx = versionIndices[i];
		if (vIdx == null || vIdx < 0 || vIdx >= props.Versions.length) vIdx = 0;
		var version = props.Versions[vIdx];
		var level = null;
		var variable = null;
		if (version) {
			var lvlIdx = version.SelectedLevelIndex;
			if (lvlIdx == null || lvlIdx < 0 || lvlIdx >= version.Levels.length) lvlIdx = 0;
			level = version.Levels[lvlIdx];
		}
		if (level) {
			var varIdx = level.SelectedVariableIndex;
			if (varIdx == null || varIdx < 0 || varIdx >= level.Variables.length) varIdx = 0;
			variable = level.Variables[varIdx];
		}
		if (variable) {
			this._appendVersionTuples(ret, version, level, variable);
		}
	}

	// Si las versiones activas no produjeron ninguna tupla (caso de borde),
	// también se emite la placeholder para no perder el indicador.
	if (ret.length === 0) {
		ret.push(this._makeEmptyTuple());
	}
	return ret;
};

// Agrega a `ret` las tuplas de una versión: una por categoría seleccionada (más
// la Total si corresponde), o una sola si la variable no tiene categorías.
ActiveSelectedMetric.prototype._appendVersionTuples = function (ret, version, level, variable) {
	var labels = variable.ValueLabels || [];
	if (labels.length === 0) {
		ret.push(this._makeTuple(version, level, variable, null, null, false));
		return;
	}

	var selection = this.properties.SelectedLabelIds[version.Version.Id];
	var selSet = {};
	if (selection && selection.labels) {
		for (var s = 0; s < selection.labels.length; s++) selSet[selection.labels[s]] = true;
	}
	for (var j = 0; j < labels.length; j++) {
		if (selSet[labels[j].Id]) {
			ret.push(this._makeTuple(version, level, variable, labels[j].Id, labels[j].Name, false));
		}
	}
	if (selection && selection.includeTotal !== false) {
		ret.push(this._makeTuple(version, level, variable, null, 'Total', true));
	}
};

// Tupla placeholder: indicador presente pero sin datos (todas las versiones
// desmarcadas). Tiene key estable y isEmpty=true.
ActiveSelectedMetric.prototype._makeEmptyTuple = function () {
	var tuple = {
		metric: this,
		metricId: this.properties.Metric.Id,
		metricName: this.properties.Metric.Name,
		version: null,
		versionId: null,
		versionName: null,
		level: null,
		levelId: null,
		levelName: null,
		variable: null,
		variableId: null,
		variableName: null,
		summary: this.properties.SummaryMetric,
		labelId: null,
		labelName: null,
		isTotal: false,
		isEmpty: true
	};
	tuple.key = 'm:' + tuple.metricId + '|empty';
	return tuple;
};

ActiveSelectedMetric.prototype._makeTuple = function (version, level, variable, labelId, labelName, isTotal) {
	var tuple = {
		metric: this,
		metricId: this.properties.Metric.Id,
		metricName: this.properties.Metric.Name,
		version: version,
		versionId: version.Version.Id,
		versionName: version.Version.Name,
		level: level,
		levelId: level.Id,
		levelName: level.Name,
		variable: variable,
		variableId: variable.Id,
		variableName: variable.Name,
		summary: this.properties.SummaryMetric,
		labelId: labelId,
		labelName: labelName,
		isTotal: !!isTotal
	};
	tuple.key = 'm:' + tuple.metricId +
			   '|v:' + tuple.versionId +
			   '|l:' + tuple.levelId +
			   '|a:' + tuple.variableId +
			   '|s:' + (tuple.summary || '') +
			   '|c:' + (tuple.isTotal ? 'total' : (tuple.labelId != null ? tuple.labelId : 'none'));
	return tuple;
};
