<template>
	<div style="background-color: white">
		<Toolbar :frame="frame" :user="user" :config="config" :toolbarStates="toolbarStates" />
		<div v-if="clipping.Region.Summary" v-show="!clipping.Region.Summary.Empty" class="panel card panel-body"
				 style="background-color: transparent; padding-bottom: 13px">
			<Clipping :clipping="clipping" :frame="frame" />
			<draggable v-model="propMetrics" @end="itemMoved">
				<transition-group name="fade">
					<Metric v-for="(value, index) in metrics" :metric="value" :clipping="clipping" :key="index"></Metric>
				</transition-group>
			</draggable>
		</div>
		<div>
			<WorkMetadata ref="showFuente" />
			<MetricDownload ref="showDescargar" />
			<MetricCustomize ref="showCustomize" />
			<AddMetric ref="addMetric" />
		</div>
	</div>
</template>

<script>
import Metric from '@/public/components/widgets/metric';
import Clipping from '@/public/components/widgets/clipping';
import WorkMetadata from '@/public/components/popups/workMetadata';
import MetricCustomize from '@/public/components/popups/metricCustomize';
import AddMetric from '@/public/components/popups/addMetric';
import Toolbar from '@/public/components/widgets/toolbar';
import MetricDownload from '@/public/components/popups/metricDownload';
import draggable from 'vuedraggable';
import arr from '@/common/js/arr';

export default {
	name: 'summaryPanel',
	components: {
		Metric,
		Clipping,
		AddMetric,
		WorkMetadata,
		MetricCustomize,
		MetricDownload,
		Toolbar,
		draggable
	},
	props: [
		'clipping',
		'frame',
		'config',
		'user',
		'toolbarStates',
		'metrics'
	],
	data() {
		return {
			propMetrics: this.metrics.slice(),
			so: null,
			back: null
		};
	},
	mounted() {
		window.Popups.MetricDownload = this.$refs.showDescargar;
		window.Popups.WorkMetadata = this.$refs.showFuente;
		window.Popups.MetricCustomize = this.$refs.showCustomize;
		window.Popups.AddMetric = this.$refs.addMetric;
	},
	methods: {
		itemMoved(evt) {
			if (evt.oldIndex !== evt.newIndex) {
				window.SegMap.ChangeMetricIndex(evt.oldIndex, evt.newIndex);
			}
		},
		removeMetric(index) {
			arr.RemoveAt(this.metrics, index);
		},
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
