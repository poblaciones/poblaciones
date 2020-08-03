<template>
  <span v-if="metadata">
    <span class="sourceInfo exp-hiddable-block">
			<a href="#" :title="'Fuente de delimitación para ' + region.Name"
					v-on:click="clickFuente" style="color: #a7a7a7">
				<link-icon style="font-size: 13px; padding-top: 20px;" :title="'Fuente de delimitación para ' + region.Name" />
			</a>
    </span>
  </span>
</template>

<script>
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'clippingSelectionSource',
	components: {
		LinkIcon,
	},
	props: [
    'metadata',
    'region'
	],
	data() {
		return {
			work: {},
			showDescargar: false,
		};
	},
  methods: {
		clickDescargar(e) {
			e.preventDefault();
			this.showDescargar = true;
		},
		closeDescargar() {
			this.showDescargar = false;
		},
		clickFuente(e) {
			e.preventDefault();
			window.Popups.ClippingMetadata.show(this.metadata);
		},
	},
};
</script>

<style scoped>
	.sourceInfo {
		font-size: .5em;
	}

</style>
