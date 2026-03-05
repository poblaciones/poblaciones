<template>
	<div>
		<div id="quickRegions" v-on-clickaway="away" >
			<ul class="fab-list margin-child" style="display: flex;">
				<template v-for="action in fabActions">
					<transition :key="action.name"
											enter-active-class="animated quick zoomIn"
											leave-active-class="animated quick zoomOut"
											@after-enter="afterActionsTransitionEnter"
											@before-enter="beforeActionsTransitionEnter">
						<fab-button-item :action="action" tooltipPosition="bottom" :openOnHover="false" @selectedItem="selectedItem" panelPosition="bottom"
								:usePanel="usePanel" :isOpening="isOpening" class="greyItem" iconSize="small"  bgColor="#A5A5A5" @hidePanels="hidePanels" />
					</transition>
				</template>
			</ul>
		</div>
	</div>
</template>

<script>
import axios from 'axios';
import arr from '@/common/framework/arr';
import color from '@/common/framework/color';
import fabButtonItem from '@/map/components/widgets/fabButton/fabButtonItem';
import session from '@/common/framework/session';
	import { mixin as clickaway } from 'vue-clickaway';

export default {
		name: 'recommendBoundaries',
		mixins: [clickaway],

		components: {
			fabButtonItem,
		},
		data() {
			return {
				fabMetrics: [],
				isOpening: false,
				usePanel: true
			};
		},
		mounted() {

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
//						fabAction.color = "#DF613D";
				ret.push(fabAction);
				if (ret.length >= 3) {
					break;
				}
			}
			return ret;
		},
	},
	props: [
		'backgroundColor'
	],
		methods: {
			selectedItem(item) {
				window.SegMap.Clipping.SetClippingRegion(item.Id, true, false, false);
				this.hidePanels();
			},
			beforeActionsTransitionEnter() {
				this.isOpening = true;
			},
			afterActionsTransitionEnter() {
				this.showTooltip();
				this.isOpening = false;
			},
			hidePanels() {
				this.fabActions.forEach(function (action) {
					if (action.hide) {
						action.hide();
					}
				});
			},
			away() {
				this.hidePanels();
			}
		}
};
</script>

<style scoped>
	.margin-child > * {
		margin: 0px 7px 0px 0px;
	}
	.greyItem {
		background-color: rgb(165, 165, 165) !important;
		box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.2), 0 4px 4px rgba(0, 0, 0, 0.15)!important;
	}
</style>

