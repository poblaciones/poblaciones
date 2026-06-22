<template>
	<div class="widget inspector">
		<header class="widget-head">
			<div class="widget-titles">
				<span class="widget-kind">Inspector</span>
				<span class="widget-source" :title="datasetTitle">{{ datasetTitle }}</span>
			</div>
			<button class="widget-close" @click="requestClose" title="Ocultar">×</button>
		</header>

		<div v-if="availability !== 'ready'" class="widget-empty">
			{{ emptyMessage() }}
		</div>

		<div v-else class="inspector-body">
			<section class="inspector-section">
				<h4>Columnas <span class="count">{{ dataset.columns.length }}</span></h4>
				<table class="inspector-table">
					<thead>
						<tr><th>Etiqueta</th><th>Unidad</th><th>Modo</th><th>Ponderación</th></tr>
					</thead>
					<tbody>
						<tr v-for="col in dataset.columns" :key="col.key">
							<td :title="col.key">{{ col.shortLabel || col.label }}</td>
							<td class="mono">{{ col.unit || '—' }}</td>
							<td class="mono">{{ col.mode }}</td>
							<td>{{ weightingText(col) }}</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section class="inspector-section">
				<h4>Filas de datos <span class="count">{{ dataRows.length }}</span></h4>
				<table class="inspector-table">
					<thead>
						<tr>
							<th>Región</th>
							<th v-for="col in dataset.columns" :key="'h-' + col.key">{{ col.shortLabel }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in sampleRows" :key="row.id">
							<td>{{ row.label }}</td>
							<td v-for="(v, i) in row.values" :key="i" class="mono num">
								{{ format(dataset.columns[i], v) }}
							</td>
						</tr>
					</tbody>
				</table>
				<p v-if="dataRows.length > sampleRows.length" class="inspector-note">
					Mostrando las primeras {{ sampleRows.length }} de {{ dataRows.length }} filas.
				</p>
			</section>
		</div>
	</div>
</template>

<script>
import widgetMixin from '@/table/widgets/widgetMixin.js';

export default {
	name: 'DatasetInspectorWidget',
	mixins: [widgetMixin],
	computed: {
		datasetTitle() {
			return this.dataset ? this.dataset.title : '';
		},
		sampleRows() {
			return this.dataRows.slice(0, 12);
		}
	},
	methods: {
		weightingText(col) {
			var w = col.weighting;
			if (!w || !w.available) return 'sin ponderar';
			return w.label || w.kind;
		},
		format(col, value) {
			if (value === null || value === undefined) return '—';
			if (col && typeof col.formatter === 'function') return col.formatter(value);
			return value;
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
		padding: 8px 12px;
		border-bottom: 1px solid #eee;
		background: #fafafa;
		cursor: move;
	}
	.widget-titles {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.widget-kind {
		font-size: 13px;
		font-weight: 600;
		color: #263238;
	}
	.widget-source {
		font-size: 11px;
		color: #78909c;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.widget-close {
		border: none;
		background: transparent;
		font-size: 18px;
		line-height: 1;
		color: #90a4ae;
		cursor: pointer;
		padding: 0 4px;
	}
	.widget-close:hover { color: #455a64; }

	.widget-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 24px;
		color: #90a4ae;
		font-size: 13px;
	}

	.inspector-body {
		flex: 1;
		overflow: auto;
		padding: 10px 12px;
	}
	.inspector-section { margin-bottom: 16px; }
	.inspector-section h4 {
		margin: 0 0 6px;
		font-size: 12px;
		font-weight: 600;
		color: #455a64;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.inspector-section h4 .count {
		margin-left: 6px;
		color: #b0bec5;
		font-weight: 400;
	}
	.inspector-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
	}
	.inspector-table th {
		text-align: left;
		font-weight: 600;
		color: #607d8b;
		border-bottom: 1px solid #eceff1;
		padding: 4px 8px;
		white-space: nowrap;
	}
	.inspector-table td {
		padding: 4px 8px;
		border-bottom: 1px solid #f5f5f5;
		color: #37474f;
	}
	.mono { font-variant-numeric: tabular-nums; }
	.num { text-align: right; }
	.inspector-note {
		margin: 6px 0 0;
		font-size: 11px;
		color: #b0bec5;
	}
</style>
