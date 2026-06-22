<template>
	<div class="metric-summary">
		<div class="ms-head">
			<span class="ms-indicator">{{ metricName }}</span>
			<span class="ms-variable" v-if="variableName">{{ variableName }}{{ unit ? ' (' + unit + ')' : '' }}</span>
		</div>

		<div v-for="vg in versionGroups" :key="vg.versionId == null ? 'v-none' : vg.versionId" class="ms-version">
			<div class="ms-version-bar">
				<span class="ms-version-title">{{ vg.versionName || variableName || metricName }}</span>
				<span class="ms-version-actions">
					<button class="ms-xbtn" @click="exportVersionCsv(vg)" title="Exportar esta tabla a CSV">CSV</button>
					<button class="ms-xbtn" @click="exportVersionXlsx(vg)" title="Exportar esta tabla a Excel">Excel</button>
				</span>
			</div>

			<table class="ms-table">
				<thead>
					<tr>
						<th class="ms-cat-head">{{ categoryHeadLabel }}</th>
						<th v-for="s in statColumns" :key="s.key" class="ms-stat-head" :title="s.title">{{ s.label }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="col in vg.columns" :key="col.key" :class="{ 'ms-row-total': col.meta.isTotal }">
						<td class="ms-cat" :title="catName(col)">{{ catName(col) }}</td>
						<td v-for="s in statColumns" :key="s.key" class="ms-val">{{ formatStat(col, s.key) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script>
import stats from '@/table/js/pivotStats.js';
import { matrixToCsv, matrixToXlsx } from '@/table/js/tableExport.js';

// Los estadísticos, en orden. 'title' es el tooltip del encabezado.
// 'filas' (conteo de casos) va al final para no confundir con la N de la pivot.
var STAT_COLUMNS = [
	{ key: 'mean',   label: 'media',  title: 'Media ponderada' },
	{ key: 'stdDev', label: 'sd',     title: 'Desvío estándar' },
	{ key: 'min',    label: 'mín',    title: 'Mínimo' },
	{ key: 'max',    label: 'máx',    title: 'Máximo' },
	{ key: 'q1',     label: 'Q1',     title: 'Primer cuartil' },
	{ key: 'median', label: 'mediana',title: 'Mediana' },
	{ key: 'q3',     label: 'Q3',     title: 'Tercer cuartil' },
	{ key: 'n',      label: 'filas',  title: 'Cantidad de filas (regiones con dato)', raw: true }
];

export default {
	name: 'MetricSummary',
	props: {
		// metricId de la métrica que este bloque resume.
		metricId: { type: [String, Number], required: true },
		// Columnas del dataset que pertenecen a esta métrica (role measure).
		columns: { type: Array, required: true },
		// Filas de datos del dataset (cada una con values[] y weights[] alineados
		// a las columnas globales del dataset, por eso se accede vía _columnIndex).
		rows: { type: Array, required: true },
		// Si false, los estadísticos se calculan sin ponderar.
		weighted: { type: Boolean, default: true }
	},
	data() {
		return { statColumns: STAT_COLUMNS };
	},
	computed: {
		metricName() {
			var c = this.columns[0];
			return c ? c.meta.metricName : '';
		},
		variableName() {
			var c = this.columns[0];
			return c ? c.meta.variableName : '';
		},
		unit() {
			var c = this.columns[0];
			return c ? c.unit : '';
		},
		// Etiqueta de la primera columna (categoría / variable según haya o no labels).
		categoryHeadLabel() {
			var anyLabel = this.columns.some(function (c) { return c.meta.labelName; });
			return anyLabel ? 'Categoría' : 'Variable';
		},
		// Agrupa las columnas de esta métrica por versión (sub-tabla por año).
		versionGroups() {
			var groups = [];
			var byVersion = {};
			this.columns.forEach(function (col) {
				if (col.meta.isEmpty) return;  // placeholder: no se resume
				var vid = col.meta.versionId == null ? '_none' : col.meta.versionId;
				if (!byVersion[vid]) {
					byVersion[vid] = { versionId: col.meta.versionId, versionName: col.meta.versionName, columns: [] };
					groups.push(byVersion[vid]);
				}
				byVersion[vid].columns.push(col);
			});
			return groups;
		},
		// Cache de estadísticos por columna (key → describe()). Se recalcula cuando
		// cambian las filas o el modo ponderado.
		statsByColumn() {
			var out = {};
			var rows = this.rows;
			var weighted = this.weighted;
			this.columns.forEach(function (col) {
				var idx = col.valueIndex;
				var values = [];
				var weights = [];
				for (var i = 0; i < rows.length; i++) {
					var r = rows[i];
					values.push(r.values ? r.values[idx] : null);
					weights.push(weighted && r.weights ? r.weights[idx] : 1);
				}
				out[col.key] = stats.describe(values, weighted ? weights : null);
			});
			return out;
		}
	},
	methods: {
		catName(col) {
			if (col.meta.isTotal) return 'Total';
			if (col.meta.labelName) return col.meta.labelName;
			return col.meta.variableName || '—';
		},
		formatStat(col, statKey) {
			var d = this.statsByColumn[col.key];
			if (!d) return '—';
			var v = d[statKey];
			if (v === null || v === undefined) return '—';
			// 'n' es un conteo: entero, sin el formatter de la variable.
			if (statKey === 'n') return String(v);
			// El resto usa el formatter de la columna (respeta decimales y modo).
			if (typeof col.formatter === 'function') return col.formatter(v);
			return (Math.round(v * 100) / 100).toString();
		},

		// Construye la matriz (filas × columnas) de UNA sub-tabla, con cabecera de
		// contexto (indicador, variable, año) y los estadísticos como columnas.
		matrixForVersion(vg) {
			var loc = this;
			var rows = [];
			rows.push([this.metricName]);
			if (this.variableName) rows.push([this.variableName + (this.unit ? ' (' + this.unit + ')' : '')]);
			if (vg.versionName) rows.push([vg.versionName]);
			// Encabezado: categoría + estadísticos.
			rows.push([this.categoryHeadLabel].concat(this.statColumns.map(function (s) { return s.label; })));
			// Filas por categoría.
			vg.columns.forEach(function (col) {
				var line = [loc.catName(col)];
				loc.statColumns.forEach(function (s) { line.push(loc.formatStat(col, s.key)); });
				rows.push(line);
			});
			return rows;
		},
		versionFileBase(vg) {
			var parts = [this.metricName];
			if (vg.versionName) parts.push(vg.versionName);
			var name = parts.join('_').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
			return name || 'resumen';
		},
		exportVersionCsv(vg) {
			matrixToCsv(this.matrixForVersion(vg), this.versionFileBase(vg) + '.csv');
		},
		exportVersionXlsx(vg) {
			matrixToXlsx(this.matrixForVersion(vg), this.versionFileBase(vg) + '.xlsx', 'Resumen');
		}
	}
};
</script>

<style scoped>
	.metric-summary {
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 12px;
		background: #fff;
	}
	.ms-head {
		padding: 8px 12px;
		background: #f5f7f9;
		border-bottom: 1px solid #eceff1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.ms-indicator {
		font-size: 13px;
		font-weight: 600;
		color: #263238;
	}
	.ms-variable {
		font-size: 11px;
		color: #78909c;
	}
	.ms-version {
		padding: 0;
	}
	.ms-version + .ms-version {
		margin-top: 10px;
		border-top: 2px solid #cfd8dc;
	}
	.ms-version-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fafbfc;
		border-bottom: 1px solid #eceff1;
		padding: 4px 8px 4px 12px;
	}
	.ms-version-title {
		font-size: 11px;
		font-weight: 700;
		color: #455a64;
	}
	.ms-version-actions {
		display: inline-flex;
		gap: 4px;
	}
	.ms-xbtn {
		border: 1px solid #d0d7de;
		background: #fff;
		color: #607d8b;
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 3px;
		cursor: pointer;
		line-height: 1.4;
	}
	.ms-xbtn:hover {
		background: #f0f3f5;
		color: #37474f;
	}
	.ms-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		box-shadow: 0px 0px 1px 0px rgb(0 0 0 / 70%);
	}
	.ms-table thead th {
		font-weight: 600;
		color: #607d8b;
		text-align: center;
		padding: 3px 6px;
		border-bottom: 1px solid #eceff1;
		white-space: nowrap;
	}
	.ms-cat-head {
		text-align: left !important;
		padding-left: 12px !important;
	}
	.ms-stat-head {
		font-variant-numeric: tabular-nums;
	}
	.ms-table tbody td {
		padding: 2px 6px;
		border-bottom: 1px solid #f5f5f5;
	}
	.ms-cat {
		text-align: left;
		padding-left: 12px;
		color: #37474f;
		max-width: 110px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.ms-val {
		text-align: center;
		color: #546e7a;
		font-family: 'Courier New', monospace;
	}
	.ms-row-total {
		background: #f7f9fb;
		font-weight: 600;
	}
	.ms-row-total .ms-cat {
		font-style: italic;
	}
</style>
