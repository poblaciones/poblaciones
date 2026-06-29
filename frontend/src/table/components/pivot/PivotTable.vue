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

			<!-- Tabla pivot. El overlay de espera va en este contenedor relativo
			     (no scrolleable), no dentro del scroll, para que cubra el área visible
			     completa y no se desplace con el scroll horizontal. -->
			<div class="pivot-scroll-area">
				<div v-if="busy" class="pivot-busy-overlay">
					<div class="pivot-spinner"></div>
				</div>
				<div class="pivot-table-scroll" :class="{ 'panels-open': openPanels > 0 }">
					<table class="pivot-table">
					<thead>
						<tr>
							<th class="pivot-header-corner" :rowspan="showLevelRow ? 4 : 3">
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
									:key="'mgroup-' + group.metric.InstanceId"
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
									:rowspan="showLevelRow ? 4 : 3">
								<span class="add-label">Indicadores</span>
								<button class="toolbar-button"
												@click="addMetrics($event)"
												title="Agregar indicadores">
									<i class="fas fa-plus"></i>
								</button>
							</th>
						</tr>

						<!-- Fila de años: un th por año, y al final de cada indicador un
						     control desplegable para elegir qué años se muestran. -->
						<tr class="pivot-version-row">
							<template v-for="group in headerGroups">
								<th v-for="(vg, vgIdx) in group.versionGroups"
										:key="'vg-' + group.metric.InstanceId + '-' + vgIdx"
										:colspan="vg.colSpan"
										class="pivot-version-header">
									<span class="version-header-text">{{ vg.versionName || '—' }}</span>
									<span v-if="vg.versionId && !group.metric.selectionResolvesData(vg.versionId)"
											class="version-no-data"
											title="Este censo no tiene datos de la variable al nivel de desagregación mostrado.">*</span>
									<button v-if="vgIdx === group.versionGroups.length - 1 && versionsOfferedFor(group.metric)"
											class="inline-trigger"
											:ref="'vtrig-' + group.metric.InstanceId"
											@click.stop="openVersionPanel(group.metric, $event)">▾</button>
								</th>
							</template>
						</tr>

						<!-- Fila de nivel: solo si alguna columna es de datos por unidad
						     geográfica (tipo D) con categorías. Las columnas que necesitan
						     nivel muestran acá el nombre del nivel (con sus categorías
						     debajo); las demás muestran acá su propia etiqueta con rowspan 2
						     (ocupan nivel + categoría). -->
						<tr v-if="showLevelRow" class="pivot-level-row">
							<template v-for="(spec, sIdx) in pivot.MetricTuples.metricTuples">
								<th v-if="levelRowCells[sIdx]"
										:key="'lv-' + sIdx"
										:colspan="levelRowCells[sIdx].colspan"
										:rowspan="levelRowCells[sIdx].rowspan"
										:class="levelRowCells[sIdx].kind === 'level' ? 'pivot-level-header' : (levelRowCells[sIdx].kind === 'placeholder' ? 'pivot-subheader pivot-subheader-empty' : 'pivot-subheader hand')"
										:title="levelRowCells[sIdx].kind === 'cat' ? subHeaderTooltip(spec) : null"
										@click="levelRowCells[sIdx].kind === 'cat' ? onSubHeaderSort(spec) : null">
									<template v-if="levelRowCells[sIdx].kind === 'level'">{{ levelRowCells[sIdx].name }}</template>
									<template v-else-if="levelRowCells[sIdx].kind === 'placeholder'">
										<span class="subheader-label subheader-empty">[Ninguna]</span>
										<button class="inline-trigger"
												:ref="'ctrig-' + levelRowCells[sIdx].metric.InstanceId"
												@click.stop="openCategoryPanel(levelRowCells[sIdx].metric, $event)">▾</button>
									</template>
									<template v-else>
										<span class="subheader-label" :class="{ 'subheader-total': spec.isTotal }">{{ subHeaderText(spec) }}</span>
										<span v-if="pivot.MetricTuples.sortStateOf(spec.key) === 'desc'" class="sort-glyph sort-desc">⌄</span>
										<span v-else-if="pivot.MetricTuples.sortStateOf(spec.key) === 'asc'" class="sort-glyph sort-asc">⌃</span>
										<button v-if="levelRowCells[sIdx].lastOfMetric && metricTriggerInLevelRow(levelRowCells[sIdx].metric)"
												class="inline-trigger"
												:ref="'ctrig-' + levelRowCells[sIdx].metric.InstanceId"
												@click.stop="openCategoryPanel(levelRowCells[sIdx].metric, $event)">▾</button>
									</template>
								</th>
							</template>
						</tr>

						<!-- Fila de categorías. Recorre los indicadores: cada uno muestra
						     sus celdas de categoría/total (las que no hicieron rowspan en la
						     fila de nivel) y, si no tiene ninguna columna visible, una celda
						     placeholder "[Ninguna]". El control de categorías cuelga de la
						     última celda de cada indicador. -->
						<tr class="pivot-subheader-row">
							<template v-for="entry in categoryRow">
								<th v-for="(cell, ci) in entry.cells"
										:key="'sub-' + entry.metric.InstanceId + '-' + ci"
										class="pivot-subheader"
										:class="{ hand: !cell.spec.isPlaceholder, 'pivot-subheader-empty': cell.spec.isPlaceholder }"
										:title="cell.spec.isPlaceholder ? null : subHeaderTooltip(cell.spec)"
										@click="cell.spec.isPlaceholder ? null : onSubHeaderSort(cell.spec)">
									<span v-if="cell.spec.isPlaceholder" class="subheader-label subheader-empty">[Ninguna]</span>
									<template v-else>
										<span class="subheader-label" :class="{ 'subheader-total': cell.spec.isTotal }">{{ subHeaderText(cell.spec) }}</span>
										<span v-if="pivot.MetricTuples.sortStateOf(cell.spec.key) === 'desc'" class="sort-glyph sort-desc">⌄</span>
										<span v-else-if="pivot.MetricTuples.sortStateOf(cell.spec.key) === 'asc'" class="sort-glyph sort-asc">⌃</span>
									</template>
									<button v-if="ci === entry.cells.length - 1 && !metricTriggerInLevelRow(entry.metric)"
											class="inline-trigger"
											:ref="'ctrig-' + entry.metric.InstanceId"
											@click.stop="openCategoryPanel(entry.metric, $event)">▾</button>
								</th>
							</template>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, rowIndex) in visibleRows"
								:key="'row-' + rowIndex"
								:class="getRowClass(row)">
							<td v-for="(cell, cellIndex) in row"
									:key="'cell-' + rowIndex + '-' + cellIndex"
									:class="getCellClass(cell)">
								<span v-if="cell.isHeader" class="cell-label">
									<button v-if="cell.isRegionHeader && groupKeys.length"
													class="group-toggle group-toggle-all"
													@click="toggleAllGroups"
													:title="allGroupsCollapsed ? 'Expandir todos' : 'Colapsar todos'">{{ allGroupsCollapsed ? '▸' : '▾' }}</button>
									<button v-if="cell.isGroupHeader"
													class="group-toggle"
													@click="toggleGroup(cell.Label)"
													:title="collapse.isCollapsed(cell.Label) ? 'Expandir' : 'Colapsar'">{{ collapse.isCollapsed(cell.Label) ? '▸' : '▾' }}</button>
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

		<!-- Panel flotante único de versión/categorías. Vive en la raíz del
		     componente (fuera del thead y su contexto de apilamiento sticky), y se
		     posiciona por JS respecto del triángulo que lo abrió. Es multiselect: el
		     usuario marca varias opciones y el panel permanece abierto; se cierra al
		     hacer clic afuera o en el triángulo de nuevo. -->
		<div v-if="floatPanel.open" ref="floatPanel" class="inline-float-panel" :style="floatPanel.style" @click.stop>
			<template v-if="floatPanel.kind === 'version'">
				<div v-for="v in floatVersions" :key="'fv-' + v.id"
						class="ifp-option" :class="{ 'ifp-locked': v.locked, 'ifp-selected': !versionMulti && v.active }"
						@click.stop="onFloatVersionToggle(v.id)">
					<input v-if="versionMulti" type="checkbox" tabindex="-1" :checked="v.active" :disabled="v.locked" @click.prevent />
					<span>{{ v.name }}</span>
				</div>
				<div class="ifp-multi-toggle ifp-multi-foot" @click.stop="versionMulti = !versionMulti">
					<input type="checkbox" tabindex="-1" :checked="versionMulti" @click.prevent />
					<span>Selección múltiple</span>
				</div>
			</template>
			<template v-else-if="floatPanel.kind === 'category'">
				<div v-for="grp in floatGroups" :key="'fg-' + grp.versionId" class="ifp-group">
					<div class="ifp-group-header" @click.stop="onFloatToggleAll(grp.versionId)">
						<input type="checkbox" tabindex="-1" :checked="grp.allSelected" @click.prevent />
						<span class="ifp-group-title">{{ grp.versionName }}</span>
					</div>
					<div v-for="lbl in grp.labels" :key="'fl-' + grp.versionId + '-' + lbl.Id"
							class="ifp-option" @click.stop="onFloatToggleLabel(grp.versionId, lbl.Id)">
						<input type="checkbox" tabindex="-1" :checked="grp.selectedLabels.indexOf(lbl.Id) !== -1" @click.prevent />
						<span>{{ lbl.Name }}</span>
					</div>
					<div class="ifp-option ifp-total" @click.stop="onFloatToggleTotal(grp.versionId)">
						<input type="checkbox" tabindex="-1" :checked="grp.includeTotal" @click.prevent />
						<span>Total</span>
					</div>
				</div>
			</template>
		</div>

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
	import CollapseState from '@/table/components/pivot/CollapseState.js';

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
			},
			initialCollapse: {
				type: String,
				default: ''
			}
		},

		data() {
			return {
				loading: false,
				exloading: false,
				error: null,
				activePanel: '',
				// Panel flotante único de versión/categorías (un solo lugar de estado,
				// fuera del thead). metric: el indicador en edición; kind: 'version' o
				// 'category'; style: posición calculada respecto del triángulo.
				floatPanel: { open: false, kind: null, metric: null, style: {} },
				// Modo del combo de años: por defecto single-select (elegir un año lo
				// reemplaza y cierra el panel); el check lo vuelve multiselect.
				versionMulti: false,
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
				dragState: initialDragState(),
				// Colapso de cortes de control (grupos). La clave es el nombre del grupo.
				collapse: new CollapseState(),
				collapseVersion: 0,  // fuerza recomputar al mutar collapse (no es reactivo)
				dataTick: 0          // fuerza recomputar lo que depende de metricTuples
				                     // (array de clase, que Vue no observa) tras refrescar
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
			// Cierra el panel flotante de versión/categorías al hacer clic afuera.
			// El panel y los triángulos detienen la propagación (@click.stop), así que
			// cualquier clic que llegue acá es "afuera".
			var loc = this;
			this._floatAway = function () { if (loc.floatPanel.open) loc.closeFloatPanel(); };
			document.addEventListener('click', this._floatAway);
			this._floatScroll = function (e) {
				if (!loc.floatPanel.open) return;
				var p = loc.$refs.floatPanel;
				if (p && (p === e.target || p.contains(e.target))) return; // scroll interno
				loc.closeFloatPanel();
			};
			window.addEventListener('scroll', this._floatScroll, true);
		},
		beforeDestroy() {
			if (this._floatAway) document.removeEventListener('click', this._floatAway);
			if (this._floatScroll) window.removeEventListener('scroll', this._floatScroll, true);
		},

		computed: {
			// Claves de los cortes de control (grupos), en orden de aparición. Sirven
			// para el colapso y para codificar el estado de forma posicional.
			groupKeys() {
				this.collapseVersion;
				var keys = [];
				if (!this.pivot || !this.pivot.Rows) return keys;
				this.pivot.Rows.forEach(function (row) {
					if (row.length && row[0].isGroupHeader) keys.push(row[0].Label);
				});
				return keys;
			},
			// Filas a mostrar: oculta las filas hijas de los grupos colapsados. La fila
			// de grupo siempre se ve; sus hijos (item-header bajo ese padre) se ocultan.
			visibleRows() {
				this.collapseVersion;
				if (!this.pivot || !this.pivot.Rows) return [];
				var loc = this;
				var hiddenParent = null;
				var out = [];
				this.pivot.Rows.forEach(function (row) {
					var head = row[0];
					if (head && head.isGroupHeader) {
						hiddenParent = loc.collapse.isCollapsed(head.Label) ? head.Label : null;
						out.push(row);
						return;
					}
					if (head && head.isRegionHeader) { hiddenParent = null; out.push(row); return; }
					// Fila de item: se oculta si pertenece al grupo colapsado en curso.
					if (hiddenParent != null && head && head.Parent === hiddenParent) return;
					out.push(row);
				});
				return out;
			},
			allGroupsCollapsed() {
				this.collapseVersion;
				return this.collapse.allCollapsed(this.groupKeys);
			},
			// Estado del orden alfabético por label ('asc' | 'desc' | null).
			labelSortState() {
				return this.pivot ? this.pivot.MetricTuples.sortStateOf(ActivePivot.LABEL_SORT_KEY) : null;
			},
			// Celdas de la fila de nivel, alineadas por índice con metricTuples.
			// Cada entrada es null (columna absorbida por el colspan de un nivel a su
			// izquierda) o { kind, colspan, rowspan, name }:
			//   kind 'level' → nombre del nivel, colspan = nº de categorías del tramo
			//   kind 'cat'   → etiqueta de la propia columna (total o tipo L/S), con
			//                  rowspan 2 para ocupar también la fila de categorías.
			levelRowCells() {
				this.dataTick;
				var specs = this.pivot ? this.pivot.MetricTuples.metricTuples : [];
				var cells = new Array(specs.length).fill(null);
				var i = 0;
				while (i < specs.length) {
					var sp = specs[i];
					if (sp && sp.isPlaceholder) {
						cells[i] = { kind: 'placeholder', colspan: 1, rowspan: 2, name: null, metric: sp.metric };
						i++;
					} else if (this.tupleNeedsLevel(sp)) {
						var span = 1;
						var j = i + 1;
						while (j < specs.length && this.tupleNeedsLevel(specs[j])
								&& specs[j].metric === sp.metric && specs[j].versionId === sp.versionId && specs[j].levelId === sp.levelId) {
							span++; j++;
						}
						cells[i] = { kind: 'level', colspan: span, rowspan: 1, name: sp.levelName, metric: sp.metric };
						i = j;
					} else {
						cells[i] = { kind: 'cat', colspan: 1, rowspan: 2, name: null, metric: sp.metric };
						i++;
					}
				}
				// Marca la última celda de cada indicador, para colgar ahí el control
				// de categorías inline (una vez por indicador).
				for (var k = 0; k < cells.length; k++) {
					if (!cells[k]) continue;
					var nextWithCell = null;
					for (var n = k + 1; n < cells.length; n++) {
						if (cells[n]) { nextWithCell = cells[n]; break; }
					}
					cells[k].lastOfMetric = !nextWithCell || nextWithCell.metric !== cells[k].metric;
				}
				return cells;
			},
			// Una tupla aporta la fila de nivel cuando es de un dataset tipo "D"
			// (datos por unidad geográfica) y representa una categoría (no el total).
			// Los tipos "L" (puntos) y "S" (shape), y los totales, no la necesitan.
			showLevelRow() {
				this.dataTick;
				var specs = this.pivot ? this.pivot.MetricTuples.metricTuples : null;
				if (!specs) return false;
				for (var i = 0; i < specs.length; i++) {
					if (this.tupleNeedsLevel(specs[i])) return true;
				}
				return false;
			},
			// Agrupa las ColumnSpecs por indicador (consecutivas con mismo metricId).
			// Devuelve [{ metric, specs: [...], colSpan }]. El metric viene del primer
			// spec del grupo (todas las del mismo grupo comparten metric).
			headerGroups() {
				this.dataTick;
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
			// Contenido del panel flotante de versión: los censos donde existe la
			// variable, con su estado activo y el bloqueo del último.
			floatVersions() {
				var m = this.floatPanel.metric;
				if (!m || this.floatPanel.kind !== 'version') return [];
				var active = m.Selections.map(function (s) { return s.versionId(); });
				var multi = this.versionMulti;
				var list = m.VersionsForVariable(m.variableName());
				return list.map(function (v) {
					var id = v.Version.Id;
					var isActive = active.indexOf(id) !== -1;
					// El bloqueo del último censo solo aplica en multiselect; en single,
					// elegir otro año siempre está permitido (lo reemplaza).
					return { id: id, name: v.Version.Name, active: isActive, locked: multi && isActive && active.length === 1 };
				});
			},
			// Contenido del panel flotante de categorías: un grupo por censo activo,
			// con sus labels visibles y el estado de selección.
			floatGroups() {
				var m = this.floatPanel.metric;
				if (!m || this.floatPanel.kind !== 'category') return [];
				return m.Selections.map(function (sel) {
					var labels = sel.variable.ValueLabels.filter(function (l) { return l.Visible; });
					var allSelected = sel.includeTotal && labels.length > 0 &&
						labels.every(function (l) { return sel.labels.indexOf(l.Id) !== -1; });
					return {
						versionId: sel.versionId(),
						versionName: sel.versionName(),
						labels: labels,
						selectedLabels: sel.labels,
						includeTotal: sel.includeTotal,
						allSelected: allSelected
					};
				});
			},
			// Estructura de la fila de categorías por indicador: las celdas que esta
			// fila renderiza (las que no hicieron rowspan en la fila de nivel). El
			// control de categorías cuelga de la última celda de cada indicador. Una
			// tupla placeholder (indicador sin columnas visibles) muestra "[Ninguna]".
			categoryRow() {
				this.dataTick;
				if (!this.pivot) return [];
				var specs = this.pivot.MetricTuples.metricTuples;
				var showLevel = this.showLevelRow;
				var byMetric = [];
				var indexByMetric = {};
				for (var i = 0; i < specs.length; i++) {
					var sp = specs[i];
					if (!sp || !sp.metric) continue;
					// Con fila de nivel, el placeholder ya ocupa ambas filas (rowspan 2)
					// allí; sin fila de nivel, va acá. Las celdas que hicieron rowspan en
					// la fila de nivel no se repiten.
					if (showLevel) {
						if (sp.isPlaceholder) continue;
						if (!this.tupleNeedsLevel(sp)) continue;
					}
					var id = sp.metric.InstanceId;
					if (indexByMetric[id] == null) {
						indexByMetric[id] = byMetric.length;
						byMetric.push({ metric: sp.metric, cells: [] });
					}
					byMetric[indexByMetric[id]].cells.push({ spec: sp });
				}
				return byMetric;
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
			// Colapsa o expande un corte de control (grupo) por su clave.
			toggleGroup(key) {
				this.collapse.toggle(key);
				this.collapseVersion++;
				this.emitCollapse();
			},
			// Alterna entre colapsar todos los grupos y expandir todos.
			toggleAllGroups() {
				this.collapse.setAll(this.groupKeys, !this.allGroupsCollapsed);
				this.collapseVersion++;
				this.emitCollapse();
			},
			// Notifica el estado compacto para que el contenedor lo persista en la URL.
			emitCollapse() {
				this.$emit('collapse-changed', {
					encoded: this.collapse.encode(this.groupKeys),
					keys: this.collapse.collapsedKeys()
				});
			},
			// Aplica un estado de colapso recibido (p. ej. restaurado desde la URL).
			applyCollapse(encoded) {
				this.collapse.decode(encoded || '', this.groupKeys);
				this.collapseVersion++;
				// Tras restaurar, notifica los nombres para que distribución los excluya.
				this.$emit('collapse-changed', {
					encoded: this.collapse.encode(this.groupKeys),
					keys: this.collapse.collapsedKeys()
				});
			},
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
					Key: 'm:' + metric.InstanceId,
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
					// Desde un chip llega la instancia concreta: se quita esa.
					if (it && loc.pivot.Metrics.indexOf(it) !== -1) {
						arr.Remove(loc.pivot.Metrics, it);
						return;
					}
					// Desde el árbol llega el indicador (por Metric.Id): se quitan
					// todas sus instancias, porque el nodo representa al indicador.
					var id = (it && it.Id != null) ? it.Id
						: (it && it.properties && it.properties.Metric ? it.properties.Metric.Id : null);
					var toRemove = loc.pivot.Metrics.filter(function (m) {
						return m.properties.Metric.Id === id;
					});
					for (var i = 0; i < toRemove.length; i++) arr.Remove(loc.pivot.Metrics, toRemove[i]);
				});
				this.pivot.RefreshData();
				this.dataTick++;
				this.$emit('data-refreshed', this.pivot);
			},

			// ── Filas (delimitaciones) ───────────────────────────────────────────────
			// "Agregar todos/as": la delimitación entera (un solo chip).
			onRowGroup(node) {
				var loc = this;
				loc.pivot.AddRegionById(node.Id, node.Name).then(function () { loc.applyAndNotify(true); });
			},
			// Selección por items (hojas individuales o check de corte de control).
			// container es la delimitación a la que pertenecen las hojas.
			onRowSelect(items, container) {
				if (!container) return;
				var loc = this;
				var itemIds = items.map(function (it) { return it.Id; });
				loc.pivot.AddRegionItemsById(container.Id, itemIds).then(function () { loc.applyAndNotify(true); });
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
				this.applyAndNotify(true);
			},

			// ── Filtros (delimitaciones) ─────────────────────────────────────────────
			onFilterSelect(items, container) {
				if (!container) return;
				var loc = this;
				var itemIds = items.map(function (it) { return it.Id; });
				loc.pivot.AddFilterItemsById(container.Id, itemIds).then(function () { loc.applyAndNotify(true); });
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
								// metricTuples/Rows ya se rearmaron: invalida los computeds
								// que los leen (no son observables por Vue).
								loc.dataTick++;
								resolve(r);
							}).catch(function (e) {
								loc.busy = false;
								loc.dataTick++;
								resolve(e);
							});
						}, 0);
					});
				});
			},

			// Re-renderiza (trae datos) y avisa al contenedor para sincronizar la ruta.
			// `structural` marca add/remove de región o filtro, para que el contenedor
			// deje una entrada en el historial.
			applyAndNotify(structural) {
				var loc = this;
				return this.runBusy(function () {
					return loc.pivot.Render().then(function () {
						loc.$emit('data-refreshed', loc.pivot, !!structural);
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

			// ── Controles inline del encabezado (años y categorías por indicador) ──
			// Operan directamente sobre el modelo del indicador y refrescan. La lógica
			// vive en el modelo (toggleVersion, Selections); acá solo se dispara.
			// ── Panel flotante de versión/categorías ──────────────────────────────
			// ¿Conviene ofrecer el combo de años para este indicador? (más de un censo
			// donde existe la variable). Si hay uno solo, el triángulo no se muestra.
			versionsOfferedFor(metric) {
				return metric.VersionsForVariable(metric.variableName()).length > 1;
			},
			openVersionPanel(metric, ev) {
				if (this.floatPanel.open && this.floatPanel.kind === 'version' && this.floatPanel.metric === metric) {
					this.closeFloatPanel();
					return;
				}
				// Si ya hay más de un censo activo, el panel arranca en modo múltiple.
				this.versionMulti = metric.Selections.length > 1;
				this.floatPanel = { open: true, kind: 'version', metric: metric, style: {} };
				this._positionFloatPanel(ev.currentTarget);
			},
			openCategoryPanel(metric, ev) {
				if (this.floatPanel.open && this.floatPanel.kind === 'category' && this.floatPanel.metric === metric) {
					this.closeFloatPanel();
					return;
				}
				this.floatPanel = { open: true, kind: 'category', metric: metric, style: {} };
				this._positionFloatPanel(ev.currentTarget);
			},
			closeFloatPanel() {
				this.floatPanel = { open: false, kind: null, metric: null, style: {} };
			},
			// Posiciona el panel (position:fixed) debajo del triángulo, ajustando si se
			// sale del viewport. Se recalcula en el nextTick (cuando el panel ya tiene
			// tamaño) para poder corregir hacia arriba/izquierda.
			_positionFloatPanel(triggerEl) {
				if (!triggerEl || !triggerEl.getBoundingClientRect) return;
				var r = triggerEl.getBoundingClientRect();
				var loc = this;
				this.floatPanel.style = { position: 'fixed', top: (r.bottom + 4) + 'px', left: r.left + 'px', zIndex: 3000 };
				this.$nextTick(function () {
					var panel = loc.$refs.floatPanel;
					if (!panel) return;
					var pr = panel.getBoundingClientRect();
					var vw = window.innerWidth, vh = window.innerHeight;
					var left = r.left, top = r.bottom + 4;
					if (left + pr.width > vw - 8) left = Math.max(8, vw - pr.width - 8);
					if (top + pr.height > vh - 8) top = Math.max(8, r.top - pr.height - 4);
					loc.floatPanel.style = { position: 'fixed', top: top + 'px', left: left + 'px', zIndex: 3000,
						maxHeight: (vh - top - 12) + 'px', overflowY: 'auto' };
				});
			},
			// Contenido del panel (computado desde floatPanel.metric en los getters).
			_floatSelectionFor(versionId) {
				var m = this.floatPanel.metric;
				if (!m) return null;
				return m.Selections.filter(function (s) { return s.versionId() === versionId; })[0] || null;
			},
			onFloatVersionToggle(versionId) {
				var m = this.floatPanel.metric;
				if (!m) return;
				if (!this.versionMulti) {
					// Single-select: ese censo pasa a ser el único, y el panel se cierra.
					m.SelectVersions([versionId]);
					this.closeFloatPanel();
					this.handleChange({ metric: m, changeType: 'Version' });
					return;
				}
				// Multiselect: alterna sin cerrar; no permite destildar el último.
				var active = m.Selections.map(function (s) { return s.versionId(); });
				if (active.length === 1 && active[0] === versionId) return;
				m.toggleVersion(versionId);
				this.handleChange({ metric: m, changeType: 'Version' });
			},
			onFloatToggleLabel(versionId, labelId) {
				var sel = this._floatSelectionFor(versionId);
				if (!sel) return;
				if (sel.labels.indexOf(labelId) >= 0) sel.labels = sel.labels.filter(function (id) { return id !== labelId; });
				else sel.labels = sel.labels.concat(labelId);
				this.handleChange({ metric: this.floatPanel.metric, changeType: 'Categories' });
			},
			onFloatToggleTotal(versionId) {
				var sel = this._floatSelectionFor(versionId);
				if (!sel) return;
				sel.includeTotal = !sel.includeTotal;
				this.handleChange({ metric: this.floatPanel.metric, changeType: 'Categories' });
			},
			onFloatToggleAll(versionId) {
				var sel = this._floatSelectionFor(versionId);
				if (!sel) return;
				var labels = sel.variable.ValueLabels.filter(function (l) { return l.Visible; });
				var allSelected = sel.includeTotal && labels.length > 0 &&
					labels.every(function (l) { return sel.labels.indexOf(l.Id) !== -1; });
				sel.labels = allSelected ? [] : labels.map(function (l) { return l.Id; });
				sel.includeTotal = true;
				this.handleChange({ metric: this.floatPanel.metric, changeType: 'Categories' });
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
			tupleNeedsLevel(spec) {
				return !!spec && !spec.isEmpty && !spec.isTotal && spec.datasetType === 'D' && spec.labelId != null;
			},
			// ¿El indicador tiene celdas en la fila de categorías? Si no (todas sus
			// columnas hicieron rowspan en la fila de nivel), el control de categorías
			// debe colgar de su celda con rowspan en la fila de nivel.
			metricHasCategoryRowCells(metric) {
				var row = this.categoryRow;
				for (var i = 0; i < row.length; i++) {
					if (row[i].metric.InstanceId === metric.InstanceId) return row[i].cells.length > 0;
				}
				return false;
			},
			// ¿La última celda del indicador está en la fila de nivel (una celda 'cat'
			// con rowspan: el Total, o una columna tipo L/S)? En ese caso el triángulo
			// de categorías cuelga de esa celda —típicamente el Total cuando está
			// visible—, no de la última categoría de la fila de abajo.
			metricTriggerInLevelRow(metric) {
				var cells = this.levelRowCells;
				for (var i = 0; i < cells.length; i++) {
					var c = cells[i];
					if (c && c.metric === metric && c.lastOfMetric) {
						return c.kind === 'cat' || c.kind === 'placeholder';
					}
				}
				return false;
			},
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
					loc.$emit('data-refreshed', loc.pivot, true);
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
				// Indentado doble solo cuando hay cortes de control (jerarquía de
				// árbol); sin ellos, indentado simple.
				return this.groupKeys.length
					? 'pivot-row-item-header pivot-row-item-nested'
					: 'pivot-row-item-header';
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
			},
			// Aplica el colapso restaurado de la URL una sola vez, cuando ya hay
			// grupos sobre los que mapearlo (tras el primer render con datos).
			groupKeys(keys) {
				if (this._collapseApplied || !keys.length) return;
				this._collapseApplied = true;
				if (this.initialCollapse) this.applyCollapse(this.initialCollapse);
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

	.pivot-scroll-area {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.pivot-table-scroll {
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
		/* separate (no collapse) para sticky headers: en modo collapse los bordes
		   pertenecen a la tabla y no se mueven con la celda sticky al scrollear,
		   dejando colar el fondo blanco entre el header y los datos. Con separate
		   cada celda lleva su propio borde y viaja con ella. */
		border-collapse: separate;
		border-spacing: 0;
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
		padding: 0 8px;
		border: none;
		border-top: 1px solid #3b8eea;
		border-left: 1px solid #3b8eea;
		border-bottom: 1px solid #3b8eea;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	/* En border-collapse: separate cada celda dibuja sus bordes; la primera fila no
	   tenía borde superior ni la última columna borde derecho. Se completan acá. */
	.pivot-table thead th:last-child {
		border-right: 1px solid #3b8eea;
	}

	.pivot-table th.pivot-level-header {
		font-size: 11px;
		font-weight: 600;
		color: #fff;
		background-color: #2289d6;
		text-align: center;
		padding: 0 8px;
		border: none;
		border-left: 1px solid #3b8eea;
		border-bottom: 1px solid #3b8eea;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	/* Las celdas con control inline lo posicionan a la derecha; el panel flota con
	   position:fixed, así que overflow:hidden de la celda no lo recorta. */
	.pivot-table th.pivot-version-header,
	.pivot-table th.pivot-level-header {
		position: relative;
	}
	.inline-header-control {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
	}
	.version-header-text, .level-header-text { vertical-align: middle; }
	.version-no-data {
		color: #ffd54f;
		font-weight: 700;
		margin-left: 2px;
		cursor: help;
		vertical-align: middle;
	}
	/* Glifo de ordenamiento: circunflejo arriba/abajo, distinto del desplegable. */
	.sort-glyph { margin-left: 3px; font-weight: 700; }
	.subheader-empty { font-style: italic; opacity: 0.7; }
	.pivot-subheader-empty { cursor: default; }

	/* Triángulo que abre el panel flotante de versión/categorías. */
	.inline-trigger {
		position: absolute;
		right: 4px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #ffffff;
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 3px;
	}
	.inline-trigger:hover { background-color: rgba(255,255,255,0.2); }

	/* Panel flotante único (versión/categorías), anclado por JS. */
	.inline-float-panel {
		background: #fff;
		border: 1px solid #cfd8dc;
		border-radius: 4px;
		box-shadow: 0 4px 16px rgba(0,0,0,0.18);
		min-width: 180px;
		padding: 4px 0;
		font-size: 13px;
		color: #37474f;
	}
	.inline-float-panel .ifp-option,
	.inline-float-panel .ifp-group-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		cursor: pointer;
		white-space: nowrap;
		text-align: left;
	}
	.inline-float-panel .ifp-option:hover,
	.inline-float-panel .ifp-group-header:hover { background-color: #e3f2fd; }
	.inline-float-panel .ifp-group-header { font-weight: 600; border-top: 1px solid #eceff1; }
	.inline-float-panel .ifp-group:first-child .ifp-group-header { border-top: none; }
	/* Las categorías cuelgan de su grupo de versión: se indentan para reflejarlo. */
	.inline-float-panel .ifp-group .ifp-option { padding-left: 28px; }
	.inline-float-panel .ifp-total { font-style: italic; color: #607d8b; }
	.inline-float-panel .ifp-locked { opacity: 0.5; cursor: default; }
	/* En selección simple no hay checkbox: el activo se marca con fondo. */
	.inline-float-panel .ifp-selected { background-color: #e3f2fd; font-weight: 600; }
	.inline-float-panel .ifp-multi-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		cursor: pointer;
		white-space: nowrap;
		color: #607d8b;
		border-bottom: 1px solid #eceff1;
		margin-bottom: 2px;
	}
	/* Variante al pie del panel: el separador va arriba. */
	.inline-float-panel .ifp-multi-foot {
		border-bottom: none;
		border-top: 1px solid #eceff1;
		margin-bottom: 0;
		margin-top: 2px;
	}
	.inline-float-panel .ifp-multi-toggle:hover { background-color: #eceff1; }
	.inline-float-panel input[type="checkbox"] { pointer-events: none; }

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
		padding: 0 8px;
		border: none;
		border-left: 1px solid #3b8eea;
		border-bottom: 2px solid #1565c0;
		user-select: none;
		width: 75px;
		max-width: 75px;
		white-space: normal;
		overflow-wrap: break-word;
		position: relative;
	}
	/* El espacio extra a la derecha solo en celdas que tienen el triángulo. */
	.pivot-table th.pivot-subheader:has(.inline-trigger),
	.pivot-table th.pivot-version-header:has(.inline-trigger),
	.pivot-table th.pivot-level-header:has(.inline-trigger) {
		padding-right: 18px;
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
		background-color: inherit;
	}
		/* En border-collapse: separate los bordes de <tr> se ignoran; la línea
		   horizontal entre filas se pone en las celdas. */
		.pivot-table tbody td {
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
		/* Indentado simple por defecto; doble cuando hay cortes de control. */
		.pivot-row-item-header .cell-label {
			padding-left: 6px;
		}
		.pivot-row-item-nested .cell-label {
			padding-left: 13px;
		}

	.pivot-row-group-header {
		background-color: #f0f4f8;
		font-weight: 600;
		color: #37474f;
	}
		.pivot-row-group-header .pivot-cell-header {
			background-color: #f0f4f8;
		}
		/* El corte de control se indenta levemente; su fondo ya lo distingue, sin
		   necesidad de un borde izquierdo (que rompía la jerarquía del árbol). */
		.pivot-row-group-header .cell-label {
			padding-left: 6px;
		}

	.pivot-row-data {
		background-color: #fff;
	}

	/* Triángulo de colapso de grupos: flota a la derecha de la celda de etiqueta,
	   igual que en el selector de indicadores. */
	.pivot-cell-header { position: relative; }
	.group-toggle {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		border: none;
		background: transparent;
		color: #607d8b;
		cursor: pointer;
		font-size: 14px;
		line-height: 1;
		padding: 2px 4px;
	}
	.group-toggle:hover { color: #263238; }

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
