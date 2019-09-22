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
    <div style="position: absolute">
			<WorkMetricMetadata ref="showFuente" :metric="metric" :work="metric.SelectedVersion().Work" />
      <MetricDownload ref="showDescargar" :metric="metric" :clipping="clipping" />
    </div>
  </div>
</template>

<script>
import WorkMetricMetadata from '@/public/components/popups/workMetricMetadata';
import MetricDownload from '@/public/components/popups/metricDownload';
import DownloadIcon from 'vue-material-design-icons/download.vue';
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'metricSourceInfo',
	components: {
    DownloadIcon,
		WorkMetricMetadata,
		LinkIcon,
		MetricDownload
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
			this.$refs.showDescargar.show();
		},
		clickFuente(e) {
			e.preventDefault();
			this.$refs.showFuente.show();
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
