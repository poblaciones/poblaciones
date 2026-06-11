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
				<div style="position: relative; width: 600px; height: 320px;">
				<div id="relocate-map" style="width: 600px; height: 320px;">
				</div>
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
							<md-button class="md-icon-button" @click="swapValues" style="margin-top: 8px;">
								<md-icon>import_export</md-icon>
								<md-tooltip md-direction="bottom">Intercambiar latitud y longitud</md-tooltip>
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
												  :disabled="!(lat !== newLat || lon !== newLon || (!useMarker && zoom !== newZoom))">
								<md-icon>keyboard_arrow_right</md-icon>
								<md-tooltip md-direction="bottom">Ir</md-tooltip>
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
	import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import h from '@/map/js/helper';
	import str from '@/common/framework/str';
	import GeographyOverlay from '../classes/GeographyOverlay';

	const BASEMAP_URL = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png';
	const BASEMAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

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
				var la = latLng.lat;
				var lo = latLng.lng;
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
				var latLng = L.latLng(this.newLat, this.newLon);
				if (this.marker) {
					this.marker.setLatLng(latLng);
					this.map.panTo(latLng);
				} else {
					this.map.setView(latLng, parseFloat(this.newZoom));
				}
			},
			revert() {
				this.newLat = this.lat;
				this.newLon = this.lon;
				var latLng = L.latLng(this.lat, this.lon);
				this.updateMarkerPosition(latLng);
				if (this.marker) {
					this.marker.setLatLng(latLng);
				}
				this.map.panTo(latLng);
			},
			round(value, decimals) {
				return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
			},
			initialize() {
				var loc = this;

				// Destruye el mapa anterior si existe
				if (this.map) {
					this.map.remove();
					this.map = null;
					this.marker = null;
				}

				var latLng = L.latLng(this.lat, this.lon);

				var map = L.map('relocate-map', {
					center: latLng,
					zoom: this.zoom,
					zoomControl: true,
					attributionControl: true
				});

				L.tileLayer(BASEMAP_URL, {
					attribution: BASEMAP_ATTRIBUTION,
					maxZoom: 20
				}).addTo(map);

				if (this.useMarker) {
					var marker = L.marker(latLng, { draggable: true });
					marker.addTo(map);
					this.marker = marker;
				} else {
					this.marker = null;
				}

				if (this.useOverlay) {
					new GeographyOverlay(window.Context.GetTrackingLevelGeography().Id).addTo(map);
				}

				this.map = map;
				loc.updateMarkerPosition(latLng);

				if (this.useMarker) {
					marker.on('drag', function () {
						loc.updateMarkerPosition(marker.getLatLng());
					});
				} else {
					map.on('move', function () {
						var c = map.getCenter();
						loc.newLat = parseFloat(c.lat.toFixed(6));
						loc.newLon = parseFloat(c.lng.toFixed(6));
					});
					map.on('zoomend', function () {
						loc.newZoom = map.getZoom();
					});
				}

				map.on('click', function (e) {
					loc.updateMarkerPosition(e.latlng);
					if (loc.marker) {
						loc.marker.setLatLng(e.latlng);
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
			// por marker o si a partir de la posición actual del mapa devuelve un lat, lon y zoom.
			useMarker: {
				type: Boolean, default: true
			},
			useOverlay: {
				type: Boolean, default: true
			},
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

</style>
