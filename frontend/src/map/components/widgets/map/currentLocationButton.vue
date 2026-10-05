<template>
	<div v-if="hasGeolocation" class="clButton inMapButton" id="clButton" title="Ir a la ubicación actual" @click="geolocate()">
			<i class="far fa-dot-circle" />
	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';

export default {
	name: 'clButton',
	components: {
	},
	data() {
    return {
    };
  },
		props: {
		},
   methods: {
		 geolocate() {
			 if (navigator.geolocation) {
				 navigator.geolocation.getCurrentPosition(function (position) {
					 var coord = { Lat: position.coords.latitude, Lon: position.coords.longitude };
					 window.SegMap.SetMyLocation(coord);
				 });
			 }
		 },
		 hasGeolocation() {
			 return navigator && navigator.geolocation;
		 },

	},
};
</script>

<style scoped>
	.clButton {
		right: 11px;
		bottom: 98px;
	}
</style>

