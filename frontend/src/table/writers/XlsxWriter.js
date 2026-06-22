import ExcelJS from 'exceljs';
import TabularWriter from '@/table/writers/TabularWriter.js';

/**
 * XlsxWriter — exporta la tabla a XLSX. Despliega el encabezado en cuatro filas
 * (indicador / variable+modo / categoría / edición), aplica estilos, fija los
 * encabezados y la primera columna, y dispara la descarga.
 */

var LABEL_COL_WIDTH = Math.round(250 / 7);  // Excel mide en caracteres ≈ px/7.
var VALUE_COL_WIDTH = Math.round(150 / 7);

function XlsxWriter(pivot) {
	TabularWriter.call(this, pivot);
}

XlsxWriter.prototype = Object.create(TabularWriter.prototype);
XlsxWriter.prototype.constructor = XlsxWriter;

XlsxWriter.prototype.download = function (filename) {
	if (!this.hasContent()) return Promise.resolve();
	var loc = this;
	var grid = this.grid();
	var ncols = grid.columns.length + 1;

	var wb = new ExcelJS.Workbook();
	var ws = wb.addWorksheet('Tabla');

	ws.getColumn(1).width = LABEL_COL_WIDTH;
	for (var c = 2; c <= ncols; c++) ws.getColumn(c).width = VALUE_COL_WIDTH;

	this._writeHeader(ws, grid, ncols);
	this._writeRows(ws, grid);

	ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 4 }];

	return wb.xlsx.writeBuffer().then(function (buf) {
		loc.triggerDownload(
			buf,
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			filename || 'tabla.xlsx'
		);
	});
};

// Cuatro filas de encabezado; la etiqueta de la primera columna ocupa las cuatro.
XlsxWriter.prototype._writeHeader = function (ws, grid, ncols) {
	var rowInd = [grid.labelHeader];
	var rowVar = [''];
	var rowCat = [''];
	var rowEd  = [''];
	grid.columns.forEach(function (col) {
		rowInd.push(col.indicator);
		rowVar.push(col.variable);
		rowCat.push(col.category);
		rowEd.push(col.edition);
	});
	ws.addRow(rowInd);
	ws.addRow(rowVar);
	ws.addRow(rowCat);
	ws.addRow(rowEd);
	ws.mergeCells(1, 1, 4, 1);

	for (var r = 1; r <= 4; r++) {
		var hr = ws.getRow(r);
		for (var cc = 1; cc <= ncols; cc++) {
			var cell = hr.getCell(cc);
			cell.font = { size: 11, bold: true };
			cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
			var border = {};
			if (r === 1) border.top = { style: 'thin' };
			if (r === 4) border.bottom = { style: 'thin' };
			cell.border = border;
		}
	}
};

// Filas de datos: label a la izquierda con indentado por jerarquía, valores
// centrados.
XlsxWriter.prototype._writeRows = function (ws, grid) {
	var ncols = grid.columns.length + 1;
	grid.rows.forEach(function (meta) {
		var added = ws.addRow(meta.cells);
		var labelCell = added.getCell(1);
		labelCell.font = { size: 11, bold: meta.bold };
		labelCell.alignment = { horizontal: 'left', indent: meta.indent };
		for (var cc = 2; cc <= ncols; cc++) {
			var vc = added.getCell(cc);
			vc.font = { size: 11, bold: meta.bold };
			vc.alignment = { horizontal: 'center' };
		}
	});
};

export default XlsxWriter;
