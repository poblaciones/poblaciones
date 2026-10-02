<template>
	<TopPanel type="B"
						:metadata="metadata"
						:addToMapItems="addToMapItems"
						:backgroundColor="backgroundColor"
						ref="topPanel" />
</template>

<script>
import TopPanel from './topPanel';

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
