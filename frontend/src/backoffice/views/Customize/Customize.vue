<template>
	<div v-if="Work">
		<title-bar title="Personalizar" :help="`<p>En esta sección se indican opciones que modifican la vista personalizada que se genera para la cartografía.
			</p>`" />
			<div class="app-container">
			<invoker ref="invoker"></invoker>
			<search-popup ref="searchPopup" @selected="regionSelected" />
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
									Dinámico
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
										{{ Work.StartupExtraInfo.RegionExtraInfo }} &gt; {{ Work.StartupExtraInfo.RegionCaption }}.
									</div>
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" class="md-raised" @click="search">
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
									Ubicación
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
									<md-button v-if="Work.CanEdit()" class="md-raised" @click="relocate">
										{{ (Startup.Center ? 'Modificar' : 'Indicar') }}
									</md-button>
								</div>
							</div>
						</md-card-content>
					</md-card>
					<md-card v-if="false">
						<md-card-header>
							<div class="md-title">Indicadores
							</div>
						</md-card-header>
						<md-card-content>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100">
									Seleccione los indicadores que deben estar activos en el visor al ingresar a la cartografía. Adicionalmente, puede agregar indicadores de otras cartografías al listado de indicadores.
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" class="md-raised">
										Agregar
									</md-button>
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
	methods: {
		Update() {
			// Valida latitud y longitud.
			this.$refs.invoker.do(this.Work,
					this.Work.UpdateStartup);
			return true;
		},
		regionSelected(item) {
			this.Startup.ClippingRegionItemId = item.id;
			this.Work.StartupExtraInfo.RegionCaption = item.caption;
			this.Work.StartupExtraInfo.RegionExtraInfo = item.extra;
			if (this.Startup.Type !== 'R') {
				this.Startup.Type = 'R';
			}
			this.Update();
		},
		search() {
			this.$refs.searchPopup.show();
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
