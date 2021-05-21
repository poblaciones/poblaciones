<template>
	<div>
		<div class="md-layout md-gutter">
			<invoker ref="invoker"></invoker>
			<search-popup ref="addMetricPopup" @selected="metricSelected" searchType="m" />

			<div class="md-layout-item md-size-80 md-small-size-100">
				<md-card>
					<md-card-header>
						<div class="md-title">
							Indicadores predeterminados
						</div>
					</md-card-header>
					<md-card-content>
						<div class="md-layout md-gutter">
							<div class="md-layout-item md-size-100 md-small-size-100">
								Establezca qué indicadores deben estar activos (visibles en el mapa) al ingresar a la cartografía.
							</div>
							<div class="md-layout-item md-size-80 md-small-size-100">
								<md-table v-model="metricList" md-sort="Caption" md-sort-order="asc" md-card="">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell md-label="Nombre">{{ item.Caption }}</md-table-cell>
										<md-table-cell md-label="¿Activo?" class="mpNoWrap">
											<md-switch v-model="item.StartActive" class="md-primary" :disabled="!Work.CanEdit()"
																 @change="value => SetActive(value, item)"></md-switch>
										</md-table-cell>
									</md-table-row>
								</md-table>
							</div>
						</div>
					</md-card-content>
				</md-card>
			</div>
		</div>
		<div class="md-layout md-gutter">
			<div class="md-layout-item md-size-80 md-small-size-100">
				<md-card>
					<md-card-header>
						<div class="md-title">
							Indicadores adicionales
						</div>
					</md-card-header>
					<md-card-content>
						<div class="md-layout md-gutter">
							<div class="md-layout-item md-size-100 md-small-size-100">
								En forma complementaria, pueden ofrecerse en el panel superior indicadores con información disponible en el sitio tales como variables demográficas generales o indicadores de infraestructura.
							</div>
							<div v-if="Work.CanEdit()" class="md-layout-item md-size-40 md-small-size-50">
								<md-button @click="addMetric()">
									<md-icon>add_circle_outline</md-icon>
									Agregar indicador
								</md-button>
							</div>
							<div class="md-layout-item md-size-40 md-small-size-50" style="position: relative; padding-top: 6px">
								<img style="float: right" src="/static/img/parts/metrics.png" />
								<div class="highlightBox" style="right: 14px; width: 90px; height: 32px; top: 8px;"></div>
							</div>
							<div class="md-layout-item md-size-80 md-small-size-100">
								<md-table v-model="Work.ExtraMetrics" md-sort="Caption" md-sort-order="asc" md-card="">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell md-label="Nombre">{{ item.Caption }}</md-table-cell>
										<md-table-cell md-label="Activo al inicio">
											<md-switch v-model="item.StartActive" class="md-primary" :disabled="!Work.CanEdit()"
																 @change="value => handleToggle(value, item)"></md-switch>
										</md-table-cell>
										<md-table-cell md-label="Acciones" class="mpNoWrap">
											<div v-if="Work.CanEdit()">
												<md-button class="md-icon-button" title="Quitar fuente" @click="removeMetric(item)">
													<md-icon>delete</md-icon>
												</md-button>
											</div>
										</md-table-cell>
									</md-table-row>
								</md-table>
							</div>
						</div>
					</md-card-content>
				</md-card>
			</div>
		</div>
	</div>
</template>
<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import str from '@/common/js/str';
import arr from '@/common/js/arr';
import SearchPopup from '@/backoffice/components/SearchPopup.vue';

export default {
	name: 'Metrics',
	components: {
		SearchPopup
	},
	data() {
		return {
			metricList: []
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		Startup() {
			return this.Work.properties.Startup;
		}
	},
	mounted() {
		var loc = this;
		this.Work.GetMetricsList().then(
			function (list) {
				for (var n = 0; n < list.length; n++) {
					list[n].StartActive = loc.IsActive(list[n].Id);
				}
				loc.metricList = list;
			});
	},
	methods: {
		Update() {
			this.$refs.invoker.do(this.Work,
				this.Work.UpdateStartup);
		},
		IsActive(metricId) {
			var activeMetrics = this.Work.properties.Startup.ActiveMetrics;
			var activeMetricsList = (activeMetrics ? activeMetrics.split(',') : []);
			return activeMetricsList.indexOf('' + metricId) != -1;
		},
		SetActive(value, metric) {
			var activeMetrics = this.Work.properties.Startup.ActiveMetrics;
			var activeMetricsList = (activeMetrics ? activeMetrics.split(',') : []);
			var n = activeMetricsList.indexOf('' + metric.Id);
			if (n !== -1) {
				arr.RemoveAt(activeMetricsList, n);
			}
			if (value) {
				activeMetricsList.push(metric.Id);
			}
			this.Work.properties.Startup.ActiveMetrics = activeMetricsList.join(',');
			this.Update();
		},
		handleToggle(value, metric) {
			var loc = this;
			this.$refs.invoker.do(this.Work,
				this.Work.UpdateExtraMetricStart, metric);
		},
		metricSelected(metric) {
			for (var n = 0; n < this.Work.ExtraMetrics.length; n++) {
				if (this.Work.ExtraMetrics[n].Id === metric.Id) {
					return;
				}
			}
			var loc = this;
			this.$refs.invoker.do(this.Work,
				this.Work.AppendExtraMetric, metric).then(
					function () {
						loc.$set(metric, 'StartActive', false);
						loc.Work.ExtraMetrics.push(metric);
					});
		},
		removeMetric(metric) {
			var loc = this;
			this.$refs.invoker.confirm('Eliminar indicador', 'El indicador seleccionado será eliminado',
				function () {
					loc.$refs.invoker.do(
						loc.Work,
						loc.Work.RemoveExtraMetric, metric).then(
							function () {
								arr.Remove(loc.Work.ExtraMetrics, metric);
							});
				});
		},
		search() {
			this.$refs.searchPopup.show();
		},
		addMetric() {
			this.$refs.addMetricPopup.show();
		}
	}
};

</script>

<style rel="stylesheet/scss" lang="scss" scoped>



</style>
