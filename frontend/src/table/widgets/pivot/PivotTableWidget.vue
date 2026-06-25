<template>
	<div class="widget pivot-widget">
		<!-- Barra de análisis: muestra u oculta cada exploración sobre estos datos -->
		<div class="analysis-bar">
			<span class="analysis-bar-label">Analizar:</span>
			<button
				v-for="k in analysisKinds"
				:key="k.key"
				class="analysis-btn"
				:class="{ 'is-active': isActive(k.key) }"
				:disabled="!ready && !isActive(k.key)"
				:title="buttonTitle(k)"
				@click="toggleAnalysis(k.key)">
				<i :class="k.icon"></i>
				<span>{{ k.label }}</span>
			</button>
			<span class="analysis-bar-spacer"></span>
			<button class="head-btn" @click="exportCsv" :disabled="!ready" title="Exportar CSV">CSV</button>
			<button class="head-btn" @click="exportExcel" :disabled="!ready" title="Exportar Excel">Excel</button>
		</div>

		<div class="pivot-widget-body">
			<pivot-table
				:pivot="pivot"
				:auto-refresh="false"
				:decimals="2"
				:initial-collapse="initialCollapse"
				@data-refreshed="onDataRefreshed"
				@collapse-changed="onCollapseChanged"
				@error="onError"
				ref="pivotTable" />
		</div>
	</div>
</template>

<script>
import PivotTable from '@/table/components/pivot/PivotTable.vue';
import { ANALYSIS_KINDS } from '@/table/widgets/widgetKinds.js';

/*
 * PivotTableWidget — panel de la tabla pivote dentro del tablero.
 *
 * No es dueño de la pivot: la recibe por prop (el Dashboard la crea). Muestra la
 * tabla y la barra de análisis; los botones de análisis emiten un toggle hacia
 * el Dashboard, que muestra u oculta el widget correspondiente. Cuando la tabla
 * refresca sus datos, reemite 'data-refreshed' para que el Dashboard reaccione
 * (su dataset reactivo, pivot.Dataset, ya quedó actualizado por la propia pivot).
 */
export default {
	name: 'PivotTableWidget',
	components: { PivotTable },
	props: {
		pivot: { type: Object, required: true },
		activeAnalyses: { type: Object, default: function () { return {}; } },
		initialCollapse: { type: String, default: '' }
	},
	data() {
		return {
			analysisKinds: ANALYSIS_KINDS
		};
	},
	computed: {
		ready() {
			var ds = this.pivot ? this.pivot.Dataset : null;
			return !!(ds && ds.columns.length && ds.dataRows().length);
		}
	},
	methods: {
		isActive(kind) {
			return !!this.activeAnalyses[kind];
		},
		buttonTitle(k) {
			if (this.isActive(k.key)) return 'Ocultar ' + k.label.toLowerCase();
			if (!this.ready) return 'Para analizar debe haber indicadores y delimitaciones';
			return 'Mostrar ' + k.label.toLowerCase() + ' con estos datos';
		},
		toggleAnalysis(kind) {
			if (!this.ready && !this.isActive(kind)) return;
			this.$emit('toggle-analysis', kind);
		},
		onDataRefreshed() {
			this.$emit('data-refreshed');
		},
		onCollapseChanged(payload) {
			this.$emit('collapse-changed', payload);
		},
		onError(error) {
			this.$emit('error', error);
		},
		exportCsv() {
			if (this.$refs.pivotTable) this.$refs.pivotTable.exportToCSV();
		},
		exportExcel() {
			if (this.$refs.pivotTable) this.$refs.pivotTable.exportToExcel();
		}
	}
};
</script>
<style scoped>
	.widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		overflow: hidden;
	}
	.widget-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		border-bottom: 1px solid #eee;
		background: #fafafa;
		cursor: move;
	}
	.widget-title-text {
		font-size: 14px;
		font-weight: 600;
		color: #1976d2;
		padding: 3px 6px;
	}

	.widget-head-actions { display: flex; align-items: center; gap: 6px; }
	.head-btn {
		border: 1px solid #d0d7de;
		background: #fff;
		color: #455a64;
		font-size: 12px;
		padding: 3px 8px;
		border-radius: 4px;
		cursor: pointer;
	}
	.head-btn:hover:not(:disabled) { background: #f0f3f5; }
	.head-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.widget-close {
		border: none; background: transparent;
		font-size: 18px; line-height: 1; color: #90a4ae;
		cursor: pointer; padding: 0 4px;
	}
	.widget-close:hover { color: #455a64; }

	.analysis-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-bottom: 1px solid #eee;
		background: #fff;
		flex-wrap: wrap;
	}
	.analysis-bar-label {
		font-size: 12px;
		color: #78909c;
		font-weight: 600;
	}
	.analysis-bar-spacer { flex: 1 1 auto; min-width: 12px; }
	.analysis-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 1px solid #d0d7de;
		background: #fff;
		color: #37474f;
		font-size: 12px;
		padding: 4px 10px;
		border-radius: 16px;
		cursor: pointer;
		transition: border-color 0.15s ease, background 0.15s ease;
	}
	.analysis-btn:hover:not(:disabled) {
		border-color: #1976d2;
		background: #e3f2fd;
		color: #1565c0;
	}
	.analysis-btn.is-active {
		border-color: #1976d2;
		background: #1976d2;
		color: #fff;
	}
	.analysis-btn.is-active:hover {
		background: #1565c0;
		border-color: #1565c0;
		color: #fff;
	}
	.analysis-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.analysis-btn i { font-size: 12px; }

	.pivot-widget-body {
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}
</style>
