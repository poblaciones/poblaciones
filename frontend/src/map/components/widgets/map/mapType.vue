<template>
	<div>
			<mpBasemapButton @styleChanged="styleChanged" :toolbarStates="toolbarStates" :readonly="Embedded.Readonly" ref="selector"/>
	</div>
</template>

<script>
import axios from 'axios';
import arr from '@/common/framework/arr';
import err from '@/common/framework/err';
import color from '@/common/framework/color';
import mpBasemapButton from '@/map/components/controls/mpBasemapButton';
import session from '@/common/framework/session';

export default {
	name: 'mapType',
	components: {
		mpBasemapButton,
	},
	data() {
		return {
		};
	},
	mounted() {
		},

 computed: {
 		Embedded() {
				return window.Embedded;
			}
    },
	props: [
		 'toolbarStates'
	],
	methods: {
		styleChanged(styleId) {
			switch (styleId) {
				case 'default':
					window.SegMap.MapsApi.InteractiveChangeMapType("r");
					break;
				case 'satellite':
					window.SegMap.MapsApi.InteractiveChangeMapType("s");
					break;
				case 'streets':
					window.SegMap.MapsApi.InteractiveChangeMapType("c");
					break;
				case 'blank':
					window.SegMap.MapsApi.InteractiveChangeMapType("b");
					break;
			}
		},
		InitializeMapControl() {
			// Carga el tipo de mapa
			var rawStyle = window.SegMap.GetMapTypeState();
			switch (rawStyle) {
				case 'r':
					this.$refs.selector.selectMapStyleById('default');
					break;
				case 'h':
				case 's':
					this.$refs.selector.selectMapStyleById('satellite');
					break;
				case 'c':
					this.$refs.selector.selectMapStyleById('streets');
					break;
				case 'b':
					this.$refs.selector.selectMapStyleById('blank');
					break;
			}
			// Carga los layers de base
			arr.AddRange(this.$refs.selector.mapLayers, window.SegMap.toolbarStates.basemapMetrics);

		}
	},
};
</script>

<style scoped>

</style>

