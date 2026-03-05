<template>
	<li :style="liStyle">
		<div v-tooltip="{
        content: action.tooltip,
        placement: actualTooltipPosition,
        classes: 'fab-tooltip',
        trigger: tooltipTrigger
      }"
				 @mouseenter="mouseEnter"
				 @click="mouseClick"
				 ref="actions"
				 class="fab-list-div no-highlight pointer">
			<i :class="[actionIconSize, 'material-icons']">{{ action.icon }}</i>
		</div>

		<fabPanel v-if="usePanel"
							ref="fabPanel" :orientation="(this.panelPosition == 'bottom' ? 'bottom' : 'right')"
							@selected="selectedItem"
							:style="(this.panelPosition == 'bottom' ? 'position: absolute; left: 0px; margin-top: 35px' : '')"
							:items="action.items"
							:actionIconSize="actionIconSize"
							:bgColor="bgColor"></fabPanel>
	</li>
</template>

<script>
	import { VTooltip } from 'v-tooltip';
	import fabPanel from '@/map/components/widgets/fabButton/fabPanel';

	export default {
		name: 'fabButton',
		components: {
			fabPanel,
		},
		directives: {
			tooltip: VTooltip,
		},
		props: {
			action: {
				default: null
			},
			tooltipPosition: {
				default: 'default'
			},
			isOpening: {
				default: false
			},
			panelPosition: {
				default: 'right'
			},
			panelOpenMode: {
				default: function () {
					if (this.$isMobile() || this.openOnHover == false) {
						return 'click';
					} else {
						return 'mouseenter';
					}
				},
				validator: function (value) {
					// valores válidos:
					return ['mouseenter', 'click'].indexOf(value) !== -1;
				},
			},
			usePanel:
			{
				default: false
			},
			openOnHover:
			{
				default: true
			},
			bgColor: {
				default: '#333333',
			},
			iconSize: {
				default: 'medium'
			},
			tooltipTrigger: {
				default: 'hover'
			}
		},
		mounted() {
			if (this.action) {
				this.action.hide = this.hide;
			}
		},
		computed: {
			liStyle() {
				var ret = 'background-color:' + (this.action.color ? this.action.color : this.bgColor);
				if (this.panelPosition == 'bottom') {
					ret += '; position: relative;';
				}
				return ret;
			},
			actualTooltipPosition() {
				if (this.tooltipPosition != 'default') {
					return this.tooltipPosition;
				}
				if (this.usePanel && this.panelOpenMode == 'mouseenter') {
					return 'top';
				}
				return 'left';
			},
			actionIconSize() {
				switch (this.iconSize) {
					case 'small':
						return 'md-18';
					case 'medium':
						return 'md-24';
					case 'large':
						return 'md-36';
					default:
						return 'md-24';
				}
			}
		},
		methods: {
			mouseClick() {
				if (!this.usePanel || this.panelOpenMode == 'click') {
					this.selectedGroup();
				} else {
					this.togglePanel();
				}
			},
			mouseEnter() {
				if (this.openOnHover) {
					this.showPanel();
				}
			},
			showPanel() {
				if (this.usePanel == false || this.panelOpenMode == 'click') {
					return;
				}
				if (this.openHoverTimer) {
					clearTimeout(this.openHoverTimer);
					this.openHoverTimer = null;
				}
				if (!this.isOpening) {
					this.togglePanel();
				} else {
					this.openHoverTimer = setTimeout(() => {
						this.showPanel();
					}, 50);
				}
			},
			togglePanel() {
				this.$emit('hidePanels');
				this.$refs.fabPanel.show();
			},
			hide() {
				this.$refs.fabPanel.hide();
			},
			selectedItem(item) {
				this.$emit('selectedItem', item);
			},
			selectedGroup() {
				this.$emit('selectedGroup', this.action);
				this.toggle = false;
			}
		}
	};
</script>

<style>
	.no-highlight {
		-webkit-user-select: none; /* Safari */
		-moz-user-select: none; /* Firefox */
		-ms-user-select: none; /* IE10+/Edge */
		user-select: none; /* Standard */
	}

	.fab-tooltip.tooltip {
		display: block !important;
		padding: 0px;
		z-index: 900;
	}

		.fab-tooltip.tooltip .tooltip-inner {
			background: #333333;
			color: white;
			border-radius: 0px;
			padding: 5px 10px 4px;
		}

		.fab-tooltip.tooltip tooltip-arrow {
			display: none;
		}

		.fab-tooltip.tooltip[aria-hidden='true'] {
			visibility: hidden;
			opacity: 0;
			transition: opacity 0.15s, visibility 0.15s;
		}

		.fab-tooltip.tooltip[aria-hidden='false'] {
			visibility: visible;
			opacity: 1;
			transition: opacity 0.15s;
		}
</style>

<style scoped>
	.fab-list li {
		display: flex;
		align-items: center;
		border-radius: 100px;
		box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2), 0 4px 4px rgba(0, 0, 0, 0.15);
	}

	.fab-list-div {
		padding: 10px;
		display: flex;
	}

	.fab-list li .material-icons {
		color: white;
		margin: 0px auto;
	}

	.pointer {
		cursor: pointer;
	}

	.material-icons.md-18 {
		font-size: 18px;
	}

	.material-icons.md-24 {
		font-size: 24px;
	}

	.material-icons.md-36 {
		font-size: 36px;
	}

	.material-icons.md-48 {
		font-size: 48px;
	}

	.material-icons.md-light {
		color: rgba(255, 255, 255, 1);
	}
</style>
