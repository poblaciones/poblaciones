import ExcelJS from 'exceljs';
import TabularWriter from '@/table/writers/TabularWriter.js';

/**
 * XlsxWriter — exporta la tabla a XLSX. Despliega el encabezado en cuatro filas
 * (indicador / variable+modo / categoría / edición), aplica estilos, fija los
 * encabezados y la primera columna, y dispara la descarga.
 */

var LABEL_COL_WIDTH = Math.round(250 / 7);  // Excel mide en caracteres ≈ px/7.
var VALUE_COL_WIDTH = Math.round(150 / 7);
var CODE_COL_WIDTH = 9;                     // ~8 dígitos, más angosta que la descripción.

function XlsxWriter(pivot) {
	TabularWriter.call(this, pivot);
}

XlsxWriter.prototype = Object.create(TabularWriter.prototype);
XlsxWriter.prototype.constructor = XlsxWriter;

// Fusiona en una fila de encabezado los tramos contiguos de columnas cuya clave
// (definida por keyFn) coincide. firstCol = leadCols + 1 (tras las columnas fijas).
XlsxWriter.prototype._mergeRow = function (ws, rowIndex, columns, leadCols, keyFn) {
	var firstCol = leadCols + 1;
	var runStart = 0;
	for (var i = 1; i <= columns.length; i++) {
		var sameAsPrev = i < columns.length && keyFn(columns[i]) === keyFn(columns[runStart]);
		if (!sameAsPrev) {
			if (i - 1 > runStart) {
				// Tramo de más de una columna: se fusiona.
				ws.mergeCells(rowIndex, firstCol + runStart, rowIndex, firstCol + (i - 1));
			}
			runStart = i;
		}
	}
};

XlsxWriter.prototype.download = function (filename) {
	if (!this.hasContent()) return Promise.resolve();
	var loc = this;
	var grid = this.grid();
	// Columnas fijas a la izquierda: código (opcional) + regiones.
	var leadCols = grid.hasCode ? 2 : 1;
	var ncols = grid.columns.length + leadCols;

	var wb = new ExcelJS.Workbook();
	var ws = wb.addWorksheet('Tabla');

	var firstValueCol = leadCols + 1;
	if (grid.hasCode) {
		ws.getColumn(1).width = CODE_COL_WIDTH;
		ws.getColumn(2).width = LABEL_COL_WIDTH;
	} else {
		ws.getColumn(1).width = LABEL_COL_WIDTH;
	}
	for (var c = firstValueCol; c <= ncols; c++) ws.getColumn(c).width = VALUE_COL_WIDTH;

	this._writeHeader(ws, grid, ncols, leadCols);
	this._writeRows(ws, grid, leadCols);

	ws.views = [{ state: 'frozen', xSplit: leadCols, ySplit: 4 }];

	return wb.xlsx.writeBuffer().then(function (buf) {
		loc.triggerDownload(
			buf,
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			filename || 'tabla.xlsx'
		);
	});
};

// Cuatro filas de encabezado; las columnas fijas (código/regiones) ocupan las
// cuatro filas combinadas.
XlsxWriter.prototype._writeHeader = function (ws, grid, ncols, leadCols) {
	var lead = grid.hasCode ? [grid.codeHeader, grid.labelHeader] : [grid.labelHeader];
	var rowInd = lead.slice();
	var rowVar = lead.map(function () { return ''; });
	var rowCat = lead.map(function () { return ''; });
	var rowEd  = lead.map(function () { return ''; });
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
	// Cada columna fija combina sus cuatro filas de encabezado.
	for (var lc = 1; lc <= leadCols; lc++) ws.mergeCells(1, lc, 4, lc);

	// Merge horizontal de celdas de encabezado contiguas que pertenecen al mismo
	// indicador (fila 1) o a la misma edición dentro del indicador (fila 4). Se usa
	// el id del indicador para no fusionar columnas de metric-headers distintos que
	// casualmente compartan nombre o año.
	var keyOf = function (col, part) { return (col.metricId != null ? col.metricId : '?') + '|' + (col[part] || ''); };
	this._mergeRow(ws, 1, grid.columns, leadCols, function (c) { return keyOf(c, 'indicator'); });
	this._mergeRow(ws, 4, grid.columns, leadCols, function (c) { return keyOf(c, 'edition'); });

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

// Filas de datos: código (si hay) y label a la izquierda; valores centrados.
XlsxWriter.prototype._writeRows = function (ws, grid, leadCols) {
	var ncols = grid.columns.length + leadCols;
	grid.rows.forEach(function (meta) {
		var rowCells = grid.hasCode ? [meta.code].concat(meta.cells) : meta.cells;
		var added = ws.addRow(rowCells);
		if (grid.hasCode) {
			var codeCell = added.getCell(1);
			codeCell.font = { size: 11, bold: meta.bold };
			codeCell.alignment = { horizontal: 'left' };
		}
		var labelCell = added.getCell(leadCols);
		labelCell.font = { size: 11, bold: meta.bold };
		labelCell.alignment = { horizontal: 'left', indent: meta.indent };
		for (var cc = leadCols + 1; cc <= ncols; cc++) {
			var vc = added.getCell(cc);
			vc.font = { size: 11, bold: meta.bold };
			vc.alignment = { horizontal: 'center' };
		}
	});
};

export default XlsxWriter;
