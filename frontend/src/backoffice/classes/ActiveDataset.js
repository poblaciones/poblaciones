import axios from 'axios';
import f from '@/backoffice/classes/Formatter';
import axiosClient from '@/common/js/axiosClient';
import arr from '@/common/js/arr';
import str from '@/common/js/str';
import ScaleGenerator from './ScaleGenerator';
import LevelGenerator from './LevelGenerator';
import Vue from 'vue';
import err from '@/common/js/err';

export default ActiveDataset;

function ActiveDataset(work, dataset) {
	this.Work = work;
	this.properties = dataset;
	this.Labels = null;
	this.Columns = null;
	this.LevelGenerator = new LevelGenerator(this);
	this.ScaleGenerator = new ScaleGenerator(this);
	this.MultilevelMatrix = [];
	this.MetricVersionLevels = [];
	this.GettingColumns = false;
};

ActiveDataset.prototype.Create = function (workId, caption, successCallback) {
	let url = window.host + '/services/backoffice/CreateDataset';
	this.Work.WorkChanged();
	return axiosClient.getPromise(url, { 'w': workId, 't': caption },
						'crear el dataset');
};

ActiveDataset.prototype.CloneDataset = function (workId, caption) {
	let url = window.host + '/services/backoffice/CloneDataset';
	this.Work.WorkChanged();
	return axiosClient.getPromise(url, { 'w': workId, 'k': this.properties.Id, 'n': caption },
		'duplicar el dataset').then(function (data) {
			window.Db.LoadWorks();
			return data;
		});
};

ActiveDataset.prototype.DeleteDataset = function (workId) {
	var loc = this;
	let url = window.host + '/services/backoffice/DeleteDataset';
	this.Work.WorkChanged();
	return axiosClient.getPromise(url, { 'w': workId, 'k': this.properties.Id },
		'eliminar el dataset').then(function () {
			var datasets = loc.GetMultilevelDatasets();
			if (datasets.length === 1) {
				datasets[0].properties.MultilevelMatrix = null;
			}
			window.Db.LoadWorks();
		});
};


ActiveDataset.prototype.toTwoColumnVariable = function (column) {
	if (column.Id === null || column.Id === -100 || column.Id === 0) {
		return { Info: null, Column: null };
	}
	if (column.Id > 0) {
		return { Info: 'O', Column: column };
	}
	var specials = this.GetRichColumns();
	for (let i = 0; i < specials.length; i++) {
		if (specials[i].Id === column.Id) {
			return { Info: specials[i].Code, Column: null };
		}
	}
	throw new Error('Columna no reconocida.');
};

ActiveDataset.prototype.fromTwoColumnVariable = function (columnInfo, columnRef) {
	if (columnInfo === null) {
		return this.GetNullColumn()[0];
	}
	if (columnInfo === 'O') {
		return columnRef;
	}
	var specials = this.GetRichColumns();
	for (let i = 0; i < specials.length; i++) {
		if (specials[i].Code === columnInfo) {
			return specials[i];
		}
	}
	throw new Error('La columna no pudo ser reconocida.');
};

ActiveDataset.prototype.formatNormalizationScale = function(scale) {
	var scales = this.GetNormalizationScales();
	for (let i = 0; i < scales.length; i++) {
		if (scales[i].Id === scale) {
			return scales[i].Caption;
		}
	}
	throw new Error('La escala de normalización no pudo ser reconocida.');
};

ActiveDataset.prototype.formatTwoColumnVariable = function(columnInfo, columnRef, varnameOnly) {
	var column = this.fromTwoColumnVariable(columnInfo, columnRef);
	if (column === null) {
		return '-';
	} else {
		return f.formatColumn(column, varnameOnly);
	}
};

ActiveDataset.prototype.formatTwoColumnVariableTooltip = function(columnInfo, columnRef) {
	var column = this.fromTwoColumnVariable(columnInfo, columnRef);
	if (column === null) {
		return '';
	} else {
		return f.formatColumnTooltip(column);
	}
};

ActiveDataset.prototype.MoveVariableUp = function (level, variable) {
	this.Work.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/MoveVariableUp',
		{ 'v': variable.Id, 'k': this.properties.Id }, 'cambiar la ubicación de la variable')
		.then(function (data) {
			arr.MoveUp(level.Variables, variable);
		});
};

ActiveDataset.prototype.MoveVariableDown = function (level, variable) {
	this.Work.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/MoveVariableDown',
		{ 'v': variable.Id, 'k': this.properties.Id }, 'cambiar la ubicación de la variable')
		.then(function (data) {
			arr.MoveDown(level.Variables, variable);
		});
};

ActiveDataset.prototype.GetColumnById = function (id) {
	for(let i = 0; i < this.Columns.length; i++) {
		let col = this.Columns[i];
		if (col.Id + '' === id + '') {
			return col;
		}
	}
	throw new Error('Columna no encontrada.');
};


ActiveDataset.prototype.UpdateRowValues = function (selectedId, setValues) {
	var loc = this;
	this.Work.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateRowValues',
		{ 'k': this.properties.Id, 'id': selectedId, 'v': setValues }, 'actualizar la fila del dataset'
		).then(function(data) {
			loc.ScaleGenerator.Clear();
			return data;
		});
};

ActiveDataset.prototype.Update = function () {
	this.Work.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateDataset',
			{ 'd': this.properties }, 'actualizar los atributos del dataset');
};

ActiveDataset.prototype.DeleteMetricVersionLevel = function (level) {
	var loc = this;
	this.Work.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/DeleteMetricVersionLevel',
		{ 'k': loc.properties.Id, 'l': level.Id }, 'eliminar el indicador').then(function () {
			arr.RemoveById(loc.MetricVersionLevels, level.Id);
			window.Db.LoadWorks();
			window.Context.RefreshMetrics();
			loc.Work.MetricVersions.Refresh();
		});
};

ActiveDataset.prototype.DeleteVariable = function (level, variable) {
	var loc = this;
	this.Work.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/DeleteVariable',
		{ 'k': loc.properties.Id, 'l': level.Id, 'v': variable.Id }, 'quitar la variable').then(function () {
			arr.RemoveById(level.Variables, variable.Id);
		});
};

ActiveDataset.prototype.UpdateVariable = function (level, variable) {
	var loc = this;
	var levelNoVariables = f.clone(level);
	levelNoVariables.Variables = null;
	// Establece caption
	var column = this.fromTwoColumnVariable(variable.Data, variable.DataColumn);
	var columnText = '';
	if (variable.Data !== 'N') {
		columnText = f.formatColumnText(column);
	}
	// Agrega criterio de corte
	if (variable.Symbology.CutMode === 'V' && variable.Symbology.CutColumn !== null) {
		var byText = f.formatColumnText(variable.Symbology.CutColumn);
		if (columnText.length === 0) {
			columnText = 'Por ' + byText;
		} else {
			columnText += ' por ' + byText; // str.LowerFirstIfOnlyUpper()
		}
	}
	variable.Caption = columnText;
	// graba
	this.Work.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateVariable',
		{ 'k': this.properties.Id, 'l': levelNoVariables, 'v': variable }, 'actualizar la variable').then(
		function (data) {
			if (variable.Id === null || variable.Id === 0) {
				if (level.Variables.indexOf(variable) === -1) {
					level.Variables.push(variable);
				}
				variable.Id = data.VariableId;
				variable.Order = data.Order;
			} else {
				// la busca y reemplaza
				for (var n = 0; n < level.Variables.length; n++) {
					if (level.Variables[n].Id === variable.Id) {
						Vue.set(level.Variables, n, variable);
						break;
					}
				}
			}
			if (variable.IsDefault) {
				for (var n = 0; n < level.Variables.length; n++) {
					if (level.Variables[n].Id !== variable.Id) {
						level.Variables[n].IsDefault = false;
					}
				}
			}
			return data;
		});
};

ActiveDataset.prototype.UpdateMetricVersionLevel = function (level) {
	var loc = this;
	var levelNoVariables = f.clone(level);
	levelNoVariables.Variables = null;
	this.Work.WorkChanged();

	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateMetricVersionLevel',
		{ 'k': this.properties.Id, 'l': levelNoVariables }, 'actualizar el indicador').then(
			function (data) {
				var isNew = level.Id === 0 || level.Id === null;
				level.Id = data.LevelId;
				level.MetricVersion.Id = data.MetricVersionId;
				level.MetricVersion.Metric.Id = data.MetricId;
				if (isNew) {
					loc.MetricVersionLevels.push(level);
					window.Db.LoadWorks();
				} else {
					arr.ReplaceById(loc.MetricVersionLevels, level.Id, level);
				}
				window.Context.RefreshMetrics();
				loc.Work.MetricVersions.Refresh();
				return data;
			});
};


ActiveDataset.prototype.GetMultilevelDatasets = function () {
	var ret = [];
	for(var n = 0; n < this.Work.Datasets.length; n++)
	{
		var ds = this.Work.Datasets[n];
		if (ds.properties.Id !== this.properties.Id &&
			ds.properties.MultilevelMatrix === this.properties.MultilevelMatrix &&
			ds.properties.MultilevelMatrix !== null) {
				ret.push(ds);
		}
	}
	return ret;
};

ActiveDataset.prototype.UpdateMultilevelMatrix = function (id1, matrix1, id2, matrix2) {
	this.Work.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/UpdateMultilevelMatrix',
		{ 'd1': id1, 'm1': (matrix1 ? matrix1 : 0), 'd2': id2, 'm2': (matrix2 ? matrix2 : 0) }, 'guardar la relación multinivel');
};

ActiveDataset.prototype.AcquireMultilevelMatrix = function () {
	var max = 1;
	for(var n = 0; n < this.Work.Datasets.length; n++)
	{
		var ds = this.Work.Datasets[n];
		if (ds.properties.Id !== this.properties.Id &&
			ds.properties.MultilevelMatrix !== null &&
			parseInt(ds.properties.MultilevelMatrix) >= max) {
				max = parseInt(ds.properties.MultilevelMatrix) + 1;
		}
	}
	this.properties.MultilevelMatrix = max;
};

ActiveDataset.prototype.AutoRecodeValues = function (column, list, newName, newLabel) {
	this.Work.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/AutoRecodeValues',
			{ 'i': list, 'c': column.Id, 'l': newLabel, 'n': newName }, 'recodificar los valores');
};

ActiveDataset.prototype.UpdateLabels = function (column, list, deletedList) {
	this.Work.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/UpdateLabels',
			{ 'i': list, 'c': column.Id, 'd': deletedList }, 'actualizar las etiquetas');
};

ActiveDataset.prototype.GetStartDatasetDeleteUrl = function () {
	return window.host + '/services/backoffice/StartDeleteDataset?w=' + this.properties.Id;
};

ActiveDataset.prototype.GetStepDatasetDeleteUrl = function () {
	return window.host + '/services/backoffice/StepDeleteDataset';
};

ActiveDataset.prototype.GetDataUrl = function () {
	return window.host + '/services/backoffice/GetDatasetDataPaged?k=' + this.properties.Id;
};
ActiveDataset.prototype.GetErrorsUrl = function () {
	return window.host + '/services/backoffice/GetDatasetErrors?k=' + this.properties.Id;
};


ActiveDataset.prototype.GetMultiGeoreferenceByLatLongUrl = function () {
	return window.host + '/services/backoffice/CreateMultiGeoreferenceByLatLong';
};

ActiveDataset.prototype.GetMultiGeoreferenceByCodesUrl = function () {
	return window.host + '/services/backoffice/CreateMultiGeoreferenceByCodes';
};

ActiveDataset.prototype.GetMultiGeoreferenceByShapesUrl = function () {
	return window.host + '/services/backoffice/CreateMultiGeoreferenceByShapes';
};

ActiveDataset.prototype.GetStepMultiGeoreferenceUrl = function () {
	return window.host + '/services/backoffice/StepMultiGeoreference';
};

ActiveDataset.prototype.Selected = function () {
	if (this.GettingColumns === false) {
		this.EnsureColumnsAndExec(null);
		this.CalculateMultilevelMatrix();
	}
};


ActiveDataset.prototype.CalculateMultilevelMatrix = function () {
	var ret = [];
	for (var n = 0; n < this.Work.Datasets.length; n++) {
		var ds = this.Work.Datasets[n];
		if (ds !== this) {
			ret.push({
				ds: ds, Id: ds.properties.Id, Caption: ds.properties.Caption,
				Bounded: ds.properties.MultilevelMatrix === this.properties.MultilevelMatrix &&
				ds.properties.MultilevelMatrix !== null
			});
		}
	}
	this.MultilevelMatrix = ret;
};

ActiveDataset.prototype.ReloadProperties = function () {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/GetDataset',
		{ 'k': this.properties.Id }, 'obtener los atributos del dataset').then(function (data) {
			loc.properties = data;
		});
};


ActiveDataset.prototype.ReloadColumns = function () {
	this.Columns = null;
	this.EnsureColumnsAndExec(null);
};

ActiveDataset.prototype.GetLabelFromVariable = function (varName) {
	if (this.Columns === null) {
		return '';
	}
	for (var n = 0; n < this.Columns.length; n++) {
		if (this.Columns[n].Variable === varName) {
			return this.Columns[n].Caption;
		}
	}
	return '[ND]';
};

ActiveDataset.prototype.GetNewUniqueVariableName = function (varName) {
	if (this.GetColumnFromVariable(varName, false) === null)
		return varName;
	var i = 1;
	while (this.GetColumnFromVariable(varName + "_" + i, false) !== null) {
		i++;
	}
	return varName + "_" + i;
};

ActiveDataset.prototype.GetColumnFromVariable = function (varName, throwError = true) {
	for (var n = 0; n < this.Columns.length; n++) {
		if (this.Columns[n].Variable === varName) {
			return this.Columns[n];
		}
	}
	if (throwError) {
		throw new Error('Columna no encontrada.');
	} else {
		return null;
	}
};

ActiveDataset.prototype.DeleteColumns = function (columnIds) {
	this.Work.WorkChanged();
	return axiosClient.getPromise(window.host + '/services/backoffice/DeleteDatasetColumns',
			{ 'k': this.properties.Id, 'ids': columnIds }, 'eliminar la(s) variable(s)');
};

ActiveDataset.prototype.SetColumnOrder = function (idsArray,
						successCallback, errorCallback) {
	this.Work.WorkChanged();
	var loc = this;
	var CancelToken = axios.CancelToken;
	var retCancel = null;
	axios.get(window.host + '/services/backoffice/SetColumnOrder', {
			params: {
				'k': this.properties.Id,
				'cols': idsArray
			},
			cancelToken: new CancelToken(function executor(c) { retCancel = c; })
	}).then(function (res) {
		successCallback();
	}).catch(function (error) {
		errorCallback(error.message);
		err.errDialog('SetColumnOrder', 'actualizar la posición de la variable', error);
		});
	return retCancel;
};

ActiveDataset.prototype.SaveColumn = function (variable) {
	this.Work.WorkChanged();

	return axiosClient.postPromise(window.host + '/services/backoffice/SaveColumn',
		{ 'k': this.properties.Id, 'c': variable },
		'actualizar los atributos de la variable');
};
ActiveDataset.prototype.SkipRows = function (rowIds) {
	var loc = this;
	this.Work.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/OmmitDatasetRows',
		{ 'k': this.properties.Id, 'ids': rowIds },  'marcar las filas como omitidas'
	).then(function(data) {
		loc.ScaleGenerator.Clear();
		return data;
	});
};

ActiveDataset.prototype.DeleteRows = function (rowIds) {
	var loc = this;
	this.Work.WorkChanged();
	return axiosClient.postPromise(window.host + '/services/backoffice/DeleteDatasetRows',
			{	'k': this.properties.Id, 'ids': rowIds }, 'eliminar las filas seleccionadas'
	).then(function(data) {
		loc.ScaleGenerator.Clear();
		return data;
	});
};

ActiveDataset.prototype.ValidAlignments = function () {
	return [{ Id: 0, Caption: 'Izquierda' },
					{ Id: 1, Caption: 'Derecha' },
					{ Id: 2, Caption: 'Centrado' }];
};

ActiveDataset.prototype.ValidMeasures = function () {
	return [{ Id: 1, Caption: 'Nominal' },
					{ Id: 2, Caption: 'Ordinal' },
					{ Id: 3, Caption: 'Continua' }];
};

ActiveDataset.prototype.ValidMeasuresString = function () {
	return [ { Id: 1, Caption: 'Nominal' },
					{ Id: 3, Caption: 'Continua' }];
};

ActiveDataset.prototype.ValidFormats = function () {
	return [{ Id: 1, Caption: 'Texto' },
					{ Id: 5, Caption: 'Numérico' }];
};

ActiveDataset.prototype.EnsureColumnsAndExec = function (callBack) {
	if (this.Columns !== null && this.Labels !== null) {
		if (callBack) {
			callBack();
		}
		return;
	}
	var bPart1Completed = false;
	var bPart2Completed = false;
	var tmpColumns = null;
	var tmpLabels = null;
	this.Columns = null;
	this.Labels = null;
	this.MetricVersionLevels = null;
	this.GettingColumns = true;
	var loc = this;

	var finish = function () {
		loc.Columns = tmpColumns;
		loc.Labels = tmpLabels;
		loc.GettingColumns = false;
		if (callBack !== null) {
			callBack();
		}
	};

	// Consulta en paralelo las columnas, las etiquetas y los indicadores para recargarlos
	axios.get(window.host + '/services/backoffice/GetDatasetColumns', {
		params: { 'k': this.properties.Id },
	}).then(function (res) {
		tmpColumns = res.data;
		bPart1Completed = true;
		if (bPart2Completed) {
			finish();
		}
	}).catch(function (error) {
		err.errDialog('GetColumns', 'obtener las variables del dataset', error);
	});

	axios.get(window.host + '/services/backoffice/GetDatasetColumnsLabels', {
		params: { 'k': this.properties.Id },
	}).then(function (res) {
		tmpLabels = res.data;
		bPart2Completed = true;
		if (bPart1Completed) {
			finish();
		}
	}).catch(function (error) {
		err.errDialog('GetColumnsLabels', 'obtener las etiquetas de las variables', error);
	});

	this.LoadMetricVersionLevels();
};


ActiveDataset.prototype.GetRelatedDatasets = function () {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/GetRelatedDatasets',
		{ 'k': this.properties.Id }, 'obtener los datasets relacionados').then(function (res) {
			return res;
		});
};

ActiveDataset.prototype.LevelMetrics = function (sourceDatasetId) {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/LevelDatasetMetrics',
		{ 'sk': sourceDatasetId, 'tk': this.properties.Id }, 'nivelar los indicadores del dataset').then(function (res) {
			return loc.LoadMetricVersionLevels();
		});
};

ActiveDataset.prototype.LoadMetricVersionLevels = function () {
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/backoffice/GetDatasetMetricVersionLevels',
		{ 'k': this.properties.Id }, 'obtener los indicadores del dataset').then(function (res) {
			loc.MetricVersionLevels = res;
			return res;
		});
};

ActiveDataset.prototype.GetNumericAndRichColumns = function (includeNull) {
	var ret = [];
	if (includeNull) {
		ret = ret.concat(this.GetNullColumn());
	}
	ret = ret.concat(this.GetNumericColumns());
	ret = ret.concat(this.GetSeparator());
	ret = ret.concat(this.GetRichColumns());
	return ret;
};

ActiveDataset.prototype.GetNormalizationScales = function () {
	var scales = [{	Id: 100, Caption: 'Porcentaje' },
									{	Id: 1, Caption: 'n cada unidad' },
									{	Id: 1000, Caption: 'n cada mil' },
									{	Id: 10000, Caption: 'n cada 10 mil' },
									{ Id: 100000, Caption: 'n cada 100 mil' },
									{ Id: 1000000, Caption: 'n cada 1 millón' }];
	return scales;
};

ActiveDataset.prototype.GetNullColumn = function () {
	return [{ Id: 0, Caption: '[Ninguna]', Code: null }];
};

ActiveDataset.prototype.GetSeparator = function () {
	return [{ Id: -100, Caption: '- Variables de cartografía -----', Code: 'O' }];
};
ActiveDataset.prototype.GetRichColumns = function () {
	var columns = [
									{	Id: -1, Caption: 'Población total', Code: 'P' },
									{	Id: -2, Caption: 'Hogares', Code: 'H' },
									{	Id: -3, Caption: 'Adultos (>=18)', Code: 'A' },
									{	Id: -4, Caption: 'Niños (<18)', Code: 'C' },
									{	Id: -5, Caption: 'Area m2', Code: 'M' },
									{	Id: -10, Caption: 'Conteo', Code: 'N' }];
	return columns;
};


ActiveDataset.prototype.GetNumericWithLabelColumns = function () {
	if (this.Columns === null) {
		return [];
	}
	var columns = [];
	for (let i = 0; i < this.Columns.length; i++) {
		if (this.Columns[i].Format === 5) {
			var labels = this.Labels[this.Columns[i].Id];
			if (labels && labels.length > 0) {
				columns.push(this.Columns[i]);
			}
		}
	}
	return columns;
};

ActiveDataset.prototype.GetNumericColumns = function () {
	if (this.Columns === null) {
		return [];
	}
	var columns = [];
	for (let i = 0; i < this.Columns.length; i++) {
		if (this.Columns[i].Format === 5) {
			columns.push(this.Columns[i]);
		}
	}
	return columns;
};

ActiveDataset.prototype.GetTextColumns = function () {
	if (this.Columns === null) {
		return [];
	}
	var columns = [];
	for (let i = 0; i < this.Columns.length; i++) {
		if (this.Columns[i].Format === 1) {
			columns.push(this.Columns[i]);
		}
	}
	return columns;
};

ActiveDataset.prototype.GetDistinctColumnValues = function (columnId) {
	return axiosClient.getPromise(window.host + '/services/backoffice/GetColumnUniqueValues',
			{ 'k': this.properties.Id, 'c': columnId }, 'obtener los valores para la columna');
};


ActiveDataset.prototype.GetColumnUniqueValues = function () {
	if (this.Columns === null) {
		return [];
	}
	var columns = [];
	for (let i = 0; i < this.Columns.length; i++) {
		if (this.Columns[i].Format === 5) {
			columns.push(newColumn);
		}
	}
	return columns;
};

ActiveDataset.prototype.GetColumnsForJqxGrid = function (showingErrors) {
	if (this.Columns === null) {
		return [];
	}
	var columns = [];
	var newColumn = {};

	if (showingErrors === true) {
		newColumn = {};
		newColumn.text = 'Problema';
		newColumn.datafield = 'internal__Err';
		newColumn.width = 130;
		newColumn.pinned = true;
		columns.push(newColumn);
	}
	for (let i = 0; i < this.Columns.length; i++) {
		let datasetColumn = this.Columns[i];
		newColumn = {};
		newColumn.text = datasetColumn.Variable;
		newColumn.datafield = datasetColumn.Variable;
		if (this.Labels && this.Labels[datasetColumn.Id]) {
			let currentLabels = this.Labels[datasetColumn.Id];
			newColumn.filtertype = 'list';
			newColumn.filteritems = this.getLabelList(currentLabels);
		}
		if (datasetColumn.Format === 5) {
			newColumn.cellsformat = 'd' + datasetColumn.Decimals;
		}
		newColumn.cellsalign = this.spssAlignmentToGridAligment(datasetColumn.Alignment);
		newColumn.width = (datasetColumn.ColumnWidth < 30 ? datasetColumn.ColumnWidth * 10 : 200);
		newColumn.cellsrenderer = this.cellsRenderer;

		columns.push(newColumn);
	}
	return columns;
};
ActiveDataset.prototype.cellsRenderer = function (row, columnfield, value, defaulthtml, columnproperties) {
	return '<span style="margin: 4px; float: ' + columnproperties.cellsalign + ';">' + str.EscapeHtml(value) + '</span>';
};

ActiveDataset.prototype.getLabelList = function (list) {
	var ret = [];
	for (var n = 0; n < list.length; n++) {
		ret.push({ label: list[n].Value + '. ' + list[n].Caption, value: list[n].Value });
	}
	return ret;
};

ActiveDataset.prototype.spssAlignmentToGridAligment = function (align) {
	switch (align) {
		case 0:
			return 'left';
		case 2:
			return 'center';
		case 1:
			return 'right';
		default:
			return 'center';
	}
};

ActiveDataset.prototype.GetDataFieldByColumnId = function (showingErrors, columnId) {
	var column = this.GetColumnById(columnId);
	var dataFields = this.GetDataFieldsForJqxGrid(showingErrors);
	for (let i = 0; i < dataFields.length; i++) {
		let dataField = dataFields[i];
		if (dataField.name === column.Variable) {
			return dataField;
		}
	}
	throw new Error('DataField no encontrado.');
};

ActiveDataset.prototype.GetDataFieldsForJqxGrid = function (showingErrors) {
	var datafields = [];

	if (this.Columns !== null) {
		if (showingErrors) {
			datafields.push({ name: 'internal__Err', type: 'string', map: '0' });
		}
		for (let i = 0; i < this.Columns.length; i++) {
			let column = this.Columns[i];
			let datafield = {};
			datafield.name = column.Variable;
			datafield.map = '' + datafields.length;
			if (column.Format === 5) {
				datafield.type = 'number';
			} else {
				datafield.type = 'string';
			}
			datafields.push(datafield);
		} // fin del for
		datafields.push({ name: 'internal__Id', type: 'number', map: '' + datafields.length });
	}
	return datafields;
};
