import arr from '@/common/framework/arr';
import { cellValue } from '@/table/classes/pivotValue.js';
import ActiveData from '@/table/classes/ActiveData.js';
import ActiveMetricTuples, { LABEL_SORT_KEY } from '@/table/classes/ActiveMetricTuples.js';
import ActiveRowTree from '@/table/classes/ActiveRowTree.js';
import ActiveDataset from '@/table/classes/ActiveDataset.js';
import ActiveRoute from '@/table/classes/ActiveRoute.js';
import logicalVariableName from '@/table/classes/logicalVariableName.js';

// Suma que conserva null: si ambos operandos son null, el resultado es null; si
// alguno tiene valor, suma tratando el null como 0. Permite distinguir "no se midió"
// (todos '-') de "se midió y dio 0".
function _addKeepNull(acc, val) {
	if (val == null) return acc;
	return (acc == null ? 0 : acc) + Number(val);
}

// El catálogo de delimitaciones y sus RegionSets los mantiene el contexto (son
// servicios globales, no algo que la pivot posea), así que se consultan por
// window.Context.
function contextHierarchy() {
	return window.Context.BoundaryHierarchy;
}

function contextRegionFor(boundary) {
	return window.Context.RegionStore.GetRegionFromItems(boundary.VersionId, boundary.Name, boundary.Items);
}


export default ActivePivot;
export { ActivePivot };

function ActivePivot(options) {
	options = options || {};
	this.Rows = [];
	this.Metrics = [];

	// Si es true (default), la fila de nivel (p. ej. "Departamentos") del
	// encabezado de columnas se muestra siempre, aunque el indicador solo tenga
	// el Total visible (sin categorías abiertas). En false, vuelve al criterio
	// previo: solo aparece cuando hay una categoría específica seleccionada.
	// Se prueba como propiedad porque todavía no está decidido si conviene
	// dejarla fija en true.
	this.AlwaysShowLevelRow = true;

	this.MetricTuples = new ActiveMetricTuples(this);
	this.Data = new ActiveData(this);

	// Filas: árbol de niveles (delimitación raíz, elementos desplegables y sus
	// tipos de hijo). Las dependencias del catálogo se inyectan para poder
	// probarlo en aislamiento.
	this.RowTree = new ActiveRowTree(this, {
		hierarchy: options.hierarchy || contextHierarchy,
		regionFor: options.regionFor || contextRegionFor
	});

	this.Router = new ActiveRoute(this);

	// Vista plana de resultados (pivot.Dataset). Arranca como un dataset vacío
	// válido (sin columnas ni filas) y la propia pivot la reconstruye al terminar
	// cada RefreshData. Siempre es un ActiveDataset real, nunca null, para que los
	// consumidores accedan a pivot.Dataset.Columns sin guardas.
	this.Dataset = new ActiveDataset(this);
};

// Clave sentinel para ordenar por el label de la fila (alfabético). Reexporta la
// de ActiveMetricTuples para que haya una sola fuente.
ActivePivot.LABEL_SORT_KEY = LABEL_SORT_KEY;

// Carga datos del endpoint por cada (versionId, levelId) único que las
// columnTuples requieren. Delega en el manager de datos (pivot.Data).
ActivePivot.prototype._loadColumnTupleData = function () {
	return this.Data.load();
};

ActivePivot.prototype.RefreshData = function () {
	this.MetricTuples.rebuild();
	this.SanitizeSort();
	var loc = this;
	return this._loadColumnTupleData().then(function () {
		arr.Clear(loc.MetricTuples.headers);
		for (var s = 0; s < loc.MetricTuples.metricTuples.length; s++) {
			loc.MetricTuples.headers.push(loc.MetricTuples.metricTuples[s]);
		}
		arr.Clear(loc.Rows);
		if (loc.RowTree.root) {
			arr.AddRange(loc.Rows, loc._levelRows(loc.RowTree.root, 0, loc.RowTree.AnalysisLevel()));
		}
		// Las filas ya están armadas: se reconstruye la vista plana de resultados.
		loc.RebuildDataset();
	});
};

// Filas de un nivel (encabezado y elementos) y, debajo de cada elemento
// desplegado, las de sus tipos de hijo. Con indicadores, un tipo de hijo abierto
// sin filas no se ofrece (diría "(0)"), y un elemento desplegado sin datos se
// conserva solo si debajo hay elementos con datos.
ActivePivot.prototype._levelRows = function (level, depth, analysisLevel) {
	if (!level.IsTypeOpen()) {
		return this._collapsedLevelRows(level, depth);
	}
	var block = this._buildLevelBlock(level);
	var hasTuples = this.MetricTuples.metricTuples.length > 0;
	var body = [];
	var listed = 0;
	for (var r = 0; r < block.rows.length; r++) {
		var row = block.rows[r];
		var nested = [];
		if (row[0].open) {
			var types = level.Types(row[0].item);
			for (var t = 0; t < types.length; t++) {
				arr.AddRange(nested, this._levelRows(types[t], depth + 2, analysisLevel));
			}
		}
		if (!hasTuples || rowHasValue(row) || hasItemRows(nested)) {
			row[0].depth = depth + 1;
			row[0].inAnalysis = (level === analysisLevel);
			body.push(row);
			arr.AddRange(body, nested);
			listed++;
		}
	}
	if (!level.IsRoot() && hasTuples && listed === 0) {
		return [];
	}
	if (listed !== block.rows.length) {
		block.header[0] = this._levelHeaderCell(level, listed);
	}
	block.header[0].depth = depth;
	return [block.header].concat(body);
};

// Un tipo de hijo colapsado muestra solo su encabezado, con la cantidad de
// elementos y sin valores: sus datos se calculan recién al abrirlo, porque pueden
// exigir un nivel geográfico mucho más fino (p. ej. todos los radios del país).
ActivePivot.prototype._collapsedLevelRows = function (level, depth) {
	var header = [this._levelHeaderCell(level, level.ShownItems().length)];
	for (var t = 0; t < this.MetricTuples.metricTuples.length; t++) {
		header.push(null);
	}
	header[0].depth = depth;
	return [header];
};

function hasItemRows(rows) {
	for (var i = 0; i < rows.length; i++) {
		if (rows[i][0].isItem) return true;
	}
	return false;
}

function rowHasValue(row) {
	for (var c = 1; c < row.length; c++) {
		if (row[c] && row[c].Value !== null && row[c].Value !== undefined) return true;
	}
	return false;
}

// Resuelve las filas de los elementos visibles de un nivel y su encabezado con
// los totales agregados (Value, Total, Area, brecha) y los denominadores de los
// modos normalizados (ColumnTotal, ColumnArea, RowGroupTotal).
ActivePivot.prototype._buildLevelBlock = function (level) {
	var tuples = this.MetricTuples.metricTuples;
	var region = this.RowTree.RegionFor(level);
	var items = level.ShownItems();
	var totals = [];
	for (var t = 0; t < tuples.length; t++) {
		totals.push({ Value: null, Total: null, Area: null, ValueGap: null, TotalGap: null });
	}
	var levelRows = [];
	for (var n = 0; n < items.length; n++) {
		var row = [this._itemHeaderCell(level, items[n])];
		for (var ci = 0; ci < tuples.length; ci++) {
			var value = this.ResolveCell(tuples[ci], region, items[n]);
			row.push(value);
			// Se suma solo lo no nulo y se conserva null cuando ningún aporte tuvo
			// valor: la suma de puros '-' debe quedar '-', no 0 (un 0 daría a
			// entender que se midió y el resultado fue cero).
			totals[ci].Value = _addKeepNull(totals[ci].Value, value.Value);
			totals[ci].Total = _addKeepNull(totals[ci].Total, value.Total);
			totals[ci].Area = _addKeepNull(totals[ci].Area, value.Area);
			// Brecha: se agregan los dos universos para que el delta del encabezado
			// se calcule sobre las sumas.
			totals[ci].ValueGap = _addKeepNull(totals[ci].ValueGap, value.ValueGap);
			totals[ci].TotalGap = _addKeepNull(totals[ci].TotalGap, value.TotalGap);
		}
		levelRows.push(row);
	}
	// Solo filas con al menos un valor. Sin indicadores no hay valores en ninguna
	// fila: en ese caso se muestran todas, para que las delimitaciones sigan
	// visibles al quitar el último indicador. Un elemento desplegado se conserva
	// aunque no tenga datos, porque de él cuelgan sus niveles hijos.
	if (tuples.length > 0) {
		levelRows = levelRows.filter(function (r) {
			return r[0].open || rowHasValue(r);
		});
	}

	var columnTotals = this._applyColumnTotals(levelRows);
	var groups = this._tupleGroups();
	for (var g = 0; g < levelRows.length; g++) {
		this._setRowGroupTotals(levelRows[g].slice(1), groups);
	}
	this._setRowGroupTotals(totals, groups);
	this._applyComputedValues(levelRows);

	// Ordena las filas al interior del nivel según el criterio activo (columna o
	// label), sin mezclar entre niveles distintos.
	this.SortBoundaryRows(levelRows);

	for (var ti = 0; ti < totals.length; ti++) {
		totals[ti].ColumnTotal = columnTotals.values[ti];
		totals[ti].ColumnArea = columnTotals.areas[ti];
		var tuple = tuples[ti];
		// Columna placeholder (indicador sin versiones activas): el total es vacío, no 0.
		if (tuple.isEmpty) {
			totals[ti].Empty = true;
			totals[ti].Value = null;
			totals[ti].ComputedValue = null;
		} else {
			// ComputedValue del total para que pueda ordenarse / mostrarse coherente.
			totals[ti].ComputedValue = this._computedValue(tuple, totals[ti]);
		}
	}
	var header = [this._levelHeaderCell(level, levelRows.length)];
	arr.AddRange(header, totals);
	return { header: header, rows: levelRows };
};

ActivePivot.prototype._itemHeaderCell = function (level, item) {
	return {
		Label: item.Caption,
		FID: item.FID,
		Code: item.Code,
		isHeader: true,
		isItem: true,
		boundaryId: level.boundary.Id,
		level: level,
		item: item,
		open: level.IsItemOpen(item),
		expandable: level.IsExpandable(item),
		forced: level.IsItemForced(item)
	};
};

// Encabezado de un nivel. El conteo entre paréntesis es cuántas filas quedan
// LISTADAS debajo tras el filtro por datos (un indicador sin datos en la mayoría
// de los hijos las oculta, y el número debe reflejar lo que se ve). Con el nivel
// restringido se informa también el universo ("2 de 6"). Sin indicadores y sin
// restricción no se muestra número: todas las filas están.
ActivePivot.prototype._levelHeaderCell = function (level, listedCount) {
	var caption = level.boundary.Name;
	var countText = '';
	if (!level.IsAll()) {
		countText = '(' + listedCount + ' de ' + level.Items().length + ')';
	} else if (this.MetricTuples.metricTuples.length > 0) {
		countText = '(' + listedCount + ')';
	}
	var label = caption;
	if (countText) {
		label = caption + ' ' + countText;
	}
	return {
		Label: label,
		Caption: caption,
		CountText: countText,
		isHeader: true,
		isLevelHeader: true,
		isRoot: level.IsRoot(),
		boundaryId: level.boundary.Id,
		level: level,
		collapsible: level.IsCollapsible(),
		open: level.IsTypeOpen(),
		restricted: !level.IsAll()
	};
};

// Totales verticales por columna (Value y Area) de las filas de un nivel; se
// copian a cada celda como ColumnTotal / ColumnArea (denominadores de col% y %
// de área).
ActivePivot.prototype._applyColumnTotals = function (rows) {
	var tuples = this.MetricTuples.metricTuples;
	var values = [];
	var areas = [];
	for (var ci = 0; ci < tuples.length; ci++) {
		var sum = 0;
		var sumArea = 0;
		for (var ri = 0; ri < rows.length; ri++) {
			var cell = rows[ri][ci + 1];
			if (cell && cell.Value !== null && cell.Value !== undefined) sum += Number(cell.Value);
			if (cell && cell.Area !== null && cell.Area !== undefined) sumArea += Number(cell.Area);
		}
		values.push(sum);
		areas.push(sumArea);
	}
	for (var r = 0; r < rows.length; r++) {
		for (var c = 0; c < tuples.length; c++) {
			if (rows[r][c + 1]) {
				rows[r][c + 1].ColumnTotal = values[c];
				rows[r][c + 1].ColumnArea = areas[c];
			}
		}
	}
	return { values: values, areas: areas };
};

// Índices de columnas que comparten (metricId, versionId, levelId, variableId):
// el grupo sobre el que se calcula el % horizontal (modo FIL).
ActivePivot.prototype._tupleGroups = function () {
	var tuples = this.MetricTuples.metricTuples;
	var groups = {};
	for (var i = 0; i < tuples.length; i++) {
		var sp = tuples[i];
		var key = sp.metricId + ':' + sp.versionId + ':' + sp.levelId + ':' + sp.variableId;
		if (!groups[key]) groups[key] = [];
		groups[key].push(i);
	}
	return groups;
};

// RowGroupTotal de una fila (cells alineadas con las tuplas): las categorías
// reparten 100% entre las seleccionadas (suma de sus Value, sin la columna Total,
// que sería doble conteo); la columna Total se normaliza contra sí misma, de modo
// que su FIL dé 100 aun cuando no estén todas las categorías seleccionadas.
ActivePivot.prototype._setRowGroupTotals = function (cells, groups) {
	var tuples = this.MetricTuples.metricTuples;
	var keys = Object.keys(groups);
	for (var k = 0; k < keys.length; k++) {
		var indexes = groups[keys[k]];
		var sum = 0;
		for (var n = 0; n < indexes.length; n++) {
			var categoryCell = cells[indexes[n]];
			if (!tuples[indexes[n]].isTotal && categoryCell && categoryCell.Value !== null && categoryCell.Value !== undefined) {
				sum += Number(categoryCell.Value);
			}
		}
		for (var m = 0; m < indexes.length; m++) {
			var cell = cells[indexes[m]];
			if (cell) {
				if (tuples[indexes[m]].isTotal && cell.Value !== null && cell.Value !== undefined) {
					cell.RowGroupTotal = Number(cell.Value);
				} else {
					cell.RowGroupTotal = sum;
				}
			}
		}
	}
};

// Valor calculado que se muestra en cada celda (según el modo y la variable). Lo
// usan el orden y el render.
ActivePivot.prototype._applyComputedValues = function (rows) {
	var tuples = this.MetricTuples.metricTuples;
	for (var r = 0; r < rows.length; r++) {
		for (var ci = 0; ci < tuples.length; ci++) {
			var cell = rows[r][ci + 1];
			if (cell) {
				cell.ComputedValue = this._computedValue(tuples[ci], cell);
			}
		}
	}
};

ActivePivot.prototype._computedValue = function (tuple, cell) {
	var cv = cellValue(tuple.metric, tuple.variable, cell);
	if (cv === '-' || cv === null || cv === undefined) {
		return null;
	}
	return Number(cv);
};

// Reconstruye pivot.Dataset (la vista plana de resultados) a partir del estado
// actual. La versión se incrementa para que los consumidores reactivos que
// observan pivot.Dataset.version detecten el cambio.
ActivePivot.prototype.RebuildDataset = function (title) {
	var prevVersion = this.Dataset ? this.Dataset.version : 0;
	var prevTitle = this.Dataset ? this.Dataset.title : undefined;
	this.Dataset = new ActiveDataset(this, {
		version: prevVersion + 1,
		title: title || prevTitle
	});
	return this.Dataset;
};


// Si la columna ordenadora ya no existe entre las columnas (porque se
// deseleccionó la categoría o cambió la versión), limpia el estado de orden
// para que la UI no muestre una flecha en una columna inexistente.
ActivePivot.prototype.SanitizeSort = function () {
	if (this.MetricTuples.sortKey == null || this.MetricTuples.sortKey === ActivePivot.LABEL_SORT_KEY) return;
	for (var i = 0; i < this.MetricTuples.metricTuples.length; i++) {
		if (this.MetricTuples.metricTuples[i].key === this.MetricTuples.sortKey) return;
	}
	this.MetricTuples.sortKey = null;
	this.MetricTuples.sortDirection = 0;
};

// Ordena las filas de una delimitación según el criterio activo, sin mezclar
// entre delimitaciones distintas. El criterio puede ser una columna concreta
// (SortColumnKey = tuple.key) o el label de la fila (SortColumnKey === LABEL_SORT_KEY).
// Los valores nulos quedan al final en ambas direcciones.
ActivePivot.prototype.SortBoundaryRows = function (boundaryRows) {
	if (this.MetricTuples.sortKey == null || this.MetricTuples.sortDirection === 0) return;
	var dir = this.MetricTuples.sortDirection;

	// Orden alfabético por el label de la fila (primera celda).
	if (this.MetricTuples.sortKey === ActivePivot.LABEL_SORT_KEY) {
		boundaryRows.sort(function (a, b) {
			var al = (a[0] && a[0].Label != null) ? String(a[0].Label) : '';
			var bl = (b[0] && b[0].Label != null) ? String(b[0].Label) : '';
			var cmp = al.localeCompare(bl, 'es', { sensitivity: 'base' });
			return dir === 1 ? cmp : -cmp;
		});
		return;
	}

	// Localiza la columna por su clave estable.
	var colIndex = -1;
	for (var i = 0; i < this.MetricTuples.metricTuples.length; i++) {
		if (this.MetricTuples.metricTuples[i].key === this.MetricTuples.sortKey) {
			colIndex = i;
			break;
		}
	}
	if (colIndex === -1) return;   // la columna ordenadora ya no existe: no ordena.
	var col = colIndex + 1;
	boundaryRows.sort(function (a, b) {
		var av = a[col] ? a[col].ComputedValue : null;
		var bv = b[col] ? b[col].ComputedValue : null;
		var aNull = (av === null || av === undefined);
		var bNull = (bv === null || bv === undefined);
		if (aNull && bNull) return 0;
		if (aNull) return 1;
		if (bNull) return -1;
		return dir === 1 ? (av - bv) : (bv - av);
	});
};

ActivePivot.prototype.ResolveCell = function (tuple, region, regionItem) {
	// Resuelve la celda para un ColumnTuple (combinación metric × versión × labelId|total).
	// Suma Value, Total y AreaM2 filtrando por VID, geografía y, si corresponde, por LID.

	// Tuple placeholder (indicador sin versiones activas): celda vacía.
	if (tuple.isEmpty || !tuple.level) {
		return { 'Value': null, 'Total': null, 'Area': null, 'Empty': true };
	}

	var level = tuple.level;
	var metricGeographyId = level.GeographyId;
	var geographyIds = region.GetGeographyIdsForItem(regionItem.FID, metricGeographyId);

	if (!geographyIds || geographyIds.length === 0) {
		return { 'Value': null, 'Total': null, 'Area': null, 'Empty': true };
	}

	// Sumariza. Cuando tuple.labelId es null, suma todos los LID que matchean el VID
	// (eso da el "Total" agregado por variable, o la única columna cuando la variable
	// no tiene ValueLabels). Cuando tuple.labelId es un Id concreto, filtra por él.
	//
	// Se usa el índice por VID y geografía (pivot.Data.indexFor): se recorren solo
	// las geografías del elemento, en vez de barrer todo el array de items por
	// cada celda.
	var sum = 0, sumTotal = 0, sumArea = 0, count = 0;
	var sumValueGap = 0, sumTotalGap = 0, hasGap = false;
	var variableId = tuple.variableId;
	var labelId = tuple.labelId;
	var index = this.Data.indexFor(tuple.versionId, tuple.levelId);
	var byVid = index ? index[variableId] : null;

	if (byVid) {
		for (var g = 0; g < geographyIds.length; g++) {
			var bucket = byVid.byGeo.get(geographyIds[g]);
			if (!bucket) continue;
			// El área (AreaM2) es geográfica: la comparten todos los registros de la
			// misma geografía (uno por categoría). Por eso se suma UNA sola vez por
			// geografía, no por registro; sumarla por registro la inflaba tantas veces
			// como categorías tuviera la variable (rompía densidad y km² del total).
			var geoArea = 0, geoAreaSeen = false;
			for (var b = 0; b < bucket.length; b++) {
				var mi = bucket[b];
				if (labelId != null && mi.LID !== labelId) continue;
				// Cada registro que aporta trae el paquete completo (Value, Total y, si
				// corresponde, Area): se cuenta como UN aporte y se suman sus campos
				// juntos. No se cuenta por campo: hacerlo fabricaba celdas incoherentes
				// (p. ej. Total presente con Value en cero), que luego rompían los
				// cálculos derivados (incidencia, densidad) en otros lados.
				count++;
				if (mi.Value !== null && mi.Value !== undefined) sum += parseFloat(mi.Value);
				if (mi.Total !== null && mi.Total !== undefined) sumTotal += parseFloat(mi.Total);
				if (mi.AreaM2 !== null && mi.AreaM2 !== undefined) { geoArea = parseFloat(mi.AreaM2); geoAreaSeen = true; }
				// Variables de brecha (gap): traen un segundo par de valores que se
				// suma en paralelo. El cálculo del delta lo hace pivotValue.
				if (mi.ValueGap !== null && mi.ValueGap !== undefined) { sumValueGap += parseFloat(mi.ValueGap); hasGap = true; }
				if (mi.TotalGap !== null && mi.TotalGap !== undefined) { sumTotalGap += parseFloat(mi.TotalGap); hasGap = true; }
			}
			if (geoAreaSeen) sumArea += geoArea;
		}
	}

	// Celda coherente: si ninguna geografía aportó un registro, está vacía (todos los
	// campos null); si alguna aportó, todos los campos son sumas válidas. El área se
	// devuelve también cuando es 0 legítimo (no se la confunde con "sin dato").
	if (count === 0) {
		return { 'Value': null, 'Total': null, 'Area': null, 'Empty': true };
	}
	return {
		'Value': sum,
		'Total': sumTotal,
		'Area':  sumArea,
		'ValueGap': hasGap ? sumValueGap : null,
		'TotalGap': hasGap ? sumTotalGap : null
	};
};

// Valor agregado de una categoría sobre el universo de análisis de la tabla,
// reutilizando ResolveCell (la sumarización por celda vive en un solo lugar).
// Recorre los elementos del nivel de análisis, acumula Value y Total, y aplica
// la misma interpretación por modo de medición que usa el dataset (pivotValue):
// suma de conteos, o media ponderada en porcentaje. Lo usa el widget de
// distribución para mostrar categorías que no están seleccionadas como columnas
// (caso "solo total"). `tuple` debe traer level, versionId, levelId, variableId y
// labelId de la categoría.
ActivePivot.prototype.ResolveCategoryAggregate = function (tuple, summaryMetric, variable, totalTuple) {
	var sumValue = 0, sumTotal = 0, sumArea = 0, hasAny = false;
	var sumValueGap = 0, sumTotalGap = 0, hasGap = false;
	var entries = this.RowTree.AnalysisEntries();
	for (var ei = 0; ei < entries.length; ei++) {
		var region = entries[ei].region;
		var item = entries[ei].item;
		var cell = this.ResolveCell(tuple, region, item);
		if (cell.Empty) continue;
		if (cell.Value != null) { sumValue += Number(cell.Value); hasAny = true; }
		if (cell.Area != null)  { sumArea  += Number(cell.Area); }
		if (cell.ValueGap != null) { sumValueGap += Number(cell.ValueGap); hasGap = true; }
		if (cell.TotalGap != null) { sumTotalGap += Number(cell.TotalGap); hasGap = true; }
		// En modos normalizados (incidencia, etc.) el denominador es el total del
		// universo, no el de la categoría: los ítems de categoría pueden no traer
		// su propio Total. Por eso se resuelve con el tuple de total (labelId null).
		if (totalTuple) {
			var tcell = this.ResolveCell(totalTuple, region, item);
			if (!tcell.Empty && tcell.Total != null) sumTotal += Number(tcell.Total);
			if (!tcell.Empty && tcell.TotalGap != null) { sumTotalGap += Number(tcell.TotalGap); hasGap = true; }
		} else if (cell.Total != null) {
			sumTotal += Number(cell.Total);
		}
	}
	if (!hasAny && sumTotal === 0) return null;

	// Delega en cellValue para aplicar el mismo cálculo que la pivot (incluido el
	// delta de brecha cuando la variable es de gap).
	var aggCell = {
		Value: sumValue, Total: sumTotal, Area: sumArea,
		ValueGap: hasGap ? sumValueGap : null, TotalGap: hasGap ? sumTotalGap : null
	};
	var cv = cellValue({ properties: { SummaryMetric: summaryMetric } }, variable, aggCell);
	return (cv === '-' || cv == null) ? null : Number(cv);
};

// Camino 1: para un (metricId, versionId) cuya selección es "solo total",
// resuelve TODAS las categorías de la variable con su valor agregado y color,
// como si estuvieran seleccionadas. Devuelve [{ labelId, name, color, value }] en
// el orden de las ValueLabels, o [] si no se puede resolver. Lo usa el widget de
// distribución para graficar las categorías sin que el usuario las elija.
// Tuples de todas las categorías de la variable de un (metricId, versionId), con
// su color y el tuple base (level, modo) para resolverlas. Devuelve null si no
// hay una variable con ValueLabels.
ActivePivot.prototype._categoryTuples = function (metricId, versionId) {
	var base = null;
	for (var t = 0; t < this.MetricTuples.metricTuples.length; t++) {
		var sp = this.MetricTuples.metricTuples[t];
		if (String(sp.metricId) === String(metricId) &&
			String(sp.versionId) === String(versionId) &&
			sp.variable && sp.variable.ValueLabels && sp.variable.ValueLabels.length) {
			base = sp; break;
		}
	}
	if (!base) return null;

	var colors = base.metric.GetStyleColorDictionary();

	var labels = base.variable.ValueLabels;
	var tuples = [];
	for (var i = 0; i < labels.length; i++) {
		tuples.push({
			labelId: labels[i].Id,
			name: labels[i].Name,
			color: colors[labels[i].Id] || null,
			tuple: {
				level: base.level, levelId: base.levelId, versionId: base.versionId,
				variableId: base.variableId, labelId: labels[i].Id, isTotal: false
			}
		});
	}
	// Tuple del total (labelId null): denominador del universo para modos normalizados.
	var totalTuple = {
		level: base.level, levelId: base.levelId, versionId: base.versionId,
		variableId: base.variableId, labelId: null, isTotal: true
	};
	return { base: base, tuples: tuples, totalTuple: totalTuple };
};

ActivePivot.prototype.ResolveAllCategories = function (metricId, versionId) {
	var info = this._categoryTuples(metricId, versionId);
	if (!info) return [];
	var sm = info.base.summary;

	// Primera pasada: agrega cada categoría sobre todas las regiones (suma de Value,
	// Area y del Total del universo), guardando los crudos por categoría.
	var aggs = [];
	var totalValueSum = 0, totalAreaSum = 0;
	for (var ci = 0; ci < info.tuples.length; ci++) {
		var c = info.tuples[ci];
		var sumValue = 0, sumTotal = 0, sumArea = 0, hasAny = false;
		var sumValueGap = 0, sumTotalGap = 0, hasGap = false;
		var entries = this.RowTree.AnalysisEntries();
		for (var ei = 0; ei < entries.length; ei++) {
			var region = entries[ei].region;
			var item = entries[ei].item;
			var cell = this.ResolveCell(c.tuple, region, item);
			if (cell.Empty) continue;
			// En incidencia, una celda sin valor (numerador) debe saltearse por
			// completo: si se sumara solo su Total al denominador, la incidencia
			// agregada quedaría hundida (p. ej. una región sin dato en la categoría
			// arrastraba el promedio a casi cero). Con conteo no aplica: ahí el
			// aporte es el propio Value, que si falta simplemente no suma.
			var isIncidence = (sm === 'I' || sm === 'P' || sm === 'FIL');
			if (isIncidence && cell.Value == null) continue;
			if (cell.Value != null) { sumValue += Number(cell.Value); hasAny = true; }
			if (cell.Area != null) sumArea += Number(cell.Area);
			if (cell.ValueGap != null) { sumValueGap += Number(cell.ValueGap); hasGap = true; }
			// Denominador de incidencia: el Total propio de la categoría (como en la
			// pivot). Solo si la celda no lo trae se cae al total del universo.
			if (cell.Total != null) {
				sumTotal += Number(cell.Total);
			} else {
				var tcell = this.ResolveCell(info.totalTuple, region, item);
				if (!tcell.Empty && tcell.Total != null) sumTotal += Number(tcell.Total);
			}
			if (cell.TotalGap != null) { sumTotalGap += Number(cell.TotalGap); hasGap = true; }
		}
		aggs.push({ labelId: c.labelId, name: c.name, color: c.color,
			sumValue: sumValue, sumTotal: sumTotal, sumArea: sumArea,
			sumValueGap: sumValueGap, sumTotalGap: sumTotalGap, hasGap: hasGap, hasAny: hasAny });
		totalValueSum += sumValue;
		totalAreaSum += sumArea;
	}

	// Segunda pasada: valor mostrado de cada categoría con el mismo cellValue de la
	// pivot. En col% (P) y fil% (FIL) el denominador es la suma de Value de todas las
	// categorías (el universo); en col-área (A), la suma de Area. Sin ese
	// denominador, esos modos devolverían el valor crudo (incidencias gigantes).
	var loc = this;
	return aggs.map(function (a) {
		if (!a.hasAny && a.sumTotal === 0) return { labelId: a.labelId, name: a.name, color: a.color, value: null };
		var aggCell = {
			Value: a.sumValue, Total: a.sumTotal, Area: a.sumArea,
			ValueGap: a.hasGap ? a.sumValueGap : null, TotalGap: a.hasGap ? a.sumTotalGap : null,
			ColumnTotal: (sm === 'P') ? totalValueSum : undefined,
			ColumnArea: (sm === 'A') ? totalAreaSum : undefined,
			RowGroupTotal: (sm === 'FIL') ? totalValueSum : undefined
		};
		var cv = cellValue({ properties: { SummaryMetric: sm } }, info.base.variable, aggCell);
		var val = (cv === '-' || cv == null) ? null : Number(cv);
		return { labelId: a.labelId, name: a.name, color: a.color, value: val };
	});
};

// Camino 1 en modo regiones: para un (metricId, versionId) con selección "solo
// total", resuelve el valor de cada categoría POR REGIÓN. Devuelve una fila por
// región { label, fid, parts: [{ labelId, name, color, value }] }, en el orden de
// los elementos del nivel de análisis. El widget arma con esto las barras horizontales.
ActivePivot.prototype.ResolveAllCategoriesByRegion = function (metricId, versionId) {
	var info = this._categoryTuples(metricId, versionId);
	if (!info) return [];
	var isGap = !!(info.base.variable && info.base.variable.IsGap);
	var sm = info.base.summary;

	// Primera pasada: se resuelven todas las celdas (región × categoría) y la celda
	// total de cada región, guardando los crudos. Con ellos se calculan los
	// denominadores de los modos normalizados que la pivot deriva por columna o por
	// fila y que ResolveCell no trae en una resolución suelta:
	//   - col% (P): ColumnTotal = suma de Value de la categoría sobre las regiones.
	//   - fil% (FIL): RowGroupTotal = suma de Value de las categorías en la región.
	//   - col-área (A): ColumnArea = suma de Area de la categoría sobre las regiones.
	var grid = [];                 // por región: { item, totalCell, cells: [por categoría] }
	var colValueSum = [];          // por categoría: suma de Value (denominador col%)
	var colAreaSum = [];           // por categoría: suma de Area  (denominador col-área)
	for (var ci0 = 0; ci0 < info.tuples.length; ci0++) { colValueSum[ci0] = 0; colAreaSum[ci0] = 0; }

	var entries = this.RowTree.AnalysisEntries();
	for (var ei = 0; ei < entries.length; ei++) {
		var region = entries[ei].region;
		var item = entries[ei].item;
		var totalCell = this.ResolveCell(info.totalTuple, region, item);
		var cells = [];
		for (var ci = 0; ci < info.tuples.length; ci++) {
			var cell = this.ResolveCell(info.tuples[ci].tuple, region, item);
			cells.push(cell);
			if (!cell.Empty) {
				if (cell.Value != null) colValueSum[ci] += Number(cell.Value);
				if (cell.Area != null) colAreaSum[ci] += Number(cell.Area);
			}
		}
		grid.push({ item: item, totalCell: totalCell, cells: cells });
	}

	// Gran total de Value (todas las categorías y regiones): es el denominador común
	// que hace que el col% componga bien por región. Si cada segmento se midiera
	// contra el total de SU columna (colValueSum por categoría), las participaciones
	// de una región no compartirían denominador y la barra podía superar el 100%.
	var grandValueSum = 0;
	for (var gv = 0; gv < colValueSum.length; gv++) grandValueSum += colValueSum[gv];
	// Mismo razonamiento para % de área (modo A): sin un denominador común entre
	// categorías, la barra de una región podía superar el 100% (bug observado: una
	// barra en 202%). Se suma el área de TODAS las categorías, no solo la propia.
	var grandAreaSum = 0;
	for (var ga = 0; ga < colAreaSum.length; ga++) grandAreaSum += colAreaSum[ga];

	// Segunda pasada: se calcula el valor mostrado de cada celda con el mismo
	// cellValue que la pivot, inyectando los denominadores correctos según el modo.
	var rows = [];
	for (var gi = 0; gi < grid.length; gi++) {
		var g = grid[gi];
		var totalCell2 = g.totalCell;
		var denomTotal = (!totalCell2.Empty && totalCell2.Total != null) ? Number(totalCell2.Total) : null;

		// RowGroupTotal (fil%): suma de Value de las categorías en esta región.
		var rowGroupSum = 0;
		for (var rc = 0; rc < g.cells.length; rc++) {
			if (!g.cells[rc].Empty && g.cells[rc].Value != null) rowGroupSum += Number(g.cells[rc].Value);
		}

		var parts = [];
		for (var ci2 = 0; ci2 < info.tuples.length; ci2++) {
			var c = info.tuples[ci2];
			var cell2 = g.cells[ci2];
			var merged = {
				Value: cell2.Value,
				// El Total propio de la categoría (su denominador de incidencia), como en
				// la pivot: la incidencia de "15% y más" es su Value sobre SU total, no
				// sobre el universo. Solo si la celda no trae Total se cae al del universo.
				Total: cell2.Total != null ? cell2.Total : denomTotal,
				Area: cell2.Area,
				ValueGap: cell2.ValueGap,
				TotalGap: cell2.TotalGap,
				// Denominadores derivados, para que col%/fil%/col-área normalicen igual
				// que en la tabla en vez de devolver el valor crudo.
				ColumnTotal: (sm === 'P') ? colValueSum[ci2] : cell2.ColumnTotal,
				ColumnArea: (sm === 'A') ? colAreaSum[ci2] : cell2.ColumnArea,
				RowGroupTotal: (sm === 'FIL') ? rowGroupSum : cell2.RowGroupTotal
			};
			var cv = cellValue({ properties: { SummaryMetric: sm } }, info.base.variable, merged);
			var val = (cv === '-' || cv == null) ? null : Number(cv);
			// Valor expresado sobre el universo de la región (no sobre el total propio
			// de la categoría): en incidencia, la categoría sobre el TOTAL de la región.
			// A diferencia del valor sobre el total propio, estos sí son aditivos entre
			// categorías (comparten denominador), así que sumarlos da la incidencia del
			// conjunto. Para conteos/áreas coincide con el valor normal.
			var mergedU = {
				Value: cell2.Value,
				Total: denomTotal != null ? denomTotal : cell2.Total,
				Area: cell2.Area, ValueGap: cell2.ValueGap, TotalGap: cell2.TotalGap,
				// Para componer la barra de una región, col% se mide contra el gran total
				// (denominador común) en vez del total de cada columna; así los segmentos
				// suman la participación de la región y el conjunto de barras llega a 100%.
				// % de área (A) usa el mismo criterio con el área de todas las categorías.
				ColumnTotal: (sm === 'P') ? grandValueSum : cell2.ColumnTotal,
				ColumnArea: (sm === 'A') ? grandAreaSum : cell2.ColumnArea,
				RowGroupTotal: (sm === 'FIL') ? rowGroupSum : cell2.RowGroupTotal
			};
			var cvU = cellValue({ properties: { SummaryMetric: sm } }, info.base.variable, mergedU);
			var valU = (cvU === '-' || cvU == null) ? null : Number(cvU);
			// Peso de composición para repartir los colores: magnitud combinada de
			// los dos universos (base + comparado). Es siempre positiva y aditiva,
			// a diferencia del delta (value), que puede ser negativo. En variables
			// no-brecha el peso es simplemente el Value.
			var weight = (Number(cell2.Value) || 0) + (isGap ? (Number(cell2.ValueGap) || 0) : 0);
			parts.push({
				labelId: c.labelId, name: c.name, color: c.color,
				value: (val == null || isNaN(val)) ? 0 : val,
				valueOnUniverse: (valU == null || isNaN(valU)) ? 0 : valU,
				weight: weight
			});
		}
		// Delta/valor del total de la región: en brecha es la longitud (con signo) de
		// la barra; en lo demás es el valor de total que la pivot muestra.
		var totalCv = cellValue({ properties: { SummaryMetric: sm } }, info.base.variable, {
			Value: totalCell2.Value, Total: totalCell2.Total, Area: totalCell2.Area,
			ValueGap: totalCell2.ValueGap, TotalGap: totalCell2.TotalGap,
			ColumnTotal: totalCell2.ColumnTotal, ColumnArea: totalCell2.ColumnArea,
			RowGroupTotal: totalCell2.RowGroupTotal
		});
		var totalVal = (totalCv === '-' || totalCv == null) ? null : Number(totalCv);
		rows.push({
			label: g.item.Caption, fid: g.item.FID, parts: parts,
			delta: (totalVal == null || isNaN(totalVal)) ? null : totalVal,
			isGap: isGap
		});
	}
	return rows;
};

// Auto-drill hacia abajo: si alguna región no tiene relación geográfica con el
// nivel de alguna Selection (de algún censo), esa Selection baja un nivel. Cada
// censo se evalúa contra SU propio GeographyId, porque sus geografías difieren.
ActivePivot.prototype.NeedAutoDrillDown = function () {
	var regions = this.RowTree.OpenRegions();
	for (var bi = 0; bi < regions.length; bi++) {
		var region = regions[bi];
		for (var mi = 0; mi < this.Metrics.length; mi++) {
			var selections = this.Metrics[mi].Selections;
			for (var si = 0; si < selections.length; si++) {
				var sel = selections[si];
				var rel = region.GeographyRelations[sel.geographyId()];
				if (!rel || rel.length === 0) {
					if (this._selectionLevelDown(sel)) return true;
				}
			}
		}
	}
	return false;
};

// Auto-drill hacia arriba: si TODAS las regiones tienen relación con el nivel
// padre de una Selection, esa Selection sube un nivel. Por Selection y por su
// propia geografía.
ActivePivot.prototype.CanAutoDrillUp = function () {
	var regions = this.RowTree.OpenRegions();
	var drilledUp = false;
	for (var mi = 0; mi < this.Metrics.length; mi++) {
		var selections = this.Metrics[mi].Selections;
		for (var si = 0; si < selections.length; si++) {
			var sel = selections[si];
			var parent = this._selectionLevelParent(sel);
			if (!parent) continue;
			var canUp = true;
			for (var bi = 0; bi < regions.length; bi++) {
				var rel = regions[bi].GeographyRelations[parent.GeographyId];
				if (!rel || rel.length === 0) { canUp = false; break; }
			}
			if (canUp && this._selectionLevelUp(sel)) drilledUp = true;
		}
	}
	return drilledUp;
};

// Nivel padre (uno más agregado) de una Selection dentro de su propio censo.
ActivePivot.prototype._selectionLevelParent = function (sel) {
	var idx = sel.levelIndex();
	return idx > 0 ? sel.version.Levels[idx - 1] : null;
};

// Mueve una Selection un nivel hacia arriba/abajo en SU propia jerarquía. Devuelve
// true si cambió. Reengancha la variable por nombre (lo hace Selection).
ActivePivot.prototype._selectionLevelUp = function (sel) {
	var idx = sel.levelIndex();
	if (idx <= 0) return false;
	return sel.moveToLevel(sel.version.Levels[idx - 1]);
};

ActivePivot.prototype._selectionLevelDown = function (sel) {
	var idx = sel.levelIndex();
	if (idx >= sel.version.Levels.length - 1) return false;
	return sel.moveToLevel(sel.version.Levels[idx + 1]);
};

ActivePivot.prototype.RefreshRelations = function () {
	// Verifica que la información de relaciones entre los niveles visibles y las
	// métricas esté completa. Itera por geographyIds únicos derivados de las ColumnTuples
	// (cubre multi-versión, donde cada versión activa puede usar un GeographyId distinto).
	this.MetricTuples.rebuild();
	var toRetrieve = [];
	var seenGeoIds = {};
	var regions = this.RowTree.OpenRegions();

	for (var s = 0; s < this.MetricTuples.metricTuples.length; s++) {
		var tuple = this.MetricTuples.metricTuples[s];
		// Tuple placeholder (indicador sin versiones activas): no tiene geografía.
		if (tuple.isEmpty || !tuple.level || !tuple.version) continue;
		var geographyId = tuple.level.GeographyId;
		// Parent del nivel: solo si la versión activa tiene un nivel previo.
		var parentGeoId = null;
		var levelIdx = tuple.version.Levels.indexOf(tuple.level);
		if (levelIdx > 0) parentGeoId = tuple.version.Levels[levelIdx - 1].GeographyId;

		if (!seenGeoIds[geographyId]) {
			seenGeoIds[geographyId] = true;
			for (var ab = 0; ab < regions.length; ab++) {
				toRetrieve.push(regions[ab].EnsureContainsGeographyRelations(geographyId));
			}
		}
		if (parentGeoId != null && !seenGeoIds[parentGeoId]) {
			seenGeoIds[parentGeoId] = true;
			for (var ab2 = 0; ab2 < regions.length; ab2++) {
				toRetrieve.push(regions[ab2].EnsureContainsGeographyRelations(parentGeoId));
			}
		}
	}

	return Promise.all(toRetrieve);
};

ActivePivot.prototype.GetTotalRows = function () {
	return this.Rows.length;
};

ActivePivot.prototype.Clear = function () {
	arr.Clear(this.MetricTuples.headers);
	arr.Clear(this.Rows);
	arr.Clear(this.Metrics);
	this.RowTree.Clear();
};

// Reordena una métrica de la posición `from` a la posición `to` (sobre el array
// Metrics, que determina el orden de las columnas). No refresca; el llamador
// debe invocar RefreshData/Render luego.
ActivePivot.prototype.MoveMetric = function (from, to) {
	if (from === to) return false;
	if (from < 0 || from >= this.Metrics.length) return false;
	if (to < 0 || to >= this.Metrics.length) return false;
	var item = this.Metrics.splice(from, 1)[0];
	this.Metrics.splice(to, 0, item);
	return true;
};

ActivePivot.prototype.AddMetricById = function (metricId) {
	var loc = this;
	var ms = window.Context.MetricStore;
	return ms.GetMetricOrRetrieve(metricId).then(function (metric) {
		// La pivot habilita %FIL (distribución horizontal entre categorías),
		// que en el mapa no aparece.
		metric.properties.AllowRowPercent = true;
		loc.Metrics.push(metric);
		return metric;
	});
};

ActivePivot.prototype.Render = function () {
	var loc = this;
	this.RowTree.EnsureRoot();
	return loc.RefreshRelations().then(function () {
		// Si TryAutoDrillDown devuelve true, repetimos todo
		if (loc.NeedAutoDrillDown()) {
			return loc.Render();
		}
		if (loc.CanAutoDrillUp()) {
			return loc.Render();
		}
		// Si no, seguimos con RefreshData
		return loc.RefreshData();
	});
};

// Reconstruye el pivot desde lo parseado de la ruta (ver ActiveRoute):
//   columns: indicadores; tree: árbol de filas; places: lugares que llegan del
//   visor (cada uno, un id con sus ancestros como alternativas) y se muestran como
//   selección; suggestion: lugar sugerido (vista actual del visor); order.
// No llama a Render: el consumidor decide cuándo hacerlo.
ActivePivot.prototype.RestoreFromSections = function (sections) {
	var loc = this;
	sections = sections || {};
	var tasks = [];

	(sections.columns || []).forEach(function (col) {
		tasks.push(loc.AddMetricById(col.id).then(function (metric) {
			loc.applyColumnState(metric, col);
		}));
	});

	if (sections.tree) {
		this.RowTree.Restore(sections.tree);
	}
	var places = sections.places || [];
	for (var p = 0; p < places.length; p++) {
		var chain = this.RowTree.Hierarchy().ChainForCandidates(places[p]);
		if (p === 0) {
			this.RowTree.ReplaceSelection(chain);
		} else {
			this.RowTree.AddSelection(chain);
		}
	}
	if (sections.suggestion && sections.suggestion.length) {
		this.RowTree.SetSuggestion(sections.suggestion);
	}

	// Orden persistido (se aplica en el siguiente RefreshData/Render).
	if (sections.order && sections.order.key != null) {
		loc.MetricTuples.sortKey = sections.order.key;
		loc.MetricTuples.sortDirection = sections.order.dir;
	}

	// Las altas de indicadores corren en paralelo y cada una se agrega al final al
	// resolverse: se reordenan según el orden serializado, una vez cargadas.
	return Promise.all(tasks).then(function (result) {
		loc._reorderMetricsBySections(sections.columns || []);
		return result;
	});
};

ActivePivot.prototype._reorderMetricsBySections = function (columns) {
	function orderIndex(metric) {
		for (var i = 0; i < columns.length; i++) {
			/* eslint-disable-next-line eqeqeq */
			if (columns[i].id == metric.properties.Metric.Id) return i;
		}
		return columns.length;
	}
	this.Metrics.sort(function (a, b) { return orderIndex(a) - orderIndex(b); });
};

// Selecciona versión(es)/nivel/variable/summary/categorías de un indicador según
// lo serializado. Todo lo interno viene por ÍNDICE (posición), como el visor: las
// versiones por su posición en properties.Versions, el nivel por su posición en la
// versión, la variable por su posición en el nivel. El metric llega por Id (ya
// resuelto en `metric`). La variable se traduce a su nombre lógico, que es el
// gobernador con que SelectByCaption rearma todas las Selections.
ActivePivot.prototype.applyColumnState = function (metric, col) {
	if (!metric || !metric.properties) return;
	var props = metric.properties;
	if (col.summary) props.SummaryMetric = col.summary;

	var allVersions = props.Versions || [];
	// Censos guardados, resueltos por índice. Si no hay lista, no se toca la selección.
	var versionIndexes = (col.versionIndexes && col.versionIndexes.length) ? col.versionIndexes : null;
	if (!versionIndexes) return;
	var versionIds = [];
	for (var vi = 0; vi < versionIndexes.length; vi++) {
		var ver = allVersions[versionIndexes[vi]];
		if (ver) versionIds.push(ver.Version.Id);
	}
	if (!versionIds.length) return;

	// Versión principal (la primera guardada): de ella se leen los índices de nivel
	// y variable, y de ahí el nombre lógico de la variable (el que gobierna el resto).
	var mainVersion = allVersions[versionIndexes[0]];
	var levelIndex = (col.levelIndex != null) ? col.levelIndex : 0;
	var mainLevel = mainVersion && mainVersion.Levels ? mainVersion.Levels[levelIndex] : null;
	if (!mainLevel) return;
	var levelName = mainLevel.Name;
	var variableIndex = (col.variableIndex != null) ? col.variableIndex : 0;
	var mainVariable = mainLevel.Variables[variableIndex];
	if (!mainVariable) return;
	var variableName = logicalVariableName(mainLevel, mainVariable);

	metric.SelectByCaption(variableName, versionIds, levelName);

	// Reaplica nivel y la selección de categorías por censo. La selección viene
	// indexada por ÍNDICE de versión; se traduce al censo de cada Selection.
	for (var s = 0; s < metric.Selections.length; s++) {
		var sel = metric.Selections[s];
		if (levelName != null) sel.moveToLevelNamed(levelName);
		// Índice de este censo en properties.Versions, para leer su selección guardada.
		var selVersionIndex = allVersions.indexOf(sel.version);
		var saved = (col.selection && selVersionIndex >= 0) ? col.selection[selVersionIndex] : null;
		if (saved) {
			sel.includeTotal = saved.includeTotal !== false;
			var valid = {};
			sel.variable.ValueLabels.forEach(function (lab) { valid[lab.Id] = true; });
			sel.labels = (saved.labels || []).filter(function (id) { return valid[id]; });
		}
	}
};

