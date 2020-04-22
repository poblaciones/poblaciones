<template>
	<div v-if="open" style='max-width: 250px; overflow-y:auto' v-bind:style="{ 'background-color': myColor }">
		<div style='padding-bottom: 0px; padding-top:2px; font-size: 9px; text-transform: uppercase'>{{ dt.Type }}</div>;
		<div style='padding-bottom: 3px; padding-top:2px; font-size: 15px; font-weight: 500'>{{ title }}</div>
		<div style='max-height: 300px;'>
			{{ codeTitle }}
			<span v-html="lines"></span>
			<div style='padding-top: 11px; font-size: 11px;text-align: center'>Posición: {{ lat }},{{ lon }}.</div>
		</div>
	</div>
</template>

<script>
import h from '@/public/js/helper';

export default {
	name: 'leftPanel',
	props: [
		'dt',
	],
	// components: {
	// },
	data() {
		return {
			open: true,
			myColor: '#' + (Math.random() * 0xFFFFFF << 0).toString(16),
			fid: 0,
		};
	},
	// created () {
	// },
	// beforeDestroy () {
	// },
	mounted() {
		this.fid = this.dt.fid;
	},
	computed: {
		title() {
			if (this.dt.Title) {
				return this.dt.Title;
			} else if (this.dt.Code) {
				return this.dt.Code;
			}
			return '';
		},
		codeTitle() {
			if (this.dt.Code && this.dt.Title) {
				return this.InfoRequestedFormatLine({ Name: 'Código', Value: this.dt.Code });
			}
			return '';
		},
		lines() {
			let ret = '';
			const loc = this;
			this.dt.Items.forEach(function (item) {
				ret += loc.InfoRequestedFormatLine(item);
			});
			return ret;
		},
		lat() {
			return h.trimNumber(this.dt.position.Coordinate.Lat);
		},
		lon() {
			return h.trimNumber(this.dt.position.Coordinate.Lon);
		},
	},
	methods: {
		InfoRequestedFormatLine(item) {
			var text = "<div style='padding-top: 4px'>";
			var val = (item.Caption !== null && item.Caption !== undefined ? item.Caption : item.Value);
			if (val === null) {
				val = '-';
			}
			val = (val + '').trim();
			if (val.length > 0 && val.substr(val.length - 1) !== '.') {
				val += '.';
			}
			text += h.capitalize(item.Name) + ': ' + val;
			text += '</div>';
			return text;
		},
	},
};
</script>

<style scoped>
</style>

