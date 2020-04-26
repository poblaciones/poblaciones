<template>
	<div v-if="open" style='overflow-y:auto'
			 v-bind:style="{ 'background-color': myColor }">
		<div class="panel card panel-body">
			<h4 class="title">{{ title }}</h4>
			<div class='stats' style="padding-top: 8px"><a href="aa" style="color: rgb(167, 167, 167);">{{ dt.Type }}</a></div>
			<hr class="moderateHr">
			<div style='font-weight: 300'>
				<span v-html='codeTitle'></span>
				<span v-html='lines'></span>			<div style='padding-top: 11px; font-size: 11px;text-align: center'>Posición: {{ lat }},{{ lon }}.</div>
			</div>
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
			myColor: 'pink',
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
		// myColor() {
		// 	return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
		// },
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
			var text = "<div style='padding-top: 12px'>";
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

