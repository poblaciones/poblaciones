import axios from 'axios';
import h from '@/public/js/helper';
import Mercator from '@/public/js/Mercator';
import err from '@/common/framework/err';
import c from '@/common/framework/color';
import arr from '@/common/framework/arr';

export default Compare;

function Compare(metric) {
	this.metric = metric;
	this.SelectedVersionIndex = -1;
	this.Active = false;
	if (this.metric.properties.Comparable) {
		this.GenerateComparableValueLabels();
	}
};

Compare.prototype.GenerateComparableValueLabels = function () {
	for (var v = 1; v < this.metric.properties.Versions.length; v++) {
		for (var level of this.metric.properties.Versions[v].Levels) {
			for (var variable of level.Variables) {
				if (variable.Comparable) {
					// Le genera niveles
					var unit = ' pp.';
					if (this.UseProportionalDelta(variable)) {
						unit = '%';
					}
					variable.ComparableUnit = unit;
					variable.ComparableValueLabels = [];
					this.AddComparableLabel(variable, null, "No disponible");
					this.AddComparableLabel(variable, -50, "Disminuyó 50" + unit + " o más");
					this.AddComparableLabel(variable, -20, "↘ 20 a 50" + unit);
					this.AddComparableLabel(variable, -10, "↘ 10 a 20" + unit);
					this.AddComparableLabel(variable, -5, "↘ 5 a 10" + unit);
					this.AddComparableLabel(variable, -1, "↘ 1 a 5" + unit);
					this.AddComparableLabel(variable, 1, "Sin cambios");
					this.AddComparableLabel(variable, 5, "↗ 1 a 5" + unit);
					this.AddComparableLabel(variable, 10, "↗ 5 a 10" + unit);
					this.AddComparableLabel(variable, 20, "↗ 10 a 20" + unit);
					this.AddComparableLabel(variable, 50, "↗ 20 a 50" + unit);
					this.AddComparableLabel(variable, 10000000, "Aumentó 50" + unit + " o más");
				}
			}
		}
	}
};

Compare.prototype.AddComparableLabel = function (variable, cut, caption) {
	var color = '';
	if (cut !== null) {
		var maxValue = 60;
		var cutForColor = Math.abs(cut) + (cut > 0 ? 5 : 0);
		if (cutForColor > maxValue) {
			cutForColor = maxValue;
		}
		var extraComponent = (maxValue - cutForColor) / maxValue * 240;
		var coreComponent = 200 + (maxValue - cutForColor) / maxValue * 55;
		if (cut < 0) {
			color = c.MakeColor(extraComponent, extraComponent, coreComponent);
		} else {
			color = c.MakeColor(coreComponent, extraComponent, extraComponent);
		}
	} else {
		color = "#aaa";
	}
	var item = {
		"Id": variable.ComparableValueLabels.length + 1,
		"Name": caption,
		"Value": cut,
		"LineColor": null,
		"FillColor": color,
		"Symbol": null,
		"Visible": true
	};
	variable.ComparableValueLabels.push(item);
};


Compare.prototype.SelectVersion = function (index) {
	this.SelectedVersionIndex = index;
	this.metric.UpdateSummary();
	this.metric.UpdateMap();
};

Compare.prototype.SelectedVersion = function () {
	// es una válida
	if (this.SelectedVersionIndex !== -1 &&
		this.SelectedVersionIndex < this.metric.properties.Versions.length) {
		return this.metric.properties.Versions[this.SelectedVersionIndex];
	}
	// Si está en -1 o excede el count establece un default
	var maxIndex = this.metric.properties.SelectedVersionIndex - 1;
	if (maxIndex > 0) {
		this.SelectedVersionIndex = maxIndex;
		return this.metric.properties.Versions[this.SelectedVersionIndex];
	}
	if (this.metric.Compare.Active) {
		// la actual es la más baja... la corre
		this.metric.properties.SelectedVersionIndex = 1;
	}
	this.SelectedVersionIndex = 0;
	return this.metric.properties.Versions[this.SelectedVersionIndex];
};

Compare.prototype.Merge = function (mainData, compareData) {
	// identifica los geographyId
	var mainLevel = this.metric.SelectedLevel();
	var compareLevel = this.SelectedLevel();
	// identifica la Variable activa en
	var mainVariable = this.metric.SelectedVariable();
	var compareVariable = this.SelectedVariable();
	//
	var nullElement = arr.GetByProperty(mainVariable.ComparableValueLabels, "Value", null);
	// ubica el geographyTuple
	var tupleKey = mainLevel.GeographyId + "_" + compareLevel.GeographyId;
	if (!window.SegMap.GeographyTuples[tupleKey]) {
		alert('No hay tablas de conversión para relacionar ' + tupleKey);
		return;
	}
	var tuples = window.SegMap.GeographyTuples[tupleKey].Items;
	// recorre el .Data de ambas anexando el resultado de lo calculado
	// tiene {"FID":835942,"VID":40701,"Value":4,"Total":78,"LID":836901},

	// indexa los datos de la variable de interés de compareData
	var compareDataIndexed = {};
	for (var item of compareData.Data) {
		if (item['VID'] === compareVariable.Id) {
			compareDataIndexed[item['FID']] = item;
		}
	}
	// recorre mainData
	for (var item of mainData.Data) {
		if (item['VID'] === mainVariable.Id) {
			// ubica los ids equivalentes
			var previousItemId = tuples[item['FID']];
			if (previousItemId) {
				var element = compareDataIndexed[previousItemId];
				if (element) {
					// Calcula el valor de ambos
					var delta = this.CalculateDelta(mainVariable, item, compareVariable, element);
					item['DeltaValue'] = delta;
					item['LID'] = this.CalculateCategory(mainVariable, delta);
				} else {
					// le corresponde 'no disponible'
					item['LID'] = nullElement.Id;
					item['DeltaValue'] = 'n/d';
				}
			} else {
				// le corresponde 'no disponible'
				item['LID'] = nullElement.Id;
				item['DeltaValue'] = 'n/d';
			}
		}
	}
};

Compare.prototype.UseProportionalDelta = function (variable) {
	return !variable.HasTotals || variable.NormalizationScale !== 100;
};

Compare.prototype.CalculateCategory = function (variable, delta) {
	for (var category of variable.ComparableValueLabels) {
		if (category.Value !== null &&
			delta <= category.Value) {
			return category.Id;
		}
	};
	return variable.ComparableValueLabels[variable.ComparableValueLabels.length - 1].Id;
};

Compare.prototype.CalculateDelta = function (variable, item, compareVariable, compareItem) {
	var value1 = this.CalculateValue(variable, item);
	var value2 = this.CalculateValue(compareVariable, compareItem);
	if (this.UseProportionalDelta(variable)) {
		if (value2 === 0) {
			return '';
		}
		return (value1 / value2) * 100 - 100;
	} else {
		return value1 - value2;
	}
};

Compare.prototype.CalculateValue = function (variable, item) {
	if (variable.HasTotals) {
		return (item.Total > 0 ? item.Value * variable.NormalizationScale / item.Total : 0);
	} else {
		return item.Value;
	}
};

Compare.prototype.SelectedVariable = function () {
	var variable = this.metric.SelectedVariable();
	if (!variable) {
		return null;
	}
	var variableName = variable.ShortName;
	var compareLevel = this.SelectedLevel();
	for (var matchVariable of compareLevel.Variables) {
		if (matchVariable.ShortName === variableName) {
			return matchVariable;
		}
	}
	var serie = this.metric.SelectedLevel().Revision;
	throw new Error('No hay valores para esa variable en la serie ' + serie);
};

Compare.prototype.SelectedLevel = function () {
	var compareVersion = this.SelectedVersion();
	var serieName = this.metric.SelectedLevel().Name;
	for (var level of compareVersion.Levels) {
		if (level.Name === serieName) {
			return level;
		}
	}
	var serie = this.metric.SelectedLevel().Revision;
	throw new Error('No hay valores para ese indicador en la serie ' + serie);
};

