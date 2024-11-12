<template>
  <div v-if="metadata">
    <div class="sourceInfo exp-hiddable-block">
			<a href="#" @click="clickFuente"
				 :title="sourceTitle" style="color: #a7a7a7">
				<link-icon />
				Fuente
			</a>
    </div>
  </div>
</template>

<script>
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'clippingSourceInfo',
	components: {
   LinkIcon,
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
.sourceInfo
{
  position: absolute;
  top: 12px;
  right: 0px;
  font-size: 12px;
}

</style>
