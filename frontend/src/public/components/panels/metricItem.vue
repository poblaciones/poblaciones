<template>
	<div class="metricBlock">
		<hr class="moderateHr exp-hiddable-visiblity" v-if="showSeparatorLine(metric)" />
		<div v-else :style="(isFirst(metric) ? 'height: 4px' : 'height: 12px')"></div>
		<Boundary v-if="metric.isBoundary" :boundary="metric" :clipping="clipping"></Boundary>
		<Metric v-else :metric="metric" :clipping="clipping"></Metric>
	</div>
</template>

<script>
	import Metric from '@/public/components/widgets/summary/metric';
	import Boundary from '@/public/components/widgets/summary/boundary';

	export default {
		name: 'metricItem',
		components: {
			Metric,
			Boundary,
		},
		props: [
			'metric',
			'metrics',
			'clipping'
		],
		data() {
			return {

			};
		},
		computed: {
			Embedded() {
				return window.Embedded;
			},
			showPopulationTotals() {
				if (!this.Embedded.Active) {
					return true;
				}
				return !window.SegMap.Clipping.FrameHasNoClipping();
			}
		},
		methods: {
			showSeparatorLine(item) {
				if (this.isFirst(item)) {
					return this.showPopulationTotals;
				} else {
					return !item.IsLocked;
				}
			},
			isFirst(item) {
				return this.metrics[0] === item;
			},
		},
	};
</script>
<style scoped>

</style>
