import axios from 'axios';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/framework/arr';
import str from '@/common/framework/str';
import color from '@/common/framework/color';
import f from '@/backoffice/classes/Formatter';
import h from '@/map/js/helper';
import ScaleStates from './ScaleStates';

export default ScaleGenerator;

const MAX_VALUE = 9999999217;
const columnFormatEnum = require("@/common/enums/columnFormatEnum");

function ScaleGenerator(dataset) {
	this.Dataset = dataset;
	this.States = new ScaleStates(this);
	this.InfoCache = {};
	this.RegenPending = {};
	this.Palettes = null;
	this.PaletteValues = null;
	this.LoadPalettes();
};

ScaleGenerator.prototype.LoadPalettes = function () {
	var ret = {};
	const colorbrewer = require('colorbrewer');

	ret.basicPalettes = [];
	for(var n = 0; n < 15; n++) {
		ret.basicPalettes.push({ Id: n, Caption: ''});
	}
	ret.sequential = [];
	n = 30;
	var list = colorbrewer.default.schemeGroups.sequential; //.concat(colorbrewer.schemeGroups.singlehue);
	for (var i = 0; i < list.length; i++) {
		ret.sequential.push({ Id: n++, Caption: list[i] });
	}
	ret.diverging = [];
	list = colorbrewer.default.schemeGroups.diverging;
	for (var i = 0; i < list.length; i++) {
		ret.diverging.push({ Id: n++, Caption: list[i] });
	}
	ret.qualitative = [];
	list = colorbrewer.default.schemeGroups.qualitative;
	for (var i = 0; i < list.length; i++) {
		ret.qualitative.push({ Id: n++, Caption: list[i] });
	}
	this.Palettes = ret;
	this.PaletteValues = colorbrewer.default;
};

ScaleGenerator.prototype.Clear = function () {
	this.InfoCache = {};
};

ScaleGenerator.prototype.RegenAndSaveAllVariables = function () {
	// Va por todos los level regenerando sus variables
	var loc = this;
	for(var i = 0; i < this.Dataset.MetricVersionLevels.length; i++) {
		var level = this.Dataset.MetricVersionLevels[i];
		this.RegenAndSaveAllLevelVariables(level);
	}
};

ScaleGenerator.prototype.RegenAndSaveAllLevelVariables = function (level) {
	// Regenerando las variables del level
	var p = Promise.resolve(); // Q() in q
	level.Variables.forEach(variable =>
											p = p.then(() => this.RegenAndSaveVariable(level, variable)));
  return p;
};

ScaleGenerator.prototype.RegenAndSaveVariable = function (level, variable) {
	// Regenerando las variables del level
	var loc = this;
	return this.RegenVariableCategories(level, variable).then(function() {
		return loc.Dataset.UpdateVariable(level, variable);
	});
};

ScaleGenerator.prototype.RegenAndSaveVariablesAffectedByDeletedDataColumnIds = function (dataColumnIds) {
	// Esto toma los casos en que se removió una variable
	// de una columna que se está usando como cutColumn
	for (var i = 0; i < this.Dataset.MetricVersionLevels.length; i++) {
		var level = this.Dataset.MetricVersionLevels[i];
		for (var q = 0; q < dataColumnIds.length; q++) {
			var dataColumnId = dataColumnIds[q];
			for (var n = 0; n < level.Variables.length; n++) {
				var variable = level.Variables[n];
				if (variable.Data === 'O' && variable.DataColumn && variable.DataColumn.Id === dataColumnId) {
					variable.DataColumn = null;
					variable.Data = 'N';
					variable.Symbology.CutMode = 'S';
					arr.Crop(variable.Values, 0);
					this.CreateVariableCategories(level, variable, null);
					this.Dataset.UpdateVariable(level, variable);
				}
			}
		}
	}
};

ScaleGenerator.prototype.RegenAndSaveVariablesAffectedByDeletedCutColumnsIds = function (cutColumnIds) {
	// Esto toma los casos en que se removió una variable
	// de una columna que se está usando como cutColumn
	for(var i = 0; i < this.Dataset.MetricVersionLevels.length; i++) {
		var level = this.Dataset.MetricVersionLevels[i];
		for(var q = 0; q < cutColumnIds.length; q++) {
			var cutColumnId = cutColumnIds[q];
			for(var n = 0; n < level.Variables.length; n++) {
				var variable = level.Variables[n];
				if (variable.Symbology.CutMode === 'V' && variable.Symbology.CutColumn.Id === cutColumnId) {
					variable.Symbology.CutMode = 'S';
					variable.Symbology.CutColumn = null;
					this.CreateVariableCategories(level, variable, null);
					this.Dataset.UpdateVariable(level, variable);
				}
			}
		}
	}
};

ScaleGenerator.prototype.RegenAndSaveVariablesAffectedByDeletedSequenceIds = function (sequenceIds) {
	// Esto toma los casos en que se removió una variable
	// de una columna que se está usando como cutColumn
	for(var i = 0; i < this.Dataset.MetricVersionLevels.length; i++) {
		var level = this.Dataset.MetricVersionLevels[i];
		for(var q = 0; q < sequenceIds.length; q++) {
			var sequenceId = parseInt(sequenceIds[q]);
			for(var n = 0; n < level.Variables.length; n++) {
				var variable = level.Variables[n];
				if (variable.Symbology.SequenceColumn && variable.Symbology.SequenceColumn.Id === sequenceId) {
					variable.Symbology.IsSequence = 'S';
					variable.Symbology.SequenceColumn = null;
					this.Dataset.UpdateVariable(level, variable);
				}
			}
		}
	}
};


ScaleGenerator.prototype.RegenAndSaveVariablesAffectedByLabelChange = function (changedColumn) {
	// Esto toma los casos en que se cambiaron las etiquetas
	// de una columna que se está usando como cutColumn, normalización o data
	for(var i = 0; i < this.Dataset.MetricVersionLevels.length; i++) {
		var level = this.Dataset.MetricVersionLevels[i];
		for (var n = 0; n < level.Variables.length; n++) {
			var variable = level.Variables[n];
			var requiresUpdate = false;
			if (variable.NormalizationColumn !== null && variable.NormalizationColumn.Id === changedColumn.Id) {
				variable.NormalizationColumn = changedColumn;
				requiresUpdate = true;
			}
			if (variable.DataColumn !== null && variable.DataColumn.Id === changedColumn.Id) {
				variable.DataColumn = changedColumn;
				requiresUpdate = true;
			}
			if (variable.Symbology.CutMode === 'V' && variable.Symbology.CutColumn.Id === changedColumn.Id) {
				variable.Symbology.CutColumn = changedColumn;
				this.RegenAndSaveVariable(level, variable);
			} else if (requiresUpdate) {
				this.Dataset.UpdateVariable(level, variable);
			}
		}
	}
};

ScaleGenerator.prototype.createKey = function (variable) {
	var ret = 'd';

	if (variable.Symbology.CutMode === 'V') {
		if (variable.Symbology.CutColumn !== null) {
			ret += variable.Symbology.CutColumn.Id;
		}
	} else {
		if (variable.Data !== null) {
			ret += variable.Data;
		}
		if (variable.DataColumn !== null) {
			ret += variable.DataColumn.Id;
		}
		ret += 'n';
		if (variable.Normalization !== null) {
			ret += variable.Normalization;
			if (variable.NormalizationColumn !== null) {
				ret += variable.NormalizationColumn.Id;
			}
			ret += 'p' + variable.NormalizationScale;
		}
	}
	if (variable.FilterValue !== null) {
		ret += 'f' + variable.FilterValue;
	}
	return ret;
};

ScaleGenerator.prototype.HasData = function (variable) {
	var key = this.createKey(variable);
	return this.InfoCache[key] !== undefined;
};


ScaleGenerator.prototype.GetColumnDistributions = function (variable) {
	// Trae los grupos calculados para ese par de variables y escalas
	let url = window.host;
	var args;
	if (variable.Symbology.CutMode === 'V') {
		args = {
			'k': this.Dataset.properties.Id,
			'c': (variable.Symbology.CutColumn ? variable.Symbology.CutColumn.Id : 0),
			'f': variable.FilterValue
		};
		url += '/services/backoffice/GetColumnStringDistributions';
	} else {
		args = {
			'k': this.Dataset.properties.Id,
			'c': variable.Data,
			'ci': (variable.DataColumn ? variable.DataColumn.Id : 0),
			'o': variable.Normalization,
			'oi': (variable.NormalizationColumn ? variable.NormalizationColumn.Id : 0),
			's': variable.NormalizationScale,
			'f': variable.FilterValue
		};
		url += '/services/backoffice/GetColumnDistributions';
	}
	return axiosClient.getPromise(url, args, 'obtener las distribuciones de la columna');
};

ScaleGenerator.prototype.GetAndCacheColumnDistributions = function (level, variable) {
	var key = this.createKey(variable);
	this.RegenPending[key] = variable;
	// Trae los grupos calculados para ese par de variables y escalas
	let url = window.host + '/services/backoffice/GetColumnDistributions';
	var loc = this;
	return this.GetColumnDistributions(variable).then(function (data) {
			loc.InfoCache[key] = data;
			var varPending = loc.RegenPending[key];
			loc.RegenPending[key] = null;
			loc.CreateVariableCategories(level, varPending, data);
			return data;
		}).catch(function(err) {
			loc.RegenPending[key] = false;
			return err;
		});
};
ScaleGenerator.prototype.RegenVariableCategories = function (level, variable) {
	var loc = this;
	var key = this.createKey(variable);
	var data = loc.InfoCache[key];
	if (loc.RegenPending[key]) {
		// Pone a que ese proceso atienda a la variable
		// en su versión más nueva disponible
		loc.RegenPending[key] = variable;
		let ret = new Promise((resolve, reject) => {
			resolve();
		});
		return ret;
	}
	if (data || (variable.Symbology.CutMode === 'V' &&
		variable.Symbology.CutColumn && variable.Symbology.CutColumn.Format === columnFormatEnum.NUMBER)) {
		// procede a crearlas si ya tiene los datos, o si usa CutColumn y es numérica
		let ret = new Promise((resolve, reject) => {
			loc.CreateVariableCategories(level, variable, data);
			resolve();
		});
		return ret;
	} else {
		return this.GetAndCacheColumnDistributions(level, variable);
	}
};
ScaleGenerator.prototype.CalculateColor = function (variable, n, total, customColors) {
	// Resuelve nulo
	if (n === null) {
		return 'b7b7b7';
	}
	// Calcula lo demás
	var ratio = (total <= 1 ? 0 : n / (total - 1));
	if (variable.Symbology.PaletteType === 'G') {
		// Gradiente
		var from = variable.Symbology.ColorFrom;
		var to = variable.Symbology.ColorTo;
		return this.CalculateGradienteColor(from, to, ratio);
	} else if (variable.Symbology.PaletteType === 'P') {
		// Paleta
		if (variable.Symbology.Rainbow === 100) {
			return this.CalculateCustomPaletteColor(variable, n, customColors);
		} else if (variable.Symbology.Rainbow < 30) {
			return this.CalculateStandardPaletteColor(variable, ratio);
		} else {
			return this.CalculateStandardPaletteColorBrewer(variable, n, total);
		}
	} else {
		throw new Error('Tipo de paleta no reconocido');
	}
};

ScaleGenerator.prototype.CopySymbology = function (variable, singleColor, customColors) {
	// Copia el symbology y resetea el id
	var data = f.clone({ Symbology: variable.Symbology });
	data.Symbology.Id = null;
	// Pasa valores si es manual
	if (variable.Symbology.CutMode === 'M') {
		// Copia los valores
		var values = [];
		var valuesNoNullElement = this.GetValuesNoNullElement(variable);
		for (var n = 0; n < valuesNoNullElement.length; n++) {
			values.push(valuesNoNullElement[n].Value);
		}
		data.Values = values;
	}
	// Si tiene valores para nulo los graba
	data.NullValue = this.States.saveNullInfo(variable);
	// Pasa cutColumn
	if (variable.Symbology.CutMode === 'V' && variable.Symbology.CutColumn !== null) {
		data.Symbology.CutColumn = data.Symbology.CutColumn.Variable;
	} else {
		data.Symbology.CutColumn = null;
	}
	// Guarda los custom colors
	if (variable.Symbology.CutMode === 'S') {
		data.Symbology.CustomColors = JSON.stringify([singleColor]);
	} else {
		data.Symbology.CustomColors = JSON.stringify(customColors);
	}
	// Guarda visibilidades
	data.Visibilities = this.States.saveVisibilities(variable);
	// Guarda simbolos
	data.Symbols = this.States.saveSymbols(variable);
	return data;
};

ScaleGenerator.prototype.ApplySymbology = function (level, variable, newData) {
	variable.Symbology = newData.Symbology;
	// Se fija si son rangos manuales
	var cutMode = variable.Symbology.CutMode;
	if (cutMode === 'M') {
		variable.Values = [];
		for (var n = 0; n < newData.Values.length; n++) {
			var value = ScaleGenerator.CreateValue('Etiqueta ' + (n + 1), newData.Values[n], 'C0C0C0', n + 1);
			variable.Values.push(value);
		}
	}
	// Se fija si tiene una variable a reponer
	if (cutMode === 'S') {
		variable.Values = [];
		var customColors = JSON.parse(variable.Symbology.CustomColors);
		var value = ScaleGenerator.CreateValue('Total', 0, customColors[0], 1);
		variable.Values.push(value);
	} else {
		if (cutMode === 'V') {
			var column = this.Dataset.GetColumnFromVariable(newData.Symbology.CutColumn, false);
			variable.Symbology.CutColumn = column;
		}
	}
	if (this.Dataset.properties.Type !== 'L') {
		newData.Symbols = null;
	}
	// Pone la info de visibilidad y nulo, que aún no puede aplicar porque
	// no se regeneraron los valores
	variable.Symbology.PendingPaste = { NullValue: newData.NullValue, Visibilities: newData.Visibilities, Symbols: newData.Symbols };
};

ScaleGenerator.prototype.ApplyColors = function (level, variable, newData) {
	variable.Symbology.ColorFrom = newData.Symbology.ColorFrom;
	variable.Symbology.ColorTo = newData.Symbology.ColorTo;
	variable.Symbology.Rainbow = newData.Symbology.Rainbow;
	variable.Symbology.CustomColors = newData.Symbology.CustomColors;
	variable.Symbology.RainbowReverse = newData.Symbology.RainbowReverse;
	variable.Symbology.PaletteType = newData.Symbology.PaletteType;
	this.States.applyNullInfo(variable, newData.NullValue, true);
};

ScaleGenerator.prototype.CalculateCustomPaletteColor = function (variable, n, customColors) {
	if (customColors.length > n) {
		return customColors[n];
	} else {
		return 'C8C8C8';
	}
};

ScaleGenerator.prototype.CalculateStandardPaletteColor = function (variable, ratio) {
	var rainbow = variable.Symbology.Rainbow;
	var reverse = variable.Symbology.RainbowReverse;
	if (reverse) {
		ratio = 1 - ratio;
	}
	var r = this.GetRainbow(rainbow);
	var totalGradientWWith = 178;
	var accum = 0;
	for(var i = 0; i < r.length; i++) {
		accum += r[i].pixels;
		if (ratio <= accum / totalGradientWWith)
		{
			return r[i].color;
		}
	}
	throw new Error('No fue posible calcular el color');
};

ScaleGenerator.prototype.CalculateStandardPaletteColorBrewer = function (variable, n, total) {
	var reverse = variable.Symbology.RainbowReverse;
	if (reverse) {
		n = total - 1 - n;
	}
	// resuelve N = 1 y 2
	if (total === 1) {
		total = 3; n = 1;
	} else if (total == 2) {
		total = 3;
		if (n === 1) n = 2;
	}
	// averigua la escala
	var scale = this.paletteNumberToKey(variable.Symbology.Rainbow);
	var colors = this.PaletteValues[scale];
	// si tiene más categorías que posible, trae la mayor
	var values = colors[total];
	if (!values) {
		var keys = Object.keys(colors);
		values = colors[keys[keys.length - 1]];
	}
	if (n >= values.length) {
		n = n % values.length;
	}
	return values[n].substring(1);
};

ScaleGenerator.prototype.paletteNumberToKey = function (n) {
	var ret = arr.IndexById(this.Palettes.sequential, n);
	if (ret !== -1) {
		return this.Palettes.sequential[ret].Caption;
	}
	ret = arr.IndexById(this.Palettes.diverging, n);
	if (ret !== -1) {
		return this.Palettes.diverging[ret].Caption;
	}
	ret = arr.IndexById(this.Palettes.qualitative, n);
	if (ret !== -1) {
		return this.Palettes.qualitative[ret].Caption;
	}
	throw new Error('Paleta desconocida');
};

ScaleGenerator.prototype.CalculateGradienteColor = function (color1, color2, ratio) {
	var hex = function(x) {
		x = x.toString(16);
		return (x.length == 1) ? '0' + x : x;
	};
	var r = Math.ceil(parseInt(color2.substring(0,2), 16) * ratio + parseInt(color1.substring(0,2), 16) * (1-ratio));
	var g = Math.ceil(parseInt(color2.substring(2,4), 16) * ratio + parseInt(color1.substring(2,4), 16) * (1-ratio));
	var b = Math.ceil(parseInt(color2.substring(4,6), 16) * ratio + parseInt(color1.substring(4,6), 16) * (1-ratio));
	return hex(r) + hex(g) + hex(b);
};

ScaleGenerator.prototype.CreateVariableCategories = function (level, variable, data) {
	var loc = this;
	var customColors = JSON.parse(variable.Symbology.CustomColors);
	// Borra y regenera las categorías
	var previousStates = this.States.Save(variable);

	var requiresNullCategory;
	if (data) {
		requiresNullCategory = data.HasNulls;
	} else {
		requiresNullCategory = this.HasNullCategory(variable);
	}
	if (variable.Symbology.CutMode !== 'M') {
		// Resetea los valores para regenerar
		arr.Crop(variable.Values, (requiresNullCategory && this.HasNullCategory(variable) ? 1 : 0));
	}
	if (variable.Symbology.CutMode !== 'V' && requiresNullCategory) {
		this.EnsureNullCategory(variable);
	}
	if (variable.Symbology.CutMode === 'S') {
		this.CreateSingleCategory(variable);
	}
	if (variable.Symbology.CutMode === 'J') {
		this.CreateRangeCategories(variable, data, 'jenks');
	}
	if (variable.Symbology.CutMode === 'T') {
		this.CreateRangeCategories(variable, data, 'ntiles');
	}
	if (variable.Symbology.CutMode === 'M') {
		this.CreateManualCategories(variable);
	}
	if (variable.Symbology.CutMode === 'V') {
		var col = variable.Symbology.CutColumn;
		if (col !== null) {
			var currentLabels = [];
			if (variable.Symbology.CutColumn.Format === columnFormatEnum.NUMBER) {
				if (this.Dataset.Labels !== null) {
					currentLabels = this.Dataset.Labels[col.Id];
				}
			} else {
				currentLabels = data;
			}
			this.CreateByVariableCategories(variable, currentLabels);
		}
	}
	if (variable.Symbology.PendingPaste)
	{
		this.States.Apply(variable, variable.Symbology.PendingPaste);
		variable.Symbology.PendingPaste = null;
	} else {
		this.States.Apply(variable, previousStates);
	}
	if (variable.Symbology.CutMode !== 'S') {
		this.recalculateColors(variable, customColors);
	}
};

ScaleGenerator.prototype.recalculateColors = function (variable, customColors) {
	var valuesNoNullElement = this.GetValuesNoNullElement(variable);
	for (var n = 0; n < valuesNoNullElement.length; n++) {
		var color = this.CalculateColor(variable, n, valuesNoNullElement.length, customColors);
		valuesNoNullElement[n].FillColor = color;
	}
};


ScaleGenerator.prototype.EnsureNullCategory = function (variable, customColors) {
	if (this.HasNullCategory(variable)) {
		return;
	}
	var value = {
		Id: null,
		Caption: 'Sin valores',
		Visible: true,
		Value: null,
		FillColor: this.CalculateColor(variable, null, null, customColors),
		Symbol: null,
		LineColor: null,
		Order: 0
	};
	arr.InsertAt(variable.Values, 0, value);
};

ScaleGenerator.prototype.GetValuesNoNullElement = function (variable) {
	var ret = [];
	for (var n = 0; n < variable.Values.length; n++) {
		if (variable.Values[n].Value !== null) {
			ret.push(variable.Values[n]);
		}
	}
	return ret;
};

ScaleGenerator.prototype.HasNullCategory = function (variable) {
	for(var n = 0; n < variable.Values.length; n++) {
		if (variable.Values[n].Value === null) {
			return true;
		}
	}
	return false;
};

ScaleGenerator.prototype.CreateSingleCategory = function (variable) {
	var value = {
		Id: null,
		Caption: 'Total',
		Visible: true,
		Value: 10,
		FillColor: color.GetRandomDefaultColor(),
		Symbol: null,
		LineColor: null,
		Order: 1
	};
	variable.Values.push(value);
};

ScaleGenerator.prototype.CreateByVariableCategories = function (variable, currentLabels) {
	if (!currentLabels) {
		return;
	}
	var total = currentLabels.length;
	var newVals = [];
	for (var n = 0; n < total; n++) {
		var label = currentLabels[n];
		var value = {
			Id: null,
			Caption: label.Caption,
			Visible: true,
			Value: label.Value,
			FillColor: null,
			Symbol: null,
			LineColor: null,
			Order: n + 1
		};
		newVals.push(value);
	}
	//arr.Fill(variable.Values, newVals);
	variable.Values = newVals;
};

ScaleGenerator.prototype.CreateManualCategories = function (variable) {
	var extraNullElement = (this.HasNullCategory(variable) ? 1 : 0);
	var total = parseInt(variable.Symbology.Categories);
	if (variable.Values.length > total + extraNullElement) {
		arr.Crop(variable.Values, total + extraNullElement);
	}
	var next = (variable.Values.length > 1 ? variable.Values[variable.Values.length - 2].Value : null);
	if (next === null) {
		next = 10;
	}
	next += 10;
	variable.Values[variable.Values.length - 1].Value = next;
	next += 10;
	var valuesNoNullElement = this.GetValuesNoNullElement(variable);
	for (var n = valuesNoNullElement.length; n < total; n++) {
		var value = ScaleGenerator.CreateValue('Etiqueta ' + (n + 1), next, null, n + 1);
		next += 10;
		variable.Values.push(value);
	}
	this.FixManualRanges(variable);
};

ScaleGenerator.prototype.FixManualRanges = function (variable) {
	// Regenera captions
	var lastValue = 0;
	var valuesNoNullElement = this.GetValuesNoNullElement(variable);
	var total = valuesNoNullElement.length;
	for (var n = 0; n < total; n++) {
		var value = valuesNoNullElement[n].Value;
		var caption = this.ResolveRangeCaption(variable, n === 0, n === total - 1, value, lastValue);
		valuesNoNullElement[n].Caption = caption;
		lastValue = value;
	}
	valuesNoNullElement[valuesNoNullElement.length - 1].Value = MAX_VALUE;
};

ScaleGenerator.CreateValue = function (caption, value, color, order) {
	return {
			Id: null,
			Caption: caption,
			Visible: true,
			Value: value,
			FillColor: color,
			Symbol: null,
			LineColor: null,
			Order: order
		};
};

ScaleGenerator.prototype.RoundByVariable = function (variable, n) {
	if (variable.Symbology.Round && variable.Symbology.Round !== "0") {
		return this.RoundNumber(n, variable.Symbology.Round);
	} else {
		return n;
	}
};

ScaleGenerator.prototype.CreateRangeCategories = function (variable, data, set) {
//	var total = variable.Symbology.Categories;
	var roundedValue = 0;
	var groups = data.Groups;
	var currentGroup = groups[variable.Symbology.Categories];
	var total = currentGroup[set].length + 1;
	var lastRoundedValue = null;
	for (var n = 0; n < total; n++) {
		if (n === total - 1) {
			roundedValue = MAX_VALUE;
		} else {
			roundedValue = this.RoundByVariable(variable, currentGroup[set][n]);
			if (roundedValue < data.MinValue) {
				// Evita que genere punto de corte en 0
				roundedValue += parseFloat(variable.Symbology.Round);
			}
			// Si quedó repetido, lo incrementa
			if (roundedValue <= lastRoundedValue) {
				if (variable.Symbology.Round && variable.Symbology.Round !== "0") {
					roundedValue = lastRoundedValue + parseFloat(variable.Symbology.Round);
				} else {
					roundedValue = lastRoundedValue + 10;
				}
			}
		}
		var caption = this.ResolveRangeCaption(variable, n === 0, n === total - 1, roundedValue, lastRoundedValue);
		var value = ScaleGenerator.CreateValue(caption, roundedValue, null, n + 1);
		variable.Values.push(value);
		lastRoundedValue = roundedValue;
	}
};

ScaleGenerator.prototype.RoundNumber = function (number, criteria) {
	criteria = parseFloat(criteria);
	if (criteria === 0.1)
		return Math.round(number * 10) / 10;
	number = parseFloat(number);
	var mod = number % criteria;
	if (mod < criteria / 2) {
		return number - mod;
	} else {
		return number + criteria - ((number + criteria) % criteria);
	}
};

ScaleGenerator.prototype.ResolveRangeCaption = function (variable, isFirst, isLast, roundedValue, lastRoundedValue) {
	var ret = '';
	if (isFirst) {
		ret = 'Menor que ' + roundedValue;
	} else if (isLast) {
		ret = lastRoundedValue + ' y más';
	} else {
		ret = lastRoundedValue + ' a ' + roundedValue;
	}
	ret = str.Replace(ret, '.', ',');
	ret += h.ResolveNormalizationCaption(variable);
	return ret.trimRight();
};

ScaleGenerator.prototype.GetRainbow = function (rainbow) {
	switch(rainbow)
	{
		case 0:
			return [{ pixels: 9, color: 'A5E3F7'},{ pixels: 10, color: 'DE5DFF'},{ pixels: 10, color: '5AEB52'},{ pixels: 10, color: 'F75D5A'},{ pixels: 10, color: '948E31'},{ pixels: 10, color: '525194'},{ pixels: 10, color: '298663'},{ pixels: 10, color: 'F79ECE'},{ pixels: 10, color: 'ADEF84'},{ pixels: 10, color: 'AD7963'},{ pixels: 10, color: '8C3C73'},{ pixels: 10, color: '6B71F7'},{ pixels: 10, color: '3986B5'},{ pixels: 10, color: 'FF8E52'},{ pixels: 10, color: 'EFCB8C'},{ pixels: 10, color: '73E7BD'},{ pixels: 10, color: '528231'},{ pixels: 9, color: 'CE86F7'}];
		case 1:
			return [{ pixels: 3, color: 'D6D7FF'},{ pixels: 2, color: 'D6D3FF'},{ pixels: 4, color: 'CECFFF'},{ pixels: 2, color: 'C6CBF7'},{ pixels: 2, color: 'C6C7F7'},{ pixels: 2, color: 'BDC3F7'},{ pixels: 2, color: 'BDBEF7'},{ pixels: 2, color: 'BDBAF7'},{ pixels: 2, color: 'B5BAF7'},{ pixels: 2, color: 'B5B6F7'},{ pixels: 2, color: 'ADB2F7'},{ pixels: 4, color: 'ADAEEF'},{ pixels: 4, color: 'A5AAEF'},{ pixels: 4, color: '9CA6EF'},{ pixels: 2, color: '9CA2EF'},{ pixels: 4, color: '949EE7'},{ pixels: 2, color: '949AE7'},{ pixels: 4, color: '8C96E7'},{ pixels: 2, color: '8C92E7'},{ pixels: 4, color: '848EDE'},{ pixels: 4, color: '7B8ADE'},{ pixels: 2, color: '7B86DE'},{ pixels: 2, color: '7386DE'},{ pixels: 4, color: '7382D6'},{ pixels: 6, color: '6B7DD6'},{ pixels: 2, color: '6B79D6'},{ pixels: 2, color: '6379D6'},{ pixels: 4, color: '6375CE'},{ pixels: 4, color: '5A71CE'},{ pixels: 2, color: '5A6DCE'},{ pixels: 2, color: '526DCE'},{ pixels: 4, color: '5269C6'},{ pixels: 2, color: '4A69C6'},{ pixels: 4, color: '4A65C6'},{ pixels: 2, color: '4A61C6'},{ pixels: 4, color: '4261BD'},{ pixels: 4, color: '425DBD'},{ pixels: 2, color: '395DBD'},{ pixels: 4, color: '3959BD'},{ pixels: 2, color: '3155BD'},{ pixels: 2, color: '3159BD'},{ pixels: 4, color: '3155B5'},{ pixels: 2, color: '2955B5'},{ pixels: 4, color: '2951B5'},{ pixels: 2, color: '294DB5'},{ pixels: 4, color: '214DAD'},{ pixels: 4, color: '2149AD'},{ pixels: 6, color: '1849AD'},{ pixels: 2, color: '1845A5'},{ pixels: 2, color: '1849A5'},{ pixels: 4, color: '1045A5'},{ pixels: 2, color: '1041A5'},{ pixels: 2, color: '1045A5'},{ pixels: 2, color: '10419C'},{ pixels: 2, color: '08419C'},{ pixels: 2, color: '083C9C'},{ pixels: 2, color: '08419C'},{ pixels: 4, color: '083C9C'},{ pixels: 2, color: '003894'},{ pixels: 2, color: '003C94'},{ pixels: 5, color: '003894'}];
		case 2:
			return [{ pixels: 1, color: '006100'},{ pixels: 2, color: '086100'},{ pixels: 2, color: '106500'},{ pixels: 4, color: '186900'},{ pixels: 2, color: '217100'},{ pixels: 2, color: '297100'},{ pixels: 2, color: '297500'},{ pixels: 2, color: '317900'},{ pixels: 2, color: '397D00'},{ pixels: 4, color: '398200'},{ pixels: 2, color: '428600'},{ pixels: 2, color: '4A8A00'},{ pixels: 2, color: '528E00'},{ pixels: 2, color: '529200'},{ pixels: 2, color: '5A9600'},{ pixels: 2, color: '5A9A00'},{ pixels: 4, color: '639E00'},{ pixels: 2, color: '6BA200'},{ pixels: 2, color: '73A600'},{ pixels: 2, color: '7BAA00'},{ pixels: 2, color: '7BAE00'},{ pixels: 4, color: '84B200'},{ pixels: 2, color: '8CBA00'},{ pixels: 2, color: '94BE00'},{ pixels: 2, color: '9CBE00'},{ pixels: 2, color: '9CC300'},{ pixels: 2, color: 'A5C700'},{ pixels: 2, color: 'ADCB00'},{ pixels: 2, color: 'B5CF00'},{ pixels: 2, color: 'B5D300'},{ pixels: 2, color: 'BDD700'},{ pixels: 2, color: 'C6DB00'},{ pixels: 2, color: 'CEDF00'},{ pixels: 2, color: 'CEE300'},{ pixels: 2, color: 'D6E700'},{ pixels: 2, color: 'DEEB00'},{ pixels: 2, color: 'E7EF00'},{ pixels: 2, color: 'EFF300'},{ pixels: 2, color: 'EFF700'},{ pixels: 2, color: 'F7FB00'},{ pixels: 4, color: 'FFFF00'},{ pixels: 2, color: 'FFFB00'},{ pixels: 2, color: 'FFF700'},{ pixels: 2, color: 'FFF300'},{ pixels: 2, color: 'FFEF00'},{ pixels: 2, color: 'FFEB00'},{ pixels: 2, color: 'FFE300'},{ pixels: 2, color: 'FFDF00'},{ pixels: 2, color: 'FFDB00'},{ pixels: 2, color: 'FFD700'},{ pixels: 2, color: 'FFD300'},{ pixels: 2, color: 'FFCF00'},{ pixels: 2, color: 'FFCB00'},{ pixels: 2, color: 'FFC300'},{ pixels: 2, color: 'FFBE00'},{ pixels: 2, color: 'FFB600'},{ pixels: 2, color: 'FFB200'},{ pixels: 2, color: 'FFAE00'},{ pixels: 2, color: 'FFAA00'},{ pixels: 2, color: 'FFA600'},{ pixels: 2, color: 'FFA200'},{ pixels: 2, color: 'FF9E00'},{ pixels: 2, color: 'FF9A00'},{ pixels: 2, color: 'FF9600'},{ pixels: 2, color: 'FF9200'},{ pixels: 2, color: 'FF8E00'},{ pixels: 2, color: 'FF8A00'},{ pixels: 2, color: 'FF8600'},{ pixels: 2, color: 'FF7900'},{ pixels: 2, color: 'FF7500'},{ pixels: 2, color: 'FF7100'},{ pixels: 2, color: 'FF6D00'},{ pixels: 2, color: 'FF6900'},{ pixels: 2, color: 'FF6500'},{ pixels: 2, color: 'FF6100'},{ pixels: 2, color: 'FF5900'},{ pixels: 2, color: 'FF5500'},{ pixels: 2, color: 'FF5100'},{ pixels: 2, color: 'FF4D00'},{ pixels: 2, color: 'FF4500'},{ pixels: 2, color: 'FF4100'},{ pixels: 2, color: 'FF3400'},{ pixels: 2, color: 'FF3000'},{ pixels: 2, color: 'FF2800'},{ pixels: 1, color: 'FF2000'}];
		case 3:
			return [{ pixels: 1, color: 'FFCB00'},{ pixels: 2, color: 'FFC300'},{ pixels: 2, color: 'FFBE00'},{ pixels: 2, color: 'FFBA00'},{ pixels: 2, color: 'FFB600'},{ pixels: 2, color: 'FFB200'},{ pixels: 4, color: 'FFAE00'},{ pixels: 2, color: 'FFAA00'},{ pixels: 2, color: 'FFA600'},{ pixels: 2, color: 'FFA200'},{ pixels: 2, color: 'FF9E00'},{ pixels: 2, color: 'FF9A00'},{ pixels: 2, color: 'FF9600'},{ pixels: 2, color: 'FF9200'},{ pixels: 2, color: 'FF8E00'},{ pixels: 2, color: 'FF8A00'},{ pixels: 2, color: 'FF8200'},{ pixels: 2, color: 'FF7D00'},{ pixels: 2, color: 'FF7908'},{ pixels: 2, color: 'FF7108'},{ pixels: 2, color: 'FF7110'},{ pixels: 2, color: 'FF6910'},{ pixels: 2, color: 'FF6510'},{ pixels: 4, color: 'FF5D18'},{ pixels: 2, color: 'FF5518'},{ pixels: 2, color: 'FF5121'},{ pixels: 2, color: 'FF4D21'},{ pixels: 2, color: 'FF4529'},{ pixels: 2, color: 'FF4129'},{ pixels: 2, color: 'FF3C29'},{ pixels: 2, color: 'FF3431'},{ pixels: 2, color: 'FF2C31'},{ pixels: 2, color: 'FF2431'},{ pixels: 2, color: 'FF1C31'},{ pixels: 2, color: 'FF1039'},{ pixels: 2, color: 'FF0039'},{ pixels: 6, color: 'FF0042'},{ pixels: 6, color: 'FF004A'},{ pixels: 4, color: 'FF0052'},{ pixels: 6, color: 'FF005A'},{ pixels: 6, color: 'FF0063'},{ pixels: 4, color: 'FF006B'},{ pixels: 4, color: 'FF0073'},{ pixels: 2, color: 'FF007B'},{ pixels: 6, color: 'FF0084'},{ pixels: 4, color: 'FF008C'},{ pixels: 2, color: 'FF0094'},{ pixels: 2, color: 'F70094'},{ pixels: 2, color: 'F7009C'},{ pixels: 2, color: 'EF009C'},{ pixels: 2, color: 'EF00A5'},{ pixels: 2, color: 'E700A5'},{ pixels: 2, color: 'DE00AD'},{ pixels: 2, color: 'DE00B5'},{ pixels: 2, color: 'D600B5'},{ pixels: 2, color: 'CE00BD'},{ pixels: 2, color: 'C600BD'},{ pixels: 2, color: 'C600C6'},{ pixels: 2, color: 'BD00C6'},{ pixels: 2, color: 'B500CE'},{ pixels: 2, color: 'AD00CE'},{ pixels: 2, color: 'A500D6'},{ pixels: 2, color: '9C00D6'},{ pixels: 2, color: '9400DE'},{ pixels: 2, color: '8C00DE'},{ pixels: 2, color: '8400E7'},{ pixels: 2, color: '7300E7'},{ pixels: 2, color: '6B00EF'},{ pixels: 2, color: '6300EF'},{ pixels: 2, color: '5A00F7'},{ pixels: 2, color: '4A00F7'},{ pixels: 2, color: '3900F7'},{ pixels: 2, color: '2100FF'},{ pixels: 1, color: '0000FF'}];
		case 4:
			return [{ pixels: 9, color: 'B52452'},{ pixels: 10, color: '42CB73'},{ pixels: 10, color: '3982CE'},{ pixels: 10, color: 'B58221'},{ pixels: 10, color: '3124B5'},{ pixels: 10, color: 'BD34B5'},{ pixels: 10, color: '94C329'},{ pixels: 10, color: '31B2AD'},{ pixels: 10, color: 'CE5539'},{ pixels: 10, color: '4ACB31'},{ pixels: 10, color: '314DAD'},{ pixels: 10, color: '733CB5'},{ pixels: 10, color: '5A9E39'},{ pixels: 10, color: '9C9E39'},{ pixels: 10, color: 'A56D42'},{ pixels: 10, color: 'BD458C'},{ pixels: 10, color: '2182A5'},{ pixels: 9, color: '9C2421'}];
		case 5:
			return [{ pixels: 3, color: 'FFEBD6'},{ pixels: 2, color: 'FFE7D6'},{ pixels: 2, color: 'FFE7CE'},{ pixels: 4, color: 'FFE3CE'},{ pixels: 4, color: 'FFDFC6'},{ pixels: 4, color: 'F7DBBD'},{ pixels: 4, color: 'F7D7BD'},{ pixels: 2, color: 'F7D3B5'},{ pixels: 4, color: 'F7CFB5'},{ pixels: 4, color: 'F7CBAD'},{ pixels: 6, color: 'F7C7A5'},{ pixels: 2, color: 'F7C3A5'},{ pixels: 4, color: 'F7BE9C'},{ pixels: 2, color: 'F7BA9C'},{ pixels: 4, color: 'EFB694'},{ pixels: 4, color: 'EFB294'},{ pixels: 2, color: 'EFAE8C'},{ pixels: 4, color: 'EFAA8C'},{ pixels: 2, color: 'EFA684'},{ pixels: 4, color: 'EFA284'},{ pixels: 2, color: 'EF9E7B'},{ pixels: 4, color: 'E79A7B'},{ pixels: 2, color: 'E79A73'},{ pixels: 2, color: 'E79673'},{ pixels: 2, color: 'E79273'},{ pixels: 2, color: 'E7926B'},{ pixels: 2, color: 'E78E6B'},{ pixels: 2, color: 'E78A6B'},{ pixels: 2, color: 'E78A63'},{ pixels: 4, color: 'E78663'},{ pixels: 2, color: 'E78263'},{ pixels: 2, color: 'DE7D5A'},{ pixels: 2, color: 'DE795A'},{ pixels: 4, color: 'DE755A'},{ pixels: 2, color: 'DE7152'},{ pixels: 6, color: 'DE6D52'},{ pixels: 6, color: 'DE654A'},{ pixels: 2, color: 'DE614A'},{ pixels: 2, color: 'D65D42'},{ pixels: 2, color: 'D65942'},{ pixels: 2, color: 'D65542'},{ pixels: 4, color: 'D65539'},{ pixels: 2, color: 'D65139'},{ pixels: 2, color: 'D64D39'},{ pixels: 2, color: 'D64931'},{ pixels: 4, color: 'D64531'},{ pixels: 2, color: 'D64131'},{ pixels: 4, color: 'CE3C29'},{ pixels: 2, color: 'CE3829'},{ pixels: 2, color: 'CE3429'},{ pixels: 2, color: 'CE3421'},{ pixels: 2, color: 'CE3021'},{ pixels: 4, color: 'CE2C21'},{ pixels: 4, color: 'CE2418'},{ pixels: 4, color: 'CE2018'},{ pixels: 2, color: 'C61C18'},{ pixels: 2, color: 'C61C10'},{ pixels: 4, color: 'C61410'},{ pixels: 2, color: 'C61010'},{ pixels: 4, color: 'C60C08'},{ pixels: 1, color: 'C60808'}];
		case 6:
			return [{ pixels: 9, color: 'A5CFBD'},{ pixels: 10, color: '8C86BD'},{ pixels: 10, color: 'DEE3A5'},{ pixels: 10, color: 'A5C3E7'},{ pixels: 10, color: '9CCF94'},{ pixels: 10, color: 'A5B28C'},{ pixels: 10, color: '9C9AB5'},{ pixels: 10, color: 'C6DFB5'},{ pixels: 10, color: 'BDDBDE'},{ pixels: 10, color: '94B2B5'},{ pixels: 10, color: '7BB294'},{ pixels: 10, color: 'ADA6DE'},{ pixels: 10, color: 'DEDFBD'},{ pixels: 10, color: '9CD7D6'},{ pixels: 10, color: '94BA8C'},{ pixels: 10, color: 'C6CB9C'},{ pixels: 10, color: 'A5DBBD'},{ pixels: 9, color: '9CB69C'}];
		case 7:
			return [{ pixels: 9, color: '73C3BD'},{ pixels: 10, color: '31FBD6'},{ pixels: 10, color: '42E7F7'},{ pixels: 10, color: 'CEFBF7'},{ pixels: 10, color: '29B2A5'},{ pixels: 10, color: '7BEFDE'},{ pixels: 10, color: '29AABD'},{ pixels: 10, color: '9CBEC6'},{ pixels: 10, color: '94EFF7'},{ pixels: 10, color: '4AD3CE'},{ pixels: 10, color: '39FBF7'},{ pixels: 10, color: '6BA2A5'},{ pixels: 10, color: '4AA69C'},{ pixels: 10, color: '9CD7DE'},{ pixels: 10, color: '4ADFC6'},{ pixels: 10, color: '5ACFDE'},{ pixels: 10, color: '63FBF7'},{ pixels: 9, color: '63BEAD'}];
		case 8:
			return [{ pixels: 3, color: '2992C6'},{ pixels: 2, color: '3196C6'},{ pixels: 2, color: '399AC6'},{ pixels: 2, color: '429ABD'},{ pixels: 2, color: '4A9ABD'},{ pixels: 2, color: '529EBD'},{ pixels: 2, color: '52A2BD'},{ pixels: 2, color: '5AA2BD'},{ pixels: 2, color: '63A6B5'},{ pixels: 2, color: '6BA6B5'},{ pixels: 2, color: '6BAAB5'},{ pixels: 2, color: '73AAB5'},{ pixels: 2, color: '7BAEAD'},{ pixels: 2, color: '7BB2AD'},{ pixels: 2, color: '84B2AD'},{ pixels: 2, color: '84B2A5'},{ pixels: 4, color: '8CBAA5'},{ pixels: 2, color: '94BAA5'},{ pixels: 2, color: '94BE9C'},{ pixels: 2, color: '9CBE9C'},{ pixels: 2, color: 'A5C39C'},{ pixels: 2, color: 'A5C79C'},{ pixels: 2, color: 'A5C794'},{ pixels: 2, color: 'ADCB94'},{ pixels: 4, color: 'B5CF94'},{ pixels: 2, color: 'B5CF8C'},{ pixels: 2, color: 'BDD38C'},{ pixels: 2, color: 'C6D78C'},{ pixels: 4, color: 'C6DB84'},{ pixels: 2, color: 'CEDB84'},{ pixels: 2, color: 'D6E384'},{ pixels: 4, color: 'D6E37B'},{ pixels: 2, color: 'DEE773'},{ pixels: 2, color: 'DEEB73'},{ pixels: 2, color: 'E7EB73'},{ pixels: 2, color: 'E7EF6B'},{ pixels: 4, color: 'EFF36B'},{ pixels: 2, color: 'F7F76B'},{ pixels: 4, color: 'FFFB63'},{ pixels: 2, color: 'FFF763'},{ pixels: 4, color: 'FFEF5A'},{ pixels: 2, color: 'FFE75A'},{ pixels: 2, color: 'FFE35A'},{ pixels: 2, color: 'FFDB52'},{ pixels: 2, color: 'FFD752'},{ pixels: 2, color: 'FFD352'},{ pixels: 2, color: 'FFCF4A'},{ pixels: 2, color: 'FFCB4A'},{ pixels: 2, color: 'FFC34A'},{ pixels: 2, color: 'FFBE4A'},{ pixels: 2, color: 'FFBA42'},{ pixels: 2, color: 'FFB642'},{ pixels: 2, color: 'FFAE42'},{ pixels: 2, color: 'FFAA42'},{ pixels: 2, color: 'FFA639'},{ pixels: 2, color: 'FFA239'},{ pixels: 2, color: 'FF9A39'},{ pixels: 2, color: 'FF9639'},{ pixels: 2, color: 'FF9231'},{ pixels: 2, color: 'FF8E31'},{ pixels: 2, color: 'FF8A31'},{ pixels: 2, color: 'FF8631'},{ pixels: 2, color: 'FF8229'},{ pixels: 2, color: 'F77D29'},{ pixels: 2, color: 'F77529'},{ pixels: 2, color: 'F77129'},{ pixels: 2, color: 'F76D29'},{ pixels: 2, color: 'F76921'},{ pixels: 4, color: 'F76121'},{ pixels: 2, color: 'F75921'},{ pixels: 2, color: 'F75521'},{ pixels: 2, color: 'F75118'},{ pixels: 2, color: 'F74518'},{ pixels: 2, color: 'F74118'},{ pixels: 2, color: 'F73C18'},{ pixels: 2, color: 'EF3818'},{ pixels: 2, color: 'EF3018'},{ pixels: 2, color: 'EF2C10'},{ pixels: 2, color: 'EF2410'},{ pixels: 2, color: 'EF1C10'},{ pixels: 1, color: 'EF1010'}];
		case 9:
			return [{ pixels: 9, color: '7B86C6'},{ pixels: 10, color: '3134EF'},{ pixels: 10, color: '4261DE'},{ pixels: 10, color: 'C6CFF7'},{ pixels: 10, color: '8C86F7'},{ pixels: 10, color: '4A51F7'},{ pixels: 10, color: '526DCE'},{ pixels: 10, color: 'A5AAE7'},{ pixels: 10, color: '3134C6'},{ pixels: 10, color: 'A5A2FF'},{ pixels: 10, color: '736DF7'},{ pixels: 10, color: '4A45C6'},{ pixels: 10, color: '7B79CE'},{ pixels: 10, color: '4245EF'},{ pixels: 10, color: '9CA6C6'},{ pixels: 10, color: '525DCE'},{ pixels: 10, color: '6382F7'},{ pixels: 9, color: '2928C6'}];
		case 10:
			return [{ pixels: 9, color: 'BD79CE'},{ pixels: 10, color: 'E734F7'},{ pixels: 10, color: 'CE55D6'},{ pixels: 10, color: 'DEB2E7'},{ pixels: 10, color: '9C24BD'},{ pixels: 10, color: 'F782F7'},{ pixels: 10, color: 'B586BD'},{ pixels: 10, color: 'F7AAF7'},{ pixels: 10, color: 'B55DC6'},{ pixels: 10, color: 'FF5DFF'},{ pixels: 10, color: 'E792FF'},{ pixels: 10, color: 'CE38DE'},{ pixels: 10, color: 'B534B5'},{ pixels: 10, color: 'F749FF'},{ pixels: 10, color: 'D696DE'},{ pixels: 10, color: 'D675D6'},{ pixels: 10, color: 'CE4DE7'},{ pixels: 9, color: 'D665FF'}];
		case 11:
			return [{ pixels: 9, color: 'CE8A7B'},{ pixels: 10, color: 'F73439'},{ pixels: 10, color: 'EF6184'},{ pixels: 10, color: 'BD5139'},{ pixels: 10, color: 'F7CBBD'},{ pixels: 10, color: 'BD2431'},{ pixels: 10, color: 'E75D39'},{ pixels: 10, color: 'F7A2B5'},{ pixels: 10, color: 'F7826B'},{ pixels: 10, color: 'F73863'},{ pixels: 10, color: 'CE6973'},{ pixels: 10, color: 'FF6163'},{ pixels: 10, color: 'BD969C'},{ pixels: 10, color: 'BD304A'},{ pixels: 10, color: 'C66952'},{ pixels: 10, color: 'FFA294'},{ pixels: 10, color: 'FF5139'},{ pixels: 9, color: 'F77D94'}];
		case 12:
			return [{ pixels: 5, color: '39AA00'},{ pixels: 4, color: '42AE00'},{ pixels: 4, color: '4AB200'},{ pixels: 4, color: '52B600'},{ pixels: 4, color: '5ABA00'},{ pixels: 2, color: '5ABE00'},{ pixels: 4, color: '63BE00'},{ pixels: 2, color: '6BC300'},{ pixels: 2, color: '6BC700'},{ pixels: 2, color: '73C700'},{ pixels: 4, color: '7BCB00'},{ pixels: 2, color: '7BCF00'},{ pixels: 4, color: '84CF00'},{ pixels: 2, color: '8CD300'},{ pixels: 4, color: '94D700'},{ pixels: 2, color: '9CD700'},{ pixels: 2, color: '9CDB00'},{ pixels: 2, color: 'A5DB00'},{ pixels: 4, color: 'ADDF00'},{ pixels: 4, color: 'B5E300'},{ pixels: 2, color: 'BDE700'},{ pixels: 4, color: 'C6EB00'},{ pixels: 2, color: 'CEEB00'},{ pixels: 2, color: 'D6EF00'},{ pixels: 4, color: 'DEF300'},{ pixels: 2, color: 'E7F300'},{ pixels: 2, color: 'E7F700'},{ pixels: 4, color: 'EFF700'},{ pixels: 2, color: 'F7FB00'},{ pixels: 4, color: 'FFFF00'},{ pixels: 2, color: 'FFF700'},{ pixels: 2, color: 'FFEF00'},{ pixels: 2, color: 'FFEB00'},{ pixels: 2, color: 'FFE700'},{ pixels: 2, color: 'FFE300'},{ pixels: 2, color: 'FFDB00'},{ pixels: 2, color: 'FFD700'},{ pixels: 2, color: 'FFD300'},{ pixels: 2, color: 'FFCB00'},{ pixels: 2, color: 'FFC300'},{ pixels: 2, color: 'FFBA00'},{ pixels: 2, color: 'FFB600'},{ pixels: 2, color: 'FFB200'},{ pixels: 2, color: 'FFAE00'},{ pixels: 2, color: 'FFA600'},{ pixels: 2, color: 'FFA200'},{ pixels: 2, color: 'FF9A00'},{ pixels: 2, color: 'FF9600'},{ pixels: 2, color: 'FF8E00'},{ pixels: 2, color: 'FF8A00'},{ pixels: 2, color: 'FF8600'},{ pixels: 2, color: 'FF8200'},{ pixels: 2, color: 'FF7500'},{ pixels: 2, color: 'FF7100'},{ pixels: 2, color: 'FF6D00'},{ pixels: 2, color: 'FF6500'},{ pixels: 2, color: 'FF6100'},{ pixels: 2, color: 'FF5900'},{ pixels: 2, color: 'FF5500'},{ pixels: 2, color: 'FF5100'},{ pixels: 2, color: 'FF4D00'},{ pixels: 2, color: 'FF4500'},{ pixels: 2, color: 'FF4100'},{ pixels: 2, color: 'FF3400'},{ pixels: 2, color: 'FF3000'},{ pixels: 2, color: 'FF2800'},{ pixels: 2, color: 'FF2400'},{ pixels: 2, color: 'FF2000'},{ pixels: 2, color: 'FF1C00'},{ pixels: 2, color: 'FF1400'},{ pixels: 2, color: 'FF1000'},{ pixels: 2, color: 'FF0C00'},{ pixels: 2, color: 'FF0400'},{ pixels: 1, color: 'FF0000'}];
		case 13:
			return [{ pixels: 1, color: '739A5A'},{ pixels: 2, color: '739E5A'},{ pixels: 2, color: '7B9E5A'},{ pixels: 2, color: '84A263'},{ pixels: 2, color: '84AA63'},{ pixels: 2, color: '8CAA6B'},{ pixels: 4, color: '94B26B'},{ pixels: 2, color: '9CBA73'},{ pixels: 2, color: 'A5BE73'},{ pixels: 2, color: 'ADBE7B'},{ pixels: 4, color: 'B5C77B'},{ pixels: 2, color: 'BDCF84'},{ pixels: 2, color: 'C6CF84'},{ pixels: 2, color: 'C6D78C'},{ pixels: 2, color: 'CEDB8C'},{ pixels: 2, color: 'D6DB8C'},{ pixels: 2, color: 'DEE394'},{ pixels: 2, color: 'E7E794'},{ pixels: 2, color: 'E7EB9C'},{ pixels: 2, color: 'EFEF9C'},{ pixels: 6, color: 'F7EFA5'},{ pixels: 4, color: 'F7EBA5'},{ pixels: 2, color: 'F7EB9C'},{ pixels: 6, color: 'F7E79C'},{ pixels: 2, color: 'F7E39C'},{ pixels: 4, color: 'F7E394'},{ pixels: 6, color: 'F7DF94'},{ pixels: 2, color: 'F7DB94'},{ pixels: 4, color: 'F7DB8C'},{ pixels: 2, color: 'F7D78C'},{ pixels: 6, color: 'F7D38C'},{ pixels: 2, color: 'F7CF8C'},{ pixels: 2, color: 'F7CB84'},{ pixels: 4, color: 'EFC784'},{ pixels: 2, color: 'EFC384'},{ pixels: 2, color: 'EFBE84'},{ pixels: 2, color: 'E7BA84'},{ pixels: 4, color: 'E7B684'},{ pixels: 2, color: 'DEB284'},{ pixels: 6, color: 'DEAA84'},{ pixels: 2, color: 'D6A684'},{ pixels: 2, color: 'D6A284'},{ pixels: 2, color: 'D69E84'},{ pixels: 2, color: 'CE9E84'},{ pixels: 2, color: 'CE9A7B'},{ pixels: 2, color: 'CE9A84'},{ pixels: 2, color: 'CE967B'},{ pixels: 4, color: 'C6927B'},{ pixels: 4, color: 'C68E7B'},{ pixels: 2, color: 'C68E84'},{ pixels: 4, color: 'CE968C'},{ pixels: 2, color: 'D69A94'},{ pixels: 2, color: 'D69E9C'},{ pixels: 2, color: 'D6A2A5'},{ pixels: 2, color: 'DEA6AD'},{ pixels: 4, color: 'DEAEB5'},{ pixels: 2, color: 'E7B6BD'},{ pixels: 2, color: 'E7BAC6'},{ pixels: 2, color: 'E7BECE'},{ pixels: 2, color: 'EFC3CE'},{ pixels: 2, color: 'EFC7D6'},{ pixels: 2, color: 'EFCFDE'},{ pixels: 2, color: 'F7D3E7'},{ pixels: 2, color: 'F7DBE7'},{ pixels: 2, color: 'F7DFEF'},{ pixels: 2, color: 'F7E7F7'},{ pixels: 2, color: 'FFEBF7'},{ pixels: 2, color: 'FFEFFF'},{ pixels: 1, color: 'FFF3FF'}];
		case 14:
			return [{ pixels: 9, color: '9C8652'},{ pixels: 10, color: 'DECF6B'},{ pixels: 10, color: '9C5942'},{ pixels: 10, color: 'E79E7B'},{ pixels: 10, color: 'D6B67B'},{ pixels: 10, color: 'AD7D63'},{ pixels: 10, color: 'ADA252'},{ pixels: 10, color: 'E7D78C'},{ pixels: 10, color: 'C68A5A'},{ pixels: 10, color: 'BD965A'},{ pixels: 10, color: 'A5714A'},{ pixels: 10, color: 'CEA27B'},{ pixels: 10, color: 'CE7D63'},{ pixels: 10, color: 'DEBA6B'},{ pixels: 10, color: 'AD9E63'},{ pixels: 10, color: 'C6B673'},{ pixels: 10, color: 'E7A673'},{ pixels: 9, color: 'E78E73'}];
		default:
			throw new Error('Palette not found.');
	}
};
