import axios from 'axios';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/js/arr';
import str from '@/common/js/str';
import f from '@/backoffice/classes/Formatter';

export default LevelGenerator;

function LevelGenerator(dataset) {
	this.Dataset = dataset;
	this.Messages = [];
};

LevelGenerator.prototype.ClearMessages = function () {
	this.Messages = [];
};

LevelGenerator.prototype.HasMessages = function () {
	return this.Messages.length > 0;
};

LevelGenerator.prototype.CompleteLevel = function (metricVersion) {
	this.ClearMessages();

	// averigua el level dentro de ese work desde work.MetricVersions
	var loc = this;
	return this.Dataset.Work.GetHighestLevelForVersion(metricVersion).then(function (sourceLevel) {
		// Lo crea
		return loc.CreateLevel(sourceLevel.MetricVersion).then(function (level) {
			// Lo graba
			return loc.Dataset.UpdateMetricVersionLevel(level).then(function () {
				// Traslada las variables y las graba
				var ret = loc.CreateVariables(level, sourceLevel);
				// Pone el alerta con la suma de mensajes si es necesario
				if (loc.HasMessages()) {
					window.alert('Algunas de las variables del indicador no tienen su variable homónima: \n\n' +
						this.Messages.join('\n') + '\n\nProcure revisar las definiciones de variables para este nivel.');
				}
				return ret;
			});
		});
	});
};

LevelGenerator.prototype.CreateLevel = function (metricVersion) {
	return window.Context.Factory.GetCopyPromise('MetricVersionLevel').then(
		function (data) {
			data.MetricVersion = metricVersion;
			data.Variables = [];
			return(data);
		});
};

LevelGenerator.prototype.CreateVariables = function (newLevel, sourceLevel) {
	// Cuando ubicó el dataset-version-level correcto, copia variables
	// en el newLevel
	for (var v = 0; v < sourceLevel.Variables.length; v++) {
		var cloned = this.CloneVariable(sourceLevel.Variables[v]);
		newLevel.Variables.push(this.MigrateVariable(cloned));
	}
	// Las graba
	return this.Dataset.ScaleGenerator.RegenAndSaveAllLevelVariables(newLevel);
};

LevelGenerator.prototype.CloneVariable = function (variable) {
	var cloned = f.clone(variable);
	cloned.Id = null;
	cloned.Symbology.Id = null;
	for (var n = 0; n < cloned.Values.length; n++) {
		cloned.Values[n].Id = null;
	}
	return cloned;
};

LevelGenerator.prototype.MigrateVariable = function (variable) {
	// Les corrige los columns buscando otras que se llamen igual
	variable.DataColumn = this.MigrateColumn(variable.DataColumn, 'a la formula');
	variable.NormalizationColumn = this.MigrateColumn(variable.NormalizationColumn, 'a la normalización');
	variable.Symbology.CutColumn = this.MigrateColumn(variable.Symbology.CutColumn, 'al criterio de corte');
	variable.Symbology.SequenceColumn = this.MigrateColumn(variable.Symbology.SequenceColumn, 'al criterio de secuencia');
	return variable;
};

LevelGenerator.prototype.MigrateColumn = function (column, text) {
	if (column === null) {
		return null;
	}
	for (var c = 0; c < this.Dataset.Columns.length; c++) {
		var col = this.Dataset.Columns[c];
		if (col.Variable === column.Variable)
			return col;
	}
	this.Messages.push('La variable \'' + column.Variable + '\' correspondiente ' + text + ' del indicador no fue encontrada en el dataset actual.');
	return null;
};

