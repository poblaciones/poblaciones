import h from '@/public/js/helper';

export default MetricRouter;

function MetricRouter(activeSelectedMetric) {
	this.activeSelectedMetric = activeSelectedMetric;
};

MetricRouter.prototype.ToRoute = function () {
	if (this.activeSelectedMetric.properties === null) {
		throw new Error('No properties has been set.');
	}
	var ret = this.activeSelectedMetric.properties.Metric.Id;
	ret += this.AddValue('v', this.activeSelectedMetric.properties.SelectedVersionIndex, 0);
	ret += this.AddValue('a', this.activeSelectedMetric.SelectedVersion().SelectedLevelIndex, 0);
	ret += this.AddValue('i', this.activeSelectedMetric.SelectedLevel().SelectedVariableIndex, 0);
	ret += this.AddRanking(this.activeSelectedMetric);
	ret += this.AddBoolean('c', this.activeSelectedMetric.SelectedVersion().LabelsCollapsed, false);

	ret += this.AddValue('m', this.activeSelectedMetric.properties.SummaryMetric, 'N');
	ret += this.AddValue('u', this.activeSelectedMetric.properties.SelectedUrbanity, 'N');
	if (this.activeSelectedMetric.SelectedLevel().Pinned) {
		ret += this.AddValue('l', '1');
	}
	ret += this.AddValue('t', this.activeSelectedMetric.properties.Transparency, 'M');

	if (this.activeSelectedMetric.SelectedVariable()) {
		if (this.activeSelectedMetric.SelectedVariable().CustomPattern !== this.activeSelectedMetric.SelectedVariable().Pattern) {
			ret += this.AddValue('p', this.activeSelectedMetric.SelectedVariable().CustomPattern, '');
		}
		ret += this.AddBoolean('d', this.activeSelectedMetric.SelectedVariable().ShowDescriptions, '0');
		ret += this.AddBoolean('s', this.activeSelectedMetric.SelectedVariable().ShowValues, '0');
	}
	// bloque de estado de variables. las variables van separadas por @, e indican visible y luego lista de visible de valores.
	ret += '!w';
	for (var v = 0; v < this.activeSelectedMetric.SelectedLevel().Variables.length; v++) {
		var variable = this.activeSelectedMetric.SelectedLevel().Variables[v];
		ret += (variable.Visible ? '1' : '0');
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
		if (!allVisible) ret += vals;

		if (v < this.activeSelectedMetric.SelectedLevel().Variables.length - 1) {
			ret += ',';
		}
	}

	//$levelId = Params::Get('a');
	//$excludedValues = Params::Get('x');
	//$collapsed = Params::Get('c');
	//$metric = Params::Get('m');
	//$variableId = Params::Get('i');
	//$urbanity = Params::Get('u');

	return ret;
};

MetricRouter.prototype.parseMetric = function (metricString) {
	if (metricString === '') {
		return null;
	}
	var i = metricString.indexOf('!');
	if (i === -1) i = metricString.length;
	var id = metricString.substring(0, i);
	var values = h.parseSingleLetterArgs(metricString);
	var versionIndex = h.getSafeValue(values, 'v', 0);
	var levelIndex = h.getSafeValue(values, 'a', 0);
	var variableIndex = h.getSafeValue(values, 'i', 0);
	var labelsCollapsed = h.getSafeValue(values, 'c', false);
	var summaryMetric = h.getSafeValue(values, 'm', 'N');
	var urbanity = h.getSafeValue(values, 'u', 'N');
	var pinnedLevel = h.getSafeValue(values, 'l', '');
	var showDescriptions = h.getSafeValue(values, 'd', '0');
	var showValues = h.getSafeValue(values, 's', '0');
	var ranking = h.getSafeValue(values, 'k', null);
	var customPattern = h.getSafeValue(values, 'p', '');
	var transparency = h.getSafeValue(values, 't', 'M');
	var variableStates = h.getSafeValue(values, 'w', null);

	return {
		Id: parseInt(id),
		VersionIndex: versionIndex,
		LevelIndex: levelIndex,
		VariableIndex: variableIndex,
		LabelsCollapsed: labelsCollapsed,
		SummaryMetric: summaryMetric,
		Urbanity: urbanity,
		ShowDescriptions: showDescriptions,
		ShowValues: showValues,
		ShowRanking: this.ParseRanking(ranking)['Show'],
		RankingSize: this.ParseRanking(ranking)['Size'],
		RankingDirection: this.ParseRanking(ranking)['Direction'],
		Transparency: transparency,
		PinnedLevel: pinnedLevel,
		CustomPattern: (customPattern === '' ? '' : parseInt(customPattern)),
		VariableStates: (variableStates ? variableStates.split(',') : [])
	};
};


MetricRouter.prototype.ParseRanking = function (value) {
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


MetricRouter.prototype.AddRanking = function (metric) {
	if (!metric.ShowRanking) {
		return '';
	}
	var ret = '!k';
	if (metric.RankingSize != 10) {
		ret += metric.RankingSize;
	}
	ret += metric.RankingDirection;
	return ret;
};

MetricRouter.prototype.AddValue = function (key, value, def) {
	if (value !== def) {
		return '!' + key + value;
	} else {
		return '';
	}
};
MetricRouter.prototype.AddBoolean = function (key, value, def) {
	if (value !== def) {
		return '!' + key + (value ? '1' : '0');
	} else {
		return '';
	}
};

MetricRouter.prototype.RestoreMetricState = function (state) {
	var mapChanged = false;
	var selectedMetric = this.activeSelectedMetric.properties;
	var versionIndex = parseInt(state.VersionIndex);
	if (versionIndex !== selectedMetric.SelectedVersionIndex &&
		versionIndex < selectedMetric.Versions.length) {
		selectedMetric.SelectedVersionIndex = versionIndex;
		mapChanged = true;
	}
	var version = selectedMetric.Versions[selectedMetric.SelectedVersionIndex];
	var levelIndex = parseInt(state.LevelIndex);
	if (levelIndex !== version.SelectedLevelIndex &&
		levelIndex < version.Levels.length) {
		version.SelectedLevelIndex = levelIndex;
		if (state.PinnedLevel === '1') {
			this.activeSelectedMetric.SelectedLevel().Pinned = true;
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

	if (state.ShowRanking !== this.activeSelectedMetric.ShowRanking) {
		this.activeSelectedMetric.ShowRanking = state.ShowRanking;
	}
	if (state.RankingDirection !== this.activeSelectedMetric.RankingDirection) {
		this.activeSelectedMetric.RankingDirection = state.RankingDirection;
	}
	if (state.RankingSize !== this.activeSelectedMetric.RankingSize) {
		this.activeSelectedMetric.RankingSize = state.RankingSize;
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
	if (this.activeSelectedMetric.SelectedVariable()) {
		if (this.activeSelectedMetric.SelectedVariable().ShowDescriptions !== state.ShowDescriptions) {
			this.activeSelectedMetric.SelectedVariable().ShowDescriptions = state.ShowDescriptions;
			mapChanged = true;
		}
		if (this.activeSelectedMetric.SelectedVariable().CustomPattern !== state.CustomPattern) {
			this.activeSelectedMetric.SelectedVariable().CustomPattern = state.CustomPattern;
			mapChanged = true;
		}
		if (this.activeSelectedMetric.SelectedVariable().ShowValues !== state.ShowValues) {
			this.activeSelectedMetric.SelectedVariable().ShowValues = state.ShowValues;
			mapChanged = true;
		}
	}
	if (selectedMetric.Transparency !== state.Transparency) {
		selectedMetric.Transparency = state.Transparency;
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
	return mapChanged;
};
