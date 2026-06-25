import { displayCell, valueHeader } from '@/table/classes/pivotValue.js';

/**
 * TabularWriter — base de los exportadores de la tabla.
 *
 * Construye una grilla intermedia a partir del estado del pivot (encabezados de
 * columna descompuestos + filas con label, valores y metadatos de presentación)
 * y delega en cada subclase la serialización a su formato concreto.
 *
 * Subclases: CsvWriter, XlsxWriter. Implementan write(grid) → contenido + nombre
 * de archivo + tipo MIME.
 */

function stripHtml(s) {
	return String(s == null ? '' : s).replace(/<[^>]*>/g, '');
}

function TabularWriter(pivot) {
	this.pivot = pivot;
}

TabularWriter.prototype.hasContent = function () {
	return !!(this.pivot && this.pivot.Rows && this.pivot.Rows.length);
};

// Encabezado de una tupla descompuesto en sus partes. 'variable' incluye el modo
// entre paréntesis ("Hogares con NBI (%)").
TabularWriter.prototype.columnParts = function (tuple) {
	var mode = stripHtml(this._unit(tuple.metric, tuple.variable));
	var variableLabel = tuple.variableName || '';
	if (mode) variableLabel = variableLabel + ' (' + mode + ')';
	var category = '';
	if (tuple.isTotal) category = 'Total';
	else if (tuple.labelName) category = tuple.labelName;
	return {
		indicator: tuple.metricName,
		variable: variableLabel,
		category: category,
		edition: tuple.versionName || ''
	};
};

TabularWriter.prototype._unit = function (metric, variable) {
	return valueHeader(metric, variable);
};

TabularWriter.prototype._value = function (tuple, cell) {
	if (!tuple || !tuple.metric || cell == null) return '';
	return displayCell(tuple.metric, tuple.variable, cell);
};

// Filas de datos con metadatos de presentación: cells (label + valores), nivel
// de indentado por jerarquía y si van en negrita.
//   indent 0 = encabezado de delimitación, 1 = corte de control o item sin
//   padre, 2 = item bajo un corte de control.
TabularWriter.prototype.dataRows = function () {
	var headers = this.pivot.MetricTuples.headers;
	var loc = this;
	var out = [];
	this.pivot.Rows.forEach(function (row) {
		var head = row[0];
		var indent = 1;
		var bold = false;
		if (head.isRegionHeader) { indent = 0; bold = true; }
		else if (head.isGroupHeader) { indent = 1; bold = true; }
		else if (head.Parent != null) { indent = 2; }

		var cells = [];
		for (var j = 0; j < row.length; j++) {
			var cell = row[j];
			if (cell.isHeader) cells.push(cell.Label);
			else cells.push(loc._value(headers[j - 1], cell));
		}
		out.push({ cells: cells, indent: indent, bold: bold });
	});
	return out;
};

// Grilla intermedia que consumen las subclases:
//   { columns: [{indicator, variable, category, edition}], rows: [{cells, indent, bold}] }
// La columna de labels (regiones) va aparte, como labelHeader.
TabularWriter.prototype.grid = function () {
	var loc = this;
	var columns = [];
	this.pivot.MetricTuples.headers.forEach(function (tuple) {
		columns.push(loc.columnParts(tuple));
	});
	return {
		labelHeader: 'Regiones',
		columns: columns,
		rows: this.dataRows()
	};
};

TabularWriter.prototype.triggerDownload = function (content, type, filename) {
	var blob = new Blob([content], { type: type });
	var url = URL.createObjectURL(blob);
	var link = document.createElement('a');
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

export default TabularWriter;
