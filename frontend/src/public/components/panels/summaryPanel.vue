<template>
	<div style="width: 100%;">
		<Toolbar :metrics="metrics" :frame="frame" :user="user" v-show="!Embedded.Readonly"
						 :currentWork="currentWork" :config="config" :toolbarStates="toolbarStates" style="position: sticky; z-index: 10; top: 0px"
						 class="exp-hiddable-block" />
		<div v-if="clipping.Region.Summary" v-show="!clipping.Region.Summary.Empty" class="panel card panel-body"
				 style="background-color: transparent; padding-bottom: 11px; margin-bottom: 0px; ">
			<Clipping :clipping="clipping" :frame="frame" v-show="showPopulationTotals" />

			<template v-for="(value, index) in metrics">
				<MetricItem :metric="value" :metrics="metrics" :clipping="clipping"
										:key="index" v-if="value.IsLocked" />
			</template>
			<draggable v-model="propMetrics" @end="itemMoved" handle=".dragHandle">
				<transition-group name="fade">
					<template v-for="(value, index) in metrics">
						<MetricItem :metric="value" :clipping="clipping" :metrics="metrics" :key="index" v-if="!value.IsLocked" />
					</template>
				</transition-group>
			</draggable>
		</div>
	</div>
</template>

<script>
import MetricItem from './metricItem';
import Clipping from '@/public/components/widgets/summary/clipping';
import Toolbar from '@/public/components/widgets/summary/toolbar';
import draggable from 'vuedraggable';
import arr from '@/common/framework/arr';

export default {
	name: 'summaryPanel',
	components: {
		MetricItem,
		Clipping,
		Toolbar,
		draggable
	},
	props: [
		'clipping',
		'frame',
		'config',
		'currentWork',
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
