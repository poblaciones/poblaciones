<template>
	<div style="background-color: white; width: 100%;">
		<Toolbar :metrics="metrics" :frame="frame" :user="user" v-show="!Embedded.Readonly"
						 :currentWork="currentWork" :config="config" :toolbarStates="toolbarStates"
						 class="exp-hiddable-block"/>
		<div v-if="clipping.Region.Summary" v-show="!clipping.Region.Summary.Empty" class="panel card panel-body"
				 style="background-color: transparent; padding-bottom: 13px;">
			<Clipping :clipping="clipping" :frame="frame" v-show="showPopulationTotals" />

			<template v-for="(value, index) in metrics">
				<MetricItem :metric="value" :metrics="metrics" :clipping="clipping"
										:key="index" v-if="value.IsLocked"/>
			</template>
			<draggable v-model="propMetrics" @end="itemMoved" handle=".dragHandle">
				<transition-group name="fade">
					<template v-for="(value, index) in metrics">
						<MetricItem :metric="value" :clipping="clipping" :metrics="metrics" :key="index" v-if="!value.IsLocked" />
					</template>
				</transition-group>
			</draggable>
		</div>
		<div>
			<WorkMetadata ref="showFuente" :backgroundColor="backgroundColor" />
			<ClippingMetadata ref="showClippingMetadata" :backgroundColor="backgroundColor" />
			<MetricDownload ref="showMetricDownload" :backgroundColor="backgroundColor" />
			<BoundaryDownload ref="showBoundaryDownload" :backgroundColor="backgroundColor" />
			<Embedding ref="showEmbedding" :backgroundColor="backgroundColor" />
			<BoundaryCustomize ref="showBoundaryCustomize" :backgroundColor="backgroundColor" />
			<MetricCustomize ref="showCustomize" :backgroundColor="backgroundColor" />
			<WaitMessage ref="showWaitMessage" :backgroundColor="backgroundColor" />
			<AddMetric ref="addMetric" :backgroundColor="backgroundColor" />
		</div>
	</div>
</template>

<script>
import MetricItem from './metricItem';
import Clipping from '@/public/components/widgets/summary/clipping';
import WorkMetadata from '@/public/components/popups/workMetadata';
import Embedding from '@/public/components/popups/embedding';
import ClippingMetadata from '@/public/components/popups/clippingMetadata';
import MetricCustomize from '@/public/components/popups/metricCustomize';
import BoundaryCustomize from '@/public/components/popups/boundaryCustomize';
import WaitMessage from '@/public/components/popups/waitMessage';
import AddMetric from '@/public/components/popups/addMetric';
import Toolbar from '@/public/components/widgets/summary/toolbar';
import MetricDownload from '@/public/components/popups/metricDownload';
import BoundaryDownload from '@/public/components/popups/boundaryDownload';
import draggable from 'vuedraggable';
import arr from '@/common/framework/arr';

export default {
	name: 'summaryPanel',
	components: {
		MetricItem,
		BoundaryDownload,
		Clipping,
		Embedding,
		AddMetric,
		WorkMetadata,
		ClippingMetadata,
		WaitMessage,
		BoundaryCustomize,
		MetricCustomize,
		MetricDownload,
		Toolbar,
		draggable
	},
	props: [
		'clipping',
		'frame',
		'config',
		'currentWork',
		'backgroundColor',
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
	mounted() {
		window.Popups.MetricDownload = this.$refs.showMetricDownload;
		window.Popups.BoundaryDownload = this.$refs.showBoundaryDownload;
		window.Popups.Embedding = this.$refs.showEmbedding;
		window.Popups.WorkMetadata = this.$refs.showFuente;
		window.Popups.ClippingMetadata = this.$refs.showClippingMetadata;
		window.Popups.WaitMessage = this.$refs.showWaitMessage;
		window.Popups.BoundaryCustomize = this.$refs.showBoundaryCustomize;
		window.Popups.MetricCustomize = this.$refs.showCustomize;
		window.Popups.AddMetric = this.$refs.addMetric;
	},
	methods: {
		itemMoved(evt) {
			if (evt.oldIndex !== evt.newIndex) {
				window.SegMap.ChangeMetricIndex(evt.oldIndex, evt.newIndex);
			}
		},
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
