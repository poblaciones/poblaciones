<template>
	<div>
		<span v-if="fabMetrics.length > 0">
			<fabButton ref="vuefab" style="left: 15px!important"
					 icon-size="small"
					 z-index="1000000095"
					 :enable-rotation="false"
					 :position="position"
					 :bg-color="backgroundColor"
					 :actions="fabActions"
					 :mainTooltip="mainTooltip"
					 @selectedItem="selectedItem"
					 @selectedGroup="selectedGroup">
			</fabButton>
		</span>
	</div>
</template>

<script>
import axios from 'axios';
import err from '@/common/framework/err';
import color from '@/common/framework/color';
import fabButton from '@/public/components/widgets/fabButton/fabButton';
import session from '@/common/framework/session';

export default {
	name: 'metricsButton',
	components: {
		fabButton,
	},
	data() {
		return {
			action: {
				Metrics: [],
			},
			fabMetrics: [],
			position: 'bottom-left',
			mainTooltip: "Agregar",
		};
	},
	created () {
		window.addEventListener('keydown', this.keyProcess);
	},
	beforeDestroy () {
		window.removeEventListener('keydown', this.keyProcess);
	},
	computed: {
		fabActions() {
			var ret = [];
			for(var n = 0; n < this.fabMetrics.length; n++) {
				var action = this.fabMetrics[n];
				var fabAction = {
					name: 'selected' + n, tooltip: action.Name,
					icon: action.Icon,
					items: action.Items,
					metricAction: action
				};
				if (action.Intensity) {
					fabAction.color = color.ReduceColor("#10AADB" /*this.backgroundColor*/, action.Intensity);
					if (n == 0) {
						fabAction.color = "#DF613D";
					} else if (n == 1) {
						fabAction.color = "#EBA206";
					}
				}
				ret.push(fabAction);
			}
			return ret;
		},
	},
	props: [
		'backgroundColor'
	],
	methods: {
		keyProcess(e) {
			if (e.key === "Escape") {
				if (this.$refs.vuefab.toggle) {
					this.$refs.vuefab.toggle = false;
				}
			}
			if (e.key == "+" && e.shiftKey) {
				window.Popups.AddMetric.show(this.action.Items, null, this.action.Name);
			}
		},
		selectedItem(item) {
			if (item.Type === 'B') {
				window.SegMap.AddBoundaryById(item.Id, item.Name);
			} else {
				window.SegMap.AddMetricById(item.Id);
			}
			this.$refs.vuefab.toggle = false;
		},
		selectedGroup(action) {
			this.action = action.metricAction; // this.fabMetrics[n];
			this.$refs.vuefab.toggle = false;
			window.Popups.AddMetric.show(this.action.Items, null, this.action.Name);
		}
	},
};
</script>

<style scoped>

</style>

