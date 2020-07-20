<template>
	<div>
		<div ref="topImage" v-if="featureInfo.Image && isImageUrl(featureInfo.Image)"
				 :style="'background-image:url('
										+ featureInfo.Image + ');'"
				 class="topImage">
		</div>

		<div class='panel card panel-body'>
			<div v-on:click="doBack" v-if='featureInfo.back' class='hand' style='background-color:pink'>&lt;&lt; Volver al listado</div>
			<mp-close-button v-else v-on:click="doClose" />

			<h5 class="title"><mp-label :text="'' + title" /></h5>
			<div class='stats' style="padding-top: 8px">
				<span style="color: rgb(167, 167, 167);">{{ featureInfo.Type }}</span>
			</div>
			<hr class="moderateHr">
			<div class='item' v-if="featureInfo.Code && featureInfo.Title">
				Código: {{ val }}
			</div>
			<div v-for="(item, index) in featureInfo.Items" class='item' :key="index">
				{{ capitalize(item.Name) }}: <mp-label :text="getValue(item)" />
			</div>
			<div v-if="lat != 0 && lon != 0" class='pos'>Posición: {{ lat }},{{ lon }}.</div>
		</div>
	</div>
</template>

<script>
import h from '@/public/js/helper';

export default {
	name: 'featureInfo',
	props: [
		'featureInfo',
	],
	computed: {
		title() {
			if (this.featureInfo.Title) {
				return this.featureInfo.Title;
			} else if (this.featureInfo.Code) {
				return this.featureInfo.Code;
			}
			return '';
		},
		val() {
			return h.ensureFinalDot(this.isNullDash(this.featureInfo.Code));
		},
		lat() {
			if(this.featureInfo.position && this.featureInfo.position.Coordinate && this.featureInfo.position.Coordinate.Lat) {
				return h.trimNumberCoords(this.featureInfo.position.Coordinate.Lat);
			}
			return 0;
		},
		lon() {
			if(this.featureInfo.position && this.featureInfo.position.Coordinate && this.featureInfo.position.Coordinate.Lon) {
				return h.trimNumberCoords(this.featureInfo.position.Coordinate.Lon);
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
			window.Panels.Content.FeatureInfoKey = null;
			e.preventDefault();
			this.$emit('clickClose', e, this.featureInfo.Key.Id);
		},
		capitalize(name) {
			return h.capitalize(name);
		},
		isImageUrl(image) {
			if (image === null) {
				return false;
			}
			if (image.toLowerCase().startsWith("http") == false) {
				return false;
			}
			if (image.trim().indexOf(" ") !== -1) {
				return false;
			}
			return true;
		},
		isNullDash(str) {
			if (str === undefined || str === '' || str === null) {
				return '-';
			} else {
				return '' + str;
			}
		},
		getValue(item) {
			var val = item.Value;
			if (item.Caption !== null && item.Caption !== undefined) {
				val = item.Caption;
			}
			return this.isNullDash(val);
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
	padding-bottom: 10px;
	word-wrap: break-word;
}
.topImage {
	background-position: 50% 50%;
	height: 200px;
	width: 100%;
	background-size: cover;
}
</style>

