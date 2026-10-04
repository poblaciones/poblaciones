<template>
  <span v-if="metadata">
		<span class="exp-hiddable-block">
			<button type="button" :title="sourceTitle" :aria-label="sourceTitle" @click="clickFuente" class="mp-btn"><i class="fas fa-link"></i></button>
		</span>
  </span>
</template>

<script>

export default {
	name: 'clippingSelectionSource',
	components: {
	},
	props: [
    'metadata',
    'region'
	],
	data() {
		return {
			work: {},
		};
	},
	computed: {
		sourceTitle() {
			return 'Fuente de delimitación para ' + this.region.Name;
		}
	},
  methods: {
		clickFuente(e) {
			e.preventDefault();
			window.Popups.ClippingMetadata.show(this.metadata, this.sourceTitle);
		},
	},
};
</script>

<style scoped>

</style>
