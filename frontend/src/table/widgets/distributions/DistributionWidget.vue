<template>
	<div class="widget distribution-widget">
		<header class="widget-head">
			<div class="widget-titles">
				<span class="widget-kind">Distribución</span>
			</div>
			<div class="widget-head-actions">
				<button class="widget-close" @click="requestClose" title="Ocultar">×</button>
			</div>
		</header>

		<div v-if="availability !== 'ready'" class="widget-empty">
			{{ emptyMessage() }}
		</div>

		<div v-else ref="body" class="widget-body dist-scroll">
			<template v-for="ind in indicators">
				<!-- Indicador colapsado: franja angosta para reexpandir -->
				<div v-if="isCollapsed(ind.metricId)" :key="'c-' + ind.metricId"
						class="w-block dist-collapsed" :title="ind.name" @click="toggleCollapse(ind.metricId)">
					<button class="dist-collapse-btn" :aria-label="'Expandir ' + ind.name">▸</button>
					<span class="dist-collapsed-name">{{ ind.name }}</span>
				</div>

				<div v-else :key="ind.metricId" class="w-block dist-indicator">
					<button class="dist-collapse-btn dist-minimize" @click="toggleCollapse(ind.metricId)" title="Colapsar" aria-label="Colapsar">▾</button>
					<div class="w-block-head">
						<div class="dist-head-titles">
							<div class="w-indicator">{{ ind.name }}</div>
							<div class="w-variable">{{ ind.variableName }}</div>
						</div>
						<div class="dist-export">
							<button class="dist-export-btn" @click.stop="toggleExportMenu(ind.metricId)" title="Exportar gráfico" aria-label="Exportar gráfico">
								<i class="fas fa-download"></i>
							</button>
							<div v-if="exportMenuFor === ind.metricId" class="dist-export-menu" @click.stop>
								<div class="dist-export-opt" @click="exportChart(ind, 'svg')">SVG (vectorial)</div>
								<div class="dist-export-opt" @click="exportChart(ind, 'png')">PNG (imagen)</div>
							</div>
						</div>
					</div>

					<div class="dist-indicator-body" :ref="'body-' + ind.metricId">
					<!-- Categorías, apilado multi-año: un solo chart, cada año una barra -->
					<template v-if="axisMode === 'categories' && stacked && ind.panels.length">
						<div class="dist-panel">
							<div class="w-version dist-panel-title">{{ yearSpan(ind) }}</div>
							<category-chart
								:years="yearSeriesFor(ind)"
								:mode="chartMode"
								:stacked="true"
								:is-percent="ind.panels[0].isPercent()"
								:height="chartHeight" />
						</div>
					</template>

					<!-- Categorías, sin apilar: un chart por año -->
					<template v-else-if="axisMode === 'categories'">
						<div class="dist-panels">
							<div v-for="panel in ind.panels" :key="panel.key()" class="dist-panel">
								<div class="w-version dist-panel-title">{{ panel.versionName() }}</div>
								<category-chart v-if="categoryHasData(panel)"
									:bars="barsFor(panel)"
									:mode="chartMode"
									:stacked="false"
									:is-percent="panel.isPercent()"
									:is-gap="panel.isGap()"
									:value-unit="panel.valueUnit()"
									:show-total-line="panel.showsTotalLine()"
									:total-value="totalFor(panel)"
									:height="chartHeight" />
								<div v-else class="dist-no-data">Sin información</div>
							</div>
						</div>
					</template>

					<!-- Regiones: barras horizontales por panel (año) -->
					<template v-else>
						<div class="dist-panels">
							<div v-for="panel in ind.panels" :key="panel.key()" class="dist-panel">
								<div class="w-version dist-panel-title">{{ panel.versionName() }}</div>
								<region-bars v-if="regionHasData(panel)"
									:rows="regionRowsFor(panel)"
									:scale-max="regionScaleFor(panel)"
									:stacked="stacked"
									:is-percent="panel.isPercent()"
									:min-height="chartHeight" />
								<div v-else class="dist-no-data">Sin información</div>
							</div>
						</div>
					</template>
				</div>

					<div class="w-legend dist-legend" v-if="legendFor(ind).length">
						<span v-for="c in legendFor(ind)" :key="c.labelId == null ? c.name : c.labelId" class="w-legend-item">
							<span class="w-swatch" :style="{ background: c.color }"></span>{{ c.name }}
						</span>
						<span v-if="axisMode === 'categories' && !stacked && ind.panels[0].showsTotalLine()" class="w-legend-item">
							<span class="w-legend-line"></span>Total
						</span>
					</div>
				</div>
			</template>
		</div>

		<footer v-if="availability === 'ready'" class="widget-foot">
			<span class="axis-switch">
				<span class="axis-label">Graficar:</span>
				<label><input type="radio" value="categories" v-model="axisMode" /> categorías</label>
				<label><input type="radio" value="regions" v-model="axisMode" /> regiones</label>
			</span>
			<label class="sw-toggle" :class="{ disabled: !anyStackable }">
				<input type="checkbox" v-model="stacked" :disabled="!anyStackable" />
				<span class="sw-track"><span class="sw-thumb"></span></span>
				<span class="sw-label">Apilar</span>
			</label>
			<label class="sw-toggle">
				<input type="checkbox" v-model="weighted" />
				<span class="sw-track"><span class="sw-thumb"></span></span>
				<span class="sw-label">Ponderar los valores de las unidades geográficas según sus totales</span>
			</label>
		</footer>
	</div>
</template>

<script>
import widgetMixin from '@/table/widgets/widgetMixin.js';
import CategoryChart from '@/table/widgets/distributions/components/CategoryChart.vue';
import RegionBars from '@/table/widgets/distributions/components/RegionBars.vue';
import DistributionModel from '@/table/widgets/distributions/classes/DistributionModel.js';
import CategoryDistribution from '@/table/widgets/distributions/classes/CategoryDistribution.js';
import RegionDistribution from '@/table/widgets/distributions/classes/RegionDistribution.js';
import ChartExporter from '@/table/writers/ChartExporter.js';

export default {
	name: 'DistributionWidget',
	components: { CategoryChart, RegionBars },
	mixins: [widgetMixin],
	props: {
		pivot: { type: Object, default: null },
		excludedGroups: { type: Array, default: function () { return []; } }
	},
	data() {
		var cfg = this.config || {};
		return {
			weighted: cfg.weighted !== undefined ? cfg.weighted : true,
			axisMode: cfg.axisMode || 'categories',   // 'categories' | 'regions'
			chartMode: cfg.chartMode || 'bars',        // 'bars' | 'lines' (global)
			stacked: !!cfg.stacked,                    // apilar (global)
			collapsed: cfg.collapsed ? cfg.collapsed.slice() : [],  // metricIds colapsados
			chartHeight: 180,
			exportMenuFor: null   // metricId con el menú de exportar abierto, o null
		};
	},
	computed: {
		model() {
			return this.availability === 'ready' ? new DistributionModel(this.dataset) : null;
		},
		indicators() {
			return this.model ? this.model.indicators() : [];
		},
		anyStackable() {
			// En categorías: algún panel con varias categorías, ya sea como columnas
			// elegidas (canStack) o resueltas por Camino 1 (isComposed). En regiones:
			// paneles cuya barra se compone de varias categorías.
			var byColumns = this.indicators.some(function (ind) {
				return ind.panels.some(function (p) { return p.canStack(); });
			});
			if (byColumns) return true;
			if (this.axisMode === 'regions') {
				return this._anyComposed(this.regionByPanel);
			}
			return this._anyComposed(this.categoryByPanel);
		},
		categoryByPanel() {
			var out = {};
			if (!this.model) return out;
			var ds = this.dataset, pv = this.pivot, ex = this.excludedGroups;
			this.model.panels().forEach(function (p) {
				out[p.key()] = new CategoryDistribution(p, ds, pv, ex);
			});
			return out;
		},
		regionByPanel() {
			var out = {};
			if (!this.model || this.axisMode !== 'regions') return out;
			var ds = this.dataset, pv = this.pivot, ex = this.excludedGroups;
			this.model.panels().forEach(function (p) {
				out[p.key()] = new RegionDistribution(p, ds, { pivot: pv, excludedGroups: ex });
			});
			return out;
		}
	},
	watch: {
		weighted(v) { this.persist({ weighted: v }); },
		axisMode(v) { this.persist({ axisMode: v }); },
		chartMode(v) { this.persist({ chartMode: v }); },
		stacked(v) { this.persist({ stacked: v }); },
		collapsed: { deep: true, handler(v) { this.persist({ collapsed: v }); } }
	},
	mounted() {
		// El callback se difiere con requestAnimationFrame: medir y luego ajustar el
		// alto puede reentrar al observer en el mismo ciclo, lo que dispara el aviso
		// "ResizeObserver loop completed with undelivered notifications".
		var loc = this;
		this._ro = new ResizeObserver(function () {
			if (loc._roPending) return;
			loc._roPending = true;
			window.requestAnimationFrame(function () {
				loc._roPending = false;
				loc.measureHeight();
			});
		});
		if (this.$refs.body) this._ro.observe(this.$refs.body);
		this.$nextTick(this.measureHeight);
		// Cierra el menú de exportar al hacer clic afuera (el botón y el menú
		// detienen la propagación con @click.stop).
		this._exportAway = function () { if (loc.exportMenuFor != null) loc.exportMenuFor = null; };
		document.addEventListener('click', this._exportAway);
	},
	beforeDestroy() {
		if (this._ro) this._ro.disconnect();
		if (this._exportAway) document.removeEventListener('click', this._exportAway);
	},
	methods: {
		persist(patch) { this.updateConfig(patch); },
		toggleExportMenu(metricId) {
			this.exportMenuFor = (this.exportMenuFor === metricId) ? null : metricId;
		},
		// Exporta todos los gráficos del indicador (puede haber un panel por año) a un
		// único archivo, vectorial (SVG) o raster (PNG). El contenedor es el cuerpo
		// del bloque; el título combina indicador y variable.
		exportChart(ind, format) {
			this.exportMenuFor = null;
			var refs = this.$refs['body-' + ind.metricId];
			var body = Array.isArray(refs) ? refs[0] : refs;
			if (!body) return;
			var title = ind.name + (ind.variableName ? ' — ' + ind.variableName : '');
			var exporter = new ChartExporter(body, title);
			if (!exporter.hasCharts()) return;
			if (format === 'png') exporter.downloadPng();
			else exporter.downloadSvg();
		},
		isCollapsed(metricId) { return this.collapsed.indexOf(metricId) !== -1; },
		toggleCollapse(metricId) {
			var i = this.collapsed.indexOf(metricId);
			if (i === -1) this.collapsed.push(metricId);
			else this.collapsed.splice(i, 1);
		},
		// Alto disponible para los charts: sigue al alto del cuerpo (que cambia con
		// el splitter), descontando títulos y leyenda.
		measureHeight() {
			if (!this.$refs.body) return;
			var h = this.$refs.body.clientHeight;
			// clientHeight puede ser 0 o no numérico durante el montaje; en ese caso
			// se mantiene un alto por defecto en vez de propagar un valor inválido
			// (que un SVG rechazaría por negativo/NaN).
			if (!h || isNaN(h)) { this.chartHeight = 180; return; }
			// Se descuenta el espacio de cabecera del bloque, título de versión y
			// leyenda para que el gráfico no provoque scroll por sobrarse de alto.
			this.chartHeight = Math.max(125, Math.min(720, h - 175));
		},
		barsFor(panel) {
			var cd = this.categoryByPanel[panel.key()];
			return cd ? cd.bars() : [];
		},
		// ¿Algún panel del mapa de distribuciones tiene barras compuestas por varias
		// categorías? Habilita apilar incluso sin categorías elegidas como columnas.
		_anyComposed(byPanel) {
			for (var k in byPanel) {
				if (byPanel.hasOwnProperty(k) && byPanel[k] && byPanel[k].isComposed && byPanel[k].isComposed()) return true;
			}
			return false;
		},
		categoryHasData(panel) {
			var bars = this.barsFor(panel);
			return bars.some(function (b) { return b.value != null; });
		},
		// Leyenda del indicador: las categorías del panel, o las resueltas por el
		// Camino 1 cuando la selección es solo total (que vienen en los bars).
		legendFor(ind) {
			var leg = ind.panels[0].legend();
			if (leg.length) return leg;
			var bars = this.barsFor(ind.panels[0]);
			return bars.filter(function (b) { return b.labelId != null; })
				.map(function (b) { return { labelId: b.labelId, name: b.name, color: b.color }; });
		},
		totalFor(panel) {
			var cd = this.categoryByPanel[panel.key()];
			return cd ? cd.totalValue() : null;
		},
		// Para el apilado multi-año: una serie por año (cada una con sus categorías).
		yearSeriesFor(ind) {
			var loc = this;
			return ind.panels.map(function (p) {
				return { name: p.versionName(), bars: loc.barsFor(p) };
			});
		},
		yearSpan(ind) {
			var names = ind.panels.map(function (p) { return p.versionName(); }).filter(Boolean);
			if (!names.length) return '';
			if (names.length === 1) return names[0];
			return names[0] + '–' + names[names.length - 1];
		},
		regionRowsFor(panel) {
			var rd = this.regionByPanel[panel.key()];
			return rd ? rd.rows() : [];
		},
		regionHasData(panel) {
			var rd = this.regionByPanel[panel.key()];
			return rd ? rd.hasData() : false;
		},
		regionScaleFor(panel) {
			var rd = this.regionByPanel[panel.key()];
			if (!rd) return 100;
			// La escala del eje es el mayor total de barra (la suma de las categorías
			// seleccionadas por región). No se fija 100 en porcentaje: si solo hay
			// algunas categorías, su suma no llega a 100, y forzar 100 dejaría las
			// barras cortas; y si por redondeos superan 100, fijar 100 las pasaría de
			// largo. El máximo real evita ambos.
			var m = rd.maxTotal();
			if (m <= 0) return panel.isPercent() ? 100 : 1;
			var p = Math.pow(10, Math.floor(Math.log10(m)));
			return Math.ceil(m / p) * p;
		}
	}
};
</script>

<style scoped>
	@import '@/table/widgets/widgetStyles.css';

	.dist-scroll { display: flex; gap: 16px; align-items: stretch; }

	.dist-indicator { flex: 0 0 auto; display: flex; flex-direction: column; position: relative; }
	.dist-indicator-body { padding: 10px 12px; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; }

	.w-block-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; padding-right: 24px; }
	.dist-export { position: relative; flex: 0 0 auto; }
	.dist-export-btn {
		border: none; background: transparent; color: #90a4ae; cursor: pointer;
		font-size: 13px; line-height: 1; padding: 4px 6px; border-radius: 4px;
	}
	.dist-export-btn:hover { color: #1976d2; background: #e3f2fd; }
	.dist-export-menu {
		position: absolute; top: 100%; right: 0; margin-top: 2px; z-index: 5;
		background: #fff; border: 1px solid #cfd8dc; border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 150px; padding: 4px 0;
	}
	.dist-export-opt {
		padding: 7px 14px; font-size: 13px; color: #37474f; cursor: pointer; white-space: nowrap;
	}
	.dist-export-opt:hover { background: #e3f2fd; }
	.dist-head-titles { min-width: 0; max-width: 320px; }
	.dist-head-titles .w-indicator,
	.dist-head-titles .w-variable {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 320px;
	}
	.dist-collapse-btn {
		border: none; background: transparent; color: #90a4ae; cursor: pointer;
		font-size: 16px; line-height: 1; padding: 2px 4px; flex: 0 0 auto;
	}
	.dist-collapse-btn:hover { color: #455a64; }
	.dist-minimize {
		position: absolute; top: 4px; right: 4px; z-index: 1;
		font-size: 18px; font-weight: 700; padding: 0 6px;
	}

	.dist-collapsed {
		flex: 0 0 auto; width: 22px; cursor: pointer;
		display: flex; flex-direction: column; align-items: center; gap: 8px;
		padding: 8px 0; overflow: hidden;
	}
	.dist-collapsed:hover { background: #f5f7f9; }
	.dist-collapsed-name {
		writing-mode: vertical-rl; text-orientation: mixed;
		font-size: 11px; color: #546e7a; white-space: nowrap;
		overflow: hidden; text-overflow: ellipsis; max-height: 220px;
	}

	.dist-panels { display: flex; gap: 4px; align-items: flex-start; flex: 1 1 auto; min-height: 0; overflow-x: auto; }
	.dist-panel { flex: 0 0 auto; display: flex; flex-direction: column; height: 100%; }
	.dist-panel-title { text-align: center; margin-bottom: 6px; }

	.dist-legend {
		margin: 0;
		max-width: none;
		flex: 0 0 auto;
		padding: 8px 12px;
		border-top: 1px solid #eceff1;
		background: #fff;
	}
	.dist-cut-note { margin-top: 6px; }
	.dist-no-data {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80px;
		padding: 20px;
		color: #90a4ae;
		font-size: 13px;
		font-style: italic;
	}

	.sw-toggle { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; color: #546e7a; cursor: pointer; user-select: none; }
	.sw-toggle.disabled { opacity: 0.35; cursor: not-allowed; }
	.sw-toggle.disabled .sw-track { background: #cfd8dc; }
	/* Habilitado pero en off: track con un gris más vivo que invita a togglear. */
	.sw-toggle:not(.disabled) .sw-track { background: #b0bec5; }
	.sw-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
	.sw-track { position: relative; width: 30px; height: 16px; background: #cfd8dc; border-radius: 9px; transition: background 0.15s; flex: 0 0 auto; }
	.sw-thumb { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; background: #fff; border-radius: 50%; transition: transform 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.25); }
	.sw-toggle input:checked + .sw-track { background: #1976d2; }
	.sw-toggle input:checked + .sw-track .sw-thumb { transform: translateX(14px); }

	.axis-switch { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: #546e7a; }
	.axis-switch label { display: inline-flex; align-items: center; gap: 3px; cursor: pointer; }
	.axis-label { color: #78909c; }
</style>
