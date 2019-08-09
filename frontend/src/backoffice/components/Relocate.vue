<template>
	<md-dialog :md-active.sync="openPopup">
		<md-dialog-title>
			Relocalizar
		</md-dialog-title>

		<md-dialog-content>
			<div>
				<p>
				Indique la nueva ubicación del elemento.
				</p>
				<div id="map" style="width: 600px; height: 320px;"></div>
				<div style="margin-top: 20px; margin-bottom: -10px">
					<div class="md-layout md-gutter">
						<div class="md-layout-item md-size-30">
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
						<div class="md-layout-item md-size-30">
							<md-field>
								<label>Longitud</label>
								<md-input v-model="newLon"></md-input>
							</md-field>
						</div>
						<div class="md-layout-item md-size-30">
							<md-button class="md-icon-button" @click="goto" style="margin-top: 8px;"
												 title="Ir" :disabled="lat === newLat && lon === newLon">
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
			this.marker.setPosition(latLng);
			this.map.setCenter(latLng);
		},

		revert() {
			this.newLat = this.lat;
			this.newLon = this.lon;
			var latLng = new google.maps.LatLng(this.lat, this.lon);

			this.updateMarkerPosition(latLng);
			this.marker.setPosition(latLng);
			this.map.setCenter(latLng);
		},
		round(value, decimals) {
			return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
		},
		initialize() {
			var loc = this;
			var latLng = new google.maps.LatLng(this.lat, this.lon);
			var map = new google.maps.Map(document.getElementById('map'), {
				zoom: 14,
				center: latLng,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			});

			var marker = new google.maps.Marker({
				position: latLng,
				title: 'Relocalizar',
				map: map,
				draggable: true
			});
			this.marker = marker;
			this.map = map;
			map.overlayMapTypes.insertAt(0, new GeographyOverlay(map,
							window.Context.GetTrackingLevelGeography().Id));

			// Update current position info.
			loc.updateMarkerPosition(latLng);

			// Add dragging event listeners.
			google.maps.event.addListener(marker, 'dragstart', function() {
				//updateMarkerAddress('Dragging...');
			});

			google.maps.event.addListener(marker, 'drag', function() {
				//updateMarkerStatus('Dragging...');
				loc.updateMarkerPosition(marker.getPosition());
			});

			google.maps.event.addListener(marker, 'dragend', function() {
				//loc.updateMarkerStatus('Drag ended');
			});

			google.maps.event.addListener(map, 'click', function(e) {
				loc.updateMarkerPosition(e.latLng);
				marker.setPosition(e.latLng);
			});
		},
		show(lat, lon) {
			var loc = this;
			this.openPopup = true;
			this.$nextTick(() => {
				loc.initialize();
			});
			this.lat = lat;
			this.lon = lon;
			this.newLat = lat;
			this.newLon = lon;
		},
		save() {
			this.$emit('relocated');
			this.openPopup = false;
		},
	},
	props: {
  },
	data() {
		return {
			lat: null,
			lon: null,
			newLat: null,
			newLon: null,
			marker: null,
			openPopup: false,
			map: null,
		};
	},
};
</script>
