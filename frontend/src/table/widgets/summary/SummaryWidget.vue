<template>
	<div class="widget summary-widget">
		<header class="widget-head">
			<div class="widget-titles">
				<span class="widget-kind">Resumen</span>
			</div>
			<div class="widget-head-actions">
				<button class="head-btn" @click="exportCsv" :disabled="availability !== 'ready'" title="Exportar CSV">CSV</button>
				<button class="head-btn" @click="exportExcel" :disabled="availability !== 'ready'" title="Exportar Excel">Excel</button>
				<button class="widget-close" @click="requestClose" title="Ocultar">×</button>
			</div>
		</header>

		<div v-if="availability !== 'ready'" class="widget-empty">
			{{ emptyMessage() }}
		</div>

		<div v-else class="summary-body">
			<div class="summary-inner" ref="exportRoot">
				<metric-summary
					v-for="g in metricGroups"
					:key="g.metricId"
					:metric-id="g.metricId"
					:columns="g.columns"
					:rows="dataRows"
					:weighted="weighted" />
			</div>
		</div>

		<footer v-if="availability === 'ready'" class="widget-foot">
			<label class="sw-toggle">
				<input type="checkbox" v-model="weighted" />
				<span class="sw-track"><span class="sw-thumb"></span></span>
				<span>Ponderar valores</span>
			</label>
		</footer>
	</div>
</template>

<script>
import widgetMixin from '@/table/widgets/widgetMixin.js';
import MetricSummary from '@/table/widgets/summary/MetricSummary.vue';
import { exportDomToCsv, exportDomToXlsx } from '@/table/js/tableExport.js';

export default {
	name: 'SummaryWidget',
	components: { MetricSummary },
	mixins: [widgetMixin],
	data() {
		return {
			// Por defecto ponderado; se persiste en la config del widget.
			weighted: this.config && this.config.weighted !== undefined ? this.config.weighted : true
		};
	},
	computed: {
		// Agrupa las columnas de medida por métrica, preservando el orden de aparición.
		// A cada columna se le adjunta su índice posicional en dataset.columns, que
		// es el mismo índice con el que se alinean values[] y weights[] de cada fila.
		metricGroups() {
			var groups = [];
			var byMetric = {};
			var allColumns = this.dataset ? this.dataset.columns : [];
			var indexByKey = {};
			allColumns.forEach(function (c, i) { indexByKey[c.key] = i; });

			this.measureColumns.forEach(function (col) {
				var enriched = Object.assign({}, col, { valueIndex: indexByKey[col.key] });
				var mid = col.meta.metricId;
				if (!byMetric[mid]) {
					byMetric[mid] = { metricId: mid, columns: [] };
					groups.push(byMetric[mid]);
				}
				byMetric[mid].columns.push(enriched);
			});
			return groups;
		}
	},
	watch: {
		weighted(val) {
			this.updateConfig({ weighted: val });
		}
	},
	methods: {
		exportBaseName() {
			var t = (this.dataset && this.dataset.title ? this.dataset.title : 'resumen')
				.replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
			return 'resumen_' + (t || 'tabla');
		},
		exportCsv() {
			if (this.availability !== 'ready' || !this.$refs.exportRoot) return;
			exportDomToCsv(this.$refs.exportRoot, this.exportBaseName() + '.csv');
		},
		exportExcel() {
			if (this.availability !== 'ready' || !this.$refs.exportRoot) return;
			exportDomToXlsx(this.$refs.exportRoot, this.exportBaseName() + '.xlsx', 'Resumen');
		}
	}
};
</script>

<style scoped>
	@import '@/table/widgets/widgetStyles.css';

	.summary-body {
		flex: 1;
		overflow: auto;
		padding: 10px 12px;
	}
	.summary-inner {
		width: 600px;
		max-width: 100%;
	}
	@media (max-width: 600px) {
		.summary-inner {
			width: 33vw;
			min-width: 200px;
		}
	}
</style>
