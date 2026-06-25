<template>
	<div class="dashboard">
		<div v-if="booting" class="dash-booting">
			<div class="boot-spinner"></div>
		</div>

		<div class="dash-area" ref="area" v-show="!booting">
			<!-- Columna izquierda: tabla (arriba) y distribución (abajo) -->
			<div class="dash-col" :style="leftColStyle">
				<div class="dash-pane" :style="leftTopStyle">
					<pivot-table-widget
						ref="table"
						:pivot="pivot"
						:active-analyses="activeAnalyses"
						:initial-collapse="rowCollapse"
						@toggle-analysis="onToggleAnalysis"
						@data-refreshed="onDataRefreshed"
						@collapse-changed="onCollapseChanged"
						@error="onWidgetError" />
				</div>

				<div v-if="showDistribution"
						 class="splitter splitter-h"
						 @mousedown="startDrag('left', $event)"
						 title="Arrastrar para redimensionar"></div>

				<div v-if="showDistribution" class="dash-pane" :style="leftBottomStyle">
					<distribution-widget
						ref="distribution"
						:dataset="dataset"
						:pivot="pivot"
						:excluded-groups="collapsedGroups"
						:config="configFor('distribution')"
						@config-changed="onConfigChanged('distribution', $event)"
						@close="hideAnalysis('distribution')"
						@error="onWidgetError" />
				</div>
			</div>

			<!-- Splitter vertical entre columnas -->
			<div v-if="hasRightColumn"
					 class="splitter splitter-v"
					 @mousedown="startDrag('col', $event)"
					 title="Arrastrar para redimensionar"></div>

			<!-- Columna derecha: resumen (arriba) y relaciones (abajo) -->
			<div v-if="hasRightColumn" class="dash-col" :style="rightColStyle">
				<div v-if="showSummary" class="dash-pane" :style="rightTopStyle">
					<summary-widget
						ref="summary"
						:dataset="dataset"
						:config="configFor('summary')"
						@config-changed="onConfigChanged('summary', $event)"
						@close="hideAnalysis('summary')"
						@error="onWidgetError" />
				</div>

				<div v-if="showSummary && showRelations"
						 class="splitter splitter-h"
						 @mousedown="startDrag('right', $event)"
						 title="Arrastrar para redimensionar"></div>

				<div v-if="showRelations" class="dash-pane" :style="rightBottomStyle">
					<relations-widget
						ref="relations"
						:dataset="dataset"
						:config="configFor('relations')"
						@config-changed="onConfigChanged('relations', $event)"
						@close="hideAnalysis('relations')"
						@error="onWidgetError" />
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import PivotTableWidget from '@/table/widgets/pivot/PivotTableWidget.vue';
import DistributionWidget from '@/table/widgets/distributions/DistributionWidget.vue';
import SummaryWidget from '@/table/widgets/summary/SummaryWidget.vue';
import RelationsWidget from '@/table/widgets/relations/RelationsWidget.vue';

import ActivePivot from '@/table/classes/ActivePivot.js';
import ActiveRoute from '@/table/classes/ActiveRoute.js';

// Extrae los parámetros de la query del hash (#/view?c=...&r=...) como objeto
// plano, equivalente a lo que proveía this.$route.query con Vue Router.
function _parseHashQuery(hash) {
	if (!hash) return null;
	var qi = hash.indexOf('?');
	if (qi < 0) return null;
	var out = {};
	var pairs = hash.slice(qi + 1).split('&');
	for (var i = 0; i < pairs.length; i++) {
		var eq = pairs[i].indexOf('=');
		if (eq < 0) continue;
		out[pairs[i].slice(0, eq)] = decodeURIComponent(pairs[i].slice(eq + 1));
	}
	return out;
}

var MIN = 0.15;   // proporción mínima de cualquier panel
var MAX = 0.85;

// Los tres análisis con panel propio (la distribución vive abajo a la izquierda;
// resumen y relaciones, en la columna derecha).
var ANALYSES = ['summary', 'distribution', 'relations'];

export default {
	name: 'Dashboard',
	components: { PivotTableWidget, DistributionWidget, SummaryWidget, RelationsWidget },
	props: {
		work: { type: Object, default: null }
	},
	data() {
		return {
			pivot: new ActivePivot(),   // dueño único de la pivot del tablero
			booting: true,
			showSummary: false,
			showDistribution: false,
			showRelations: false,
			analysisConfig: { summary: {}, distribution: {}, relations: {} },
			rowCollapse: '',   // estado compacto de colapso de cortes de control (pivot)
			collapsedGroups: [],   // nombres de grupos colapsados (para excluir en distribución)
			colSplit: 0.5,
			leftSplit: 0.5,
			rightSplit: 0.5,
			drag: null
		};
	},
	computed: {
		// Cambia de identidad en cada RefreshData, lo que dispara la reactividad de
		// los widgets que lo consumen.
		dataset() {
			return this.pivot ? this.pivot.Dataset : null;
		},
		activeAnalyses() {
			return {
				summary: this.showSummary,
				distribution: this.showDistribution,
				relations: this.showRelations
			};
		},
		hasRightColumn() {
			return this.showSummary || this.showRelations;
		},
		leftColStyle() {
			return { flex: '1 1 0%', minWidth: '0' };
		},
		rightColStyle() {
			if (!this.hasRightColumn) return { display: 'none' };
			return { flex: '0 0 ' + ((1 - this.colSplit) * 100) + '%', maxWidth: '650px', minWidth: '0' };
		},
		leftTopStyle() {
			if (!this.showDistribution) return { flex: '1 1 100%' };
			return { flex: '0 0 ' + (this.leftSplit * 100) + '%' };
		},
		leftBottomStyle() {
			return { flex: '1 1 0%' };
		},
		rightTopStyle() {
			if (!this.showRelations) return { flex: '1 1 100%' };
			return { flex: '0 0 ' + (this.rightSplit * 100) + '%' };
		},
		rightBottomStyle() {
			if (!this.showSummary) return { flex: '1 1 100%' };
			return { flex: '1 1 0%' };
		}
	},
	mounted() {
		this.whenCatalogReady(this.bootstrap);
	},
	beforeDestroy() {
		this.endDrag();
	},
	methods: {
		configFor(kind) {
			return this.analysisConfig[kind] || {};
		},
		isVisible(kind) {
			if (kind === 'summary') return this.showSummary;
			if (kind === 'distribution') return this.showDistribution;
			if (kind === 'relations') return this.showRelations;
			return false;
		},
		setVisible(kind, value) {
			if (kind === 'summary') this.showSummary = value;
			else if (kind === 'distribution') this.showDistribution = value;
			else if (kind === 'relations') this.showRelations = value;
		},
		onToggleAnalysis(kind) {
			this.setVisible(kind, !this.isVisible(kind));
			this.syncRoute();
		},
		hideAnalysis(kind) {
			this.setVisible(kind, false);
			this.syncRoute();
		},
		onConfigChanged(kind, config) {
			this.analysisConfig[kind] = Object.assign({}, this.analysisConfig[kind], config);
			this.syncRoute();
		},
		onDataRefreshed() {
			this.syncRoute();
		},
		onCollapseChanged(payload) {
			this.rowCollapse = (payload && payload.encoded) || '';
			this.collapsedGroups = (payload && payload.keys) || [];
			this.syncRoute();
		},
		// Agrega un indicador a la pivot del tablero. Lo invoca App.vue cuando el
		// popup de la barra superior emite su intención; la mutación vive acá
		// porque el Dashboard es el dueño de la pivot.
		addMetric(metricId) {
			var loc = this;
			return Promise.resolve(this.pivot.AddMetricById(metricId)).then(function () {
				return loc.pivot.RefreshData();
			}).then(function () {
				loc.syncRoute();
			});
		},
		onWidgetError(err) {
			console.error('Widget error:', err);
		},

		// ── Splitters ────────────────────────────────────────────────────────
		startDrag(which, ev) {
			ev.preventDefault();
			var rect = this.$refs.area.getBoundingClientRect();
			this.drag = { which: which, rect: rect };
			document.addEventListener('mousemove', this.onDrag);
			document.addEventListener('mouseup', this.endDrag);
			document.body.style.userSelect = 'none';
			document.body.style.cursor = (which === 'col') ? 'col-resize' : 'row-resize';
		},
		onDrag(ev) {
			if (!this.drag) return;
			var r = this.drag.rect;
			if (this.drag.which === 'col') {
				this.colSplit = this.clampSplit((ev.clientX - r.left) / r.width);
			} else if (this.drag.which === 'left') {
				this.leftSplit = this.clampSplit((ev.clientY - r.top) / r.height);
			} else if (this.drag.which === 'right') {
				this.rightSplit = this.clampSplit((ev.clientY - r.top) / r.height);
			}
		},
		clampSplit(p) {
			return Math.max(MIN, Math.min(MAX, p));
		},
		endDrag() {
			if (!this.drag) return;
			this.drag = null;
			document.removeEventListener('mousemove', this.onDrag);
			document.removeEventListener('mouseup', this.endDrag);
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
			this.syncRoute();
		},

		// ── Catálogo / arranque ──────────────────────────────────────────────
		whenCatalogReady(cb) {
			var ready = function () {
				return window.Context && Array.isArray(window.Context.Boundaries) &&
					window.Context.Boundaries.length > 0 &&
					Array.isArray(window.Context.Metrics) && window.Context.Metrics.length > 0;
			};
			if (ready()) { cb(); return; }
			if (window.Messages && window.Messages.$once) {
				window.Messages.$once('serverLoaded', function () {
					var tries = 0;
					var timer = setInterval(function () {
						if (ready() || tries++ > 100) { clearInterval(timer); cb(); }
					}, 50);
				});
				return;
			}
			var tries = 0;
			var timer = setInterval(function () {
				if (ready() || tries++ > 200) { clearInterval(timer); cb(); }
			}, 50);
		},

		bootstrap() {
			var loc = this;
			var query = _parseHashQuery(window.location.hash);
			var sections = ActiveRoute.parseQuery(query);
			var hasContent = (sections.columns && sections.columns.length) ||
							 (sections.rows && sections.rows.length) ||
							 (sections.filters && sections.filters.length);

			var start = hasContent
				? this.pivot.Router.restore(sections)
				: Promise.resolve();
			Promise.resolve(start).then(function () {
				return loc.pivot.Render();
			}).then(function () {
				loc.restoreDashState(query);
				loc.booting = false;
				// Evento de arranque: avisa que la pivot quedó construida.
				if (window.Messages) window.Messages.$emit('pivot-ready', loc.pivot);
			}).catch(function (err) {
				console.error('Error al construir el tablero:', err);
				loc.booting = false;
			});
		},

		// Restaura splitters, análisis visibles, config de relaciones y de
		// distribución y colapso de cortes de la pivot, desde el parámetro 'dash'.
		// Formato (5 segmentos separados por ';'):
		//   "col,left,right;kind1,kind2;<relaciones>;<distribución>;<colapso-pivot>"
		restoreDashState(query) {
			if (!query || !query.dash) return;
			try {
				var parts = String(query.dash).split(';');
				this.restoreSplits(parts[0]);
				this.restoreVisible(parts[1]);
				this.restoreRelationsConfig(parts[2]);
				this.restoreDistributionConfig(parts[3]);
				if (parts[4] != null) this.rowCollapse = parts[4];
			} catch (e) { /* estado inválido: se ignora */ }
		},
		restoreSplits(segment) {
			var s = (segment || '').split(',');
			var c = parseFloat(s[0]), l = parseFloat(s[1]), r = parseFloat(s[2]);
			if (isFinite(c)) this.colSplit = this.clampSplit(c / 100);
			if (isFinite(l)) this.leftSplit = this.clampSplit(l / 100);
			if (isFinite(r)) this.rightSplit = this.clampSplit(r / 100);
		},
		restoreVisible(segment) {
			var kinds = (segment || '').split(',').filter(Boolean);
			for (var i = 0; i < kinds.length; i++) {
				this.setVisible(kinds[i], true);
			}
		},
		restoreRelationsConfig(segment) {
			if (!segment) return;
			var rp = segment.split('~');
			var cfg = {};
			if (rp[0]) cfg.tab = rp[0];
			if (rp[1]) cfg.method = rp[1];
			if (rp[2]) cfg.depKey = rp[2];
			if (rp[3]) cfg.xKey = rp[3];
			if (rp[4]) cfg.yKey = rp[4];
			if (rp[5] != null && rp[5] !== '') cfg.sizeByWeight = (rp[5] === '1');
			if (rp[6]) cfg.regType = rp[6];
			if (rp[7] != null && rp[7] !== '') cfg.logitThreshold = parseFloat(rp[7]);
			if (rp[8]) cfg.logitDirection = rp[8];
			this.analysisConfig.relations = cfg;
		},

		// Segmento de distribución: "weighted~axisMode~chartMode~stacked~collapsed",
		// donde collapsed es una lista de metricIds separados por coma.
		restoreDistributionConfig(segment) {
			if (!segment) return;
			var dp = segment.split('~');
			var cfg = {};
			if (dp[0] != null && dp[0] !== '') cfg.weighted = (dp[0] === '1');
			if (dp[1]) cfg.axisMode = dp[1];
			if (dp[2]) cfg.chartMode = dp[2];
			if (dp[3] != null && dp[3] !== '') cfg.stacked = (dp[3] === '1');
			if (dp[4]) {
				cfg.collapsed = dp[4].split(',').map(function (s) {
					var n = Number(s);
					return isNaN(n) ? s : n;
				});
			}
			this.analysisConfig.distribution = cfg;
		},

		// Serializa el estado del tablero (splitters + análisis visibles + config
		// de relaciones) al string del parámetro 'dash'.
		composeDashState() {
			var splits = [
				Math.round(this.colSplit * 100),
				Math.round(this.leftSplit * 100),
				Math.round(this.rightSplit * 100)
			].join(',');

			var visible = [];
			for (var i = 0; i < ANALYSES.length; i++) {
				if (this.isVisible(ANALYSES[i])) visible.push(ANALYSES[i]);
			}

			var c = this.analysisConfig.relations || {};
			var relPart = [c.tab || '', c.method || '', c.depKey || '', c.xKey || '', c.yKey || '',
				(c.sizeByWeight === false ? '0' : '1'),
				c.regType || '',
				(c.logitThreshold != null ? c.logitThreshold : ''),
				c.logitDirection || ''].join('~');

			var d = this.analysisConfig.distribution || {};
			var collapsed = (d.collapsed && d.collapsed.length) ? d.collapsed.join(',') : '';
			var distPart = [
				(d.weighted === false ? '0' : '1'),
				d.axisMode || '',
				d.chartMode || '',
				(d.stacked ? '1' : '0'),
				collapsed
			].join('~');

			return splits + ';' + visible.join(',') + ';' + relPart + ';' + distPart + ';' + (this.rowCollapse || '');
		},

		syncRoute() {
			var query = this.pivot
				? this.pivot.Router.query()
				: (_parseHashQuery(window.location.hash) || {});
			query.dash = this.composeDashState();
			var parts = [];
			var keys = Object.keys(query);
			for (var i = 0; i < keys.length; i++) {
				parts.push(keys[i] + '=' + encodeURIComponent(query[keys[i]]));
			}
			var newHash = '#/view' + (parts.length ? ('?' + parts.join('&')) : '');
			if (window.location.hash !== newHash) {
				window.history.replaceState(null, '', newHash);
			}
		}
	}
};
</script>
<style scoped>
	.dashboard {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #eceff1;
		padding: 16px 20px;
		box-sizing: border-box;
	}

	.dash-area {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: row;
	}
	.dash-booting {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		color: #607d8b;
	}
	.boot-spinner {
		width: 38px;
		height: 38px;
		border: 4px solid #cfd8dc;
		border-top-color: #1976d2;
		border-radius: 50%;
		animation: boot-spin 0.9s linear infinite;
	}
	@keyframes boot-spin { to { transform: rotate(360deg); } }
	.dash-col {
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.dash-pane {
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	.splitter {
		flex: 0 0 auto;
		background: transparent;
		position: relative;
		z-index: 5;
	}
	.splitter::after {
		content: '';
		position: absolute;
		background: #cfd8dc;
		border-radius: 3px;
		transition: background 0.15s ease;
	}
	.splitter:hover::after {
		background: #1976d2;
	}
	.splitter-v {
		width: 12px;
		cursor: col-resize;
	}
	.splitter-v::after {
		top: 0; bottom: 0;
		left: 5px; width: 2px;
	}
	.splitter-h {
		height: 12px;
		cursor: row-resize;
	}
	.splitter-h::after {
		left: 0; right: 0;
		top: 5px; height: 2px;
	}
</style>
