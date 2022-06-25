<template>
  <div class="sourceInfo exp-hiddable-block">
    <a href="#" @click="clickDescargar" style="color: #a7a7a7"><download-icon title="Descargar"/> Descargar</a>
    &nbsp;
    <a href="#" :title="sourceTitle"
				@click="clickFuente" style="color: #a7a7a7">
			<link-icon />
			Fuente
		</a>
  </div>
</template>

<script>
import DownloadIcon from 'vue-material-design-icons/Download.vue';
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'sourceLinks',
	components: {
    DownloadIcon,
		LinkIcon
	},
	props: [
		'sourceTitle',
	],
	data() {
		return {
			work: {},
		};
	},
  methods: {
		clickDescargar(e) {
			e.preventDefault();
			this.$emit("clickDownload", e);
		},
		clickFuente(e) {
			e.preventDefault();
			this.$emit("clickSource", e);
		},
	},
};
</script>

<style scoped>
.sourceInfo
{
  padding-top: 6px;
  font-size: 12px;
}

</style>
