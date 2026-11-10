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
import h from '@/map/js/helper';

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

function columnRecord(tuple, columnIndex) {
	var metric = tuple.metric;
	var av = tuple.variable;
	var sm = tuple.summary;

	var unit = stripHtml(valueHeader(metric, av));

	// Label largo: "Indicador — Variable (unidad) — Categoría [Edición]".
	var labelParts = [tuple.metricName];
	if (tuple.variableName) labelParts.push('— ' + tuple.variableName + (unit ? ' (' + unit + ')' : ''));
	if (tuple.labelName)    labelParts.push('— ' + tuple.labelName);
	if (tuple.versionName)  labelParts.push('[' + tuple.versionName + ']');
	var label = labelParts.join(' ');

	// Short label: la dimensión más diferenciadora primero.
	var shortParts = [];
	if (tuple.labelName)         shortParts.push(tuple.labelName);
	else if (tuple.variableName) shortParts.push(tuple.variableName);
	if (tuple.versionName) shortParts.push(tuple.versionName);
	if (unit) shortParts.push(unit);
	var shortLabel = shortParts.join(' ');

	// Color curado de la categoría (FillColor del ValueLabel), para los gráficos
	// que pintan por categoría. null para la columna de total o si no hay color.
	var fillColor = null;
	if (!tuple.isTotal && tuple.labelId != null) {
		fillColor = metric.GetStyleColorDictionary()[tuple.labelId] || null;
	}

	// Variable normalizadora (p. ej. "/ km²"), el mismo criterio que el combo de
	// tipo de la pivot (MetricHeader): solo aplica en incidencia y se omite si es
	// un simple "%" (ya lo dice la unidad). Se resuelve acá, no en el chart, para
	// que quede disponible donde el chart la necesite sin depender de la selección
	// viva del metric (el dataset es una foto).
	var normCaption = '';
	if (sm === 'I') {
		var cap = h.ResolveNormalizationCaption(av, false);
		normCaption = (cap && cap !== '%') ? cap : '';
	}

	return {
		key: tuple.key,
		label: label,
		shortLabel: shortLabel,
		unit: unit,
		mode: sm,
		decimals: av ? av.Decimals : 0,
		role: 'measure',
		formatter: function (v) { return formatValue(metric, av, v); },
		weighting: weightingFor(sm, av),
		meta: {
			metricId: tuple.metricId,
			metricName: tuple.metricName,
			versionId: tuple.versionId,
			versionName: tuple.versionName,
			levelId: tuple.levelId,
			levelName: tuple.levelName,
			variableId: tuple.variableId,
			variableName: tuple.variableName,
			labelId: tuple.labelId,
			labelName: tuple.labelName,
			isTotal: !!tuple.isTotal,
			fillColor: fillColor,
			isSimpleCount: !!(av && av.IsSimpleCount),
			isGap: !!(av && av.IsGap),
			hasGapSameTotal: !!(av && av.HasGapSameTotal),
			hasArea: !!(tuple.level && tuple.level.HasArea),
			normCaption: normCaption
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

// Devuelve la fila del dataset, o null si la fila de pivot viene vacía. Tipos:
//   'level-header' encabezado de un nivel (Provincias, Municipios de Catamarca…)
//   'data'         elemento del nivel de análisis (lo que analizan los widgets)
//   'item'         elemento de otro nivel (se muestra, pero no se analiza)
function rowRecord(pr, workColumns) {
	if (!pr || !pr.length) return null;
	var head = pr[0];
	var parentItem = head.level ? head.level.parentItem : null;
	var parentFid = null;
	var parentLabel = null;
	if (parentItem) {
		parentFid = parentItem.FID;
		parentLabel = parentItem.Caption;
	}
	var levelCaption = head.level ? head.level.boundary.Name : null;
	var common = {
		boundaryId: head.boundaryId != null ? head.boundaryId : null,
		levelCaption: levelCaption,
		parentLabel: parentLabel,
		depth: head.depth || 0,
		values:  extractValues(pr, workColumns),
		weights: extractWeights(pr, workColumns),
		raw:     extractRaw(pr, workColumns)
	};
	var prefix = 'b:' + common.boundaryId + '|p:' + parentFid;

	if (head.isLevelHeader) {
		return Object.assign({
			id: prefix + '|h',
			type: 'level-header',
			label: head.Label,
			fid: null
		}, common);
	}

	var fid = head.FID != null ? head.FID : null;
	var type = 'item';
	if (head.inAnalysis) {
		type = 'data';
	}
	return Object.assign({
		id: prefix + '|f:' + fid,
		type: type,
		label: head.Label,
		fid: fid
	}, common);
}

function rowsFromPivot(pivot, workColumns) {
	var out = [];
	var pivotRows = pivot.Rows || [];
	for (var r = 0; r < pivotRows.length; r++) {
		var record = rowRecord(pivotRows[r], workColumns);
		if (record) out.push(record);
	}
	return out;
}

// Elementos elegidos explícitamente en el árbol de filas (el más profundo de cada
// rama), agrupados por delimitación.
function describeFilters(pivot) {
	var out = [];
	var byBoundary = {};
	var leaves = pivot.RowTree ? pivot.RowTree.SelectionLeaves() : [];
	for (var i = 0; i < leaves.length; i++) {
		var boundary = leaves[i].level.boundary;
		var entry = byBoundary[boundary.Id];
		if (!entry) {
			entry = { boundaryId: boundary.Id, caption: boundary.Name, items: [] };
			byBoundary[boundary.Id] = entry;
			out.push(entry);
		}
		entry.items.push({ fid: leaves[i].item.FID, caption: leaves[i].item.Caption });
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

// Nombres de las delimitaciones de las filas analizadas ("Municipios").
function regionTypesFrom(rows) {
	var seen = {};
	var list = [];
	for (var i = 0; i < rows.length; i++) {
		var r = rows[i];
		if (r.type === 'data' && r.levelCaption && !seen[r.levelCaption]) {
			seen[r.levelCaption] = true;
			list.push(r.levelCaption);
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
	// tuples placeholder (indicador sin versiones activas) no son columnas de
	// datos, pero su posición real se respeta en el índice para no desalinear la
	// lectura de celdas en pivot.Rows.
	var tuples = pivot.MetricTuples.metricTuples || [];
	var workColumns = [];
	for (var i = 0; i < tuples.length; i++) {
		if (!tuples[i].isEmpty) {
			workColumns.push(columnRecord(tuples[i], i + 1));
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
ActiveDataset.prototype.levelHeaders = function () {
	return this.rows.filter(function (r) { return r.type === 'level-header'; });
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
