<template>
	<div class="md-layout md-gutter">
		<div class="md-layout-item md-size-80 md-small-size-100">
			<invoker ref="invoker"></invoker>
			<search-popup ref="searchPopup" @selected="regionSelected" :currentWork="Work.properties.Id" searchType="r" />
			<relocate @relocated="relocated" ref="Relocate" :useOverlay="false" :useMarker="false"></relocate>

			<md-card>
				<md-card-header>
					<div class="md-title">
						Posición de inicio
					</div>
				</md-card-header>
				<md-card-content>
					<div class="md-layout">
						<div class="md-layout-item md-size-100 md-small-size-100">
							Permite indicar dónde se sitúa el mapa al ingresarse a la cartografía.

							Los cambios se harán efectivos al publicarse la cartografía.
						</div>

						<div class="md-layout-item md-size-50 md-small-size-100">

							<div class="floatRadio largeOption largeText">
								<md-radio v-model="Startup.Type" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="'E'"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption largeText">
									Extensión (predeterminado)
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Comienza la visualización mostrando el área de información total de la cartografía.
								</div>
							</div>

						</div>
						<div class="md-layout-item md-size-50 md-small-size-100">

							<div class="floatRadio largeOption largeText">
								<md-radio v-model="Startup.Type" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="'D'"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption largeText">
									Interactiva
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Al ingresar se ubicará en la zona del país en que se encuentre el visitante, determinado a partir de su dirección IP.
								</div>
							</div>
						</div>

						<div class="md-layout-item md-size-50 md-small-size-100">
							<div class="floatRadio largeOption largeText">
								<md-radio v-model="Startup.Type" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="'R'"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption largeText">
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
									<md-switch v-model="Startup.ClippingRegionItemSelected" :disabled="!Work.CanEdit() || Startup.Type != 'R'" :class="(Startup.Type == 'R' ? 'md-primary' : '')" @change="Update">
										Utilizar como selección activa.
									</md-switch>
								</div>
							</div>
						</div>
						<div class="md-layout-item md-size-50 md-small-size-100">
							<div class="floatRadio largeOption largeText">
								<md-radio v-model="Startup.Type" :disabled="!Work.CanEdit()" class="md-primary" @change="Update" :value="'L'"></md-radio>
							</div>
							<div class="md-layout md-gutter">
								<div class="md-layout-item md-size-100 md-small-size-100 largeOption largeText">
									Ubicación fija
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									Inicia la cartografía en una ubicación fija, determinada por latitud, longitud y zoom.
								</div>
								<div v-if="Startup.Center" class="md-layout-item md-size-75 md-small-size-100">
									<div class="infoRow">
										Latitud: {{
					Startup.Center.y
										}}. Longitud: {{ Startup.Center.x }}. Zoom: {{ Startup.Zoom }}.
									</div>
								</div>
								<div class="md-layout-item md-size-100 md-small-size-100">
									<md-button v-if="Work.CanEdit()" class="md-raised noLeftMargin" @click="relocate">
										{{ (Startup.Center ? 'Modificar' : 'Indicar') }}
									</md-button>
								</div>
							</div>
						</div>
					</div>
				</md-card-content>
			</md-card>
		</div>
	</div>
</template>
<script>

import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';
import arr from '@/common/framework/arr';
import Relocate from '@/backoffice/components/Relocate.vue';
import SearchPopup from '@/backoffice/components/SearchPopup.vue';

export default {
	name: 'Startup',
	components: {
		Relocate,
		SearchPopup
	},
	data() {
		return {
			latitud: '',
			longitud: ''
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
			this.$refs.invoker.doSave(this.Work,
				this.Work.UpdateStartup);
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

.paddedList {
	padding: 20px 60px 0px 60px !important;
}
.noLeftMargin {
	margin-left: 0px!important;
}


.extraInfo {
	color: #777;
	font-size: 85%;
  font-style: italic;
}
</style>
