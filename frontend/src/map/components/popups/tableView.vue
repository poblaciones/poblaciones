<template>
	<div v-if="open">
		<div class="mp-modal table-view-modal" @click.self="close">
			<div class="mp-surface table-view-dialog" role="dialog" aria-modal="true" :aria-label="title">
				<div class="table-view-header">
					<h5 class="table-view-title" :title="title">{{ title }}</h5>
					<mp-dropdown-menu v-if="tableReady" :items="exportItems" @itemClick="exportSelected" :floatRight="true"
														variant="pill" icon="fas fa-caret-down" tooltip="Exportar la tabla">
						<template slot="trigger"><i class="fas fa-file-export"></i> Exportar</template>
					</mp-dropdown-menu>
					<button type="button" class="mp-btn table-view-open" :disabled="!tableReady" @click="openDashboard"
									title="Abrir como tablero en una pestaña nueva">
						<i class="fas fa-external-link-alt"></i> Abrir como tablero
					</button>
					<mp-close-button @click="close" title="Cerrar" />
				</div>
				<div class="table-view-body">
					<component v-if="tableComponent && sections" :is="tableComponent" ref="table"
										 :sections="sections" :base-path="basePath"
										 @ready="tableReady = true" @metrics-changed="metricNames = $event" />
					<div v-else class="table-view-loading">
						<img src="/static/img/spinner.gif" alt="" />
						<span>Preparando la tabla...</span>
					</div>
				</div>
			</div>
		</div>
		<div class="mp-modal__backdrop table-view-backdrop" @click="close"></div>
	</div>
</template>

<script>
	import TableLink from '@/map/classes/TableLink';
	import EscapeCloseHandler from '@/map/classes/EscapeCloseHandler';

	// El componente de la tabla (y todo el módulo de la pivot) se carga recién
	// cuando el usuario la pide, en un fragmento aparte del bundle del visor.
	var tableComponentPromise = null;

	function loadTableComponent() {
		if (!tableComponentPromise) {
			tableComponentPromise = import(/* webpackChunkName: "embedded-table" */ '@/table/views/EmbeddedTable.vue').then(function (module) {
				return module.default;
			}).catch(function (error) {
				tableComponentPromise = null;
				throw error;
			});
		}
		return tableComponentPromise;
	}

	/*
	 * Popup "Ver como tabla": muestra la pivot con los indicadores y la selección
	 * del visor, en una ventana modal. El título es el indicador, o la lista de los
	 * visibles (se puede quitar mientras quede uno). "Exportar" descarga la tabla y
	 * "Abrir como tablero" abre el tablero completo en otra pestaña, con el estado
	 * vigente de la tabla.
	 */
	export default {
		name: 'tableView',
		data() {
			return {
				open: false,
				tableComponent: null,
				sections: null,
				basePath: '',
				tableReady: false,
				// Nombres de los indicadores visibles, para el título.
				metricNames: []
			};
		},
		computed: {
			// "Ver como tabla" con el nombre del indicador o la lista de indicadores
			// ("A, B y C"); si es muy larga, la recorta el CSS con puntos suspensivos.
			title() {
				var names = this.metricNames;
				if (names.length === 0) {
					return 'Ver como tabla';
				}
				if (names.length === 1) {
					return names[0];
				}
				return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
			},
			exportItems() {
				return [
					{ label: 'Excel', key: 'XLSX', icon: 'fas fa-file-excel' },
					{ label: 'CSV', key: 'CSV', icon: 'fas fa-file-csv' }
				];
			}
		},
		created() {
			this.escapeHandler = new EscapeCloseHandler(this.close, { useHistory: true });
		},
		beforeDestroy() {
			this.escapeHandler.Close();
		},
		watch: {
			open(isOpen) {
				if (isOpen) {
					this.escapeHandler.Open();
				} else {
					this.escapeHandler.Close();
				}
			}
		},
		methods: {
			// metrics: los indicadores a mostrar (todos los del visor, o uno solo).
			show(metrics) {
				var loc = this;
				var link = new TableLink(window.SegMap);
				this.sections = null;
				this.tableReady = false;
				this.metricNames = this.namesOf(metrics);
				this.basePath = link.tableBasePath();
				this.open = true;
				Promise.all([link.BuildSections(metrics), loadTableComponent()]).then(function (results) {
					loc.sections = results[0];
					loc.tableComponent = results[1];
				}).catch(function (error) {
					loc.close();
					throw error;
				});
			},
			close() {
				this.open = false;
				this.sections = null;
				this.tableReady = false;
			},
			namesOf(metrics) {
				var tableMetrics = TableLink.TableMetrics(metrics);
				var names = [];
				for (var i = 0; i < tableMetrics.length; i++) {
					names.push(tableMetrics[i].properties.Metric.Name);
				}
				return names;
			},
			openDashboard() {
				window.open(this.$refs.table.dashboardUrl(), '_blank');
			},
			exportSelected(item) {
				if (item.key === 'XLSX') {
					this.$refs.table.exportExcel();
				} else {
					this.$refs.table.exportCsv();
				}
			}
		}
	};
</script>

<style scoped>
	.table-view-modal {
		position: fixed;
		z-index: 1100;
		align-items: center;
		justify-content: center;
	}
	.table-view-backdrop {
		z-index: 1090;
	}
	.table-view-dialog {
		width: 75vw;
		height: 85vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: 6px;
	}
	.table-view-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 10px 10px 16px;
		border-bottom: 1px solid #e0e0e0;
	}
	.table-view-title {
		flex: 1 1 auto;
		min-width: 0;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.table-view-open i {
		margin-right: 4px;
	}
	.table-view-body {
		flex: 1 1 auto;
		min-height: 0;
		padding: 10px;
		display: flex;
		flex-direction: column;
	}
	.table-view-body > * {
		flex: 1 1 auto;
		min-height: 0;
	}
	@media (max-width: 768px) {
		.table-view-dialog {
			width: 100vw;
			border-radius: 0;
		}
	}
	.table-view-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		color: #607d8b;
	}
</style>
