<template>
	<div class="pivot-table-container">

		<div v-if="exloading" class="pivot-loading">
			<div class="spinner"></div>
			<p>Cargando datos...</p>
		</div>

		<div v-else-if="error" class="pivot-error">
			<p>{{ error }}</p>
		</div>

		<div v-else-if="pivot" class="pivot-table-wrapper" :class="{ 'is-embedded': embedded }">
			<table-side-toolbar v-if="!embedded" :pivot="pivot" :tick="dataTick"
													@add-metrics="onAddMetrics"
													@remove-metrics="onRemoveMetrics"
													@select-places="onSelectPlaces"
													@remove-places="onRemovePlaces" />
			<div v-if="suggestion" class="pivot-suggestion">
				<span>Vista actual del mapa: <strong>{{ suggestionCaption }}</strong></span>
				<button class="mp-btn mp-btn--solid mp-btn--sm" @click="acceptSuggestion">Usar como selección</button>
				<button class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--muted" @click="dismissSuggestion"
								title="Descartar" aria-label="Descartar sugerencia">×</button>
			</div>
			<!-- Tabla pivot. El overlay de espera va en este contenedor relativo
			     (no scrolleable), no dentro del scroll, para que cubra el área visible
			     completa y no se desplace con el scroll horizontal. -->
			<div class="pivot-scroll-area">
				<div v-if="busy" class="pivot-busy-overlay">
					<div class="pivot-spinner"></div>
				</div>
				<div class="pivot-table-scroll" ref="tableScroll" :class="{ 'panels-open': openPanels > 0, 'no-sticky-head': headerScrolls }">
					<table class="pivot-table">
					<thead>
						<tr>
							<th class="pivot-header-corner" :rowspan="showLevelRow ? 4 : 3">
								<span class="region-sort hand" @click="sortByLabel" title="Ordenar alfabéticamente">
									Regiones
									<span v-if="labelSortState === 'asc'" class="sort-arrow">▲</span>
									<span v-else-if="labelSortState === 'desc'" class="sort-arrow">▼</span>
								</span>
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
															 :removable="pivot.Metrics.length > minMetrics"
															 @selection-changed="handleChange"
															 @metric-removed="handleRemove"
															 @panel-open="onPanelOpen" />
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
							<template v-for="(tuple, sIdx) in pivot.MetricTuples.metricTuples">
								<th v-if="levelRowCells[sIdx]"
										:key="'lv-' + sIdx"
										:colspan="levelRowCells[sIdx].colspan"
										:rowspan="levelRowCells[sIdx].rowspan"
										:class="levelRowCells[sIdx].kind === 'level' ? 'pivot-level-header' : (levelRowCells[sIdx].kind === 'placeholder' ? 'pivot-subheader pivot-subheader-empty' : 'pivot-subheader hand')"
										:title="levelRowCells[sIdx].kind === 'cat' ? subHeaderTooltip(tuple) : null"
										@click="levelRowCells[sIdx].kind === 'cat' ? onSubHeaderSort(tuple) : null">
									<template v-if="levelRowCells[sIdx].kind === 'level'">{{ levelRowCells[sIdx].name }}</template>
									<template v-else-if="levelRowCells[sIdx].kind === 'placeholder'">
										<span class="subheader-label subheader-empty">[Ninguna]</span>
										<button class="inline-trigger"
												:ref="'ctrig-' + levelRowCells[sIdx].metric.InstanceId + '-' + levelRowCells[sIdx].versionId"
												@click.stop="openCategoryPanel(levelRowCells[sIdx].metric, levelRowCells[sIdx].versionId, $event)">▾</button>
									</template>
									<template v-else>
										<span class="subheader-label" :class="{ 'subheader-total': tuple.isTotal }">{{ subHeaderText(tuple) }}</span>
										<span v-if="pivot.MetricTuples.sortStateOf(tuple.key) === 'desc'" class="sort-glyph sort-desc">⌄</span>
										<span v-else-if="pivot.MetricTuples.sortStateOf(tuple.key) === 'asc'" class="sort-glyph sort-asc">⌃</span>
										<button v-if="levelRowCells[sIdx].lastOfVersion && metricTriggerInLevelRow(levelRowCells[sIdx].metric)"
												class="inline-trigger"
												:ref="'ctrig-' + levelRowCells[sIdx].metric.InstanceId + '-' + levelRowCells[sIdx].versionId"
												@click.stop="openCategoryPanel(levelRowCells[sIdx].metric, levelRowCells[sIdx].versionId, $event)">▾</button>
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
										:class="{ hand: !cell.tuple.isPlaceholder, 'pivot-subheader-empty': cell.tuple.isPlaceholder }"
										:title="cell.tuple.isPlaceholder ? null : subHeaderTooltip(cell.tuple)"
										@click="cell.tuple.isPlaceholder ? null : onSubHeaderSort(cell.tuple)">
									<span v-if="cell.tuple.isPlaceholder" class="subheader-label subheader-empty">[Ninguna]</span>
									<template v-else>
										<span class="subheader-label" :class="{ 'subheader-total': cell.tuple.isTotal }">{{ subHeaderText(cell.tuple) }}</span>
										<span v-if="pivot.MetricTuples.sortStateOf(cell.tuple.key) === 'desc'" class="sort-glyph sort-desc">⌄</span>
										<span v-else-if="pivot.MetricTuples.sortStateOf(cell.tuple.key) === 'asc'" class="sort-glyph sort-asc">⌃</span>
									</template>
									<button v-if="isLastCellOfVersion(entry, ci) && !metricTriggerInLevelRow(entry.metric)"
											class="inline-trigger"
											:ref="'ctrig-' + entry.metric.InstanceId + '-' + cell.tuple.versionId"
											@click.stop="openCategoryPanel(entry.metric, cell.tuple.versionId, $event)">▾</button>
								</th>
							</template>
						</tr>
						<!-- Filas fijadas: las mismas filas de la grilla, repetidas al pie del
						     encabezado (que es sticky), así quedan arriba aunque se scrollee. -->
						<tr v-for="(row, pinnedIndex) in pinnedRows" :key="'pinned-' + pinnedIndex" class="pivot-row-pinned">
							<td v-for="(cell, cellIndex) in row" :key="'pinned-' + pinnedIndex + '-' + cellIndex" :class="getCellClass(cell)">
								<span v-if="cell.isItem" class="cell-label">
									<button class="row-pin-btn is-pinned" @click.stop="togglePin(cell)"
													:title="'Desfijar ' + cell.Label" :aria-label="'Desfijar ' + cell.Label">
										<i class="fas fa-thumbtack" aria-hidden="true"></i>
									</button>
									<span class="cell-label-text">{{ cell.Label }}</span>
									<button class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--muted row-unpin-btn"
													@click.stop="togglePin(cell)"
													:title="'Desfijar ' + cell.Label" :aria-label="'Desfijar ' + cell.Label">×</button>
								</span>
								<span v-else class="cell-value">
									{{ resolveValue(pivot.MetricTuples.headers[cellIndex - 1], cell) }}
								</span>
							</td>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, rowIndex) in rows"
								:key="'row-' + rowIndex"
								:class="getRowClass(row)">
							<td v-for="(cell, cellIndex) in row"
									:key="'cell-' + rowIndex + '-' + cellIndex"
									:class="getCellClass(cell)">
								<span v-if="cell && cell.isLevelHeader" class="cell-label" :style="labelIndent(cell)">
									<button v-if="cell.collapsible" class="row-chevron" @click.stop="toggleLevelRow(cell)"
													:aria-expanded="ariaExpanded(cell)"
													:aria-label="chevronLabel(cell, cell.Caption)">{{ chevronGlyph(cell) }}</button>
									<span v-else class="row-chevron-spacer"></span>
									<a v-if="hasLevelCaptionAction(cell)" class="cell-label-link" @click.stop="onLevelCaption(cell)"
										 :title="levelCaptionTitle(cell)">{{ cell.Caption }}</a>
									<span v-else class="cell-label-text">{{ cell.Caption }}</span>
									<span v-if="cell.CountText" class="cell-label-count">{{ cell.CountText }}</span>
									<button class="row-menu-btn" @click.stop="openLevelMenu(cell, $event)"
													title="Elegir qué elementos se ven" aria-label="Elegir qué elementos se ven">▾</button>
									<span v-if="!embedded" class="cell-label-actions">
										<button class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--muted row-open-map" @click.stop="openMapForRow(cell)"
														title="Abrir mapa" aria-label="Abrir mapa">
											<i class="fas fa-globe-americas" aria-hidden="true"></i>
										</button>
									</span>
								</span>
								<span v-else-if="cell && cell.isItem" class="cell-label" :style="labelIndent(cell)">
									<button v-if="isItemToggleable(cell)" class="row-chevron" @click.stop="toggleItemRow(cell)"
													:aria-expanded="ariaExpanded(cell)"
													:aria-label="chevronLabel(cell, cell.Label)">{{ chevronGlyph(cell) }}</button>
									<span v-else class="row-chevron-spacer"></span>
									<a v-if="isItemToggleable(cell)" class="cell-label-link" @click.stop="toggleItemRow(cell)">{{ cell.Label }}</a>
									<span v-else class="cell-label-text">{{ cell.Label }}</span>
									<button class="row-pin-btn" :class="{ 'is-pinned': isPinned(cell) }" @click.stop="togglePin(cell)"
													:title="pinTitle(cell)" :aria-label="pinTitle(cell)">
										<i class="fas fa-thumbtack" aria-hidden="true"></i>
									</button>
									<button class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--muted row-remove-btn"
													@click.stop="removeItemRow(cell)"
													:title="'Quitar ' + cell.Label" :aria-label="'Quitar ' + cell.Label">×</button>
									<button class="row-more-btn" @click.stop="openLevelMenu(cell, $event)"
													title="Elegir qué elementos se ven" aria-label="Elegir qué elementos se ven">⋯</button>
									<span v-if="!embedded" class="cell-label-actions">
										<button class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--muted row-open-map" @click.stop="openMapForRow(cell)"
														title="Abrir mapa" aria-label="Abrir mapa">
											<i class="fas fa-globe-americas" aria-hidden="true"></i>
										</button>
									</span>
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
		</div>

		<div v-else class="pivot-empty">
			<p></p>
		</div>

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
				<div class="ifp-multi-toggle ifp-multi-foot" @click.stop="toggleVersionMulti">
					<input type="checkbox" tabindex="-1" :checked="versionMulti" @click.prevent />
					<span>Selección múltiple</span>
				</div>
			</template>
			<template v-else-if="floatPanel.kind === 'category'">
				<category-picker :metric="floatPanel.metric" :version-id="floatPanel.versionId" :tick="dataTick"
					@change="onFloatCategoryChange" />
			</template>
			<template v-else-if="floatPanel.kind === 'level'">
				<level-menu :level="floatPanel.level" :tick="dataTick"
					@change="onLevelMenuChange" @change-root="onChangeRoot" />
			</template>
		</div>

	</div>
</template>

<script>
	import MetricHeader from '@/table/components/MetricHeader';
	import arr from '@/common/framework/arr';
	import TableSideToolbar from '@/table/components/TableSideToolbar.vue';
	import LevelMenu from '@/table/components/pivot/LevelMenu.vue';
	import ActivePivot from '@/table/classes/ActivePivot.js';
	import { displayCell } from '@/table/classes/pivotValue.js';
	import CsvWriter from '@/table/writers/CsvWriter.js';
	import XlsxWriter from '@/table/writers/XlsxWriter.js';
	import ColumnDragController, { initialDragState } from '@/table/components/pivot/ColumnDragController.js';
	import CategoryPicker from '@/table/components/CategoryPicker.vue';
	import MapUrlBuilder from '@/table/classes/MapUrlBuilder.js';

	export default {
		name: 'PivotTable',
		components: {
			MetricHeader,
			TableSideToolbar,
			LevelMenu,
			CategoryPicker
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
			// Dentro del visor (popup "Ver como tabla"): sin barra lateral ni "Abrir mapa".
			embedded: {
				type: Boolean,
				default: false
			},
			// Cantidad de indicadores que no se pueden quitar (el popup deja al menos uno).
			minMetrics: {
				type: Number,
				default: 0
			}
		},

		data() {
			return {
				loading: false,
				exloading: false,
				error: null,
				// Panel flotante único de versión/categorías (un solo lugar de estado,
				// fuera del thead). metric: el indicador en edición; kind: 'version' o
				// 'category'; style: posición calculada respecto del triángulo.
				floatPanel: { open: false, kind: null, metric: null, versionId: null, level: null, style: {} },
				// Modo del combo de años: por defecto single-select (elegir un año lo
				// reemplaza y cierra el panel); el check lo vuelve multiselect.
				versionMulti: false,
				// Indicador de "preparando datos" mientras trae o recalcula.
				busy: false,
				// Cantidad de dropdowns de header abiertos (libera el overflow del scroll).
				openPanels: 0,
				// Estado del reordenamiento de columnas por arrastre (lo opera el
				// ColumnDragController; lo lee el template para las clases y :draggable).
				dragState: initialDragState(),
				dataTick: 0,         // fuerza recomputar lo que depende de metricTuples
				                     // (array de clase, que Vue no observa) tras refrescar
				// Cuando el alto visible de la tabla es apenas mayor (o menor) que el del
				// encabezado, mantenerlo fijo dejaría sin espacio para ver los datos: en
				// ese caso el encabezado deja de ser sticky y scrollea con el contenido.
				headerScrolls: false,
				// Filas fijadas arriba (estado de la vista): { level, fid } de cada una.
				pinned: []
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

			// Decide si el encabezado debe scrollear con el contenido (ver headerScrolls):
			// se recalcula al cambiar el tamaño del área de tabla (p. ej. al mover el
			// splitter que agranda los gráficos de abajo) y tras refrescar los datos.
			this._measureHeader = function () { loc._updateHeaderScrolls(); };
			this._roHead = new ResizeObserver(function () {
				if (loc._roHeadPending) return;
				loc._roHeadPending = true;
				window.requestAnimationFrame(function () {
					loc._roHeadPending = false;
					loc._updateHeaderScrolls();
				});
			});
			if (this.$refs.tableScroll) this._roHead.observe(this.$refs.tableScroll);
			this.$nextTick(this._measureHeader);
		},
		beforeDestroy() {
			if (this._floatAway) document.removeEventListener('click', this._floatAway);
			if (this._floatScroll) window.removeEventListener('scroll', this._floatScroll, true);
			if (this._roHead) this._roHead.disconnect();
		},

		computed: {
			rows() {
				this.dataTick;
				return this.pivot ? this.pivot.Rows : [];
			},
			// Las filas fijadas que siguen presentes en la grilla, en el orden en que se fijaron.
			pinnedRows() {
				this.dataTick;
				var out = [];
				var rows = this.pivot ? this.pivot.Rows : [];
				for (var p = 0; p < this.pinned.length; p++) {
					for (var r = 0; r < rows.length; r++) {
						var head = rows[r][0];
						if (head.isItem && head.level === this.pinned[p].level && head.FID === this.pinned[p].fid) {
							out.push(rows[r]);
						}
					}
				}
				return out;
			},
			suggestion() {
				this.dataTick;
				return this.pivot ? this.pivot.RowTree.suggestion : null;
			},
			suggestionCaption() {
				var chain = this.suggestion.chain;
				return chain[chain.length - 1].item.Caption;
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
				var tuples = this.pivot ? this.pivot.MetricTuples.metricTuples : [];
				var cells = new Array(tuples.length).fill(null);
				var i = 0;
				while (i < tuples.length) {
					var sp = tuples[i];
					if (sp && sp.isPlaceholder) {
						cells[i] = { kind: 'placeholder', colspan: 1, rowspan: 2, name: null, metric: sp.metric, versionId: sp.versionId };
						i++;
					} else if (this.tupleHasLevelCell(sp)) {
						var span = 1;
						var j = i + 1;
						while (j < tuples.length && this.tupleHasLevelCell(tuples[j])
								&& tuples[j].metric === sp.metric && tuples[j].versionId === sp.versionId && tuples[j].levelId === sp.levelId) {
							span++; j++;
						}
						cells[i] = { kind: 'level', colspan: span, rowspan: 1, name: sp.levelName, metric: sp.metric, versionId: sp.versionId };
						i = j;
					} else {
						cells[i] = { kind: 'cat', colspan: 1, rowspan: 2, name: null, metric: sp.metric, versionId: sp.versionId };
						i++;
					}
				}
				// Marca la última celda de cada indicador y de cada versión, para colgar
				// ahí el control de categorías inline (por metric+versión).
				for (var k = 0; k < cells.length; k++) {
					if (!cells[k]) continue;
					var nextWithCell = null;
					for (var n = k + 1; n < cells.length; n++) {
						if (cells[n]) { nextWithCell = cells[n]; break; }
					}
					cells[k].lastOfMetric = !nextWithCell || nextWithCell.metric !== cells[k].metric;
					cells[k].lastOfVersion = !nextWithCell || nextWithCell.metric !== cells[k].metric ||
						nextWithCell.versionId !== cells[k].versionId;
				}
				return cells;
			},
			// Una tupla aporta la fila de nivel cuando es de un dataset tipo "D"
			// (datos por unidad geográfica) y representa una categoría (no el total).
			// Los tipos "L" (puntos) y "S" (shape), y los totales, no la necesitan.
			// Con pivot.AlwaysShowLevelRow (default true) se muestra siempre que haya
			// al menos un indicador de tipo "D", aunque ninguno tenga categoría abierta
			// (ver tupleHasLevelCell, el criterio único).
			showLevelRow() {
				this.dataTick;
				var tuples = this.pivot ? this.pivot.MetricTuples.metricTuples : null;
				if (!tuples) return false;
				for (var i = 0; i < tuples.length; i++) {
					if (this.tupleHasLevelCell(tuples[i])) return true;
				}
				return false;
			},
			// Agrupa las ColumnTuples por indicador (consecutivas con mismo metricId).
			// Devuelve [{ metric, tuples: [...], colSpan }]. El metric viene del primer
			// tuple del grupo (todas las del mismo grupo comparten metric).
			headerGroups() {
				this.dataTick;
				if (!this.pivot || !this.pivot.MetricTuples.metricTuples) return [];
				var tuples = this.pivot.MetricTuples.metricTuples;
				var groups = [];
				var current = null;
				for (var i = 0; i < tuples.length; i++) {
					var sp = tuples[i];
					// Defensa ante estados transitorios: ignora tuples sin metric resuelto.
					if (!sp || !sp.metric || !sp.metric.properties || !sp.metric.properties.Metric) continue;
					if (!current || current.metric !== sp.metric) {
						current = { metric: sp.metric, tuples: [sp], colSpan: 1, versionGroups: null };
						groups.push(current);
					} else {
						current.tuples.push(sp);
						current.colSpan++;
					}
				}
				// Subdivide cada grupo de indicador por versión (para la fila de años
				// con colspan). Tuples consecutivas con el mismo versionId forman un
				// sub-grupo.
				groups.forEach(function (g) {
					var vgs = [];
					var cur = null;
					for (var k = 0; k < g.tuples.length; k++) {
						var s = g.tuples[k];
						if (!cur || cur.versionId !== s.versionId) {
							cur = { versionId: s.versionId, versionName: s.versionName, tuples: [s], colSpan: 1 };
							vgs.push(cur);
						} else {
							cur.tuples.push(s);
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
			// Estructura de la fila de categorías por indicador: las celdas que esta
			// fila renderiza (las que no hicieron rowspan en la fila de nivel). El
			// control de categorías cuelga de la última celda de cada indicador. Una
			// tupla placeholder (indicador sin columnas visibles) muestra "[Ninguna]".
			categoryRow() {
				this.dataTick;
				if (!this.pivot) return [];
				var tuples = this.pivot.MetricTuples.metricTuples;
				var showLevel = this.showLevelRow;
				var byMetric = [];
				var indexByMetric = {};
				for (var i = 0; i < tuples.length; i++) {
					var sp = tuples[i];
					if (!sp || !sp.metric) continue;
					// Con fila de nivel, el placeholder ya ocupa ambas filas (rowspan 2)
					// allí; sin fila de nivel, va acá. Las celdas que hicieron rowspan en
					// la fila de nivel no se repiten.
					if (showLevel) {
						if (sp.isPlaceholder) continue;
						if (!this.tupleHasLevelCell(sp)) continue;
					}
					var id = sp.metric.InstanceId;
					if (indexByMetric[id] == null) {
						indexByMetric[id] = byMetric.length;
						byMetric.push({ metric: sp.metric, cells: [] });
					}
					byMetric[indexByMetric[id]].cells.push({ tuple: sp });
				}
				return byMetric;
			},
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


			// ── Columnas (indicadores) ───────────────────────────────────────────────
			onAddMetrics(metricIds) {
				var loc = this;
				var tasks = [];
				for (var i = 0; i < metricIds.length; i++) {
					tasks.push(loc.pivot.AddMetricById(metricIds[i]));
				}
				Promise.all(tasks).then(function () { loc.applyAndNotify(true); });
			},
			onRemoveMetrics(items) {
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
				this.$emit('data-refreshed', this.pivot, true);
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
								// El alto del encabezado pudo cambiar (más/menos columnas).
								loc.$nextTick(function () { loc._updateHeaderScrolls(); });
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

			// El encabezado deja de ser sticky cuando el alto visible de la tabla es
			// menor que el alto del propio encabezado por 1.2: con tan poco espacio,
			// mantenerlo fijo taparía casi todos los datos, así que conviene que
			// scrollee junto con el contenido y se pueda ver el cuerpo desplazándolo.
			_updateHeaderScrolls() {
				var scroll = this.$refs.tableScroll;
				if (!scroll) return;
				var thead = scroll.querySelector('thead');
				if (!thead) { this.headerScrolls = false; return; }
				var visible = scroll.clientHeight;
				var headH = thead.offsetHeight;
				this.headerScrolls = headH > 0 && visible < headH * 1.2;
			},
			// Abre el visor de mapa en otra pestaña para la fila dada: un elemento se
			// recorta en sí mismo; un nivel se agrega como capa, recortado en el
			// elemento del que cuelga.
			openMapForRow(cell) {
				var target;
				if (cell.isLevelHeader) {
					var parentItem = cell.level.parentItem;
					var parentFid = null;
					if (parentItem) {
						parentFid = parentItem.FID;
					}
					target = { kind: 'level', boundaryId: cell.boundaryId, parentFid: parentFid };
				} else {
					target = { kind: 'item', regionId: cell.FID };
				}
				var url = new MapUrlBuilder(this.pivot).build(target);
				window.open(url, '_blank');
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
			openCategoryPanel(metric, versionId, ev) {
				if (this.floatPanel.open && this.floatPanel.kind === 'category' &&
						this.floatPanel.metric === metric && this.floatPanel.versionId === versionId) {
					this.closeFloatPanel();
					return;
				}
				this.floatPanel = { open: true, kind: 'category', metric: metric, versionId: versionId, style: {} };
				this._positionFloatPanel(ev.currentTarget);
			},
			closeFloatPanel() {
				this.floatPanel = { open: false, kind: null, metric: null, versionId: null, level: null, style: {} };
			},
			// Posiciona el panel (position:fixed) debajo del triángulo, ajustando si se
			// sale del viewport. Se recalcula en el nextTick (cuando el panel ya tiene
			// tamaño) para poder corregir hacia arriba/izquierda.
			_positionFloatPanel(triggerEl, scrollable) {
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
					var style = { position: 'fixed', top: top + 'px', left: left + 'px', zIndex: 3000 };
					if (scrollable !== false) {
						style.maxHeight = (vh - top - 12) + 'px';
						style.overflowY = 'auto';
					}
					loc.floatPanel.style = style;
				});
			},
			// Alterna el modo de selección de versiones. Al pasar de múltiple a simple
			// con más de un censo activo, se conserva solo el primero y se descartan los
			// demás (no tendría sentido un "single" pintando dos).
			toggleVersionMulti() {
				var next = !this.versionMulti;
				if (!next) {
					var m = this.floatPanel.metric;
					if (m && m.Selections.length > 1) {
						var firstId = m.Selections[0].versionId();
						m.SelectVersions([firstId]);
						this.handleChange({ metric: m, changeType: 'Version' });
					}
				}
				this.versionMulti = next;
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
			// El CategoryPicker ya mutó las Selections del metric; acá solo se refresca
			// la pivot para que la tabla refleje el cambio.
			// El CategoryPicker ya mutó las Selections del metric; se refresca la pivot
			// sin el overlay de "preparando datos": ese overlay, al montarse sobre la
			// tabla, cerraba el panel flotante que debe quedar abierto para seguir
			// marcando categorías. El panel vive en la raíz y persiste al re-render.
			onFloatCategoryChange(metric) {
				var loc = this;
				var done = this.pivot.Render();
				var emit = function () { loc.dataTick++; loc.$emit('data-refreshed', loc.pivot); };
				if (done && typeof done.then === 'function') done.then(emit);
				else emit();
			},
			// Sort por una columna concreta (sub-header). Recibe la ColumnTuple.
			onSubHeaderSort(tuple) {
				if (!tuple || !tuple.key || tuple.isEmpty) return;
				var loc = this;
				this.pivot.MetricTuples.toggleSort(tuple.key);
				this.runBusy(function () { loc.pivot.RefreshData(); }).then(function () {
					loc.$emit('data-refreshed', loc.pivot);
				});
			},
			// Texto del sub-header: categoría/Total, o nombre de variable cuando no hay categorías.
			tupleNeedsLevel(tuple) {
				return !!tuple && !tuple.isEmpty && !tuple.isTotal && tuple.datasetType === 'D' && tuple.labelId != null;
			},
			// Criterio único: ¿esta tupla ocupa la fila de nivel (kind:'level', rowspan
			// 1, con el nombre del nivel) en vez de fusionar la fila de categoría
			// (kind:'cat', rowspan 2, sin fila de nivel propia)? Con
			// pivot.AlwaysShowLevelRow (default true), cualquier tupla de dataset "D"
			// la ocupa, Total incluido; si no, solo cuando representa una categoría
			// concreta (tupleNeedsLevel, el criterio previo). Usado también por
			// levelRowCells/categoryRow para que ambas filas queden en sincronía.
			tupleHasLevelCell(tuple) {
				if (!tuple || tuple.isEmpty) return false;
				if (this.pivot && this.pivot.AlwaysShowLevelRow) return tuple.datasetType === 'D';
				return this.tupleNeedsLevel(tuple);
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
			// visible—, no de la última categoría de la fila de abajo. Solo aplica si la
			// fila de nivel se renderiza; si no, el triángulo va siempre en la fila de
			// categorías (la única visible), de lo contrario se perdería en ambas.
			// ¿La celda ci es la última de su versión dentro del indicador? Las celdas
			// de un indicador vienen agrupadas por versión; el control de categorías
			// cuelga de la última de cada versión, de modo que el corte de control sea
			// metric+versión (un triángulo por año, con un combo más acotado).
			isLastCellOfVersion(entry, ci) {
				var cells = entry.cells;
				if (ci >= cells.length) return false;
				if (ci === cells.length - 1) return true;
				return cells[ci].tuple.versionId !== cells[ci + 1].tuple.versionId;
			},
			metricTriggerInLevelRow(metric) {
				if (!this.showLevelRow) return false;
				var cells = this.levelRowCells;
				for (var i = 0; i < cells.length; i++) {
					var c = cells[i];
					if (c && c.metric && c.metric.InstanceId === metric.InstanceId && c.lastOfMetric) {
						return c.kind === 'cat' || c.kind === 'placeholder';
					}
				}
				return false;
			},
			subHeaderText(tuple) {
				if (tuple.isEmpty) return '—';
				if (tuple.isTotal) return 'Total';
				if (tuple.labelName) return tuple.labelName;
				return tuple.variableName || '';
			},
			subHeaderTooltip(tuple) {
				var parts = [tuple.metricName];
				if (tuple.variableName) parts.push(tuple.variableName);
				if (tuple.labelName) parts.push(tuple.labelName);
				if (tuple.versionName) parts.push('Edición ' + tuple.versionName);
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
			resolveValue(tuple, cell) {
				if (!tuple || !tuple.metric || cell === null || cell === undefined) return '';
				return displayCell(tuple.metric, tuple.variable, cell);
			},
			getRowClass(row) {
				var head = row[0];
				if (head.isLevelHeader) {
					return 'pivot-row-level-header';
				}
				if (head.open) {
					return 'pivot-row-item-header pivot-row-item-open';
				}
				return 'pivot-row-item-header';
			},
			labelIndent(cell) {
				return { paddingLeft: (cell.depth * 14) + 'px' };
			},
			chevronGlyph(cell) {
				if (cell.open) return '▾';
				return '▸';
			},
			ariaExpanded(cell) {
				if (cell.open) return 'true';
				return 'false';
			},
			chevronLabel(cell, caption) {
				if (cell.open) return 'Replegar ' + caption;
				return 'Desplegar ' + caption;
			},
			isItemToggleable(cell) {
				return cell.expandable && !cell.forced;
			},
			// Un encabezado colapsable se despliega con su nombre; uno que no lo es (la
			// raíz o un tipo de hijo único) vuelve a mostrar todos si estaba restringido.
			hasLevelCaptionAction(cell) {
				return cell.collapsible || cell.restricted;
			},
			levelCaptionTitle(cell) {
				if (cell.collapsible) return 'Desplegar o replegar';
				return 'Volver a ver todos los elementos';
			},
			onLevelCaption(cell) {
				if (cell.collapsible) {
					this.toggleLevelRow(cell);
				} else {
					cell.level.ShowAll();
					this.applyAndNotify(true);
				}
			},
			toggleLevelRow(cell) {
				cell.level.ToggleOpen();
				this.applyAndNotify(true);
			},
			toggleItemRow(cell) {
				cell.level.ToggleItem(cell.item);
				this.applyAndNotify(true);
			},
			removeItemRow(cell) {
				cell.level.RemoveItem(cell.item);
				this.applyAndNotify(true);
			},
			openLevelMenu(cell, ev) {
				if (this.floatPanel.open && this.floatPanel.kind === 'level' && this.floatPanel.level === cell.level) {
					this.closeFloatPanel();
					return;
				}
				this.floatPanel = { open: true, kind: 'level', metric: null, versionId: null, level: cell.level, style: {} };
				this._positionFloatPanel(ev.currentTarget, false);
			},
			// Las casillas del menú ya cambiaron el nivel: se rehace la tabla sin el
			// overlay de espera, que cerraría el menú (debe quedar abierto para seguir
			// marcando).
			onLevelMenuChange() {
				var loc = this;
				this.pivot.Render().then(function () {
					loc.dataTick++;
					loc.$emit('data-refreshed', loc.pivot, true);
				});
			},
			pinIndex(cell) {
				for (var i = 0; i < this.pinned.length; i++) {
					if (this.pinned[i].level === cell.level && this.pinned[i].fid === cell.FID) return i;
				}
				return -1;
			},
			isPinned(cell) {
				return this.pinIndex(cell) !== -1;
			},
			pinTitle(cell) {
				if (this.isPinned(cell)) return 'Desfijar ' + cell.Label;
				return 'Fijar ' + cell.Label + ' arriba';
			},
			togglePin(cell) {
				var index = this.pinIndex(cell);
				if (index === -1) {
					this.pinned.push({ level: cell.level, fid: cell.FID });
				} else {
					this.pinned.splice(index, 1);
				}
			},
			onChangeRoot(boundaryId) {
				this.pivot.RowTree.SetRoot(boundaryId);
				this.closeFloatPanel();
				this.applyAndNotify(true);
			},
			// Regiones elegidas en Filtrar: sin selección múltiple, la primera reemplaza
			// la selección de filas; el resto (y todas, con selección múltiple) se suman.
			onSelectPlaces(chains, additive) {
				for (var i = 0; i < chains.length; i++) {
					if (additive || i > 0) {
						this.pivot.RowTree.AddSelection(chains[i]);
					} else {
						this.pivot.RowTree.ReplaceSelection(chains[i]);
					}
				}
				this.applyAndNotify(true);
			},
			onRemovePlaces(fids) {
				for (var i = 0; i < fids.length; i++) {
					this.pivot.RowTree.RemoveSelectedItem(fids[i]);
				}
				this.applyAndNotify(true);
			},
			acceptSuggestion() {
				this.pivot.RowTree.AcceptSuggestion();
				this.applyAndNotify(true);
			},
			dismissSuggestion() {
				this.pivot.RowTree.DismissSuggestion();
				this.dataTick++;
				this.$emit('data-refreshed', this.pivot);
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

	.pivot-table-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		padding: 12px 12px 12px 58px;
		box-sizing: border-box;
	}
	.pivot-table-wrapper.is-embedded {
		padding: 0;
	}

	.pivot-suggestion {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
		padding: 6px 10px;
		background: #fff;
		border: 1px dashed #90a4ae;
		border-radius: 6px;
		font-size: 13px;
		color: #455a64;
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
		display: block;
		cursor: pointer;
	}
		.region-sort:hover {
			text-decoration: underline;
		}


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

		/* Con poco alto visible, el encabezado scrollea con el contenido (ver
		   headerScrolls): así el cuerpo de datos se puede ver desplazándose. */
		.pivot-table-scroll.no-sticky-head .pivot-table thead {
			position: static;
		}

		.pivot-table th {
			padding: 12px 15px;
			text-align: left;
			font-weight: 100;
		}

	.pivot-header-corner {
		background-color: #1565c0;
		text-align: left;
		vertical-align: top;
		width: 300px;
		max-width: 300px;
		position: sticky;
		left: 0;
		z-index: 12;
	}

	.pivot-header-metric {
		text-align: right;
		position: relative;
		padding-bottom: 0px !important;
	}

	.metric-drag-handle {
		visibility: hidden;
		position: absolute;
		top: 0;
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
		color: #fff;
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
		background-color: #1976d2;
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
	.version-header-text { vertical-align: middle; }
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
	.inline-float-panel .ifp-group-header:hover { background-color: #e9f2fd; }
	.inline-float-panel .ifp-group-header { font-weight: 600; border-top: 1px solid #eceff1; }
	.inline-float-panel .ifp-group:first-child .ifp-group-header { border-top: none; }
	/* Las categorías cuelgan de su grupo de versión: se indentan para reflejarlo. */
	.inline-float-panel .ifp-group .ifp-option { padding-left: 28px; }
	.inline-float-panel .ifp-total { font-style: italic; color: #607d8b; }
	.inline-float-panel .ifp-locked { opacity: 0.5; cursor: default; }
	/* En selección simple no hay checkbox: el activo se marca con fondo. */
	.inline-float-panel .ifp-selected { background-color: #e9f2fd; font-weight: 600; }
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

	.pivot-row-level-header {
		background-color: #e9f2fd;
		font-weight: 600;
	}
		.pivot-row-level-header .pivot-cell-header {
			background-color: #e9f2fd;
		}
		.pivot-row-level-header:hover,
		.pivot-row-level-header:hover .pivot-cell-header {
			background-color: #bbdefb;
		}

	.pivot-row-item-header {
		background-color: #fafafa;
	}
		.pivot-row-item-header .pivot-cell-header {
			background-color: #fafafa;
		}
	.pivot-row-item-open {
		font-weight: 600;
	}

	.row-chevron,
	.row-chevron-spacer {
		flex: 0 0 auto;
		width: 16px;
		margin-right: 2px;
	}
	.row-chevron {
		border: 0;
		background: none;
		padding: 0;
		color: #78909c;
		font-size: 11px;
		cursor: pointer;
	}
		.row-chevron:hover {
			color: #263238;
		}

	.cell-label-link {
		flex: 0 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #1565c0;
		cursor: pointer;
	}
		.cell-label-link:hover {
			text-decoration: underline;
		}
	.cell-label-count {
		flex: 0 0 auto;
		margin-left: 4px;
		font-weight: 400;
		color: #78909c;
	}

	.row-pin-btn {
		flex: 0 0 auto;
		border: 0;
		background: none;
		margin-left: 4px;
		padding: 0 3px;
		border-radius: 3px;
		color: #90a4ae;
		font-size: 10px;
		cursor: pointer;
		transform: rotate(45deg);
	}
		.row-pin-btn:hover {
			color: #1565c0;
		}
		.row-pin-btn.is-pinned {
			color: #1565c0;
			transform: none;
		}
	.pivot-table thead tr.pivot-row-pinned td {
		background-color: #fffde7;
		color: #37474f;
		font-weight: 600;
		border-bottom: 1px solid #e0e0e0;
	}
		.pivot-table thead tr.pivot-row-pinned td.pivot-cell-header {
			background-color: #fffde7;
		}
	.row-unpin-btn {
		margin-left: auto;
	}

	.row-menu-btn,
	.row-more-btn {
		flex: 0 0 auto;
		border: 0;
		background: none;
		margin-left: 2px;
		padding: 0 4px;
		border-radius: 3px;
		color: #78909c;
		font-size: 11px;
		cursor: pointer;
	}
		.row-menu-btn:hover,
		.row-more-btn:hover {
			background: rgba(0, 0, 0, 0.08);
			color: #263238;
		}

	.pivot-cell-header { position: relative; }
	.pivot-table td {
		padding: 2px 8px;
	}

	.pivot-cell-header {
		font-weight: 500;
		color: #424242;
		text-align: left;
		width: 300px;
		max-width: 300px;
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

	/* El texto trunca solo (min-width:0 es lo que permite que un flex-item se
	   angoste por debajo de su ancho natural, en vez de desbordar y tapar los
	   controles). Los controles viven aparte, en .cell-label-actions, con un único
	   margin-left:auto que los empuja como bloque al borde derecho — con DOS
	   elementos usando margin-left:auto por separado, el espacio libre se reparte
	   entre ambos y el primero queda "centrado" en vez de pegado al segundo; de ahí
	   que las acciones vayan agrupadas en un solo contenedor con un solo auto. */
	.cell-label {
		display: flex;
		align-items: center;
		min-width: 0;
		overflow: hidden;
	}
	.cell-label-text {
		flex: 0 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cell-label-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
		margin-left: auto;
	}

	/* "Quitar" y "Abrir mapa" quedan ocultos hasta pasar por la fila, solo en
	   dispositivos con hover real. En touch no se puede "pasar el mouse": la "×" se
	   reemplaza por "⋯", que abre el menú del nivel para elegir qué se ve. */
	.row-more-btn { display: none; }
	@media (hover: hover) and (pointer: fine) {
		.row-remove-btn, .row-open-map, .row-pin-btn:not(.is-pinned) { opacity: 0; }
		tr:hover .row-remove-btn, tr:hover .row-open-map, tr:hover .row-pin-btn { opacity: 1; }
	}
	@media (hover: none) {
		.row-remove-btn { display: none; }
		.row-more-btn { display: inline-block; }
	}

	.cell-value {
		display: block;
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

</style>
