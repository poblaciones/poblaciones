/**
 * tableExport.js — exporta a CSV/XLSX las tablas contenidas en un elemento DOM,
 * o una matriz de filas ya construida.
 *
 * Lee el contenido tal como está renderizado (tablas y títulos intercalados) y
 * arma el archivo. El XLSX se genera con ExcelJS (formato nativo, sin la alerta
 * de "el formato no coincide" que produce el HTML-con-extensión-.xls).
 */

import ExcelJS from 'exceljs';

function cellText(cell) {
	return (cell.innerText || cell.textContent || '').replace(/\s+/g, ' ').trim();
}

// Extrae una matriz de strings (filas × columnas) de un contenedor del DOM,
// recorriendo títulos (.ms-head, .ms-version-title) y <table> en orden.
export function matrixFromDom(root) {
	var rows = [];
	if (!root) return rows;
	var nodes = root.querySelectorAll('.ms-head, .ms-version-title, table');
	nodes.forEach(function (node) {
		if (node.tagName === 'TABLE') {
			var trs = node.querySelectorAll('tr');
			trs.forEach(function (tr) {
				var cells = tr.querySelectorAll('th, td');
				var line = [];
				cells.forEach(function (c) { line.push(cellText(c)); });
				if (line.length) rows.push(line);
			});
			rows.push([]);
		} else {
			var t = cellText(node);
			if (t) rows.push([t]);
		}
	});
	while (rows.length && rows[rows.length - 1].length === 0) rows.pop();
	return rows;
}

function escapeCsv(value) {
	var s = value == null ? '' : String(value);
	if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
	return s;
}

function download(filename, content, mime) {
	var blob = (content instanceof Blob) ? content : new Blob([content], { type: mime + ';charset=utf-8;' });
	var url = URL.createObjectURL(blob);
	var a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// ── CSV ──────────────────────────────────────────────────────────────────────
export function matrixToCsv(rows, filename) {
	var csv = rows.map(function (r) { return r.map(escapeCsv).join(','); }).join('\r\n');
	download(filename || 'tabla.csv', '\ufeff' + csv, 'text/csv');
}
export function exportDomToCsv(root, filename) {
	matrixToCsv(matrixFromDom(root), filename);
}

// ── XLSX (ExcelJS, formato nativo) ───────────────────────────────────────────
export function matrixToXlsx(rows, filename, sheetName) {
	var wb = new ExcelJS.Workbook();
	var ws = wb.addWorksheet(sheetName || 'Datos');
	rows.forEach(function (r) {
		// Convierte números cuando es posible, para que Excel los trate como tales.
		var vals = r.map(function (c) {
			if (c === '' || c == null) return null;
			var n = Number(String(c).replace(',', '.'));
			return (isFinite(n) && String(c).trim() !== '') ? n : c;
		});
		ws.addRow(vals);
	});
	return wb.xlsx.writeBuffer().then(function (buf) {
		download(filename || 'tabla.xlsx',
			new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
	});
}
export function exportDomToXlsx(root, filename, sheetName) {
	return matrixToXlsx(matrixFromDom(root), filename, sheetName);
}

// Alias retrocompatible.
export function exportDomToExcel(root, filename) {
	return exportDomToXlsx(root, (filename || 'tabla').replace(/\.xls$/, '') + (/\.xlsx$/.test(filename || '') ? '' : '.xlsx'));
}

export default {
	matrixFromDom: matrixFromDom,
	matrixToCsv: matrixToCsv,
	matrixToXlsx: matrixToXlsx,
	exportDomToCsv: exportDomToCsv,
	exportDomToXlsx: exportDomToXlsx,
	exportDomToExcel: exportDomToExcel
};
