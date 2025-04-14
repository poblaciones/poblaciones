<template>
	<div>
		<WorkMetadata ref="showFuente" :backgroundColor="backgroundColor" />
		<ClippingMetadata ref="showClippingMetadata" :backgroundColor="backgroundColor" />
		<CompareMetadata ref="showCompareMetadata" :backgroundColor="backgroundColor" />
		<MetricDownload ref="showMetricDownload" :backgroundColor="backgroundColor" />
		<BoundaryDownload ref="showBoundaryDownload" :backgroundColor="backgroundColor" />
		<Embedding ref="showEmbedding" :backgroundColor="backgroundColor" />
		<BoundaryCustomize ref="showBoundaryCustomize" :backgroundColor="backgroundColor" />
		<MetricCustomize ref="showCustomize" :backgroundColor="backgroundColor" />
		<AddMetric ref="addMetric" :backgroundColor="backgroundColor" />
		<AddMetric2 ref="addMetric2" :backgroundColor="backgroundColor" />
	</div>
</template>

<script>
import WorkMetadata from '@/public/components/popups/workMetadata';
import ClippingMetadata from '@/public/components/popups/clippingMetadata';
import CompareMetadata from '@/public/components/popups/compareMetadata';
import MetricCustomize from '@/public/components/popups/metricCustomize';
import BoundaryCustomize from '@/public/components/popups/boundaryCustomize';
import AddMetric2 from '@/public/components/popups/addMetric2';
import AddMetric from '@/public/components/popups/addMetric';
import MetricDownload from '@/public/components/popups/metricDownload';
import BoundaryDownload from '@/public/components/popups/boundaryDownload';
import Embedding from '@/public/components/popups/embedding';

export default {
	name: 'popupsPanel',
	components: {
		BoundaryDownload,
		AddMetric,
		AddMetric2,
		WorkMetadata,
		Embedding,
		ClippingMetadata,
		CompareMetadata,
		BoundaryCustomize,
		MetricCustomize,
		MetricDownload,
	},
	props: [
		'backgroundColor',
	],
	mounted() {
		window.Popups.MetricDownload = this.$refs.showMetricDownload;
		window.Popups.BoundaryDownload = this.$refs.showBoundaryDownload;
		window.Popups.Embedding = this.$refs.showEmbedding;
		window.Popups.WorkMetadata = this.$refs.showFuente;
		window.Popups.ClippingMetadata = this.$refs.showClippingMetadata;
		window.Popups.CompareMetadata = this.$refs.showCompareMetadata;
		window.Popups.BoundaryCustomize = this.$refs.showBoundaryCustomize;
		window.Popups.MetricCustomize = this.$refs.showCustomize;
		window.Popups.AddMetric = this.$refs.addMetric;
		window.Popups.AddMetric2 = this.$refs.addMetric2;
	},
	methods: {

	},
};
// https://vuejs.org/v2/guide/transitions.html
</script>

<style scoped>

.fade-enter-active, .fade-leave-active {
	transition: opacity .35s
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
	opacity: 0
}

</style>
