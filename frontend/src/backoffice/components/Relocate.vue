<template>
	<md-dialog :md-active.sync="openPopup">
		<md-dialog-title>
			Relocalizar
		</md-dialog-title>
		<md-dialog-content>
			<div>
				<p>
					Indique la ubicación:
				</p>
				<div id="map" style="width: 600px; height: 320px;">
					<div class="target" style="width: 0px; height: 30px; border-right: 1px solid #0c0c0c;"></div>
					<div class="target" style="width: 30px; height: 0px; border-top: 1px solid #0c0c0c;"></div>
					<div class="target" style="width: 30px; height: 30px; border: 1px solid #522020; border-radius: 15px;"></div>
				</div>
				<div style="margin-top: 20px; margin-bottom: -10px">
					<div class="md-layout md-gutter">
						<div class="md-layout-item md-size-20">
							<md-field>
								<label>Latitud</label>
								<md-input v-model="newLat"></md-input>
							</md-field>
						</div>
						<div class="md-layout-item md-size-10">
							<md-button class="md-icon-button" @click="swapValues" style="margin-top: 8px;"
												 title="Intercambiar latitud y longitud">
								<md-icon>import_export</md-icon>
							</md-button>
						</div>
						<div class="md-layout-item md-size-20">
							<md-field>
								<label>Longitud</label>
								<md-input v-model="newLon"></md-input>
							</md-field>
						</div>
						<div v-if="!useMarker" class="md-layout-item md-size-20">
							<md-field>
								<label>Zoom</label>
								<md-input v-model="newZoom"></md-input>
							</md-field>
						</div>
						<div class="md-layout-item md-size-10">
							<md-button class="md-icon-button" @click="goto" style="margin-top: 8px;"
												 title="Ir" :disabled="!(lat !== newLat || lon !== newLon || (!useMarker && zoom !== newZoom))">
								<md-icon>keyboard_arrow_right</md-icon>
							</md-button>
						</div>
					</div>
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
			<div>
				<md-button @click="openPopup = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Aceptar</md-button>
			</div>
		</md-dialog-actions>
	</md-dialog>
</template>
<script>
	import SegmentedMap from '@/public/classes/SegmentedMap';
	import GoogleMapsApi from '@/public/googleMaps/GoogleMapsApi';
	import h from '@/public/js/helper';
	import GeographyOverlay from '../classes/GeographyOverlay';

	export default {
		name: 'relocatePopup',
		components: {

		},
		mounted() {

		},
		computed: {
			Dataset() {
				return window.Context.CurrentDataset;
			},
		},
		methods: {
			updateMarkerPosition(latLng) {
				var la = latLng.lat();
				var lo = latLng.lng();
				if (la) la = parseFloat(la.toFixed(6));
				if (lo) lo = parseFloat(lo.toFixed(6));
				this.newLat = la;
				this.newLon = lo;
			},
			swapValues() {
				var a = this.newLat;
				this.newLat = this.newLon;
				this.newLon = a;
				this.goto();
			},
			goto() {
				var latLng = new google.maps.LatLng(this.newLat, this.newLon);
				if (this.marker) {
					this.marker.setPosition(latLng);
				} else {
					this.map.setZoom(parseFloat(this.newZoom));
				}
				this.map.setCenter(latLng);
			},

			revert() {
				this.newLat = this.lat;
				this.newLon = this.lon;
				var latLng = new google.maps.LatLng(this.lat, this.lon);

				this.updateMarkerPosition(latLng);
				if (this.marker) {
					this.marker.setPosition(latLng);
				}
				this.map.setCenter(latLng);
			},
			round(value, decimals) {
				return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
			},
			initialize() {
				var loc = this;
				var latLng = new google.maps.LatLng(this.lat, this.lon);
				var map = new google.maps.Map(document.getElementById('map'), {
					zoom: this.zoom,
					center: latLng,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				});
				if (this.useMarker) {
					var marker = new google.maps.Marker({
						position: latLng,
						title: 'Relocalizar',
						map: map,
						draggable: true
					});
					this.marker = marker;
				} else {
					this.marker = null;
				}
				this.map = map;
				if (this.useOverlay) {
					map.overlayMapTypes.insertAt(0, new GeographyOverlay(map,
						window.Context.GetTrackingLevelGeography().Id));
				}
				loc.updateMarkerPosition(latLng);

				if (this.useMarker) {
					google.maps.event.addListener(marker, 'drag', function () {
						loc.updateMarkerPosition(marker.getPosition());
					});
				} else {
					google.maps.event.addListener(map, 'bounds_changed', function (e) {
						var c = map.getCenter();
						loc.newLat = parseFloat(c.lat().toFixed(6));
						loc.newLon = parseFloat(c.lng().toFixed(6));
					});
					google.maps.event.addListener(map, 'zoom_changed', function (e) {
						loc.newZoom = map.getZoom();
					});
				}

				google.maps.event.addListener(map, 'click', function (e) {
					loc.updateMarkerPosition(e.latLng);
					if (loc.marker) {
						marker.setPosition(e.latLng);
					}
				});
			},
			show(lat, lon, zoom) {
				var loc = this;
				var defaultLocation = window.Context.Configuration.DefaultRelocateLocation;
				this.openPopup = true;
				if (!zoom || isNaN(zoom)) {
					zoom = 14;
				}
				if (!lat || isNaN(lat)) {
					lat = defaultLocation.Lat;
					zoom = 6;
				}
				if (!lon || isNaN(lon)) {
					lon = defaultLocation.Lon;
					zoom = 6;
				}
				this.lat = lat;
				this.lon = lon;
				this.zoom = zoom;
				this.newLat = lat;
				this.newLon = lon;
				this.newZoom = zoom;
				this.$nextTick(() => {
					loc.initialize();
				});
			},
			save() {
				this.$emit('relocated');
				this.openPopup = false;
			},
		},
		props: {
			// Esta propiedad establece si funciona como un popup de captación de posición
			// por marker o si apartir de la posición actual del mapa revuelve un lat, lon y zoom.
			useMarker: true,
			useOverlay: true
		},
		data() {
			return {
				lat: null,
				lon: null,
				zoom: null,
				newLat: null,
				newLon: null,
				newZoom: null,
				marker: null,
				openPopup: false,
				map: null,
			};
		},
	};
</script>


<style rel="stylesheet/scss" lang="scss" scoped>

	.target {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 100;
		transform: translate(-50%, -50%);
	}

</style>
