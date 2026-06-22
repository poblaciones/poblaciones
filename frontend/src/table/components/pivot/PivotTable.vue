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
			<div class="pivot-filters" :class="{ 'is-empty': !filterSelection.length }">
				<span class="filters-label">Filtros</span>
				<div class="filter-chips">
					<span v-for="chip in filterSelection" :key="'fchip-' + chip.Id" class="filter-chip">
						{{ chip.Caption }}
						<button class="filter-chip-x" @click="removeFilterChip(chip)" title="Quitar filtro">×</button>
					</span>
				</div>

				<button class="toolbar-button toolbar-button-sm"
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
			<div class="pivot-table-scroll" :class="{ 'panels-open': openPanels > 0 }">
				<div v-if="busy" class="pivot-busy-overlay">
					<div class="pivot-spinner"></div>
				</div>
				<table class="pivot-table">
					<thead>
						<tr>
							<th class="pivot-header-corner" :rowspan="3">
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
							<th v-for="(group, gi) in headerGroups"
									:key="'mgroup-' + group.metric.properties.Metric.Id"
									:colspan="group.colSpan"
									class="pivot-header-metric"
									:class="{ 'drag-over': dragState.overIndex === gi, 'dragging': dragState.index === gi }"
									:draggable="dragState.armed === gi"
									@dragstart="columnDrag.start(gi, $event)"
									@dragover.prevent="columnDrag.over(gi, $event)"
									@dragleave="columnDrag.leave(gi)"
									@drop="columnDrag.drop(gi, $event)"
									@dragend="columnDrag.end()">

								<div class="metric-drag-handle"
										 title="Arrastrar para reordenar"
										 @mousedown="columnDrag.arm(gi)"
										 @mouseup="columnDrag.disarm()">
									<span aria-label="Arrastrar para reordenar" role="img" class="drag-horizontal-icon">
										<svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24">
											<path d="M3,15V13H5V15H3M3,11V9H5V11H3M7,15V13H9V15H7M7,11V9H9V11H7M11,15V13H13V15H11M11,11V9H13V11H11M15,15V13H17V15H15M15,11V9H17V11H15M19,15V13H21V15H19M19,11V9H21V11H19Z"></path>
										</svg>
									</span>
								</div>
								<metric-header :metric="group.metric"
															 @selection-changed="handleChange"
															 @metric-removed="handleRemove"
															 @panel-open="onPanelOpen" />
							</th>
							<th class="pivot-header-metric pivot-header-add"
									:rowspan="3">
								<span class="add-label">Indicadores</span>
								<button class="toolbar-button"
												@click="addMetrics($event)"
												title="Agregar indicadores">
									<i class="fas fa-plus"></i>
								</button>
							</th>
						</tr>

						<!-- Fila de años: siempre presente; anida las categorías -->
						<tr class="pivot-version-row">
							<template v-for="group in headerGroups">
								<th v-for="(vg, vgIdx) in group.versionGroups"
										:key="'vg-' + group.metric.properties.Metric.Id + '-' + vgIdx"
										:colspan="vg.colSpan"
										class="pivot-version-header">
									{{ vg.versionName || '—' }}
								</th>
							</template>
						</tr>

						<!-- Fila de categorías: siempre presente -->
						<tr class="pivot-subheader-row">
							<th v-for="(spec, sIdx) in pivot.MetricTuples.metricTuples"
									:key="'sub-' + sIdx"
									class="pivot-subheader hand"
									:title="subHeaderTooltip(spec)"
									@click="onSubHeaderSort(spec)">
								<span class="subheader-label" :class="{ 'subheader-total': spec.isTotal }">{{ subHeaderText(spec) }}</span>
								<span v-if="pivot.MetricTuples.sortStateOf(spec.key) === 'desc'" class="sort-arrow">▼</span>
								<span v-else-if="pivot.MetricTuples.sortStateOf(spec.key) === 'asc'" class="sort-arrow">▲</span>
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
									{{ resolveValue(pivot.MetricTuples.headers[cellIndex - 1], cell) }}
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
	import MetricHeader from '@/table/components/MetricHeader';
	import arr from '@/common/framework/arr';
	import IndicatorSelector from '@/map/components/widgets/sideToolbar/indicatorSelector.vue';
	import RegionSelection from '@/table/classes/RegionSelection';
	import ActivePivot from '@/table/classes/ActivePivot.js';
	import { displayCell } from '@/table/classes/pivotValue.js';
	import CsvWriter from '@/table/writers/CsvWriter.js';
	import XlsxWriter from '@/table/writers/XlsxWriter.js';
	import ColumnDragController, { initialDragState } from '@/table/components/pivot/ColumnDragController.js';

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
				// Cantidad de dropdowns de header abiertos (libera el overflow del scroll).
				openPanels: 0,
				// Posición desde la que se invocó el panel (para anclarlo al +).
				panelAnchor: null,
				// Estado del reordenamiento de columnas por arrastre (lo opera el
				// ColumnDragController; lo lee el template para las clases y :draggable).
				dragState: initialDragState()
			};
		},

		created() {
			var loc = this;
			this.columnDrag = new ColumnDragController(this.dragState, function (from, to) {
				loc.moveMetric(from, to);
			});
		},

		mounted() {
			if (this.autoRefresh && this.pivot) {
				this.pivot.Render();
			}
		},

		computed: {
			// Estado del orden alfabético por label ('asc' | 'desc' | null).
			labelSortState() {
				return this.pivot ? this.pivot.MetricTuples.sortStateOf(ActivePivot.LABEL_SORT_KEY) : null;
			},
			// Agrupa las ColumnSpecs por indicador (consecutivas con mismo metricId).
			// Devuelve [{ metric, specs: [...], colSpan }]. El metric viene del primer
			// spec del grupo (todas las del mismo grupo comparten metric).
			headerGroups() {
				if (!this.pivot || !this.pivot.MetricTuples.metricTuples) return [];
				var specs = this.pivot.MetricTuples.metricTuples;
				var groups = [];
				var current = null;
				for (var i = 0; i < specs.length; i++) {
					var sp = specs[i];
					// Defensa ante estados transitorios: ignora specs sin metric resuelto.
					if (!sp || !sp.metric || !sp.metric.properties || !sp.metric.properties.Metric) continue;
					if (!current || current.metric !== sp.metric) {
						current = { metric: sp.metric, specs: [sp], colSpan: 1, versionGroups: null };
						groups.push(current);
					} else {
						current.specs.push(sp);
						current.colSpan++;
					}
				}
				// Subdivide cada grupo de indicador por versión (para la fila de años
				// con colspan). Specs consecutivas con el mismo versionId forman un
				// sub-grupo.
				groups.forEach(function (g) {
					var vgs = [];
					var cur = null;
					for (var k = 0; k < g.specs.length; k++) {
						var s = g.specs[k];
						if (!cur || cur.versionId !== s.versionId) {
							cur = { versionId: s.versionId, versionName: s.versionName, specs: [s], colSpan: 1 };
							vgs.push(cur);
						} else {
							cur.specs.push(s);
							cur.colSpan++;
						}
					}
					g.versionGroups = vgs;
				});
				return groups;
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
				return this.boundariesToChips(this.pivot.Regions.items);
			},
			// Selección de filtros: siempre por items (un chip por item filtrado).
			filterSelection() {
				if (!this.pivot) return [];
				return this.boundariesToChips(this.pivot.FilterSet.items);
			}
		},
		methods: {
			// Un header abrió o cerró un dropdown. Mantiene la cuenta para liberar
			// el overflow del scroll mientras al menos uno esté abierto.
			onPanelOpen(open) {
				this.openPanels += open ? 1 : -1;
				if (this.openPanels < 0) this.openPanels = 0;
			},

			// Traduce los índices de headerGroups a índices de pivot.Metrics y mueve.
			// Lo invoca el ColumnDragController al concretarse un arrastre válido.
			moveMetric(fromGroup, toGroup) {
				var groups = this.headerGroups;
				if (!groups[fromGroup] || !groups[toGroup]) return;
				var fromMetric = this.pivot.Metrics.indexOf(groups[fromGroup].metric);
				var toMetric = this.pivot.Metrics.indexOf(groups[toGroup].metric);
				if (fromMetric < 0 || toMetric < 0) return;
				var loc = this;
				if (this.pivot.MoveMetric(fromMetric, toMetric)) {
					this.runBusy(function () { loc.pivot.RefreshData(); }).then(function () {
						loc.$emit('data-refreshed', loc.pivot);
					});
				}
			},
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
					return loc.pivot.AddMetricById(it.Id);
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
			// Sort por una columna concreta (sub-header). Recibe la ColumnSpec.
			onSubHeaderSort(spec) {
				if (!spec || !spec.key || spec.isEmpty) return;
				var loc = this;
				this.pivot.MetricTuples.toggleSort(spec.key);
				this.runBusy(function () { loc.pivot.RefreshData(); }).then(function () {
					loc.$emit('data-refreshed', loc.pivot);
				});
			},
			// Texto del sub-header: categoría/Total, o nombre de variable cuando no hay categorías.
			subHeaderText(spec) {
				if (spec.isEmpty) return '—';
				if (spec.isTotal) return 'Total';
				if (spec.labelName) return spec.labelName;
				return spec.variableName || '';
			},
			subHeaderTooltip(spec) {
				var parts = [spec.metricName];
				if (spec.variableName) parts.push(spec.variableName);
				if (spec.labelName) parts.push(spec.labelName);
				if (spec.versionName) parts.push('Edición ' + spec.versionName);
				return parts.join(' — ') + ' · clic para ordenar';
			},
			// Ordena alfabéticamente por el label de la fila (clic en "Región").
			sortByLabel() {
				var loc = this;
				this.pivot.MetricTuples.toggleSort(ActivePivot.LABEL_SORT_KEY);
				this.runBusy(function () { loc.pivot.RefreshData(); }).then(function () {
					loc.$emit('data-refreshed', loc.pivot);
				});
			},
			handleRemove(metric) {
				var loc = this;
				arr.Remove(this.pivot.Metrics, metric);
				// Si la columna ordenadora pertenecía al indicador removido, limpiar sort.
				var sortKey = this.pivot.MetricTuples.sortKey;
				if (sortKey != null && sortKey !== ActivePivot.LABEL_SORT_KEY) {
					var prefix = 'm:' + metric.properties.Metric.Id + '|';
					if (String(sortKey).indexOf(prefix) === 0) {
						this.pivot.MetricTuples.clearSort();
					}
				}
				this.runBusy(function () { loc.pivot.RefreshData(); }).then(function () {
					loc.$emit('data-refreshed', loc.pivot);
				});
			},
			removeRowBoundary(boundaryId) {
				this.pivot.RemoveBoundaryById(boundaryId);
				this.applyAndNotify();
			},
			resolveValue(spec, cell) {
				if (!spec || !spec.metric || cell === null || cell === undefined) return '';
				return displayCell(spec.metric, spec.variable, cell);
			},
			getRowClass(row) {
				if (row.length > 0 && row[0].isRegionHeader) {
					return 'pivot-row-region-header';
				}
				if (row.length > 0 && row[0].isGroupHeader) {
					return 'pivot-row-group-header';
				}
				return 'pivot-row-item-header';
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

			exportToCSV() {
				new CsvWriter(this.pivot).download('tabla.csv');
			},
			exportToExcel() {
				return new XlsxWriter(this.pivot).download('tabla.xlsx');
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
		height: 100%;
		min-width: 0;
		display: flex;
		flex-direction: column;
		background-color: #f5f5f5;
		box-sizing: border-box;
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
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		padding: 6px 12px;
		background-color: #fff;
		border-radius: 4px;
		border-left: 4px solid #2196f3;
	}

		.filters-label {
			font-size: 13px;
			font-weight: 600;
			color: #607d8b;
			white-space: nowrap;
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

	.pivot-table-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		padding: 12px;
		box-sizing: border-box;
	}

	.pivot-filters {
		flex: 0 0 auto;
	}

	.pivot-table-scroll {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
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

	.pivot-header-add { text-align: center; white-space: nowrap; width: 90px; }
	.add-label { display: block; font-size: 11px; opacity: 0.9; margin-bottom: 4px; }

	.pivot-table {
		width: auto;
		table-layout: fixed;
		border-collapse: collapse;
		font-size: 14px;
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
		}

	.pivot-header-corner {
		background-color: #1565c0;
		text-align: left;
		width: 300px;
		max-width: 300px;
		position: sticky;
		left: 0;
		z-index: 12;
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
		text-align: right;
		position: relative;
	}

	.metric-drag-handle {
		visibility: hidden;
		position: absolute;
		top: 13px;
		left: 0;
		width: 100%;
		height: 16px;
		color: #cccccc;
		cursor: move;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		z-index: 3;
	}
	.metric-drag-handle .drag-horizontal-icon {
		display: inline-flex;
		line-height: 1;
	}
	.pivot-header-metric:hover .metric-drag-handle {
		visibility: visible;
	}
	.metric-drag-handle:hover {
		color: #1976d2;
	}
	.pivot-header-metric.dragging {
		opacity: 0.5;
	}
	.pivot-header-metric.drag-over {
		outline: 2px dashed #1976d2;
		outline-offset: -2px;
	}

	/* Fila de años (versión), anida las categorías mediante colspan */
	.pivot-version-row {
		background-color: #1976d2;
	}

	.pivot-table th.pivot-version-header {
		font-size: 11px;
		font-weight: 700;
		color: #fff;
		background-color: #1976d2;
		text-align: center;
		padding: 5px 8px;
		border: none;
		border-left: 1px solid #3b8eea;
		border-bottom: 1px solid #3b8eea;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Sub-headers de columna (etiqueta de categoría/Total + sort) */
	.pivot-subheader-row {
		background-color: #1976d2;
	}

	.pivot-table th.pivot-subheader {
		font-size: 11px;
		font-weight: 600;
		color: #fff;
		background-color: #1976d2;
		text-align: center;
		padding: 6px 8px;
		border: none;
		border-left: 1px solid #3b8eea;
		border-bottom: 2px solid #1565c0;
		user-select: none;
		width: 75px;
		max-width: 75px;
		white-space: normal;
		overflow-wrap: break-word;
	}

		.pivot-table th.pivot-version-header:first-child,
		.pivot-table th.pivot-subheader:first-child {
			border-left: none;
		}

		.pivot-table th.pivot-subheader:hover {
			background-color: #1565c0;
		}

	.subheader-version {
		color: rgba(255,255,255,0.8);
		font-weight: 500;
	}

	.subheader-label {
		color: #fff;
	}

	.subheader-total {
		font-style: italic;
	}

	.pivot-subheader .sort-arrow {
		margin-left: 4px;
		color: #fff;
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
		.pivot-row-region-header .pivot-cell-header {
			background-color: #e3f2fd;
		}

		.pivot-row-region-header:hover {
			background-color: #bbdefb !important;
		}
		.pivot-row-region-header:hover .pivot-cell-header {
			background-color: #bbdefb;
		}

	.pivot-row-item-header {
		background-color: #fafafa;
	}
		.pivot-row-item-header .pivot-cell-header {
			background-color: #fafafa;
		}

	.pivot-row-group-header {
		background-color: #f0f4f8;
		font-weight: 600;
		color: #37474f;
	}
		.pivot-row-group-header .pivot-cell-header {
			background-color: #f0f4f8;
		}
		.pivot-row-group-header .cell-label {
			padding-left: 6px;
			border-left: 3px solid #90a4ae;
		}

	.pivot-row-data {
		background-color: #fff;
	}

	.pivot-table td {
		padding: 2px 8px;
	}

	.pivot-cell-header {
		font-weight: 500;
		color: #424242;
		text-align: left;
		width: 300px;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding-left: 15px;
		position: sticky;
		left: 0;
		z-index: 2;
		background-color: #fff;
	}

	.pivot-cell-value {
		text-align: center;
		color: #616161;
		font-family: 'Courier New', monospace;
		width: 75px;
		max-width: 75px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		flex: 0 0 auto;
		margin-top: 8px;
		padding: 6px 12px;
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

		.toolbar-button.toolbar-button-sm {
			width: 26px;
			height: 26px;
			font-size: 13px;
			border: 1px solid #d0d7de;
			color: #607d8b;
			flex: 0 0 auto;
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
