<template>
	<div class='info'>
		<div v-on:click="doBack" v-if='dt.back' class='hand' style='background-color:pink'>&lt;&lt; Volver al listado</div>
		<div v-on:click="doClose" v-else class='fa fa-times hand' style='float:right;margin:5px'></div>
		<div class='type'>{{ dt.Type }}</div>
		<div class='title'>{{ title }}</div>
		<div class='item' v-if="dt.Code && dt.Title">
			Código: {{ val }}
		</div>
		<span v-for="item in dt.Items" :key="item.Name">
			<div class='item'>
				{{ capitalize(item.Name) }}: {{ getValue(item) }}
			</div>
		</span>
		<div v-if="lat != 0 && lon != 0" class='pos'>Posición: {{ lat }},{{ lon }}.</div>
	</div>
</template>

<script>
import h from '@/public/js/helper';

export default {
	name: 'infoPanel',
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
		doBack() {
			this.$parent.doCloseInfo();
		},
		doClose() {
			this.$parent.doClose(this.dt.fid);
		},
		capitalize(name) {
			return h.capitalize(name);
		},
		isNullDash(str) {
			if (str === undefined || str === null) {
				return '-';
			}
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
.info {
	border-radius: 6px;
	border: solid 1px;
	margin:4px;
	overflow-y:auto;
}
.type {
	padding-bottom: 0px;
	padding-top: 2px;
	font-size: 9px;
	text-transform: uppercase;
	text-align: center;
}
.title {
	padding-bottom: 3px;
	padding-top: 2px;
	font-size: 15px;
	font-weight: 500;
	text-align: center;
	font-weight: bold;
}
.pos {
	padding-top: 11px;
	font-size: 11px;
	text-align: center;
}
.item {
	margin-left: 10px;
	padding-top: 4px
}
</style>

