/**
 * ActiveDataset.js — vista plana y estable de los resultados de una pivot.
 *
 * Es la proyección de un ActivePivot a una estructura tabular pensada como base
 * de los widgets de exploración (resumen, distribución, relaciones).
 *
 * La pivot lo expone como `pivot.Dataset` y es la propia pivot la que lo
 * reconstruye cuando termina un RefreshData. El dataset es una foto: no mantiene
 * referencias vivas a la pivot una vez construido.
 *
 * Cada fila trae values[] y weights[] alineados a columns[]; el peso por celda es
 * el natural del modo de cada columna:
 *   N          → Value         (kind: 'self')
 *   I, P       → Total         (kind: 'denominator')
 *   K, H, A, D → Área en m²    (kind: 'denominator', rotulado 'Superficie (Km²)')
 *
 * Sobre el dataset se monta la vista de columnas de análisis, accesible como
 * `pivot.Dataset.Columns` (instancia de AnalysisColumns).
 */

import { valueHeader, formatValue } from '@/table/classes/pivotValue.js';
import AnalysisColumns from '@/table/classes/AnalysisColumns.js';

// ── Constantes ──────────────────────────────────────────────────────────────

const AREA_LABEL = 'Superficie (Km²)';

const SELF_WEIGHTED  = { N: true };
const TOTAL_WEIGHTED = { I: true, P: true };
const AREA_WEIGHTED  = { K: true, H: true, A: true, D: true };

// ── Utilidades de proyección (privadas del módulo) ───────────────────────────

function stripHtml(s) {
	return String(s == null ? '' : s).replace(/<[^>]*>/g, '');
}

function weightingFor(mode, variable) {
	if (SELF_WEIGHTED[mode]) {
		return {
			kind: 'self',
			label: variable ? variable.Name : 'Valor',
			available: true
		};
	}
	if (TOTAL_WEIGHTED[mode]) {
		var label = (variable && variable.TotalCaption) ? variable.TotalCaption : 'Total';
		return { kind: 'denominator', label: label, available: true };
	}
	if (AREA_WEIGHTED[mode]) {
		return { kind: 'denominator', label: AREA_LABEL, available: true };
	}
	return { kind: 'none', label: null, available: false };
}

function weightFromCell(column, cell) {
	if (!cell || cell.Empty) return null;
	var mode = column.mode;
	if (SELF_WEIGHTED[mode]) {
		return (cell.Value != null) ? Number(cell.Value) : null;
	}
	if (TOTAL_WEIGHTED[mode]) {
		if (cell.Total == null) return null;
		var total = Number(cell.Total);
		// Variables de brecha: el ponderador suma ambos universos (Total + TotalGap).
		// Si HasGapSameTotal, ambos totales son la misma magnitud (p. ej. hogares),
		// así que se cuenta una sola vez para no sobreponderar.
		if (column.meta && column.meta.isGap && cell.TotalGap != null) {
			var totalGap = Number(cell.TotalGap);
			return column.meta.hasGapSameTotal ? total : (total + totalGap);
		}
		return total;
	}
	if (AREA_WEIGHTED[mode]) {
		return (cell.Area != null) ? Number(cell.Area) : null;
	}
	return null;
}

function columnRecord(spec, columnIndex) {
	var metric = spec.metric;
	var av = spec.variable;
	var sm = spec.summary;

	var unit = stripHtml(valueHeader(metric, av));

	// Label largo: "Indicador — Variable (unidad) — Categoría [Edición]".
	var labelParts = [spec.metricName];
	if (spec.variableName) labelParts.push('— ' + spec.variableName + (unit ? ' (' + unit + ')' : ''));
	if (spec.labelName)    labelParts.push('— ' + spec.labelName);
	if (spec.versionName)  labelParts.push('[' + spec.versionName + ']');
	var label = labelParts.join(' ');

	// Short label: la dimensión más diferenciadora primero.
	var shortParts = [];
	if (spec.labelName)         shortParts.push(spec.labelName);
	else if (spec.variableName) shortParts.push(spec.variableName);
	if (spec.versionName) shortParts.push(spec.versionName);
	if (unit) shortParts.push(unit);
	var shortLabel = shortParts.join(' ');

	// Color curado de la categoría (FillColor del ValueLabel), para los gráficos
	// que pintan por categoría. null para la columna de total o si no hay color.
	var fillColor = null;
	if (!spec.isTotal && spec.labelId != null) {
		fillColor = metric.GetStyleColorDictionary()[spec.labelId] || null;
	}

	return {
		key: spec.key,
		label: label,
		shortLabel: shortLabel,
		unit: unit,
		mode: sm,
		decimals: av ? av.Decimals : 0,
		role: 'measure',
		formatter: function (v) { return formatValue(metric, av, v); },
		weighting: weightingFor(sm, av),
		meta: {
			metricId: spec.metricId,
			metricName: spec.metricName,
			versionId: spec.versionId,
			versionName: spec.versionName,
			levelId: spec.levelId,
			levelName: spec.levelName,
			variableId: spec.variableId,
			variableName: spec.variableName,
			labelId: spec.labelId,
			labelName: spec.labelName,
			isTotal: !!spec.isTotal,
			fillColor: fillColor,
			isSimpleCount: !!(av && av.IsSimpleCount),
			isGap: !!(av && av.IsGap),
			hasGapSameTotal: !!(av && av.HasGapSameTotal),
			hasArea: !!(spec.level && spec.level.HasArea)
		},
		_columnIndex: columnIndex
	};
}

function extractValues(pivotRow, workColumns) {
	var out = [];
	for (var i = 0; i < workColumns.length; i++) {
		var cell = pivotRow[workColumns[i]._columnIndex];
		out.push((!cell || cell.ComputedValue == null) ? null : cell.ComputedValue);
	}
	return out;
}

function extractWeights(pivotRow, workColumns) {
	var out = [];
	for (var i = 0; i < workColumns.length; i++) {
		var cell = pivotRow[workColumns[i]._columnIndex];
		out.push(weightFromCell(workColumns[i], cell));
	}
	return out;
}

function extractRaw(pivotRow, workColumns) {
	var out = [];
	for (var i = 0; i < workColumns.length; i++) {
		var cell = pivotRow[workColumns[i]._columnIndex];
		if (!cell) {
			out.push({ value: null, total: null, area: null, columnTotal: null, columnArea: null });
		} else {
			out.push({
				value: cell.Value != null ? Number(cell.Value) : null,
				total: cell.Total != null ? Number(cell.Total) : null,
				area:  cell.Area  != null ? Number(cell.Area)  : null,
				columnTotal: cell.ColumnTotal != null ? Number(cell.ColumnTotal) : null,
				columnArea:  cell.ColumnArea  != null ? Number(cell.ColumnArea)  : null
			});
		}
	}
	return out;
}

// Devuelve la fila del dataset (region-header | group-header | data), o null si
// la fila de pivot viene vacía.
function rowRecord(pr, workColumns, currentBoundaryId) {
	if (!pr || !pr.length) return null;
	var head = pr[0];
	var common = {
		boundaryId: currentBoundaryId,
		values:  extractValues(pr, workColumns),
		weights: extractWeights(pr, workColumns),
		raw:     extractRaw(pr, workColumns)
	};

	if (head.isRegionHeader) {
		return Object.assign({
			id: 'b:' + currentBoundaryId + '|h',
			type: 'region-header',
			label: head.Label,
			parentLabel: null,
			depth: 0,
			fid: null
		}, common);
	}
	if (head.isGroupHeader) {
		return Object.assign({
			id: 'b:' + currentBoundaryId + '|g:' + encodeURIComponent(head.Label || ''),
			type: 'group-header',
			label: head.Label,
			parentLabel: null,
			depth: 1,
			fid: null
		}, common);
	}

	var fid = head.FID != null ? head.FID : null;
	var idTail = (fid != null) ? ('f:' + fid) : ('f:label:' + encodeURIComponent(head.Label || ''));
	return Object.assign({
		id: 'b:' + currentBoundaryId + '|' + idTail,
		type: 'data',
		label: head.Label,
		parentLabel: head.Parent != null ? head.Parent : null,
		depth: (head.Parent != null) ? 2 : 1,
		fid: fid
	}, common);
}

// El boundaryId se arrastra desde el último region-header visto.
function rowsFromPivot(pivot, workColumns) {
	var out = [];
	var pivotRows = pivot.Rows || [];
	var currentBoundaryId = null;
	for (var r = 0; r < pivotRows.length; r++) {
		var pr = pivotRows[r];
		if (pr && pr.length && pr[0].isRegionHeader) {
			currentBoundaryId = pr[0].boundaryId != null ? pr[0].boundaryId : null;
		}
		var record = rowRecord(pr, workColumns, currentBoundaryId);
		if (record) out.push(record);
	}
	return out;
}

function describeFilters(pivot) {
	var out = [];
	var filters = pivot.FilterSet.items || [];
	for (var i = 0; i < filters.length; i++) {
		var f = filters[i];
		var sel = f.SelectedVersion ? f.SelectedVersion().Selection : null;
		var rawItems = (sel && sel.Items) ? sel.Items : [];
		var items = [];
		for (var j = 0; j < rawItems.length; j++) {
			items.push({ fid: rawItems[j].FID, caption: rawItems[j].Caption });
		}
		out.push({
			boundaryId: f.__boundaryId,
			caption: f.properties && f.properties.Name ? f.properties.Name : '',
			items: items
		});
	}
	return out;
}

// Clona un column record sin sus campos internos (los que empiezan con '_').
function stripInternal(col) {
	var clone = {};
	var keys = Object.keys(col);
	for (var i = 0; i < keys.length; i++) {
		if (keys[i][0] !== '_') clone[keys[i]] = col[keys[i]];
	}
	return clone;
}

function regionTypesFrom(rows) {
	var seen = {};
	var list = [];
	for (var i = 0; i < rows.length; i++) {
		var r = rows[i];
		if (r.type === 'region-header' && r.label && !seen[r.label]) {
			seen[r.label] = true;
			list.push(r.label);
		}
	}
	return list;
}

// ── ActiveDataset (la clase) ─────────────────────────────────────────────────

function ActiveDataset(pivot, options) {
	options = options || {};
	this.version = options.version || 1;
	this.title = options.title || 'Tabla';

	// Columnas de trabajo (con índice interno hacia pivot.Rows) y públicas. Las
	// specs placeholder (indicador sin versiones activas) no son columnas de
	// datos, pero su posición real se respeta en el índice para no desalinear la
	// lectura de celdas en pivot.Rows.
	var specs = pivot.MetricTuples.metricTuples || [];
	var workColumns = [];
	for (var i = 0; i < specs.length; i++) {
		if (!specs[i].isEmpty) {
			workColumns.push(columnRecord(specs[i], i + 1));
		}
	}

	this.rows = rowsFromPivot(pivot, workColumns);

	this.columns = [];
	for (var c = 0; c < workColumns.length; c++) {
		this.columns.push(stripInternal(workColumns[c]));
	}

	this.dimensions = [{ id: 'region', label: 'Región', role: 'dimension' }];
	this.filters = describeFilters(pivot);
	this.regionTypes = regionTypesFrom(this.rows);

	this.Columns = new AnalysisColumns(this, { weighted: true });
}

ActiveDataset.prototype.dataRows = function () {
	return this.rows.filter(function (r) { return r.type === 'data'; });
};
ActiveDataset.prototype.groupRows = function () {
	return this.rows.filter(function (r) { return r.type === 'group-header'; });
};
ActiveDataset.prototype.regionHeaders = function () {
	return this.rows.filter(function (r) { return r.type === 'region-header'; });
};

ActiveDataset.prototype.column = function (key) {
	for (var i = 0; i < this.columns.length; i++) {
		if (this.columns[i].key === key) return this.columns[i];
	}
	return null;
};
ActiveDataset.prototype.columnIndex = function (key) {
	for (var i = 0; i < this.columns.length; i++) {
		if (this.columns[i].key === key) return i;
	}
	return -1;
};
ActiveDataset.prototype.rowById = function (id) {
	for (var i = 0; i < this.rows.length; i++) {
		if (this.rows[i].id === id) return this.rows[i];
	}
	return null;
};

ActiveDataset.prototype.numericFrame = function (colKeys) {
	var keys = colKeys || this.columns.map(function (c) { return c.key; });
	var indices = [];
	for (var k = 0; k < keys.length; k++) indices.push(this.columnIndex(keys[k]));
	var data = this.dataRows();

	var matrix = [];
	var rowLabels = [];
	var rowIds = [];
	for (var r = 0; r < data.length; r++) {
		var cells = [];
		for (var j = 0; j < indices.length; j++) {
			cells.push(indices[j] >= 0 ? data[r].values[indices[j]] : null);
		}
		matrix.push(cells);
		rowLabels.push(data[r].label);
		rowIds.push(data[r].id);
	}

	var cols = [];
	for (var kk = 0; kk < keys.length; kk++) cols.push(this.column(keys[kk]));

	return { keys: keys, columns: cols, rows: matrix, rowLabels: rowLabels, rowIds: rowIds };
};

ActiveDataset.prototype.weightedFrame = function (refKey, otherKeys) {
	var refIdx = this.columnIndex(refKey);
	if (refIdx < 0) return null;
	var refCol = this.columns[refIdx];

	var keys = otherKeys;
	if (!keys) {
		keys = [];
		for (var c = 0; c < this.columns.length; c++) {
			if (this.columns[c].key !== refKey) keys.push(this.columns[c].key);
		}
	}
	var otherIndices = [];
	var otherCols = [];
	for (var k = 0; k < keys.length; k++) {
		otherIndices.push(this.columnIndex(keys[k]));
		otherCols.push(this.column(keys[k]));
	}

	var data = this.dataRows();
	var rows = [];
	for (var r = 0; r < data.length; r++) {
		var others = [];
		for (var j = 0; j < otherIndices.length; j++) {
			others.push(otherIndices[j] >= 0 ? data[r].values[otherIndices[j]] : null);
		}
		rows.push({
			rowId: data[r].id,
			rowLabel: data[r].label,
			ref: data[r].values[refIdx],
			others: others,
			weight: data[r].weights[refIdx]
		});
	}

	return { refKey: refKey, refColumn: refCol, otherKeys: keys, otherColumns: otherCols, rows: rows };
};

export default ActiveDataset;
