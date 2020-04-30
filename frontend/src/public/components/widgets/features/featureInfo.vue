<template>
	<div class='panel card panel-body'>
		<div v-on:click="doBack" v-if='dt.back' class='hand' style='background-color:pink'>&lt;&lt; Volver al listado</div>
		<mp-close-button v-else v-on:click="doClose" />

		<h4 class="title">{{ title }}</h4>
		<div class='stats' style="padding-top: 8px"><a href="aa" style="color: rgb(167, 167, 167);">{{ dt.Type }}</a></div>
		<hr class="moderateHr">
		<div class='item' v-if="dt.Code && dt.Title">
			Código: {{ val }}
		</div>
		<div v-for="item in dt.Items" class='item' :key="item.Name">
			{{ capitalize(item.Name) }}: {{ getValue(item) }}
		</div>
		<div v-if="lat != 0 && lon != 0" class='pos'>Posición: {{ lat }},{{ lon }}.</div>
	</div>
</template>

<script>
import h from '@/public/js/helper';

export default {
	name: 'featureInfo',
	props: [
		'dt',
	],
	// components: { },
	// data() { },
	// beforeDestroy () { },
	computed: {
		title() {
			if (this.dt.Title) {
				return this.dt.Title;
			} else if (this.dt.Code) {
				return this.dt.Code;
			}
			return '';
		},
		val() {
			return h.ensureFinalDot(this.isNullDash(this.dt.Code));
		},
		lat() {
			if(this.dt.position && this.dt.position.Coordinate && this.dt.position.Coordinate.Lat) {
				return h.trimNumber(this.dt.position.Coordinate.Lat);
			}
			return 0;
		},
		lon() {
			if(this.dt.position && this.dt.position.Coordinate && this.dt.position.Coordinate.Lon) {
				return h.trimNumber(this.dt.position.Coordinate.Lon);
			}
			return 0;
		},
	},
	methods: {
		doBack(e) {
			e.preventDefault();
			this.$emit('clickBack', e);
		},
		doClose(e) {
			window.Panels.Content.FeatureInfo = null;
			e.preventDefault();
			this.$emit('clickClose', e, this.dt.fid);
		},
		capitalize(name) {
			return h.capitalize(name);
		},
		isNullDash(str) {
			if (str === undefined || str === null) {
				return '-';			}
			return str;
		},
		getValue(item) {
			var val = item.Value;
			if(item.Caption !== null && item.Caption !== undefined) {
				val = item.Caption;
			}
			return h.ensureFinalDot(this.isNullDash(val));
		},
	},
};
</script>

<style scoped>
.type {
	padding-bottom: 0px;
	padding-top: 2px;
	font-size: 9px;
	text-transform: uppercase;
	text-align: center;
}
.pos {
	padding-top: 11px;
	font-size: 11px;
	text-align: center;
}
.item {
	padding-top: 1px;
	padding-bottom: 10px
}
</style>

