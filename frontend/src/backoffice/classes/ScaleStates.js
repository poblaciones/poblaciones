import arr from '@/common/js/arr';
import str from '@/common/js/str';

export default ScaleStates;

function ScaleStates(scaleGenerator) {
	this.ScaleGenerator = scaleGenerator;
};

ScaleStates.prototype.Save = function (variable) {
	var ret = {};
	ret.NullValue = this.saveNullInfo(variable);
	ret.Visibilities = this.saveVisibilities(variable);
	ret.Symbols = this.saveSymbols(variable);
	return ret;
};

ScaleStates.prototype.Apply = function (variable, states) {
	this.applyNullInfo(variable, states.NullValue);
	this.applyVisibilities(variable, states.Visibilities);
	this.applySymbols(variable, states.Symbols);
};


ScaleStates.prototype.saveNullInfo = function (variable) {
	if (this.ScaleGenerator.HasNullCategory(variable)) {
		return {
			Caption: variable.Values[0].Caption,
			FillColor: variable.Values[0].FillColor,
			Symbol: variable.Values[0].Symbol,
			Visible: variable.Values[0].Visible
		};
	} else {
		return null;
	}
};

ScaleStates.prototype.saveVisibilities = function (variable) {
	return this.saveAttribute(variable, 'Visible');
};

ScaleStates.prototype.saveSymbols = function (variable) {
	return this.saveAttribute(variable, 'Symbol');
};

ScaleStates.prototype.saveAttribute = function (variable, attribute) {
	var ret = { Null: true, Values: [] };
	if (!variable.Values) {
		return ret;
	}
	var valuesNoNullElement = this.ScaleGenerator.GetValuesNoNullElement(variable);
	for (var n = 0; n < valuesNoNullElement.length; n++) {
		ret.Values.push(valuesNoNullElement[n][attribute]);
	}
	if (this.ScaleGenerator.HasNullCategory(variable)) {
		ret.Null = variable.Values[0][attribute];
	}
	return ret;
};

ScaleStates.prototype.applyVisibilities = function (variable, previousVisibilities) {
	this.applyAttribute(variable, previousVisibilities, 'Visible');
};

ScaleStates.prototype.applySymbols = function (variable, previousVisibilities) {
	this.applyAttribute(variable, previousVisibilities, 'Symbol');
};

ScaleStates.prototype.applyAttribute = function (variable, previousValues, attribute) {
	if (!variable.Values) {
		return;
	}
	var valuesNoNullElement = this.ScaleGenerator.GetValuesNoNullElement(variable);
	for (var n = 0; n < valuesNoNullElement.length; n++) {
		if (n >= previousValues.Values.length) {
			break;
		}
		valuesNoNullElement[n][attribute] = previousValues.Values[n];
	}
	return;
};


ScaleStates.prototype.applyNullInfo = function (variable, newData, onlyColors) {
	if (this.ScaleGenerator.HasNullCategory(variable) && newData) {
		if (!onlyColors) {
			variable.Values[0].Caption = newData.Caption;
			variable.Values[0].Visible = newData.Visible;
		}
		variable.Values[0].FillColor = newData.FillColor;
		variable.Values[0].Symbol = newData.Symbol;
	}
};

