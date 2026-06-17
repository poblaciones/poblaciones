import arr from '@/common/framework/arr';
import promises from '@/common/framework/promises';
import RegionSelection from './RegionSelection';
import { cellValue } from './pivotValue.js';


export default Pivot;

function Pivot() {
	this.ColumnHeaders = [];
	this.Rows = [];

	this.Filters = [];		  // and
	this.Boundaries = []; // or
	this.Metrics = [];

	// Orden: id del indicador que ordena (o null) y dirección (-1 desc, 1 asc, 0 sin orden).
	this.SortMetricId = null;
	this.SortDirection = 0;
};

// Clave sentinel para ordenar por el label de la fila (alfabético).
Pivot.LABEL_SORT_KEY = '__label__';

// Cicla el orden de una columna: sin orden -> descendente -> ascendente -> sin orden.
// Solo una columna ordena a la vez; al activar otra, la anterior queda sin orden.
Pivot.prototype.ToggleSort = function (metricId) {
	if (this.SortMetricId !== metricId) {
		this.SortMetricId = metricId;
		this.SortDirection = -1;
	} else if (this.SortDirection === -1) {
		this.SortDirection = 1;
	} else if (this.SortDirection === 1) {
		this.SortMetricId = null;
		this.SortDirection = 0;
	} else {
		this.SortDirection = -1;
	}
};

// Dirección de orden de una columna ('desc' | 'asc' | null), para la UI.
Pivot.prototype.SortStateOf = function (metricId) {
	if (this.SortMetricId !== metricId || this.SortDirection === 0) return null;
	return this.SortDirection === -1 ? 'desc' : 'asc';
};

Pivot.prototype.RefreshData = function () {
	// Trae los datos de las métricas
	var toRetrieve = [];
	for (var metric of this.Metrics) {
		let level = metric.SelectedLevel();
		if (level.Items) {
			toRetrieve.push(promises.ReadyPromise());
		} else {
			toRetrieve.push(metric.Store.GetMetricData(metric).then(function (list) {
				level.Items = list;
				return list;
			}));
		}
	}
	var loc = this;
	return Promise.all(toRetrieve).then(function () {
		// tiene todos los datos...
		// 1. Arma los encabezados de columnas
		arr.Clear(loc.ColumnHeaders);
		for (var metric of loc.Metrics) {
			loc.ColumnHeaders.push(metric);
		}
		// 3. Arma las celdas
		arr.Clear(loc.Rows);
		for (var activeBoundary of loc.Boundaries) {
			var version = activeBoundary.SelectedVersion();
			var boundaryRows = [];
			var totals = [];
			var region = version.Selection;
			for (var item of region.Items) {
				var row = [];
				row.push({ 'Label': item.Caption, isHeader: true });
				for (var metric of loc.Metrics) {
					var value = loc.ResolveCell(metric, region.Region, item);
					// acá podría ponerla fila visible, porque tiene algún valor
					row.push(value);
					if (totals.length < row.length - 1) {
						totals.push({ Value : value.Value, Total: value.Total });
					} else {
						var i = row.length - 2;
						totals[i]['Value'] = (totals[i]['Value'] ?? 0) + (value['Value'] ?? 0);
						totals[i]['Total'] = (totals[i]['Total'] ?? 0) + (value['Total'] ?? 0);
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
			// Total vertical de cada columna dentro de esta delimitación, para el
			// modo "% de columna" (P): cada celda guarda el total de su columna y la
			// fila de total muestra 100.
			var columnTotals = [];
			for (var ci = 0; ci < loc.Metrics.length; ci++) {
				var sum = 0;
				for (var ri = 0; ri < boundaryRows.length; ri++) {
					var cv = boundaryRows[ri][ci + 1];
					if (cv && cv.Value !== null && cv.Value !== undefined) sum += Number(cv.Value);
				}
				columnTotals.push(sum);
			}
			boundaryRows.forEach(function (r) {
				for (var ci2 = 0; ci2 < loc.Metrics.length; ci2++) {
					if (r[ci2 + 1]) r[ci2 + 1].ColumnTotal = columnTotals[ci2];
				}
			});
			// Valor calculado que se muestra en cada celda (según el modo y la
			// variable). Es el que usa el orden, para que al cambiar de métrica el
			// orden refleje la nueva fórmula y no el Value crudo.
			boundaryRows.forEach(function (r) {
				for (var ci3 = 0; ci3 < loc.Metrics.length; ci3++) {
					var cell = r[ci3 + 1];
					if (!cell) continue;
					var m = loc.Metrics[ci3];
					var variable = m.SelectedVariable ? m.SelectedVariable() : null;
					var cv = cellValue(m, variable, cell);
					cell.ComputedValue = (cv === '-' || cv === null || cv === undefined) ? null : Number(cv);
				}
			});
			// Ordena las filas al interior de esta delimitación según el criterio
			// activo (columna o label), sin mezclar entre delimitaciones distintas.
			loc.SortBoundaryRows(boundaryRows);
			// Agrega el título
			var row = [];
			row.push({ 'Label': activeBoundary.properties.Name + ' [' + version.Name + ']', isHeader: true, isRegionHeader: true, boundaryId: activeBoundary.__boundaryId });
			// La celda de total de cada columna lleva su propio valor como ColumnTotal,
			// de modo que en modo "% de columna" el total muestre 100.
			for (var ti = 0; ti < totals.length; ti++) {
				totals[ti].ColumnTotal = columnTotals[ti];
			}
			arr.AddRange(row, totals);
			loc.Rows.push(row);
			// Agrega los datos
			arr.AddRange(loc.Rows, boundaryRows);
		};
	});
};

// Ordena las filas de una delimitación según el criterio activo, sin mezclar
// entre delimitaciones distintas. El criterio puede ser una columna de indicador
// (SortMetricId = id) o el label de la fila (SortMetricId === LABEL_SORT_KEY).
// Los valores nulos quedan al final en ambas direcciones.
Pivot.prototype.SortBoundaryRows = function (boundaryRows) {
	if (this.SortMetricId == null || this.SortDirection === 0) return;
	var dir = this.SortDirection;

	// Orden alfabético por el label de la fila (primera celda).
	if (this.SortMetricId === Pivot.LABEL_SORT_KEY) {
		boundaryRows.sort(function (a, b) {
			var al = (a[0] && a[0].Label != null) ? String(a[0].Label) : '';
			var bl = (b[0] && b[0].Label != null) ? String(b[0].Label) : '';
			var cmp = al.localeCompare(bl, 'es', { sensitivity: 'base' });
			return dir === 1 ? cmp : -cmp;
		});
		return;
	}

	var metricIndex = -1;
	for (var i = 0; i < this.Metrics.length; i++) {
		if (this.Metrics[i].properties.Metric.Id === this.SortMetricId) {
			metricIndex = i;
			break;
		}
	}
	if (metricIndex === -1) return;
	var col = metricIndex + 1;
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

Pivot.prototype.ResolveCell = function (metric, region, regionItem) {
	// Resuelve el N de datos tomando en cuenta metric, region_item y los filtros activos...

	// 1. Trae los Id de geographies (del metric) para ese regionItem
	var metricGeographyId = metric.SelectedLevel().GeographyId;
	var geographyIds = region.GetGeographyIdsForItem(regionItem.FID, metricGeographyId);

	if (!geographyIds || geographyIds.length === 0) {
		return 	{ 'Value': null, 'Total': null, 'Empty': true };
	}

	// 2. Trae los Id de geographies para los filtros
	var filteredGeographyIds = geographyIds;
	for (var i = 0; i < this.Filters.length; i++) {
		var filter = this.Filters[i].SelectedVersion().Selection;
		var filterGeographyIds = [];

		for (var j = 0; j < filter.Items.length; j++) {
			var filterItem = filter.Items[j];
			var ids = filter.Region.GetGeographyIdsForItem(filterItem.FID, metricGeographyId);
			if (ids && ids.length > 0) {
				filterGeographyIds = filterGeographyIds.concat(ids);
			}
		}

		// 3. Hace merge de todas las listas, quedándose con los ids que sirven (intersección)
		if (filterGeographyIds.length > 0) {
			filteredGeographyIds = filteredGeographyIds.filter(function(id) {
				return filterGeographyIds.indexOf(id) !== -1;
			});
		}
	}

	if (filteredGeographyIds.length === 0) {
		return { 'Value': null, 'Total': null, 'Empty': true };
	}

	// 4. Se fija los valores de esos y los sumariza...
	var sum = 0;
	var sumTotal = 0;
	var count = 0;
	var metricItems = metric.SelectedLevel().Items;
	var variableId = metric.SelectedVariable().Id;
	for (var k = 0; k < metricItems.length; k++) {
		var metricItem = metricItems[k];
		if (metricItem.VID === variableId && filteredGeographyIds.indexOf(metricItem.GeographyItemId) !== -1) {
			if (metricItem.Value !== null && metricItem.Value !== undefined) {
				sum += parseFloat(metricItem.Value);
				count++;
			}
			if (metricItem.Total !== null && metricItem.Total !== undefined) {
				sumTotal += parseFloat(metricItem.Total);
				count++;
			}
		}
	}

	// 5. Sale...
	return { 'Value': count > 0 ? sum : null, 'Total': count > 0 ? sumTotal : null };
};

Pivot.prototype.NeedAutoDrillDown = function () {
	var ret = false;
	// Si alguna región no tiene valores asociados,
	// hace drilldown del level y sale con true
	var allBoundaries = this.AllBoundaries();
	// Lo detecta cruzando indicadores con items de region (si hay alguno, lo da por bueno)
	for (var activeBoundary of allBoundaries) {
		for (var metric of this.Metrics) {
			var region = activeBoundary.SelectedVersion().Selection;
			if (region.Region.GeographyRelations[metric.SelectedLevel().GeographyId].length == 0) {
				if (this.TakeOneLevelDown(metric)) {
					return true;
				}
			}
		}
	}
	return false;
};

Pivot.prototype.CanAutoDrillUp = function () {
	// Si alguna región no tiene valores asociados,
	// hace drilldown del level y sale con true
	var allBoundaries = this.AllBoundaries();
	var drilledUp = false;
	// Lo detecta cruzando indicadores con items de region (si hay alguno, lo da por bueno)
	for (var metric of this.Metrics) {
		var parent = metric.SelectedLevelParent();
		if (parent) {
			var geographyId = parent.GeographyId;
			var canAutoDrillUp = true;
			for (var activeBoundary of allBoundaries) {
				var selection = activeBoundary.SelectedVersion().Selection;
				if (selection.Region.GeographyRelations[geographyId].length == 0) {
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

Pivot.prototype.TakeOneLevelUp = function (metric) {
	if (metric.SelectedVersion().SelectedLevelIndex > 0) {
		metric.SelectedVersion().SelectedLevelIndex--;
		return true;
	} else {
		return false;
	}
};

Pivot.prototype.TakeOneLevelDown = function (metric) {
	if (metric.SelectedVersion().SelectedLevelIndex < metric.SelectedVersion().Levels.length - 1) {
		metric.SelectedVersion().SelectedLevelIndex++;
		return true;
	} else {
		return false;
	}
};

Pivot.prototype.AllBoundaries = function () {
	var allBoundaries = [];
	arr.AddRange(allBoundaries, this.Boundaries);
	arr.AddRange(allBoundaries, this.Filters);
	return allBoundaries;
};

Pivot.prototype.RefreshRelations = function () {
	// Verifica que la información de relaciones
	// entre regiones y filtros con métricas
	// esté completa.
	// 1. Arma la lista de cosas a traer
	var toRetrieve = [];
	for (var metric of this.Metrics) {
		var geographyId = metric.SelectedLevel().GeographyId;
		var geographyParent = metric.SelectedLevelParent();
		var allBoundaries = this.AllBoundaries();

		for (var activeBoundary of allBoundaries) {
			var region = activeBoundary.SelectedVersion().Selection;
			toRetrieve.push(region.Region.EnsureContainsGeographyRelations(geographyId));
			// Es para tratar de nevagar niveles superiores
			if (geographyParent) {
				toRetrieve.push(region.Region.EnsureContainsGeographyRelations(geographyParent.GeographyId));
			}
		}
	}

	return Promise.all(toRetrieve);
};

Pivot.prototype.GetTotalRows = function () {
	return this.Rows.length;
};

Pivot.prototype.GetTotalColumns = function () {
	return this.ColumnHeaders.length + 1; // +1 por la columna de labels
};

Pivot.prototype.Clear = function () {
	arr.Clear(this.ColumnHeaders);
	arr.Clear(this.Rows);
	arr.Clear(this.Filters);
	arr.Clear(this.Boundaries);
	arr.Clear(this.Metrics);
};

Pivot.prototype.ClearBoundaries = function () {
	this.Boundaries = [];
};

Pivot.prototype.AddRegionById = function (boundaryId, caption) {
	var loc = this;
	var rs = window.Context.RegionStore;
	// Dedup: si ya está, lo promociona a "completo" (todos los items).
	var existing = this.FindBoundaryById(boundaryId);
	if (existing) {
		var prevVersion = existing.SelectedVersion();
		var allSelection = new RegionSelection(prevVersion.Selection.Region);
		allSelection.SelectAllItems();
		prevVersion.Selection = allSelection;
		existing.__whole = true;
		return promises.ReadyPromise(existing);
	}
	return rs.GetBoundaryOrRetrieve(boundaryId).then(function (activeBoundary) {
		var version = activeBoundary.SelectedVersion();
		return rs.GetRegionOrRetrieve(version.Id).then(function (region) {
			var regionSelection = new RegionSelection(region);
			regionSelection.SelectAllItems();
			version.Selection = regionSelection;
			activeBoundary.__boundaryId = boundaryId;
			activeBoundary.__whole = true;
			activeBoundary.__caption = caption || null;
			loc.Boundaries.unshift(activeBoundary);
		});
	});
};

// Quita una delimitación completa de las filas.
Pivot.prototype.RemoveBoundaryById = function (boundaryId) {
	var existing = this.FindBoundaryById(boundaryId);
	if (existing) arr.Remove(this.Boundaries, existing);
};

// Busca un boundary ya agregado a las filas por su id de origen.
// Comparación laxa para tolerar id como número o cadena.
Pivot.prototype.FindBoundaryById = function (boundaryId) {
	for (var i = 0; i < this.Boundaries.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (this.Boundaries[i].__boundaryId == boundaryId) {
			return this.Boundaries[i];
		}
	}
	return null;
};

// Agrega items concretos de una delimitación a las filas. Si la delimitación
// ya está presente, fusiona los items (dedup); si no, la agrega con esos items.
Pivot.prototype.AddRegionItemsById = function (boundaryId, itemIds) {
	var loc = this;
	var rs = window.Context.RegionStore;
	var existing = this.FindBoundaryById(boundaryId);
	if (existing) {
		var selection = existing.SelectedVersion().Selection;
		for (var n = 0; n < itemIds.length; n++) {
			if (!selection.IsItemSelected(itemIds[n])) selection.ToggleItem(itemIds[n]);
		}
		return promises.ReadyPromise(existing);
	}
	return rs.GetBoundaryOrRetrieve(boundaryId).then(function (activeBoundary) {
		var version = activeBoundary.SelectedVersion();
		return rs.GetRegionOrRetrieve(version.Id).then(function (region) {
			var regionSelection = new RegionSelection(region);
			regionSelection.SelectItems(itemIds);
			version.Selection = regionSelection;
			activeBoundary.__boundaryId = boundaryId;
			activeBoundary.__whole = false;
			loc.Boundaries.unshift(activeBoundary);
		});
	});
};

// Quita items concretos de una delimitación de las filas. Si la delimitación
// queda sin items seleccionados, se la remueve por completo.
Pivot.prototype.RemoveRegionItemsById = function (boundaryId, itemIds) {
	var existing = this.FindBoundaryById(boundaryId);
	if (!existing) return;
	var selection = existing.SelectedVersion().Selection;
	for (var n = 0; n < itemIds.length; n++) {
		if (selection.IsItemSelected(itemIds[n])) selection.ToggleItem(itemIds[n]);
	}
	if (!selection.Items.length) {
		arr.Remove(this.Boundaries, existing);
	}
};

Pivot.prototype.AddFilterById = function (boundaryId, itemIds) {
	var loc = this;
	var rs = window.Context.RegionStore;
	return rs.GetBoundaryOrRetrieve(boundaryId).then(function (activeBoundary) {
		var version = activeBoundary.SelectedVersion();
		return rs.GetRegionOrRetrieve(version.Id).then(function (region) {
			var regionSelection = new RegionSelection(region);
			regionSelection.SelectItems(itemIds);
			version.Selection = regionSelection;
			activeBoundary.__boundaryId = boundaryId;
			loc.Filters.push(activeBoundary);
		});
	});
};

Pivot.prototype.FindFilterById = function (boundaryId) {
	for (var i = 0; i < this.Filters.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (this.Filters[i].__boundaryId == boundaryId) {
			return this.Filters[i];
		}
	}
	return null;
};

// Agrega items concretos como filtro; fusiona si la delimitación ya filtra.
Pivot.prototype.AddFilterItemsById = function (boundaryId, itemIds) {
	var loc = this;
	var rs = window.Context.RegionStore;
	var existing = this.FindFilterById(boundaryId);
	if (existing) {
		var selection = existing.SelectedVersion().Selection;
		for (var n = 0; n < itemIds.length; n++) {
			if (!selection.IsItemSelected(itemIds[n])) selection.ToggleItem(itemIds[n]);
		}
		return promises.ReadyPromise(existing);
	}
	return rs.GetBoundaryOrRetrieve(boundaryId).then(function (activeBoundary) {
		var version = activeBoundary.SelectedVersion();
		return rs.GetRegionOrRetrieve(version.Id).then(function (region) {
			var regionSelection = new RegionSelection(region);
			regionSelection.SelectItems(itemIds);
			version.Selection = regionSelection;
			activeBoundary.__boundaryId = boundaryId;
			loc.Filters.push(activeBoundary);
		});
	});
};

Pivot.prototype.RemoveFilterItemsById = function (boundaryId, itemIds) {
	var existing = this.FindFilterById(boundaryId);
	if (!existing) return;
	var selection = existing.SelectedVersion().Selection;
	for (var n = 0; n < itemIds.length; n++) {
		if (selection.IsItemSelected(itemIds[n])) selection.ToggleItem(itemIds[n]);
	}
	if (!selection.Items.length) {
		arr.Remove(this.Filters, existing);
	}
};
// Quita un filtro completo (todas sus selecciones) por delimitación.
Pivot.prototype.RemoveFilterById = function (boundaryId) {
	var existing = this.FindFilterById(boundaryId);
	if (existing) arr.Remove(this.Filters, existing);
};
Pivot.prototype.AddMetricById = function (metricId) {
	var loc = this;
	var ms = window.Context.MetricStore;
	return ms.GetMetricOrRetrieve(metricId).then(function (metric) {
			loc.Metrics.push(metric);
	});
};

Pivot.prototype.Render = function () {
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
Pivot.prototype.RestoreFromSections = function (sections) {
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

	return Promise.all(tasks);
};

// Selecciona versión/nivel/variable/summary de un indicador según lo serializado.
Pivot.prototype.applyColumnState = function (metric, col) {
	if (!metric || !metric.properties) return;
	if (col.summary) metric.properties.SummaryMetric = col.summary;
	var versions = metric.properties.Versions || [];
	if (col.versionId != null) {
		for (var v = 0; v < versions.length; v++) {
			if (versions[v].Version && versions[v].Version.Id === col.versionId) {
				metric.properties.SelectedVersionIndex = v;
				break;
			}
		}
	}
	var version = metric.SelectedVersion ? metric.SelectedVersion() : null;
	if (version && col.levelId != null) {
		for (var l = 0; l < version.Levels.length; l++) {
			if (version.Levels[l].Id === col.levelId) {
				version.SelectedLevelIndex = l;
				break;
			}
		}
	}
	var level = metric.SelectedLevel ? metric.SelectedLevel() : null;
	if (level && col.variableId != null && level.Variables) {
		for (var a = 0; a < level.Variables.length; a++) {
			if (level.Variables[a].Id === col.variableId) {
				level.SelectedVariableIndex = a;
				break;
			}
		}
	}
};

