import arr from '@/common/framework/arr';
import promises from '@/common/framework/promises';
import RegionSelection from '@/table/classes/RegionSelection';
import { cellValue } from '@/table/classes/pivotValue.js';
import { resolveBoundary } from '@/table/classes/boundaryTree.js';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import ActiveData from '@/table/classes/ActiveData.js';
import ActiveMetricTuples, { LABEL_SORT_KEY } from '@/table/classes/ActiveMetricTuples.js';
import ActiveBoundarySet from '@/table/classes/ActiveBoundarySet.js';
import ActiveDataset from '@/table/classes/ActiveDataset.js';
import ActiveRoute from '@/table/classes/ActiveRoute.js';

// Construye el ActiveBoundary y su RegionSet desde el árbol ya cargado
// (GetFabBoundaries), sin la llamada GetRegion. Devuelve { activeBoundary, region }
// o null si el boundaryId no está en el árbol.
function buildBoundaryFromTree(boundaryId) {
	var resolved = resolveBoundary(boundaryId);
	if (!resolved) return null;
	// El catálogo de regiones lo mantiene el contexto (es un servicio global, no
	// algo que el pivot posea), así que se consulta por window.Context.
	var region = window.Context.RegionStore.GetRegionFromItems(resolved.versionId, resolved.name, resolved.items);
	var activeBoundary = new ActiveBoundary({
		Id: boundaryId,
		Name: resolved.name,
		SelectedVersionIndex: 0,
		Versions: [{ Id: resolved.versionId, Name: resolved.name, Selection: null }]
	});
	return { activeBoundary: activeBoundary, region: region };
}


export default ActivePivot;
export { ActivePivot };

function ActivePivot() {
	this.Rows = [];
	this.Metrics = [];

	this.MetricTuples = new ActiveMetricTuples(this);
	this.Data = new ActiveData(this);

	// Regiones de filas (OR) y filtros (AND): misma mecánica, distinto extremo de
	// inserción. Las dependencias del proyecto se inyectan al set.
	var boundaryDeps = {
		buildBoundary: buildBoundaryFromTree,
		makeSelection: function (region) { return new RegionSelection(region); },
		ready: function (v) { return promises.ReadyPromise(v); },
		removeItem: function (a, item) { arr.Remove(a, item); }
	};
	this.Regions = new ActiveBoundarySet(this, Object.assign({ prepend: true }, boundaryDeps));
	this.FilterSet = new ActiveBoundarySet(this, Object.assign({ prepend: false }, boundaryDeps));

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
// columnSpecs requieren. Delega en el manager de datos (pivot.Data).
ActivePivot.prototype._loadColumnSpecData = function () {
	return this.Data.load();
};

ActivePivot.prototype.RefreshData = function () {
	this.MetricTuples.rebuild();
	this.SanitizeSort();
	var loc = this;
	return this._loadColumnSpecData().then(function () {
		arr.Clear(loc.MetricTuples.headers);
		for (var s = 0; s < loc.MetricTuples.metricTuples.length; s++) {
			loc.MetricTuples.headers.push(loc.MetricTuples.metricTuples[s]);
		}
		arr.Clear(loc.Rows);
		for (var activeBoundary of loc.Regions.items) {
			var version = activeBoundary.SelectedVersion();
			var boundaryRows = [];
			var totals = [];
			var region = version.Selection;
			for (var item of region.Items) {
				var row = [];
				row.push({ 'Label': item.Caption, FID: item.FID, isHeader: true, Parent: (item.Parent != null ? item.Parent : null) });
				for (var ci = 0; ci < loc.MetricTuples.metricTuples.length; ci++) {
					var spec = loc.MetricTuples.metricTuples[ci];
					var value = loc.ResolveCell(spec, region.Region, item);
					row.push(value);
					if (totals.length < row.length - 1) {
						totals.push({ Value: value.Value, Total: value.Total, Area: value.Area });
					} else {
						var i = row.length - 2;
						totals[i]['Value'] = (totals[i]['Value'] ?? 0) + (value['Value'] ?? 0);
						totals[i]['Total'] = (totals[i]['Total'] ?? 0) + (value['Total'] ?? 0);
						totals[i]['Area']  = (totals[i]['Area']  ?? 0) + (value['Area']  ?? 0);
					}
				}
				boundaryRows.push(row);
			}
			// Solo filas con al menos un valor (no muestra filas totalmente vacías).
			boundaryRows = boundaryRows.filter(function (r) {
				for (var c = 1; c < r.length; c++) {
					if (r[c] && r[c].Value !== null && r[c].Value !== undefined) return true;
				}
				return false;
			});

			// Totales verticales por columna (Value y Area) dentro de esta delimitación.
			var columnTotals = [];
			var columnAreaTotals = [];
			for (var ci2 = 0; ci2 < loc.MetricTuples.metricTuples.length; ci2++) {
				var sum = 0, sumArea = 0;
				for (var ri = 0; ri < boundaryRows.length; ri++) {
					var cv = boundaryRows[ri][ci2 + 1];
					if (cv && cv.Value !== null && cv.Value !== undefined) sum    += Number(cv.Value);
					if (cv && cv.Area  !== null && cv.Area  !== undefined) sumArea += Number(cv.Area);
				}
				columnTotals.push(sum);
				columnAreaTotals.push(sumArea);
			}
			boundaryRows.forEach(function (r) {
				for (var ci3 = 0; ci3 < loc.MetricTuples.metricTuples.length; ci3++) {
					if (r[ci3 + 1]) {
						r[ci3 + 1].ColumnTotal = columnTotals[ci3];
						r[ci3 + 1].ColumnArea  = columnAreaTotals[ci3];
					}
				}
			});

			// RowGroupTotal: para cada fila, suma de Value entre columnas que
			// comparten (metricId, versionId, levelId, variableId), excluyendo
			// la columna Total del grupo (que sería doble conteo). Habilita el
			// modo FIL (% horizontal). El grupo está identificado por la tupla
			// 'metricId:versionId:levelId:variableId'.
			var groupIndices = {};
			for (var gs = 0; gs < loc.MetricTuples.metricTuples.length; gs++) {
				var sp = loc.MetricTuples.metricTuples[gs];
				var gk = sp.metricId + ':' + sp.versionId + ':' + sp.levelId + ':' + sp.variableId;
				if (!groupIndices[gk]) groupIndices[gk] = [];
				groupIndices[gk].push(gs);
			}
			boundaryRows.forEach(function (r) {
				Object.keys(groupIndices).forEach(function (gk) {
					var idxs = groupIndices[gk];
					var sumRG = 0;
					for (var n = 0; n < idxs.length; n++) {
						var spn = loc.MetricTuples.metricTuples[idxs[n]];
						if (spn.isTotal) continue;
						var cellN = r[idxs[n] + 1];
						if (cellN && cellN.Value !== null && cellN.Value !== undefined) sumRG += Number(cellN.Value);
					}
					for (var m = 0; m < idxs.length; m++) {
						var spm = loc.MetricTuples.metricTuples[idxs[m]];
						var cellM = r[idxs[m] + 1];
						if (!cellM) continue;
						// La columna Total se normaliza contra sí misma (FIL = 100);
						// las categorías reparten 100% entre las seleccionadas.
						if (spm.isTotal) {
							cellM.RowGroupTotal = (cellM.Value !== null && cellM.Value !== undefined) ? Number(cellM.Value) : sumRG;
						} else {
							cellM.RowGroupTotal = sumRG;
						}
					}
				});
			});
			// También propaga RowGroupTotal a la fila de totales (header de delimitación).
			// Las categorías comparten la suma de sus Values (reparten 100% entre sí).
			// La celda Total usa su propio Value como RowGroupTotal, de modo que su
			// FIL dé 100 aun cuando no estén seleccionadas todas las categorías
			// (el Total bruto puede superar la suma de las categorías mostradas).
			Object.keys(groupIndices).forEach(function (gk) {
				var idxs = groupIndices[gk];
				var sumRG = 0;
				for (var n = 0; n < idxs.length; n++) {
					var spn = loc.MetricTuples.metricTuples[idxs[n]];
					if (spn.isTotal) continue;
					var t = totals[idxs[n]];
					if (t && t.Value !== null && t.Value !== undefined) sumRG += Number(t.Value);
				}
				for (var m = 0; m < idxs.length; m++) {
					var spm = loc.MetricTuples.metricTuples[idxs[m]];
					var tt = totals[idxs[m]];
					if (!tt) continue;
					if (spm.isTotal) {
						tt.RowGroupTotal = (tt.Value !== null && tt.Value !== undefined) ? Number(tt.Value) : sumRG;
					} else {
						tt.RowGroupTotal = sumRG;
					}
				}
			});

			// Valor calculado que se muestra en cada celda (según el modo y la
			// variable). Lo usa el orden y el render.
			boundaryRows.forEach(function (r) {
				for (var ci4 = 0; ci4 < loc.MetricTuples.metricTuples.length; ci4++) {
					var cell = r[ci4 + 1];
					if (!cell) continue;
					var sp4 = loc.MetricTuples.metricTuples[ci4];
					var cv = cellValue(sp4.metric, sp4.variable, cell);
					cell.ComputedValue = (cv === '-' || cv === null || cv === undefined) ? null : Number(cv);
				}
			});

			// Ordena las filas al interior de esta delimitación según el criterio
			// activo (columna o label), sin mezclar entre delimitaciones distintas.
			loc.SortBoundaryRows(boundaryRows);

			// Header de delimitación: totales agregados, con ColumnTotal/ColumnArea/RowGroupTotal.
			var headerRow = [];
			var boundaryLabel = activeBoundary.properties.Name;
			if (version.Name && version.Name !== activeBoundary.properties.Name) {
				boundaryLabel += ' [' + version.Name + ']';
			}
			headerRow.push({ 'Label': boundaryLabel, isHeader: true, isRegionHeader: true, boundaryId: activeBoundary.__boundaryId });
			for (var ti = 0; ti < totals.length; ti++) {
				totals[ti].ColumnTotal = columnTotals[ti];
				totals[ti].ColumnArea  = columnAreaTotals[ti];
				var sp5 = loc.MetricTuples.metricTuples[ti];
				// Columna placeholder (indicador sin versiones activas): el total
				// es vacío, no 0.
				if (sp5.isEmpty) {
					totals[ti].Empty = true;
					totals[ti].Value = null;
					totals[ti].ComputedValue = null;
					continue;
				}
				// ComputedValue del total para que pueda ordenarse / mostrarse coherente.
				var cv5 = cellValue(sp5.metric, sp5.variable, totals[ti]);
				totals[ti].ComputedValue = (cv5 === '-' || cv5 === null || cv5 === undefined) ? null : Number(cv5);
			}
			arr.AddRange(headerRow, totals);
			loc.Rows.push(headerRow);

			var grouped = loc.GroupRowsByParent(boundaryRows);
			arr.AddRange(loc.Rows, grouped);
		}
		// Las filas ya están armadas: se reconstruye la vista plana de resultados.
		loc.RebuildDataset();
	});
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

// Si las filas tienen Parent (p. ej. municipios bajo su provincia), inserta un
// corte de control por cada padre con su subtotal (suma de las filas del grupo),
// respetando el orden ya aplicado a las filas. Si no hay Parent, devuelve las
// filas tal cual.
ActivePivot.prototype.GroupRowsByParent = function (boundaryRows) {
	var loc = this;
	var hasParent = boundaryRows.some(function (r) { return r[0] && r[0].Parent != null; });
	if (!hasParent) return boundaryRows;

	// Agrupa preservando el orden de aparición de cada padre.
	var order = [];
	var groups = {};
	boundaryRows.forEach(function (r) {
		var parent = (r[0] && r[0].Parent != null) ? r[0].Parent : '';
		if (!groups[parent]) { groups[parent] = []; order.push(parent); }
		groups[parent].push(r);
	});

	var out = [];
	order.forEach(function (parent) {
		var rows = groups[parent];
		// Subtotal del grupo por columna (suma de Value/Total/Area; ColumnTotal,
		// ColumnArea y RowGroupTotal heredados de la primera fila del grupo).
		var subtotal = [{ Label: parent, isHeader: true, isGroupHeader: true }];
		for (var ci = 0; ci < loc.MetricTuples.metricTuples.length; ci++) {
			var sv = 0, st = 0, sa = 0, hasVal = false, hasArea = false;
			rows.forEach(function (r) {
				var cell = r[ci + 1];
				if (cell && cell.Value !== null && cell.Value !== undefined) { sv += Number(cell.Value); hasVal = true; }
				if (cell && cell.Total !== null && cell.Total !== undefined) { st += Number(cell.Total); }
				if (cell && cell.Area  !== null && cell.Area  !== undefined) { sa += Number(cell.Area);  hasArea = true; }
			});
			var first = rows[0] && rows[0][ci + 1] ? rows[0][ci + 1] : null;
			var cellTotal = {
				Value: hasVal ? sv : null,
				Total: st,
				Area:  hasArea ? sa : null,
				ColumnTotal: first ? first.ColumnTotal : undefined,
				ColumnArea:  first ? first.ColumnArea  : undefined
			};
			subtotal.push(cellTotal);
		}
		// RowGroupTotal del subtotal: suma de Value de las celdas del subtotal
		// para columnas que comparten (metricId, versionId, levelId, variableId)
		// y no son Total.
		var groupIndices = {};
		for (var gs = 0; gs < loc.MetricTuples.metricTuples.length; gs++) {
			var sp = loc.MetricTuples.metricTuples[gs];
			var gk = sp.metricId + ':' + sp.versionId + ':' + sp.levelId + ':' + sp.variableId;
			if (!groupIndices[gk]) groupIndices[gk] = [];
			groupIndices[gk].push(gs);
		}
		Object.keys(groupIndices).forEach(function (gk) {
			var idxs = groupIndices[gk];
			var sumRG = 0;
			for (var n = 0; n < idxs.length; n++) {
				var spn = loc.MetricTuples.metricTuples[idxs[n]];
				if (spn.isTotal) continue;
				var c = subtotal[idxs[n] + 1];
				if (c && c.Value !== null && c.Value !== undefined) sumRG += Number(c.Value);
			}
			for (var m = 0; m < idxs.length; m++) {
				var spm = loc.MetricTuples.metricTuples[idxs[m]];
				var cSub = subtotal[idxs[m] + 1];
				if (!cSub) continue;
				if (spm.isTotal) {
					cSub.RowGroupTotal = (cSub.Value !== null && cSub.Value !== undefined) ? Number(cSub.Value) : sumRG;
				} else {
					cSub.RowGroupTotal = sumRG;
				}
			}
		});
		// ComputedValue del subtotal después de tener todos los agregados.
		for (var ci2 = 0; ci2 < loc.MetricTuples.metricTuples.length; ci2++) {
			var sp2 = loc.MetricTuples.metricTuples[ci2];
			var cellT = subtotal[ci2 + 1];
			var cv = cellValue(sp2.metric, sp2.variable, cellT);
			cellT.ComputedValue = (cv === '-' || cv === null || cv === undefined) ? null : Number(cv);
		}
		out.push(subtotal);
		arr.AddRange(out, rows);
	});
	return out;
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
// (SortColumnKey = spec.key) o el label de la fila (SortColumnKey === LABEL_SORT_KEY).
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

ActivePivot.prototype.ResolveCell = function (spec, region, regionItem) {
	// Resuelve la celda para un ColumnSpec (combinación metric × versión × labelId|total).
	// Suma Value, Total y AreaM2 filtrando por VID, geografía y, si corresponde, por LID.

	// Spec placeholder (indicador sin versiones activas): celda vacía.
	if (spec.isEmpty || !spec.level) {
		return { 'Value': null, 'Total': null, 'Area': null, 'Empty': true };
	}

	var level = spec.level;
	var metricGeographyId = level.GeographyId;
	var geographyIds = region.GetGeographyIdsForItem(regionItem.FID, metricGeographyId);

	if (!geographyIds || geographyIds.length === 0) {
		return { 'Value': null, 'Total': null, 'Area': null, 'Empty': true };
	}

	// Filtros: intersección con los geographyIds de cada filtro activo.
	var filteredGeographyIds = geographyIds;
	for (var i = 0; i < this.FilterSet.items.length; i++) {
		var filter = this.FilterSet.items[i].SelectedVersion().Selection;
		var filterGeographyIds = [];

		for (var j = 0; j < filter.Items.length; j++) {
			var filterItem = filter.Items[j];
			var ids = filter.Region.GetGeographyIdsForItem(filterItem.FID, metricGeographyId);
			if (ids && ids.length > 0) {
				filterGeographyIds = filterGeographyIds.concat(ids);
			}
		}

		if (filterGeographyIds.length > 0) {
			filteredGeographyIds = filteredGeographyIds.filter(function (id) {
				return filterGeographyIds.indexOf(id) !== -1;
			});
		}
	}

	if (filteredGeographyIds.length === 0) {
		return { 'Value': null, 'Total': null, 'Area': null, 'Empty': true };
	}

	// Sumariza. Cuando spec.labelId es null, suma todos los LID que matchean el VID
	// (eso da el "Total" agregado por variable, o la única columna cuando la variable
	// no tiene ValueLabels). Cuando spec.labelId es un Id concreto, filtra por él.
	var sum = 0, sumTotal = 0, sumArea = 0, count = 0;
	var metricItems = this.Data.itemsFor(spec.versionId, spec.levelId) || level.Items || [];
	var variableId = spec.variableId;
	var labelId = spec.labelId;
	for (var k = 0; k < metricItems.length; k++) {
		var mi = metricItems[k];
		if (mi.VID !== variableId) continue;
		if (filteredGeographyIds.indexOf(mi.GeographyItemId) === -1) continue;
		if (labelId != null && mi.LID !== labelId) continue;
		if (mi.Value !== null && mi.Value !== undefined) { sum += parseFloat(mi.Value); count++; }
		if (mi.Total !== null && mi.Total !== undefined) { sumTotal += parseFloat(mi.Total); count++; }
		if (mi.AreaM2 !== null && mi.AreaM2 !== undefined) { sumArea += parseFloat(mi.AreaM2); }
	}

	return {
		'Value': count > 0 ? sum : null,
		'Total': count > 0 ? sumTotal : null,
		'Area':  sumArea > 0 ? sumArea : null
	};
};

ActivePivot.prototype.NeedAutoDrillDown = function () {
	var ret = false;
	// Si alguna región no tiene valores asociados,
	// hace drilldown del level y sale con true
	var allBoundaries = this.AllBoundaries();
	// Lo detecta cruzando indicadores con items de region (si hay alguno, lo da por bueno)
	for (var activeBoundary of allBoundaries) {
		for (var metric of this.Metrics) {
			// Métrica sin versiones activas (multi-versión vacío): no participa.
			if (metric.properties && metric.properties.MultiVersion &&
				Array.isArray(metric.properties.SelectedVersionIndices) &&
				metric.properties.SelectedVersionIndices.length === 0) {
				continue;
			}
			var region = activeBoundary.SelectedVersion().Selection;
			var rel = region.Region.GeographyRelations[metric.SelectedLevel().GeographyId];
			if (!rel) continue;   // relación aún no cargada: no fuerza drilldown
			if (rel.length == 0) {
				if (this.TakeOneLevelDown(metric)) {
					return true;
				}
			}
		}
	}
	return false;
};

ActivePivot.prototype.CanAutoDrillUp = function () {
	// Si alguna región no tiene valores asociados,
	// hace drilldown del level y sale con true
	var allBoundaries = this.AllBoundaries();
	var drilledUp = false;
	// Lo detecta cruzando indicadores con items de region (si hay alguno, lo da por bueno)
	for (var metric of this.Metrics) {
		// Métrica sin versiones activas (multi-versión vacío): no participa.
		if (metric.properties && metric.properties.MultiVersion &&
			Array.isArray(metric.properties.SelectedVersionIndices) &&
			metric.properties.SelectedVersionIndices.length === 0) {
			continue;
		}
		var parent = metric.SelectedLevelParent();
		if (parent) {
			var geographyId = parent.GeographyId;
			var canAutoDrillUp = true;
			for (var activeBoundary of allBoundaries) {
				var selection = activeBoundary.SelectedVersion().Selection;
				var rel = selection.Region.GeographyRelations[geographyId];
				if (!rel || rel.length == 0) {
					canAutoDrillUp = false;
					break;
				}
			}
			if (canAutoDrillUp) {
				if (this.TakeOneLevelUp(metric)) {
					drilledUp = true;
				}
			}
		}
	}
	return drilledUp;
};

ActivePivot.prototype.TakeOneLevelUp = function (metric) {
	if (metric.SelectedVersion().SelectedLevelIndex > 0) {
		metric.SelectedVersion().SelectedLevelIndex--;
		return true;
	} else {
		return false;
	}
};

ActivePivot.prototype.TakeOneLevelDown = function (metric) {
	if (metric.SelectedVersion().SelectedLevelIndex < metric.SelectedVersion().Levels.length - 1) {
		metric.SelectedVersion().SelectedLevelIndex++;
		return true;
	} else {
		return false;
	}
};

ActivePivot.prototype.AllBoundaries = function () {
	var allBoundaries = [];
	arr.AddRange(allBoundaries, this.Regions.items);
	arr.AddRange(allBoundaries, this.FilterSet.items);
	return allBoundaries;
};

ActivePivot.prototype.RefreshRelations = function () {
	// Verifica que la información de relaciones entre regiones/filtros y métricas
	// esté completa. Itera por geographyIds únicos derivados de las ColumnSpecs
	// (cubre multi-versión, donde cada versión activa puede usar un GeographyId distinto).
	this.MetricTuples.rebuild();
	var toRetrieve = [];
	var seenGeoIds = {};
	var allBoundaries = this.AllBoundaries();

	for (var s = 0; s < this.MetricTuples.metricTuples.length; s++) {
		var spec = this.MetricTuples.metricTuples[s];
		// Spec placeholder (indicador sin versiones activas): no tiene geografía.
		if (spec.isEmpty || !spec.level || !spec.version) continue;
		var geographyId = spec.level.GeographyId;
		// Parent del nivel: solo si la versión activa tiene un nivel previo.
		var parentGeoId = null;
		var levelIdx = spec.version.Levels.indexOf(spec.level);
		if (levelIdx > 0) parentGeoId = spec.version.Levels[levelIdx - 1].GeographyId;

		if (!seenGeoIds[geographyId]) {
			seenGeoIds[geographyId] = true;
			for (var ab = 0; ab < allBoundaries.length; ab++) {
				var region = allBoundaries[ab].SelectedVersion().Selection;
				toRetrieve.push(region.Region.EnsureContainsGeographyRelations(geographyId));
			}
		}
		if (parentGeoId != null && !seenGeoIds[parentGeoId]) {
			seenGeoIds[parentGeoId] = true;
			for (var ab2 = 0; ab2 < allBoundaries.length; ab2++) {
				var region2 = allBoundaries[ab2].SelectedVersion().Selection;
				toRetrieve.push(region2.Region.EnsureContainsGeographyRelations(parentGeoId));
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
	arr.Clear(this.FilterSet.items);
	arr.Clear(this.Regions.items);
	arr.Clear(this.Metrics);
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

ActivePivot.prototype.ClearBoundaries = function () {
	this.Regions.clear();
};

ActivePivot.prototype.AddRegionById = function (boundaryId, caption) {
	return this.Regions.addWholeById(boundaryId, caption);
};

// Quita una delimitación completa de las filas.
ActivePivot.prototype.RemoveBoundaryById = function (boundaryId) {
	this.Regions.removeById(boundaryId);
};

// Busca un boundary ya agregado a las filas por su id de origen.
ActivePivot.prototype.FindBoundaryById = function (boundaryId) {
	return this.Regions.findById(boundaryId);
};

// Agrega items concretos de una delimitación a las filas. Si la delimitación
// ya está presente, fusiona los items (dedup); si no, la agrega con esos items.
ActivePivot.prototype.AddRegionItemsById = function (boundaryId, itemIds) {
	return this.Regions.addItemsById(boundaryId, itemIds, false);
};

// Quita items concretos de una delimitación de las filas. Si la delimitación
// queda sin items seleccionados, se la remueve por completo.
ActivePivot.prototype.RemoveRegionItemsById = function (boundaryId, itemIds) {
	this.Regions.removeItemsById(boundaryId, itemIds);
};

ActivePivot.prototype.AddFilterById = function (boundaryId, itemIds) {
	return this.FilterSet.addItemsById(boundaryId, itemIds);
};

ActivePivot.prototype.FindFilterById = function (boundaryId) {
	return this.FilterSet.findById(boundaryId);
};

// Agrega items concretos como filtro; fusiona si la delimitación ya filtra.
ActivePivot.prototype.AddFilterItemsById = function (boundaryId, itemIds) {
	return this.FilterSet.addItemsById(boundaryId, itemIds);
};

ActivePivot.prototype.RemoveFilterItemsById = function (boundaryId, itemIds) {
	this.FilterSet.removeItemsById(boundaryId, itemIds);
};

// Quita un filtro completo (todas sus selecciones) por delimitación.
ActivePivot.prototype.RemoveFilterById = function (boundaryId) {
	this.FilterSet.removeById(boundaryId);
};
ActivePivot.prototype.AddMetricById = function (metricId) {
	var loc = this;
	var ms = window.Context.MetricStore;
	return ms.GetMetricOrRetrieve(metricId).then(function (metric) {
			// La pivot habilita %FIL (distribución horizontal entre categorías),
			// que en el mapa no aparece.
			metric.properties.AllowRowPercent = true;
			loc.Metrics.push(metric);
	});
};

ActivePivot.prototype.Render = function () {
	var loc = this;
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

// Reconstruye el pivot desde lo parseado de la ruta:
// sections = { columns: [{id, versionId, levelId, variableId, summary}],
//              rows: [{id, whole, items}], filters: [{id, whole, items}] }
// No llama a Render: el consumidor decide cuándo hacerlo.
ActivePivot.prototype.RestoreFromSections = function (sections) {
	var loc = this;
	sections = sections || {};
	var tasks = [];

	(sections.columns || []).forEach(function (col) {
		tasks.push(loc.AddMetricById(col.id).then(function () {
			var metric = loc.Metrics[loc.Metrics.length - 1];
			loc.applyColumnState(metric, col);
		}));
	});

	(sections.rows || []).forEach(function (row) {
		if (row.whole) tasks.push(loc.AddRegionById(row.id));
		else if (row.items && row.items.length) tasks.push(loc.AddRegionItemsById(row.id, row.items));
	});

	(sections.filters || []).forEach(function (flt) {
		if (flt.items && flt.items.length) tasks.push(loc.AddFilterItemsById(flt.id, flt.items));
	});

	// Orden persistido (se aplica en el siguiente RefreshData/Render).
	if (sections.order && sections.order.key != null) {
		loc.MetricTuples.sortKey = sections.order.key;
		loc.MetricTuples.sortDirection = sections.order.dir;
	}

	return Promise.all(tasks);
};

// Selecciona versión(es)/nivel/variable/summary/categorías de un indicador
// según lo serializado. Cuando hay varias versionIds, activa multi-versión y
// configura selección por versión; para versiones distintas a la principal,
// busca level y variable por NAME (consistente con el rematch del header).
ActivePivot.prototype.applyColumnState = function (metric, col) {
	if (!metric || !metric.properties) return;
	var props = metric.properties;

	if (col.summary) props.SummaryMetric = col.summary;

	var versions = props.Versions || [];
	var versionIds = (col.versionIds && col.versionIds.length) ? col.versionIds : (col.versionId != null ? [col.versionId] : []);

	// Resuelve índices de las versiones activas.
	var indices = [];
	for (var vi = 0; vi < versionIds.length; vi++) {
		for (var v = 0; v < versions.length; v++) {
			if (versions[v].Version && versions[v].Version.Id === versionIds[vi]) {
				indices.push(v);
				break;
			}
		}
	}
	if (indices.length === 0) return;

	props.SelectedVersionIndex = indices[0];
	props.SelectedVersionIndices = indices.slice();
	props.MultiVersion = indices.length > 1;

	// Nivel y variable de la versión principal por Id; el resto por Name.
	var mainVersion = versions[indices[0]];
	if (mainVersion && col.levelId != null) {
		for (var l = 0; l < mainVersion.Levels.length; l++) {
			if (mainVersion.Levels[l].Id === col.levelId) {
				mainVersion.SelectedLevelIndex = l;
				break;
			}
		}
	}
	var mainLevel = mainVersion ? mainVersion.Levels[mainVersion.SelectedLevelIndex] : null;
	if (mainLevel && col.variableId != null && mainLevel.Variables) {
		for (var a = 0; a < mainLevel.Variables.length; a++) {
			if (mainLevel.Variables[a].Id === col.variableId) {
				mainLevel.SelectedVariableIndex = a;
				break;
			}
		}
	}
	// Para las demás versiones activas, busca level y variable por Name.
	var mainLevelName = mainLevel ? mainLevel.Name : null;
	var mainVariableName = (mainLevel && mainLevel.Variables[mainLevel.SelectedVariableIndex])
		? mainLevel.Variables[mainLevel.SelectedVariableIndex].Name : null;
	for (var oi = 1; oi < indices.length; oi++) {
		var otherVersion = versions[indices[oi]];
		if (!otherVersion) continue;
		if (mainLevelName != null) {
			for (var ol = 0; ol < otherVersion.Levels.length; ol++) {
				if (otherVersion.Levels[ol].Name === mainLevelName) {
					otherVersion.SelectedLevelIndex = ol;
					break;
				}
			}
		}
		var otherLevel = otherVersion.Levels[otherVersion.SelectedLevelIndex];
		if (otherLevel && mainVariableName != null && otherLevel.Variables) {
			for (var oa = 0; oa < otherLevel.Variables.length; oa++) {
				if (otherLevel.Variables[oa].Name === mainVariableName) {
					otherLevel.SelectedVariableIndex = oa;
					break;
				}
			}
		}
	}

	// Selección de categorías por versión activa.
	props.SelectedLabelIds = props.SelectedLabelIds || {};
	if (col.selection) {
		Object.keys(col.selection).forEach(function (vId) {
			var sel = col.selection[vId];
			props.SelectedLabelIds[vId] = {
				labels: (sel.labels || []).slice(),
				includeTotal: sel.includeTotal !== false
			};
		});
	} else {
		// Sin selección serializada: default (solo Total) por cada versión activa.
		for (var di = 0; di < indices.length; di++) {
			var vId = versions[indices[di]].Version.Id;
			if (!props.SelectedLabelIds[vId]) {
				props.SelectedLabelIds[vId] = { labels: [], includeTotal: true };
			}
		}
	}
};

