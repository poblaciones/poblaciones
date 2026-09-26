<template>
	<TopPanel type="B"
						:metadata="metadata"
						:addToMapItems="addToMapItems"
						:backgroundColor="backgroundColor"
						ref="topPanel" />
</template>

<script>
import TopPanel from './topPanel';

// Wrapper fino: arma las props genéricas de topPanel.vue a partir de la
// delimitación activa (ruta /map/b<id>). Ver workPanel.vue para el análogo
// de cartografías. No pasa addToMapId ni work: el link de metadatos y el
// onboarding son exclusivos de work (topPanel.vue los deshabilita por type).
export default {
	name: 'boundaryPanel',
	components: {
		TopPanel
	},
	props: [
		'boundary',
		'backgroundColor'
	],
	computed: {
		metadata() {
			if (!this.boundary.Current) {
				return null;
			}
			var current = this.boundary.Current;
			return current.Versions[current.SelectedVersionIndex].Metadata;
		},
		addToMapItems() {
			if (!this.boundary.Current) {
				return [];
			}
			return [{
				Id: this.boundary.Current.Id,
				Name: this.boundary.Current.Name,
				Type: 'B',
				Versions: this.boundary.Current.Versions,
			}];
		}
	},
	methods: {
		onResize() {
			this.$refs.topPanel.onResize();
		}
	}
};
</script>
