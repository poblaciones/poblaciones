<template>
	<TopPanel type="W"
						:metadata="metadata"
						:addToMapItems="addToMapItems"
						:addToMapId="addToMapId"
						:work="work"
						:backgroundColor="backgroundColor"
						ref="topPanel" />
</template>

<script>
import TopPanel from './topPanel';

// Wrapper fino: arma las props genéricas de topPanel.vue (que resuelve el
// 100% de la parte visual del zócalo) a partir del work activo. Ver
// boundaryPanel.vue para el análogo de delimitaciones.
export default {
	name: 'workPanel',
	components: {
		TopPanel
	},
	props: [
		'work',
		'backgroundColor'
	],
	computed: {
		metadata() {
			if (!this.work.Current) {
				return null;
			}
			return this.work.Current.Metadata;
		},
		addToMapItems() {
			if (!this.work.Current) {
				return [];
			}
			return this.work.Current.Metrics;
		},
		addToMapId() {
			if (!this.work.Current) {
				return null;
			}
			return this.work.Current.Id;
		}
	},
	methods: {
		onResize() {
			this.$refs.topPanel.onResize();
		}
	}
};
</script>
