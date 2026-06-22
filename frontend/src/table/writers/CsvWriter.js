import TabularWriter from '@/table/writers/TabularWriter.js';

/**
 * CsvWriter — exporta la tabla a CSV. Aplana las cuatro partes del encabezado de
 * cada columna en una sola línea ("indicador - variable - categoría - edición")
 * y dispara la descarga.
 */

function CsvWriter(pivot) {
	TabularWriter.call(this, pivot);
}

CsvWriter.prototype = Object.create(TabularWriter.prototype);
CsvWriter.prototype.constructor = CsvWriter;

CsvWriter.prototype._escape = function (value) {
	var s = (value == null) ? '' : String(value);
	if (/[",\n;]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
	return s;
};

CsvWriter.prototype._headerLine = function (column) {
	var parts = [column.indicator, column.variable, column.category, column.edition];
	return parts.filter(Boolean).join(' - ');
};

CsvWriter.prototype.build = function () {
	if (!this.hasContent()) return '';
	var loc = this;
	var grid = this.grid();

	var header = [grid.labelHeader];
	grid.columns.forEach(function (col) { header.push(loc._headerLine(col)); });

	var matrix = [header];
	grid.rows.forEach(function (r) { matrix.push(r.cells); });

	return matrix.map(function (row) {
		return row.map(function (v) { return loc._escape(v); }).join(',');
	}).join('\n');
};

CsvWriter.prototype.download = function (filename) {
	if (!this.hasContent()) return;
	// BOM inicial para que Excel reconozca UTF-8.
	this.triggerDownload('\ufeff' + this.build(), 'text/csv;charset=utf-8;', filename || 'tabla.csv');
};

export default CsvWriter;
