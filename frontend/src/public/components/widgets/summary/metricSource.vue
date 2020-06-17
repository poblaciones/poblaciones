<template>
  <div v-if="metric">
    <div class="sourceInfo">
      <a href="#" v-on:click="clickDescargar" style="color: #a7a7a7"><download-icon title="Descargar"/> Descargar</a>
      &nbsp;
      <a href="#" :title="'Fuente de ' + metric.properties.Name"
					v-on:click="clickFuente" style="color: #a7a7a7">
				<link-icon />
				Fuente
			</a>
    </div>
  </div>
</template>

<script>
import DownloadIcon from 'vue-material-design-icons/download.vue';
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'metricSourceInfo',
	components: {
    DownloadIcon,
		LinkIcon
	},
	props: [
    'metric',
    'clipping'
	],
	data() {
		return {
			work: {},
		};
	},
  methods: {
		clickDescargar(e) {
			e.preventDefault();
			window.Popups.MetricDownload.show(this.metric, this.clipping);
		},
		clickFuente(e) {
			e.preventDefault();
			window.Popups.WorkMetadata.showByMetric(this.metric);
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
