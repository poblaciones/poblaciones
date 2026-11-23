<template>
	<md-dialog :md-active.sync="showDialog" class="comparabilityDialog">
		<md-dialog-title>¿Por qué no es comparable?</md-dialog-title>
		<md-dialog-content>
			<p class="intro">
				Diagnóstico de las variables del indicador publicado, para compararlas entre series.
			</p>
			<table class="comparabilityTable">
				<thead>
					<tr>
						<th></th>
						<th>Series</th>
						<th>Nivel</th>
						<th>Variable</th>
						<th>Diagnóstico</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(row, index) in rows" :key="index">
						<td class="statusCell">
							<md-icon :style="{ color: statusOf(row).color }">
								{{ statusOf(row).icon }}
								<md-tooltip md-direction="right">{{ statusOf(row).label }}</md-tooltip>
							</md-icon>
						</td>
						<td>{{ row.Versions }}</td>
						<td>{{ row.Level }}</td>
						<td>{{ row.Variable }}</td>
						<td>{{ row.Message }}</td>
					</tr>
				</tbody>
			</table>
		</md-dialog-content>
		<md-dialog-actions>
			<md-button class="md-primary" @click="hide">Cerrar</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
export default {
	name: 'ComparabilityPopup',
	methods: {
		show(rows) {
			this.rows = rows;
			this.showDialog = true;
		},
		hide() {
			this.showDialog = false;
		},
		// Mismos íconos y colores que el estado de las grillas (verde: listo; naranja: requiere atención)
		statusOf(row) {
			if (row.Comparable) {
				return { icon: 'check_circle_outline', color: '#44b10f', label: 'Comparable' };
			}
			return { icon: 'error_outline', color: '#ff7936', label: 'No comparable' };
		},
	},
	data() {
		return {
			showDialog: false,
			rows: [],
		};
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.intro {
		margin-top: 0;
	}
	.comparabilityTable {
		border-collapse: collapse;
		width: 100%;
	}
	.comparabilityTable th,
	.comparabilityTable td {
		text-align: left;
		padding: 6px 12px 6px 0;
		vertical-align: top;
	}
	.comparabilityTable th {
		font-weight: 500;
		border-bottom: 1px solid rgba(0, 0, 0, 0.12);
	}
	.statusCell {
		width: 32px;
	}
</style>
