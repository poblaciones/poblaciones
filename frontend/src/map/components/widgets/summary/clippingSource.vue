<template>
	<div v-if="metadata" class="sourceInfo exp-hiddable-block mp-btn-group">
		<button type="button" :title="sourceTitle" @click="clickFuente" class="mp-btn mp-btn--icon"><i class="fas fa-link"></i></button>
	</div>
</template>

<script>

export default {
	name: 'clippingSourceInfo',
	components: {
 },
	props: [
    'metadata'
	],
	data() {
		return {
			work: {},
			sourceTitle: 'Fuente de habitantes, hogares y área',
		};
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
