<template>
	<div class="embedded-table">
		<div v-if="failed" class="embedded-table-message">
			No se pudo preparar la tabla. Cierre la ventana e intente nuevamente.
		</div>
		<div v-else-if="!pivot" class="embedded-table-message">
			<div class="embedded-table-spinner"></div>
			<p>Preparando la tabla...</p>
		</div>
		<pivot-table v-else ref="pivotTable" :pivot="pivot" :embedded="true" :min-metrics="1"
								 @data-refreshed="emitMetricNames" />
	</div>
</template>

<script>
	import ActivePivot from '@/table/classes/ActivePivot.js';
	import ActiveRoute from '@/table/classes/ActiveRoute.js';
	import EmbeddedContextLoader from '@/table/classes/EmbeddedContextLoader.js';
	import PivotTable from '@/table/components/pivot/PivotTable.vue';

	/*
	 * EmbeddedTable — la tabla dentro del visor (popup "Ver como tabla"). Solo la
	 * pivot: sin barra lateral ni paneles de análisis. No toca la ruta del visor: la
	 * ruta que tendría en el tablero se calcula al pedirla (dashboardUrl), con el
	 * estado vigente, para abrirla aparte con toda la funcionalidad. Deja quitar
	 * indicadores mientras quede al menos uno, y avisa los que quedan
	 * ('metrics-changed', con sus nombres) para el título del popup.
	 *
	 * Se carga bajo demanda (import dinámico desde el visor): este módulo y todo lo
	 * que arrastra no forman parte del bundle inicial del mapa.
	 */
	export default {
		name: 'EmbeddedTable',
		components: { PivotTable },
		props: {
			// Configuración inicial en el formato de ActiveRoute: { columns, places, suggestion }.
			sections: { type: Object, required: true },
			// Ruta base del tablero (p. ej. https://.../table/123/).
			basePath: { type: String, required: true }
		},
		data() {
			return { pivot: null, failed: false };
		},
		mounted() {
			var loc = this;
			new EmbeddedContextLoader(window.SegMap).EnsureContext().then(function () {
				var pivot = new ActivePivot();
				return pivot.RestoreFromSections(loc.sections).then(function () {
					return pivot.Render();
				}).then(function () {
					loc.pivot = pivot;
					loc.$emit('ready');
					loc.emitMetricNames();
				});
			}).catch(function (error) {
				loc.failed = true;
				throw error;
			});
		},
		methods: {
			dashboardUrl() {
				return ActiveRoute.tableUrl(this.pivot.Router.sections(), this.basePath);
			},
			exportCsv() {
				this.$refs.pivotTable.exportToCSV();
			},
			exportExcel() {
				return this.$refs.pivotTable.exportToExcel();
			},
			emitMetricNames() {
				var names = [];
				for (var i = 0; i < this.pivot.Metrics.length; i++) {
					names.push(this.pivot.Metrics[i].properties.Metric.Name);
				}
				this.$emit('metrics-changed', names);
			}
		}
	};
</script>

<style scoped>
	.embedded-table {
		height: 100%;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.embedded-table-message {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: #607d8b;
		font-size: 14px;
	}
	.embedded-table-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #d0d0d0;
		border-top-color: #1976d2;
		border-radius: 50%;
		animation: embedded-table-spin 0.8s linear infinite;
	}
	@keyframes embedded-table-spin {
		to { transform: rotate(360deg); }
	}
</style>
