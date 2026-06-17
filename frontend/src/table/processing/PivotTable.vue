<template>
	<div class="pivot-table-container">

		<div v-if="exloading" class="pivot-loading">
			<div class="spinner"></div>
			<p>Cargando datos...</p>
		</div>

		<div v-else-if="error" class="pivot-error">
			<p>{{ error }}</p>
		</div>

		<div v-else-if="pivot " class="pivot-table-wrapper">
			<!-- Información de filtros aplicados -->
			<div class="pivot-filters">
				<h4>Filtros</h4>
				<div class="filter-chips">
					<span v-for="chip in filterSelection" :key="'fchip-' + chip.Id" class="filter-chip">
						{{ chip.Caption }}
						<button class="filter-chip-x" @click="removeFilterChip(chip)" title="Quitar filtro">×</button>
					</span>
				</div>

				<button class="toolbar-button"
								@click="addFilters($event)"
								title="Agregar filtro">
					<i class="fas fa-plus"></i>
				</button>

				<IndicatorSelector :is-open="activePanel === 'filters'"
									 :anchor="panelAnchor"
													 :categories="boundaryCategories"
													 :selection="filterSelection"
													 :suggestions="[]"
													 :selectable-branches="true"
													 :emit-container="true"
													 :multi-select.sync="filterMulti"
													 title="Agregar filtros"
													 root-label="Categorías"
													 search-placeholder="Buscar delimitación..."
													 item-noun="delimitación"
													 item-noun-plural="delimitaciones"
													 :noun-from-node-name="true"
													 @select="onFilterSelect"
													 @deselect="onFilterDeselect"
													 @close="closePanel" />

			</div>

			<!-- Tabla pivot -->
			<div class="pivot-table-scroll">
				<div v-if="busy" class="pivot-busy-overlay">
					<div class="pivot-spinner"></div>
				</div>
				<div v-if="!pivot.Metrics.length && !pivot.Boundaries.length" class="pivot-hint">
					<p>Usá los botones <strong>+</strong> para elegir indicadores en las columnas y delimitaciones en las filas.</p>
				</div>
				<table class="pivot-table">
					<thead>
						<tr>
							<th class="pivot-header-corner">
								<span class="region-sort hand" @click="sortByLabel" title="Ordenar alfabéticamente">
									Regiones
									<span v-if="labelSortState === 'asc'" class="sort-arrow">▲</span>
									<span v-else-if="labelSortState === 'desc'" class="sort-arrow">▼</span>
								</span>
								<button class="toolbar-button toolbar-button-inline"
												@click="addRows($event)"
												title="Agregar filas">
									<i class="fas fa-plus"></i>
								</button>
							</th>
							<th v-for="(metric, index) in pivot.ColumnHeaders"
									:key="'header-' + index"
									class="pivot-header-metric">

								<metric-header :metric="metric"
															 :sort-state="pivot.SortStateOf(metric.properties.Metric.Id)"
															 @selection-changed="handleChange"
															 @order-changed="handleOrder"
															 @metric-removed="handleRemove" />
							</th>
							<th class="pivot-header-metric pivot-header-add">
								<span class="add-label">Indicadores</span>
								<button class="toolbar-button"
												@click="addMetrics($event)"
												title="Agregar indicadores">
									<i class="fas fa-plus"></i>
								</button>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, rowIndex) in pivot.Rows"
								:key="'row-' + rowIndex"
								:class="getRowClass(row)">
							<td v-for="(cell, cellIndex) in row"
									:key="'cell-' + rowIndex + '-' + cellIndex"
									:class="getCellClass(cell)">
								<span v-if="cell.isHeader" class="cell-label">
									{{ cell.Label }}
									<button v-if="cell.isRegionHeader && cell.boundaryId != null"
													class="region-remove-btn"
													@click="removeRowBoundary(cell.boundaryId)"
													title="Quitar de las filas">×</button>
								</span>
								<span v-else class="cell-value">
									{{ resolveValue(pivot.ColumnHeaders[cellIndex - 1], cell) }}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Resumen -->
			<div class="pivot-summary">
				<p>
					<strong>Total de filas:</strong> {{ pivot.GetTotalRows() }} |
					<strong>Métricas:</strong> {{ pivot.Metrics.length }}
				</p>
			</div>
		</div>

		<div v-else class="pivot-empty">
			<p></p>
		</div>

		<IndicatorSelector :is-open="activePanel === 'metrics'"
									 :anchor="panelAnchor"
											 :categories="indicatorCategories"
											 :selection="metricSelection"
											 :suggestions="[]"
											 :expand-leaves="true"
											 title="Agregar indicadores"
											 root-label="Categorías"
											 search-placeholder="Buscar indicador..."
											 item-noun="indicador"
											 item-noun-plural="indicadores"
											 @select="onMetricSelect"
											 @deselect="onMetricDeselect"
											 @close="closePanel" />

		<IndicatorSelector :is-open="activePanel === 'rows'"
									 :anchor="panelAnchor"
											 :categories="boundaryCategories"
											 :selection="rowSelection"
											 :suggestions="[]"
											 :selectable-branches="true"
											 :emit-container="true"
											 :show-add-all="true"
											 :multi-select.sync="rowMulti"
											 add-all-label="Agregar todos/as"
											 title="Agregar filas"
											 root-label="Categorías"
											 search-placeholder="Buscar delimitación..."
											 item-noun="delimitación"
											 item-noun-plural="delimitaciones"
											 :noun-from-node-name="true"
											 @select="onRowSelect"
											 @deselect="onRowDeselect"
											 @select-group="onRowGroup"
											 @close="closePanel" />

	</div>
</template>

<script>
	import MetricHeader from './MetricHeader';
	import arr from '@/common/framework/arr';
	import IndicatorSelector from '@/map/components/widgets/sideToolbar/indicatorSelector.vue';
	import RegionSelection from './RegionSelection';
	import Pivot from './Pivot.js';
	import { displayCell, valueHeader as displayCellHeader } from './pivotValue.js';
	import * as XLSX from 'xlsx';

	export default {
		name: 'PivotTable',
		components: {
			MetricHeader,
			IndicatorSelector
		},
		props: {
			pivot: {
				type: Object,
				default: null
			},
			autoRefresh: {
				type: Boolean,
				default: false
			},
			decimals: {
				type: Number,
				default: 2
			}
		},

		data() {
			return {
				loading: false,
				exloading: false,
				error: null,
				activePanel: '',
				// Filas y filtros: multiselección desactivada por defecto.
				rowMulti: false,
				filterMulti: false,
				// Indicador de "preparando datos" mientras trae o recalcula.
				busy: false,
				// Posición desde la que se invocó el panel (para anclarlo al +).
				panelAnchor: null
			};
		},

		mounted() {
			if (this.autoRefresh && this.pivot) {
				this.pivot.Render();
			}
		},

		computed: {
			// Estado del orden alfabético por label ('asc' | 'desc' | null).
			labelSortState() {
				return this.pivot ? this.pivot.SortStateOf(Pivot.LABEL_SORT_KEY) : null;
			},
			// Árboles de catálogo (poblados por App.vue desde GetFabIndicators / GetFabBoundaries).
			indicatorCategories() {
				return window.Context.Metrics;
			},
			boundaryCategories() {
				return window.Context.Boundaries;
			},
			// Selección de columnas: indicadores activos en la pivot.
			metricSelection() {
				if (!this.pivot) return [];
				return this.pivot.Metrics.map(this.metricToChip);
			},
			// Selección de filas: una delimitación agregada "completa" produce un único
			// chip que la representa; agregada por items produce un chip por item.
			rowSelection() {
				if (!this.pivot) return [];
				return this.boundariesToChips(this.pivot.Boundaries);
			},
			// Selección de filtros: siempre por items (un chip por item filtrado).
			filterSelection() {
				if (!this.pivot) return [];
				return this.boundariesToChips(this.pivot.Filters);
			}
		},
		methods: {
			// Guarda el borde derecho y el centro vertical del botón invocador.
			setAnchorFrom(event) {
				if (event && event.currentTarget && event.currentTarget.getBoundingClientRect) {
					var r = event.currentTarget.getBoundingClientRect();
					this.panelAnchor = { left: r.right, centerY: r.top + r.height / 2 };
				} else {
					this.panelAnchor = null;
				}
			},
			addFilters(event) {
				this.setAnchorFrom(event);
				this.activePanel = 'filters';
			},
			addMetrics(event) {
				this.setAnchorFrom(event);
				this.activePanel = 'metrics';
			},
			addRows(event) {
				this.setAnchorFrom(event);
				this.activePanel = 'rows';
			},
			closePanel() {
				this.activePanel = '';
			},

			// ── Mapeo a chip (Id/Caption/Description para el panel) ──────────────────
			// Supuesto a verificar: el id de cada item de región (hoja del árbol)
			// coincide con item.Id; el nombre visible está en item.Caption.
			metricToChip(metric) {
				return {
					Id: metric.properties.Metric.Id,
					Caption: metric.properties.Metric.Name,
					Description: metric.properties.Metric.Name,
					Item: metric
				};
			},
			// Convierte delimitaciones activas en chips. Cada chip lleva en Item un
			// Type ('B' delimitación completa, 'I' item) que el panel devuelve al
			// removerlo, para que el consumidor sepa qué quitar (componente genérico).
			boundariesToChips(boundaries) {
				var chips = [];
				for (var i = 0; i < boundaries.length; i++) {
					var boundary = boundaries[i];
					var boundaryId = boundary.__boundaryId;
					if (boundary.__whole) {
						// Delimitación completa: un único chip que la representa.
						chips.push({
							Id: 'B:' + boundaryId,
							Caption: boundary.__caption || '(delimitación)',
							Description: boundary.__caption || '',
							Item: { Type: 'B', BoundaryId: boundaryId }
						});
						continue;
					}
					var selection = boundary.SelectedVersion ? boundary.SelectedVersion().Selection : null;
					var items = selection && selection.Items ? selection.Items : [];
					for (var j = 0; j < items.length; j++) {
						var it = items[j];
						chips.push({
							Id: it.FID,
							Caption: it.Caption,
							Description: it.Caption,
							Item: { Type: 'I', BoundaryId: boundaryId, Id: it.FID }
						});
					}
				}
				return chips;
			},
			// Agrupa por boundary los items a quitar, distinguiendo si la quita es de
			// una delimitación completa (Type 'B') o de items concretos.
			collectRemovals(items, container) {
				var byBoundary = {};
				var wholeBoundaries = [];
				items.forEach(function (it) {
					if (it && it.Type === 'B') {
						wholeBoundaries.push(it.BoundaryId);
						return;
					}
					// Desde un chip: it.BoundaryId + it.Id. Desde el árbol: it.Id + container.
					var boundaryId = (it && it.BoundaryId != null) ? it.BoundaryId : (container ? container.Id : null);
					var itemId = (it && it.Id != null) ? it.Id : null;
					if (boundaryId == null || itemId == null) return;
					(byBoundary[boundaryId] = byBoundary[boundaryId] || []).push(itemId);
				});
				return { byBoundary: byBoundary, wholeBoundaries: wholeBoundaries };
			},

			// ── Columnas (indicadores) ───────────────────────────────────────────────
			onMetricSelect(items) {
				var loc = this;
				var ps = items.map(function (it) {
					return window.Context.MetricStore.GetMetricOrRetrieve(it.Id).then(function (metric) {
						loc.pivot.Metrics.push(metric);
					});
				});
				Promise.all(ps).then(function () { loc.applyAndNotify(); });
			},
			onMetricDeselect(items) {
				var loc = this;
				items.forEach(function (it) {
					var id = (it && it.Id != null) ? it.Id
						: (it && it.properties && it.properties.Metric ? it.properties.Metric.Id : null);
					var metric = loc.pivot.Metrics.find(function (m) {
						return m.properties.Metric.Id === id;
					});
					if (metric) arr.Remove(loc.pivot.Metrics, metric);
				});
				this.pivot.RefreshData();
				this.$emit('data-refreshed', this.pivot);
			},

			// ── Filas (delimitaciones) ───────────────────────────────────────────────
			// "Agregar todos/as": la delimitación entera (un solo chip).
			onRowGroup(node) {
				var loc = this;
				loc.pivot.AddRegionById(node.Id, node.Name).then(function () { loc.applyAndNotify(); });
			},
			// Selección por items (hojas individuales o check de corte de control).
			// container es la delimitación a la que pertenecen las hojas.
			onRowSelect(items, container) {
				if (!container) return;
				var loc = this;
				var itemIds = items.map(function (it) { return it.Id; });
				loc.pivot.AddRegionItemsById(container.Id, itemIds).then(function () { loc.applyAndNotify(); });
			},
			onRowDeselect(items, container) {
				var loc = this;
				var removals = this.collectRemovals(items, container);
				removals.wholeBoundaries.forEach(function (boundaryId) {
					loc.pivot.RemoveBoundaryById(boundaryId);
				});
				Object.keys(removals.byBoundary).forEach(function (boundaryId) {
					loc.pivot.RemoveRegionItemsById(boundaryId, removals.byBoundary[boundaryId]);
				});
				this.applyAndNotify();
			},

			// ── Filtros (delimitaciones) ─────────────────────────────────────────────
			onFilterSelect(items, container) {
				if (!container) return;
				var loc = this;
				var itemIds = items.map(function (it) { return it.Id; });
				loc.pivot.AddFilterItemsById(container.Id, itemIds).then(function () { loc.applyAndNotify(); });
			},
			onFilterDeselect(items, container) {
				var loc = this;
				var removals = this.collectRemovals(items, container);
				removals.wholeBoundaries.forEach(function (boundaryId) {
					loc.pivot.RemoveFilterById(boundaryId);
				});
				Object.keys(removals.byBoundary).forEach(function (boundaryId) {
					loc.pivot.RemoveFilterItemsById(boundaryId, removals.byBoundary[boundaryId]);
				});
				this.applyAndNotify();
			},
			// Quita un filtro desde su chip en el área de filtros.
			removeFilterChip(chip) {
				this.onFilterDeselect([chip.Item], null);
			},

			// Muestra el indicador mientras corre fn (sync o async). Cede un frame
			// para que el overlay se pinte antes de un cálculo bloqueante.
			runBusy(fn) {
				var loc = this;
				loc.busy = true;
				return new Promise(function (resolve) {
					loc.$nextTick(function () {
						setTimeout(function () {
							Promise.resolve(fn()).then(function (r) {
								loc.busy = false;
								resolve(r);
							}).catch(function (e) {
								loc.busy = false;
								resolve(e);
							});
						}, 0);
					});
				});
			},

			// Re-renderiza (trae datos) y avisa al contenedor para sincronizar la ruta.
			applyAndNotify() {
				var loc = this;
				return this.runBusy(function () {
					return loc.pivot.Render().then(function () {
						loc.$emit('data-refreshed', loc.pivot);
					});
				});
			},

			handleChange(data) {
				var loc = this;
				this.runBusy(function () {
					if (data.changeType === 'Variable' || data.changeType === 'Value') {
						return loc.pivot.Render();
					}
					return loc.pivot.Render();
				}).then(function () {
					loc.$emit('data-refreshed', loc.pivot);
				});
			},
			handleOrder(data) {
				if (!data || !data.metric) return;
				var loc = this;
				var metricId = data.metric.properties.Metric.Id;
				if (data.direction === undefined) {
					this.pivot.ToggleSort(metricId);
				} else if (data.direction === null) {
					this.pivot.SortMetricId = null;
					this.pivot.SortDirection = 0;
				} else {
					this.pivot.SortMetricId = metricId;
					this.pivot.SortDirection = (data.direction === 'asc') ? 1 : -1;
				}
				this.runBusy(function () { loc.pivot.RefreshData(); });
			},
			// Ordena alfabéticamente por el label de la fila (clic en "Región").
			sortByLabel() {
				var loc = this;
				this.pivot.ToggleSort(Pivot.LABEL_SORT_KEY);
				this.runBusy(function () { loc.pivot.RefreshData(); });
			},
			handleRemove(metric) {
				var loc = this;
				arr.Remove(this.pivot.Metrics, metric);
				if (this.pivot.SortMetricId === metric.properties.Metric.Id) {
					this.pivot.SortMetricId = null;
					this.pivot.SortDirection = 0;
				}
				this.runBusy(function () { loc.pivot.RefreshData(); }).then(function () {
					loc.$emit('data-refreshed', loc.pivot);
				});
			},
			removeRowBoundary(boundaryId) {
				this.pivot.RemoveBoundaryById(boundaryId);
				this.applyAndNotify();
			},
			resolveValue(metric, cell) {
				if (!metric || cell === null || cell === undefined) return '';
				var variable = metric.SelectedVariable ? metric.SelectedVariable() : null;
				return displayCell(metric, variable, cell);
			},
			getRowClass(row) {
				if (row.length > 0 && row[0].isRegionHeader) {
					return 'pivot-row-region-header';
				}
				else {
					return 'pivot-row-item-header';
				}
				return 'pivot-row-data';
			},

			getCellClass(cell) {
				if (cell === null) {
					return '';
				}
				if (cell.isHeader) {
					return 'pivot-cell-header';
				}
				if (cell.Value === null || cell.Value === undefined) {
					return 'pivot-cell-value pivot-cell-empty';
				}
				return 'pivot-cell-value';
			},

			// Piezas del encabezado de una columna: indicador, variable (con el modo
			// entre paréntesis) y edición (versión seleccionada).
			columnParts(metric) {
				var indicator = metric.properties.Metric.Name;
				var variable = metric.SelectedVariable ? metric.SelectedVariable() : null;
				var mode = this.stripHtml(this.columnUnit(metric, variable));
				var variableLabel = variable ? variable.Name : '';
				if (mode) variableLabel = variableLabel + ' (' + mode + ')';
				var version = metric.SelectedVersion ? metric.SelectedVersion() : null;
				var edition = '';
				if (version) edition = (version.Version && version.Version.Name) ? version.Version.Name : (version.Name || '');
				return { indicator: indicator, variable: variableLabel, edition: edition };
			},
			columnUnit(metric, variable) {
				// Reusa el mismo encabezado de modo que muestra la grilla.
				try { return displayCellHeader(metric, variable); } catch (e) { return ''; }
			},
			stripHtml(s) {
				return String(s == null ? '' : s).replace(/<[^>]*>/g, '');
			},
			// Filas de datos como matriz de strings (label + valores visibles).
			buildDataRows() {
				var loc = this;
				var rows = [];
				this.pivot.Rows.forEach(function (row) {
					var out = [];
					for (var j = 0; j < row.length; j++) {
						var cell = row[j];
						if (cell.isHeader) out.push(cell.Label);
						else out.push(loc.resolveValue(loc.pivot.ColumnHeaders[j - 1], cell));
					}
					rows.push(out);
				});
				return rows;
			},
			downloadBlob(content, type, filename) {
				var blob = new Blob([content], { type: type });
				var link = document.createElement('a');
				var url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', filename);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			},
			exportToCSV() {
				if (!this.pivot || this.pivot.Rows.length === 0) return;
				var loc = this;
				// Encabezado en una línea: "indicador - variable (modo) - edición".
				var header = ['Regiones'];
				this.pivot.ColumnHeaders.forEach(function (metric) {
					var p = loc.columnParts(metric);
					var parts = [p.indicator, p.variable, p.edition].filter(Boolean);
					header.push(parts.join(' - '));
				});
				var matrix = [header].concat(this.buildDataRows());
				var csv = matrix.map(function (row) {
					return row.map(function (v) {
						var s = (v == null ? '' : String(v));
						if (/[",\n;]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
						return s;
					}).join(',');
				}).join('\n');
				this.downloadBlob('\ufeff' + csv, 'text/csv;charset=utf-8;', 'tabla.csv');
			},
			exportToExcel() {
				if (!this.pivot || this.pivot.Rows.length === 0) return;
				var loc = this;
				// Tres filas de encabezado: indicador / variable (modo) / edición.
				var rowIndicator = ['Regiones'];
				var rowVariable = [''];
				var rowEdition = [''];
				this.pivot.ColumnHeaders.forEach(function (metric) {
					var p = loc.columnParts(metric);
					rowIndicator.push(p.indicator);
					rowVariable.push(p.variable);
					rowEdition.push(p.edition);
				});
				var aoa = [rowIndicator, rowVariable, rowEdition].concat(this.buildDataRows());
				// xlsx nativo con SheetJS.
				var ws = XLSX.utils.aoa_to_sheet(aoa);
				var wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(wb, ws, 'Tabla');
				XLSX.writeFile(wb, 'tabla.xlsx');
			}
		},

		watch: {
			pivot: {
				handler(newVal) {
					if (this.autoRefresh && newVal) {
						this.pivot.Render();
					}
				},
				deep: false
			}
		}
	};
</script>

<style scoped>
	.pivot-table-container {
		width: 100%;
		min-width: 700px;
		padding: 20px;
		background-color: #f5f5f5;
	}

	.pivot-loading {
		text-align: center;
		padding: 40px;
	}

	.spinner {
		border: 4px solid #f3f3f3;
		border-top: 4px solid #3498db;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 20px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}

		100% {
			transform: rotate(360deg);
		}
	}

	.pivot-error {
		padding: 20px;
		background-color: #ffebee;
		color: #c62828;
		border-radius: 4px;
		text-align: center;
	}

	.pivot-empty {
		padding: 40px;
		text-align: center;
		color: #757575;
	}

	.pivot-filters {
		margin-bottom: 20px;
		padding: 15px;
		background-color: #fff;
		border-radius: 4px;
		border-left: 4px solid #2196f3;
	}

		.pivot-filters h4 {
			margin: 0 0 10px 0;
			font-size: 14px;
			color: #424242;
		}

	.filter-item {
		margin: 5px 0;
		font-size: 13px;
	}

		.filter-item strong {
			color: #1976d2;
		}

	.filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #e3f2fd;
		color: #1565c0;
		border-radius: 14px;
		padding: 3px 6px 3px 12px;
		font-size: 12px;
	}
	.filter-chip-x {
		border: none;
		background: rgba(0,0,0,0.08);
		color: #1565c0;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		line-height: 1;
		cursor: pointer;
		font-size: 13px;
	}
		.filter-chip-x:hover { background: rgba(0,0,0,0.18); }

	.pivot-table-scroll {
		position: relative;
		overflow-x: auto;
		background-color: #fff;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.pivot-busy-overlay {
		position: absolute;
		inset: 0;
		background: rgba(255,255,255,0.65);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		z-index: 20;
		color: #555;
		font-size: 13px;
	}

	.pivot-spinner {
		width: 28px;
		height: 28px;
		border: 3px solid #d0d0d0;
		border-top-color: #1976d2;
		border-radius: 50%;
		animation: pivot-spin 0.8s linear infinite;
	}

	@keyframes pivot-spin {
		to { transform: rotate(360deg); }
	}

	.region-sort {
		cursor: pointer;
	}
		.region-sort:hover {
			text-decoration: underline;
		}

	.pivot-header-add { text-align: center; white-space: nowrap; }
	.add-label { display: block; font-size: 11px; opacity: 0.9; margin-bottom: 4px; }

	.pivot-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

		.pivot-table thead {
			background-color: #1976d2;
			color: white;
			position: sticky;
			top: 0;
			z-index: 10;
		}

		.pivot-table th {
			padding: 12px 15px;
			text-align: left;
			height: 1px;
			font-weight: 600;
			border-bottom: 2px solid #0d47a1;
		}

	.pivot-header-corner {
		background-color: #1565c0;
		text-align: left;
		min-width: 200px;
	}

	.toolbar-button-inline {
		width: 26px;
		height: 26px;
		font-size: 13px;
		margin-left: 10px;
		vertical-align: middle;
		display: inline-flex;
	}

	.pivot-header-metric {
		min-width: 120px;
		text-align: right;
	}

	.pivot-table tbody tr {
		border-bottom: 1px solid #e0e0e0;
	}

		.pivot-table tbody tr:hover {
			background-color: #f5f5f5;
		}

	.pivot-row-region-header {
		background-color: #e3f2fd;
		font-weight: 600;
	}

		.pivot-row-region-header:hover {
			background-color: #bbdefb !important;
		}

	.pivot-row-item-header {
		background-color: #fafafa;
	}

	.pivot-row-data {
		background-color: #fff;
	}

	.pivot-table td {
		padding: 10px 15px;
	}

	.pivot-cell-header {
		font-weight: 500;
		color: #424242;
		text-align: left;
	}

	.pivot-cell-value {
		text-align: right;
		color: #616161;
		padding-right: 30px !important;
		font-family: 'Courier New', monospace;
	}

	.pivot-cell-empty {
		color: #bdbdbd;
		font-style: italic;
	}

	.cell-label {
		display: block;
	}

	.region-remove-btn {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
		margin-left: 8px;
		opacity: 0.6;
		padding: 0 4px;
	}
		.region-remove-btn:hover {
			opacity: 1;
		}

	.cell-value {
		display: block;
	}

	.pivot-summary {
		margin-top: 15px;
		padding: 10px 15px;
		background-color: #fff;
		border-radius: 4px;
		font-size: 12px;
		color: #616161;
	}

		.pivot-summary p {
			margin: 0;
		}

	/* Responsivo */
	@media (max-width: 768px) {
		.pivot-table-container {
			padding: 10px;
		}

		.pivot-table {
			font-size: 11px;
		}

			.pivot-table th,
			.pivot-table td {
				padding: 8px 10px;
			}

		.pivot-header-corner {
			min-width: 150px;
		}

		.pivot-header-metric {
			min-width: 100px;
		}
	}


	.toolbar-button {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		background: white;
		color: #666;
		font-size: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		outline: none;
	}

		.toolbar-button:hover {
			background: #f0f0f0;
			color: #333;
			transform: scale(1.05);
		}

		.toolbar-button.active {
			background: #0fa7d8;
			color: white;
		}

		.toolbar-button:active {
			transform: scale(0.95);
		}

		/* Primer botón con color azul por defecto */
		.toolbar-button:first-child {
			background: #0fa7d8;
			color: white;
		}

			.toolbar-button:first-child:hover {
				background: #0fa7d8;
			}

			.toolbar-button:first-child.active {
				background: #0fa7d8;
			}

	@media (max-width: 768px) {
		.map-toolbar {
			left: 10px;
			padding: 8px;
			gap: 8px;
		}

		.toolbar-button {
			width: 40px;
			height: 40px;
			font-size: 16px;
		}
	}
</style>
