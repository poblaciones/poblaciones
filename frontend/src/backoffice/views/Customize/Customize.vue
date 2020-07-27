<template>
	<div v-if="Work">
		<title-bar title="Personalizar" :help="`<p>En esta sección se indican opciones que modifican la vista personalizada que se genera para la cartografía.
			</p>`" />
			<div class="app-container">
			<invoker ref="invoker"></invoker>

			<search-popup ref="searchPopup" @selected="regionSelected" searchType="r" />
			<search-popup ref="addMetricPopup" @selected="metricSelected" searchType="m" />

			<relocate @relocated="relocated" ref="Relocate" :useOverlay="false" :useMarker="false"></relocate>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-card>
						<md-card-header>
							<div class="md-title">
								Inicio
							</div>
						</md-card-header>
						<md-card-content>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100">
									Permite indicar dónde se sitúa el mapa al ingresar a la cartografía.

									Los cambios se harán efectivos al publicarse la cartografía.
								</div>
							</div>
									<div class="floatRadio largeOption">
									<md-radio v-model="Startup.Type" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="'D'"></md-radio>
								</div>
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Interactivo
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Al ingresar a la cartografía el mapa se ubicará en la zona del país en que se encuentre el visitante, determinado a partir de su dirección IP.
								</div>
							</div>

							<div class="floatRadio largeOption">
								<md-radio v-model="Startup.Type" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="'R'"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Región
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Define una zona en la cual iniciar la visualización a partir de una región conocida (ej. Provincia de Salta).
								</div>
								<div v-if="Startup.ClippingRegionItemId" class="md-layout-item md-size-75 md-small-size-100">
									<div class="infoRow">
										{{ Work.Startup.RegionExtraInfo }} &gt; {{ Work.Startup.RegionCaption }}.
									</div>
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" class="md-raised noLeftMargin" @click="search">
										{{ (Startup.ClippingRegionItemId ? 'Modificar' : 'Seleccionar') }}
									</md-button>
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-switch v-model="Startup.ClippingRegionItemSelected" :disabled="!Work.CanEdit || Startup.Type != 'R'" :class="(Startup.Type == 'R' ? 'md-primary' : '')" @change="Update">
										Utilizar la región como selección activa.
									</md-switch>
								</div>
							</div>
							<div class="floatRadio largeOption">
								<md-radio v-model="Startup.Type" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="'L'"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption">
									Fijo
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Inicia la cartografía en una ubicación fija, determinada por latitud, longitud y zoom.
								</div>
								<div v-if="Startup.Center" class="md-layout-item md-size-75 md-small-size-100">
									<div class="infoRow">
										Latitud: {{ Startup.Center.y
											}}. Longitud: {{ Startup.Center.x }}. Zoom: {{ Startup.Zoom }}.
									</div>
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" class="md-raised noLeftMargin" @click="relocate">
										{{ (Startup.Center ? 'Modificar' : 'Indicar') }}
									</md-button>
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
												<md-switch v-model="item.StartActive" class="md-primary" :disabled="!Work.CanEdit"
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
												<md-switch v-model="item.StartActive" class="md-primary" :disabled="!Work.CanEdit"
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
	</div>

</template>
<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import str from '@/common/js/str';
import arr from '@/common/js/arr';
import Relocate from '@/backoffice/components/Relocate.vue';
import SearchPopup from '@/backoffice/components/SearchPopup.vue';

export default {
	name: 'Customize',
	components: {
		Relocate,
		SearchPopup
	},
	data() {
		return {
			latitud: '',
			longitud: '',
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
		regionSelected(item) {
			this.Startup.ClippingRegionItemId = item.Id;
			this.Work.Startup.RegionCaption = item.Caption;
			this.Work.Startup.RegionExtraInfo = item.Extra;
			if (this.Startup.Type !== 'R') {
				this.Startup.Type = 'R';
			}
			this.Update();
		},
		search() {
			this.$refs.searchPopup.show();
		},
		addMetric() {
			this.$refs.addMetricPopup.show();
		},
		relocate() {
			var lat = null;
			var lon = null;
			if (this.Startup.Center) {
				lat = this.Startup.Center.y;
				lon = this.Startup.Center.x;
			} else {
				lat = -34.603722;
				lon = -58.381592;
			}
			var zoom = this.Startup.Zoom;
			this.$refs.Relocate.show(lat, lon, zoom);
		},
		relocated() {
			if (!this.Startup.Center) {
				this.Startup.Center = { srid: null, x: null, y: null };
			}
			this.Startup.Center.y = this.$refs.Relocate.newLat;
			this.Startup.Center.x = this.$refs.Relocate.newLon;
			this.Startup.Zoom = this.$refs.Relocate.newZoom;
			if (this.Startup.Type !== 'L') {
				this.Startup.Type = 'L';
			}
			this.Update();
		},
	}
};

</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-layout-item .md-size-15 {
    padding: 0 !important;
}

.md-layout-item .md-size-25 {
    padding: 0 !important;
}

.md-layout-item .md-size-20 {
    padding: 0 !important;
}

.md-layout-item .md-size-10 {
    padding: 0 !important;
}

.infoRow {
	margin-left: 8px;
	margin-top: 8px;
	margin-bottom: 6px;
	color: #666;
	border: 1px solid #e4e4e4;
	background-color: #efefef;
	padding: 2px 5px;
	border-radius: 3px;
}

.floatRadio {
	float: left;
  padding-top: 3px!important;
}

.paddedList {
	padding: 20px 60px 0px 60px !important;
}
.noLeftMargin {
	margin-left: 0px!important;
}

.largeOption {
	font-size: 18px;
  padding: 18px 0px 6px 12px;
}
.extraInfo {
	color: #777;
	font-size: 85%;
  font-style: italic;
}
</style>
