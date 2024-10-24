import h from '@/public/js/helper';
import ActiveSelectedMetric from '@/public/classes/ActiveSelectedMetric';
import ActiveBoundary from '@/public/classes/ActiveBoundary';
import err from '@/common/framework/err';
import str from '@/common/framework/str';

export default SelectedInfoRouter;

function SelectedInfoRouter() {
};

SelectedInfoRouter.prototype.GetSettings = function() {
	return {
		blockSignature: 'l=',
		startChar: null,
		endChar: null,
		groupSeparator: ';',
		itemSeparator: '!',
		useKeyValue: true
	};
};

SelectedInfoRouter.prototype.ToRoute = function (askeyarray) {
	var segmentedMap = window.SegMap;
	var ret = [];
	for (var n = 0; n < segmentedMap.Metrics.metrics.length; n++) {
		ret.push(this.SelectedInfoToRoute(segmentedMap.Metrics.metrics[n], askeyarray));
	}
	return ret;
};


SelectedInfoRouter.prototype.SelectedInfoToRoute = function (activeSelectedMetric, askeyarray) {
	if (activeSelectedMetric.properties === null) {
		throw new Error('No properties has been set.');
	}
	var ret;
	if (activeSelectedMetric.isBoundary) {
		ret = this.SelectedBoundaryToRoute(activeSelectedMetric);
	} else {
		ret = this.SelectedMetricToRoute(activeSelectedMetric);
	}
	if (askeyarray) {
		ret = this.transformArrayListToKeyList(ret);
	}
	return ret;
};

SelectedInfoRouter.prototype.SelectedBoundaryToRoute = function (activeBoundary) {
	var ret = [];
	ret.push([activeBoundary.properties.Id]);
	ret.push(['t', 'b']); // es boundary
	ret.push(['v', (activeBoundary.visible ? 1 : 0), 1]);
	ret.push(['w', activeBoundary.borderWidth, 2]);
	ret.push(['c', this.cleanSign(activeBoundary.color), this.cleanSign(ActiveBoundary.DEFAULT_COLOR)]);
	ret.push(['d', (activeBoundary.showDescriptions ? 1 : 0), 1]);
	return ret;
};

SelectedInfoRouter.prototype.cleanSign = function (color) {
	return str.Replace(color, '#', '');
};

SelectedInfoRouter.prototype.SelectedMetricToRoute = function (activeSelectedMetric) {
	var ret = [];
	ret.push([activeSelectedMetric.properties.Metric.Id]);
	ret.push(['v', this.GetVersions(activeSelectedMetric), -1]);
	ret.push(['a', activeSelectedMetric.SelectedVersion().SelectedLevelIndex, 0]);
	ret.push(['q', activeSelectedMetric.SelectedVersion().SelectedMultiLevelIndex,
								 activeSelectedMetric.SelectedVersion().SelectedLevelIndex]);
	ret.push(['i', activeSelectedMetric.SelectedLevel().SelectedVariableIndex, 0]);
	ret.push(['k', this.GetRanking(activeSelectedMetric), '']);
	ret.push(['c', this.Boolean(activeSelectedMetric.SelectedVersion().LabelsCollapsed), '0']);

	ret.push(['m', activeSelectedMetric.properties.SummaryMetric, 'N']);
	var part = activeSelectedMetric.GetSelectedPartition();
	if (part !== '') {
		ret.push(['x', part, null]);
	}
	ret.push(['u', activeSelectedMetric.properties.SelectedUrbanity, 'N']);
	if (activeSelectedMetric.SelectedLevel().Pinned) {
		ret.push(['l', '1']);
	}

	var variable = activeSelectedMetric.SelectedVariable();
	if (variable) {
		if (variable.CustomPattern !== variable.Pattern) {
			ret.push(['p', variable.CustomPattern, '']);
		}
		ret.push(['t', variable.Opacity, 'M']);
		ret.push(['g', variable.GradientOpacity, 'M']);
		ret.push(['d', this.Boolean(variable.ShowDescriptions), '0']);
		ret.push(['s', this.Boolean(variable.ShowValues), '0']);
		ret.push(['e', this.Boolean(variable.ShowPerimeter), '0']);

		var activeStepsState = this.activeSequences(variable);
		ret.push(['a', activeStepsState, null]);
	}
	// bloque de estado de variables. las variables van separadas por @, e indican visible y luego lista de visible de valores.
	var variablesInfo = this.VariablesToRoute(activeSelectedMetric);
	ret.push(['w', variablesInfo, '']);

	//$levelId = Params::Get('a');
	//$excludedValues = Params::Get('x');
	//$collapsed = Params::Get('c');
	//$metric = Params::Get('m');
	//$variableId = Params::Get('i');
	//$urbanity = Params::Get('u');
	return ret;
};


SelectedInfoRouter.prototype.GetVersions = function (activeSelectedMetric) {
	if (activeSelectedMetric.Compare.Active) {
		return activeSelectedMetric.Compare.SelectedVersionIndex + "," + activeSelectedMetric.properties.SelectedVersionIndex;
	} else {
		return activeSelectedMetric.properties.SelectedVersionIndex;
	}
};

SelectedInfoRouter.prototype.activeSequences = function (variable) {
	if (!variable.IsSequence) {
		return null;
	}
	var activeStepsState = '';
	for (var n = 0; n < variable.ValueLabels.length; n++) {
		var labelId = variable.ValueLabels[n].Id;
		var selected = variable.ValueLabels[n].ActiveStep;
		if (selected && selected > 1) {
			activeStepsState += "," + labelId + '@' + selected;
		}
	}
	if (activeStepsState === '') {
		return null;
	} else {
		return activeStepsState.substr(1);
	}
};

SelectedInfoRouter.prototype.transformArrayListToKeyList = function (list) {
	var ret = {};
	for (var n = 0; n < list.length; n++) {
		if (list[n].length === 1) {
			ret[''] = list[n][0];
		} else {
				ret[list[n][0]] = list[n][1];
		}
	}
	return ret;
};

SelectedInfoRouter.prototype.GetRanking = function (metric) {
	if (!metric.ShowRanking) {
		return '';
	}
	var ret = '';
	if (metric.RankingSize != 10) {
		ret += metric.RankingSize;
	}
	ret += metric.RankingDirection;
	return ret;
};

SelectedInfoRouter.prototype.ParseRanking = function (value) {
	var size = 10;
	var direction = 'D';
	var show = false;
	if (value !== null) {
		show = true;
		if (value.indexOf('A') !== -1) {
			direction = 'A';
		}
		value = value.replace('A', '');
		value = value.replace('D', '');
		if (value.length > 0) {
			size = parseInt(value);
			if (size > 50 || size < 10) {
				size = 10;
			}
		}
	}
	return { Size: size, Direction: direction, Show: show };
};

SelectedInfoRouter.prototype.Boolean = function (value) {
	return (value && value !== '0' ? '1' : '0');
};

SelectedInfoRouter.prototype.VariablesToRoute = function (activeSelectedMetric) {
	var ret = '';
	for (var v = 0; v < activeSelectedMetric.SelectedLevel().Variables.length; v++) {
		var variable = activeSelectedMetric.SelectedLevel().Variables[v];
		ret += this.Boolean(variable.Visible);
		var vals = '';
		var allVisible = true;
		for (var vl = 0; vl < variable.ValueLabels.length; vl++) {
			if (variable.ValueLabels[vl].Visible) {
				vals += '1';
			} else {
				vals += '0';
				allVisible = false;
			}
		}
		if (!allVisible) ret += this.deflateString(vals);

		if (v < activeSelectedMetric.SelectedLevel().Variables.length - 1) {
			ret += ',';
		}
	}
	return ret;
};

SelectedInfoRouter.prototype.FromRoute = function (args, updateRoute, skipRestore) {
	var infos = this.parseInfos(args);
	var loc = this;
	if (this.InfosHaveComparer(infos)) {
		window.SegMap.GetGeographyTuples().then(function () {
			loc.LoadInfos(infos, updateRoute, skipRestore);
		});
	} else {
		loc.LoadInfos(infos, updateRoute, skipRestore);
	}
};

SelectedInfoRouter.prototype.InfosHaveComparer = function (infos) {
	for (var info of infos) {
		if (info.VersionInfo && info.VersionInfo != -1 && info.VersionInfo.indexOf(",") > 0) {
			return true;
		}
	}
	return false;
};

SelectedInfoRouter.prototype.LoadInfos= function (infos, updateRoute, skipRestore) {
	// Se fija si cambian
	var segmentedMap = window.SegMap;
	if (infos.length === 0) {
		segmentedMap.Metrics.ClearUserMetrics();
		return;
	}
	var currentMetrics = this.parseInfos(this.ToRoute(true));
	// Si cambiaron, recarga todos
	// Una vez cargadas (o si no cambiaron) les setea los estados
	if (this.infosChanged(infos, currentMetrics)) {
		var loc = this;
		var infoIds = '';
		for (var l = 0; l < infos.length; l++) {
			infoIds += (infos[l].IsBoundary ? 'b' : '') + infos[l].Id +
												(l < infos.length - 1 ? ',' : '');
		}
		window.SegMap.Get(window.host + '/services/metrics/GetSelectedInfos', {
			params: { l: infoIds },
		}).then(function (res) {
			segmentedMap.SaveRoute.Disabled = true;
			segmentedMap.Metrics.ClearUserMetrics();
			var locked = window.Embedded.Active;
			for (var n = 0; n < infos.length; n++) {
				var selectedInfo = res.data[n];
				if (selectedInfo != null) {
					if (selectedInfo.IsBoundary) {
						var activeBoundary = new ActiveBoundary(selectedInfo);
						activeBoundary.IsLocked = locked;
						if (!skipRestore) {
							loc.RestoreBoundaryState(activeBoundary, infos[n]);
						}
						segmentedMap.Metrics.AppendStandardMetric(activeBoundary);
					} else {
						var activeMetric = new ActiveSelectedMetric(selectedInfo, false);
						activeMetric.IsLocked = locked;
						if (!skipRestore) {
							loc.RestoreMetricState(activeMetric, infos[n]);
						}
						activeMetric.properties.SelectedVersionIndex = parseInt(activeMetric.properties.SelectedVersionIndex);
						activeMetric.UpdateLevel();
						segmentedMap.Metrics.AppendStandardMetric(activeMetric);
					}
				}
			}
			segmentedMap.Labels.UpdateMap();
			segmentedMap.SaveRoute.Disabled = false;
			segmentedMap.InfoWindow.CheckUpdateNavigation();
			if (updateRoute) {
				segmentedMap.SaveRoute.UpdateRoute();
			}
		}).catch(function (error) {
			err.errDialog('GetSelectedInfos', 'obtener la información para los elementos solicitados', error);
		});
	} else {
		this.restoreInfoStates(infos);
	}
};

SelectedInfoRouter.prototype.infosChanged = function (metrics, currentMetrics) {
	if (metrics.length !== currentMetrics.length) {
		return true;
	}
	for (var l = 0; l < metrics.length; l++) {
		if (metrics[l].Id !== currentMetrics[l].Id) {
			return true;
		}
	}
	return false;
};

SelectedInfoRouter.prototype.parseInfos = function (args) {
	var infos = [];
	for (var key in args) {
		var info = args[key];
		infos.push(this.parseInfo(info));
	}
	return infos;
};

SelectedInfoRouter.prototype.parseInfo = function (values) {
	var type = h.getSafeValue(values, 't', 'm');
	if (type === 'b') {
		return this.parseBoundary(values);
	} else {
		return this.parseMetric(values);
	}
};

SelectedInfoRouter.prototype.parseBoundary = function (values) {
	var id = h.getSafeValue(values, '');
	var visible = h.getSafeValue(values, 'v', 1);
	var descriptions = h.getSafeValue(values, 'd', 1);
	var borderWidth = h.getSafeValueInt(values, 'w', 2);
	var color = h.getSafeValue(values, 'c', this.cleanSign(ActiveBoundary.DEFAULT_COLOR));

	return {
		Id: parseInt(id),
		IsBoundary: true,
		BorderWidth: borderWidth,
		Color: '#' + color,
		Visible: (visible ? true : false),
		ShowDescriptions: (descriptions ? true : false),
	};
};

SelectedInfoRouter.prototype.parseMetric = function (values) {
	var id = h.getSafeValue(values, '');
	var versionInfo = h.getSafeValue(values, 'v', -1);
	var levelIndex = h.getSafeValue(values, 'a', 0);
	var multiLevelIndex = h.getSafeValue(values, 'q', null);
	if (multiLevelIndex === null) {
		multiLevelIndex = levelIndex;
	}
	var variableIndex = h.getSafeValue(values, 'i', 0);
	var labelsCollapsed = h.getSafeValue(values, 'c', false);
	var summaryMetric = h.getSafeValue(values, 'm', 'N');
	var urbanity = h.getSafeValue(values, 'u', 'N');
	var partition = h.getSafeValue(values, 'x', null);
	var pinnedLevel = h.getSafeValue(values, 'l', '');
	var showDescriptions = h.getSafeValue(values, 'd', '0');
	var showPerimeter = h.getSafeValue(values, 'e', '0');
	var showValues = h.getSafeValue(values, 's', '0');
	var activeSequencesSteps = h.getSafeValue(values, 'a', null);
	var ranking = h.getSafeValue(values, 'k', null);
	var customPattern = h.getSafeValue(values, 'p', '');
	var opacity = h.getSafeValue(values, 't', 'M');
	var gradientOpacity = h.getSafeValue(values, 'g', 'M');
	var variableStates = h.getSafeValue(values, 'w', null);

	return {
		Id: parseInt(id),
		VersionInfo: versionInfo,
		LevelIndex: levelIndex,
		MultiLevelIndex: multiLevelIndex,
		VariableIndex: variableIndex,
		LabelsCollapsed: labelsCollapsed,
		SummaryMetric: summaryMetric,
		Partition: partition,
		Urbanity: urbanity,
		ShowDescriptions: showDescriptions,
		ShowValues: showValues,
		ShowPerimeter: showPerimeter,
		ShowRanking: this.ParseRanking(ranking)['Show'],
		RankingSize: this.ParseRanking(ranking)['Size'],
		RankingDirection: this.ParseRanking(ranking)['Direction'],
		Opacity: opacity,
		ActiveSequencesSteps: activeSequencesSteps,
		GradientOpacity: gradientOpacity,
		PinnedLevel: pinnedLevel,
		CustomPattern: (customPattern === '' ? '' : parseInt(customPattern)),
		VariableStates: (variableStates ? this.inflateArr(variableStates.split(',')) : [])
	};
};


SelectedInfoRouter.prototype.restoreInfoStates = function (states) {
	var segmentedMap = window.SegMap;
	for (var n = 0; n < segmentedMap.Metrics.metrics.length; n++) {
		var info = segmentedMap.Metrics.metrics[n];
		var state = states[n];
		if (state.IsBoundary) {
				if (this.RestoreBoundaryState(info, state)) {
					info.UpdateMap();
			}
		} else {
			if (this.RestoreMetricState(info, state)) {
				info.UpdateMap();
			}
		}
	}
};


SelectedInfoRouter.prototype.RestoreBoundaryState = function (boundary, state) {
	var mapChanged = false;

	if (state.Visible !== boundary.visible) {
		boundary.visible = state.Visible;
		mapChanged = true;
	}
	if (state.BorderWidth !== boundary.borderWidth) {
		boundary.borderWidth = state.BorderWidth;
		mapChanged = true;
	}
	if (state.Color !== boundary.color) {
		boundary.color = state.Color;
		mapChanged = true;
	}
	if (state.ShowDescriptions !== boundary.showDescriptions) {
		boundary.showDescriptions = state.ShowDescriptions;
		mapChanged = true;
	}
	return mapChanged;
};

SelectedInfoRouter.prototype.RestoreMetricState = function (activeSelectedMetric, state) {
	var mapChanged = false;
	var selectedMetric = activeSelectedMetric.properties;
	var versionIndex = '';
	if ((state.VersionInfo + "").indexOf(',') > 0 && activeSelectedMetric.properties.Comparable) {
		// son dos porque estaba comparando
		var parts = state.VersionInfo.split(',');
		var versionCompare = parseInt(parts[0]);
		activeSelectedMetric.Compare.Active = true;
		activeSelectedMetric.Compare.SelectedVersionIndex = versionCompare;
		versionIndex = parseInt(parts[1]);
	} else {
		// es uno
		versionIndex = parseInt(state.VersionInfo);
	}
	if (versionIndex !== -1 && versionIndex !== selectedMetric.SelectedVersionIndex &&
		versionIndex < selectedMetric.Versions.length) {
		selectedMetric.SelectedVersionIndex = versionIndex;
		mapChanged = true;
	}
	var version = selectedMetric.Versions[selectedMetric.SelectedVersionIndex];
	var levelIndex = parseInt(state.LevelIndex);
	if (levelIndex !== version.SelectedLevelIndex &&
		levelIndex < version.Levels.length) {
		version.SelectedLevelIndex = levelIndex;
		mapChanged = true;
	}
	var multiLevelIndex = parseInt(state.MultiLevelIndex);
	if (multiLevelIndex !== version.SelectedMultiLevelIndex &&
		multiLevelIndex < version.Levels.length) {
		version.SelectedMultiLevelIndex = multiLevelIndex;
		if (state.PinnedLevel === '1') {
			activeSelectedMetric.SelectedMultiLevel().Pinned = true;
		}
		mapChanged = true;
	}
	var level = version.Levels[version.SelectedLevelIndex];
	var variableIndex = parseInt(state.VariableIndex);
	if (variableIndex !== level.SelectedVariableIndex &&
		variableIndex < level.Variables.length) {
		level.SelectedVariableIndex = variableIndex;
		mapChanged = true;
	}
	if (state.LabelsCollapsed !== version.LabelsCollapsed) {
		version.LabelsCollapsed = state.LabelsCollapsed;
	}

	if (state.ShowRanking !== activeSelectedMetric.ShowRanking) {
		activeSelectedMetric.ShowRanking = state.ShowRanking;
	}
	if (state.RankingDirection !== activeSelectedMetric.RankingDirection) {
		activeSelectedMetric.RankingDirection = state.RankingDirection;
	}
	if (state.RankingSize !== activeSelectedMetric.RankingSize) {
		activeSelectedMetric.RankingSize = state.RankingSize;
	}

	if (state.LabelsCollapsed !== version.LabelsCollapsed) {
		version.LabelsCollapsed = state.LabelsCollapsed;
	}
	if (selectedMetric.SummaryMetric !== state.SummaryMetric) {
		selectedMetric.SummaryMetric = state.SummaryMetric;
	}
	if (selectedMetric.SelectedUrbanity !== state.Urbanity) {
		selectedMetric.SelectedUrbanity = state.Urbanity;
		mapChanged = true;
	}
	if (activeSelectedMetric.GetSelectedPartition() !== state.Partition) {
		selectedMetric.SelectedPartition = state.Partition;
		mapChanged = true;
	}
	if (activeSelectedMetric.SelectedVariable()) {
		if (activeSelectedMetric.SelectedVariable().ShowDescriptions !== state.ShowDescriptions) {
			activeSelectedMetric.SelectedVariable().ShowDescriptions = state.ShowDescriptions;
			mapChanged = true;
		}
		if (activeSelectedMetric.SelectedVariable().ShowPerimeter !== state.ShowPerimeter) {
			activeSelectedMetric.SelectedVariable().ShowPerimeter = state.ShowPerimeter;
			mapChanged = true;
		}
		if (activeSelectedMetric.SelectedVariable().CustomPattern !== state.CustomPattern) {
			activeSelectedMetric.SelectedVariable().CustomPattern = state.CustomPattern;
			mapChanged = true;
		}
		if (activeSelectedMetric.SelectedVariable().ShowValues !== state.ShowValues) {
			activeSelectedMetric.SelectedVariable().ShowValues = state.ShowValues;
			mapChanged = true;
		}
	}
	if (selectedMetric.GradientOpacity !== state.GradientOpacity) {
		selectedMetric.GradientOpacity = state.GradientOpacity;
		mapChanged = true;
	}
	if (selectedMetric.Opacity !== state.Opacity) {
		selectedMetric.Opacity = state.Opacity;
		mapChanged = true;
	}
	if (state.VariableStates.length === level.Variables.length) {
		for (var v = 0; v < level.Variables.length; v++) {
			var variable = level.Variables[v];
			var st = state.VariableStates[v];
			var value = (st.substring(0, 1) === '1');
			if (variable.Visible !== value) {
				variable.Visible = value;
				mapChanged = true;
			}
			for (var lb = 0; lb < variable.ValueLabels.length; lb++) {
				var val = true;
				if (lb + 1 < st.length) {
					val = (st.substr(lb + 1, 1) === '1');
				}
				if (variable.ValueLabels[lb].Visible !== val) {
					variable.ValueLabels[lb].Visible = val;
					mapChanged = true;
				}
			}
		}
	}

	if (this.restoreSequenceActiveSteps(selectedMetric, level, state)) {
		mapChanged = true;
	}

	return mapChanged;
};

SelectedInfoRouter.prototype.addChunk = function (cad, l) {
	if (l > 4) {
		return cad + 'e' + l + 'q';
	} else {
		return cad.repeat(l);
	}
};

SelectedInfoRouter.prototype.deflateString = function (cad) {
	var ret = '';
	var buf = '';
	var len0 = 0;
	var len1 = 0;
	for (var n = 0; n < cad.length; n++) {
		if (cad[n] === '1') {
			if (len0 > 0) {
				ret += this.addChunk('0', len0);
				len0 = 0;
			}
			len1++;
		} else {
			if (len1 > 0) {
				ret += this.addChunk('1', len1);
				len1 = 0;
			}
			len0++;
		}
	}
	if (len0 > 0) {
		ret += this.addChunk('0', len0);
	} else if (len1 > 0) {
		ret += this.addChunk('1', len1);
	}
	return ret;
};

SelectedInfoRouter.prototype.inflateString = function (cad) {
	var ret = '';
	for (var n = 0; n < cad.length; n++) {
		if (cad[n] === 'e') {
			var i = cad.indexOf('q', n);
			var l = parseInt(cad.substr(n + 1, i - n - 1));
			ret += cad[n - 1].repeat(l - 1);
			n = i;
		} else {
			ret += cad[n];
		}
	}
	return ret;
};

SelectedInfoRouter.prototype.inflateArr = function (arr) {
	if (!arr) {
		return arr;
	}
	var ret = [];
	for (var n = 0; n < arr.length; n++) {
		ret.push(this.inflateString(arr[n]));
	}
	return ret;
};


SelectedInfoRouter.prototype.restoreSequenceActiveSteps = function (selectedMetric, level, state) {
	var mapChanged = false;
	if (!level || level.SelectedVariableIndex === -1) {
		return false;
	}
	var variable = level.Variables[level.SelectedVariableIndex];
	if (!variable.IsSequence) {
		return false;
	}
	if (this.activeSequences(selectedMetric) === state.ActiveSequencesSteps) {
		return false;
	}
	var parts = state.ActiveSequencesSteps.split(',');
	for (var n = 0; n < parts.length; n++) {
		var set = parts[n].split('@');
		var labelId = parseInt(set[0]);
		if (set.length > 1) {
			var sequence = parseInt(set[1]);
			for (var lb = 0; lb < variable.ValueLabels.length; lb++) {
				if (variable.ValueLabels[lb].Id === labelId) {
					variable.ValueLabels[lb].ActiveStep = sequence;
					mapChanged = true;
					break;
				}
			}
		}
	}
	return mapChanged;
};
