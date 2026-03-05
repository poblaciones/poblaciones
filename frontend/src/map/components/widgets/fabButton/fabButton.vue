<template>
	<div :id="position + '-wrapper'" class="fab-wrapper" v-on-clickaway="away" :style="[ pos, {zIndex: zIndex}, {position: positionType} ]">
		<div :id="position + '-action'" class="actions-container" :style="listPos">
			<transition name="fab-actions-appear" :enter-active-class="transitionEnter" :leave-active-class="transitionLeave">
			<ul v-show="expanded" class="fab-list">
				<template v-for="action in actions">
					<transition :key="action.name"
						enter-active-class="animated quick zoomIn"
						leave-active-class="animated quick zoomOut"
						@after-enter="afterActionsTransitionEnter"
						@before-enter="beforeActionsTransitionEnter">
						<fab-button-item v-if="expanded" :action="action" :isOpening="isOpening" @selectedItem="selectedItem" @selectedGroup="selectedGroup"
														 :usePanel="usePanel"
														 :iconSize="iconSize" :tooltipTrigger="tooltipTrigger" :bgColor="bgColor" @hidePanels="hidePanels"/>
					</transition>
				</template>
			</ul>
			</transition>
		</div>
		<template v-if="mainTooltip">
			<div @click="toggle = !toggle"
				v-tooltip="{ content: mainTooltip, placement: tooltipPosition, classes: 'fab-tooltip' }"
				class="fab-main pointer" :style="{ 'background-color': bgColor, 'padding': paddingAmount }">
				<i :class="[ mainIconSize, { rotate: toggle && allowRotation }, 'material-icons main', 'no-highlight' ]">{{ mainIcon }}</i>
			</div>
		</template>
		<template v-else>
			<div @click="toggle = !toggle"
				class="fab-main pointer" :style="{ 'background-color': bgColor, 'padding': paddingAmount }">
				<i :class="[ mainIconSize, { rotate: toggle && allowRotation }, 'material-icons main', 'no-highlight' ]">{{ mainIcon }}</i>
			</div>
		</template>
	</div>
</template>

<script>

// Código original:
// https://github.com/PygmySlowLoris/vue-fab

import {mixin as clickaway} from 'vue-clickaway';
import {VTooltip} from 'v-tooltip';
import fabButtonItem from './fabButtonItem';

export default {
	name: 'fabButton',
	mixins: [clickaway],
	components: {
		fabButtonItem
	},
	directives: {
		tooltip: VTooltip,
	},
	data() {
		return {
			toggle: this.startOpened,
			pos: {},
			isOpening: false,
			openHoverTimer: null
		};
	},
	props: {
		usePanel: {
			default: true,
		},
		bgColor: {
			default: '#333333',
		},
		position: {
			default: 'bottom-right',
		},
		positionType: {
			default: 'fixed',
		},
		zIndex: {
			default: '999',
		},
		mainIcon: {
			default: 'add'
		},
		iconSize: {
			default: 'medium'
		},
		mainTooltip: {
			default: null
		},
		fixedTooltip: {
			default: false
		},
		tooltipTimeOutWhenStartOpened: {
			default: 200
		},
		enableRotation: {
			default: true
		},
		actions: {
			default: () => []
		},
		startOpened: {
			default: false
		},
		toggleWhenAway: {
			default: true
		},
	},
		computed: {
			expanded() {
				return this.toggle && !window.Use.UseNewMenu;
			},
		tooltipPosition() {
			return 'top';
		},
		allowRotation() {
			return this.enableRotation && this.actions && this.actions.length;
		},
		mainIconSize() {
			switch (this.iconSize) {
				case 'small':
					return 'md-24';
				case 'medium':
					return 'md-36';
				case 'large':
					return 'md-48';
				default:
					return 'md-36';
			}
		},
		paddingAmount() {
			switch (this.iconSize) {
				case 'small':
					return '28px';
				case 'medium':
					return '32px';
				case 'large':
					return '38px';
				default:
					return '32px';
			}
		},
		listPos() {
			if (this.position === 'top-right' || this.position === 'top-left') {
				return {
					top: '-20px',
					paddingTop: '20px',
				};
			}
			return {
				bottom: '-20px',
				paddingBottom: '20px',
			};
		},
		transitionEnter() {
			let animation = this.animation;
			return animation.enter;
		},
		transitionLeave() {
			let animation = this.animation;
			return animation.leave;
		},
		animation() {
			if (this.position === 'top-right' || this.position === 'top-left') {
				return {
					enter: 'animated quick fadeInDown',
					leave: 'animated quick fadeOutUp',
				};
			} else if (this.position === 'bottom-right' || this.position === 'bottom-left') {
				return {
					enter: 'animated quick fadeInUp',
					leave: 'animated quick fadeOutDown',
				};
			} else {
				return {
					enter: 'animated fadeInUp',
					leave: 'animated fadeOutDown',
				};
			}
		},
		tooltipTrigger() {
			if (this.fixedTooltip || this.$isMobile()) {
				return 'manual';
			}
			return 'hover';
		}
	},
	methods: {
		hidePanels() {
			this.actions.forEach(function (action) {
				if (action.hide) {
					action.hide();
				}
			});
		},
		togglePanel(name) {
			const index = name.substring('selected'.length);
			this.hidePanels();
			this.$refs.fabPanel[index].show();
		},
		tooltipPos() {
			if(this.usePanel) {
				return;
			}
			if (this.position === 'top-right' || this.position === 'bottom-right') {
				this.tooltipPosition = 'left';
			} else {
				this.tooltipPosition = 'right';
			}
		},
		selectedItem(item) {
			this.$emit('selectedItem', item);
		},
		selectedGroup(action) {
			this.$emit('selectedGroup', action);
			this.toggle = false;
		},
		away() {
			if(this.toggleWhenAway) {
				this.toggle = false;
			}
		},
		setPosition() {
			this.pos = {};
			switch (this.position) {
				case 'bottom-right':
					this.pos.right = '5vw';
					this.pos.bottom = '4vh';
					break;
				case 'bottom-left':
					this.pos.left = '5vw';
					this.pos.bottom = '30px';
					break;
				case 'top-left':
					this.pos.left = '5vw';
					this.pos.top = '4vh';
					break;
				case 'top-right':
					this.pos.right = '5vw';
					this.pos.top = '4vh';
					break;
				default:
					this.pos.right = '5vw';
					this.pos.bottom = '4vh';
			}
		},
		moveTransition() {
			let wrapper = document.getElementById(this.position + '-wrapper');
			let el = document.getElementById(this.position + '-action');

			if (this.position === 'top-right' || this.position === 'top-left') {
				wrapper.appendChild(el);
			} else {
				wrapper.insertBefore(el, wrapper.childNodes[0]);
			}
		},
		showTooltip(timeOut = 0) {
			if(this.$isMobile()) {
				return;
			}
			if (this.toggle && this.actions.length && this.fixedTooltip) {
				setTimeout(() => {
					this.$refs.actions.forEach((item) => {
						if(this.toggle) {
							item._tooltip.show();
						}
					});
				}, timeOut);
			}
		},
		beforeActionsTransitionEnter() {
			this.isOpening = true;
		},
		afterActionsTransitionEnter() {
			this.showTooltip();
			this.isOpening = false;
		}
	},
	watch: {
		position(val) {
			this.setPosition();

			this.$nextTick(() => {
				this.moveTransition();
				this.tooltipPos();
			});
		},
		toggle() {
			if (window.Use.UseNewMenu) {
				window.Popups.AddMetric2.show(this.actions, null);
			} else {
				if (this.toggle == false) {
					this.hidePanels();
				}
			}
		}
	},
	mounted() {
		this.moveTransition();
	},
	created() {
		this.setPosition();

		if (this.startOpened) {
			this.showTooltip(this.tooltipTimeOutWhenStartOpened);
		}
	},
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
	transition: opacity .15s, visibility .15s;
}

.fab-tooltip.tooltip[aria-hidden='false'] {
	visibility: visible;
	opacity: 1;
	transition: opacity .15s;
}
</style>

<style scoped>
.animated.quick {
	-webkit-animation-duration: .7s !important;
	animation-duration: .7s !important;
}

.fab-wrapper {
	z-index: 900!important;
}

.fab-main {
	border-radius: 100px;
	padding: 30px;
	position: relative;
	overflow: hidden;
	display: flex;
	align-items: center;
	box-shadow: 0 10px 10px rgba(0, 0, 0, 0.20), 0 4px 4px rgba(0, 0, 0, 0.15);
	z-index: 2;
	justify-content: center;
}

.fab-main .material-icons {
	color: white;
	-webkit-transition: .4s all;
	-moz-transition: .4s all;
	transition: .4s all;
	margin: 0px auto;
}

.fab-main .material-icons.main {
	opacity: 1;
	position: absolute;
}

.fab-main .material-icons.close {
	opacity: 0;
	position: absolute;
}

.fab-main .material-icons.main.rotate {
	-ms-transform: rotate(315deg); /* IE 9 */
	-webkit-transform: rotate(315deg); /* Chrome, Safari, Opera */
	transform: rotate(315deg);
	opacity: 0;
	-webkit-transition: opacity .3s ease-in, -webkit-transform .4s; /* Safari */
	transition: opacity .3s ease-in, transform .4s;
}

.fab-main .material-icons.close.rotate {
	-ms-transform: rotate(315deg); /* IE 9 */
	-webkit-transform: rotate(315deg); /* Chrome, Safari, Opera */
	transform: rotate(315deg);
	opacity: 1;
	-webkit-transition: opacity .3s ease-in, -webkit-transform .4s; /* Safari */
	transition: opacity .3s ease-in, transform .4s;
}

.fab-list {
	position: relative;
	z-index: 1;
	margin: 1.5vh 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.fab-list li {
	margin-top: 1.5vh;
	display: flex;
	align-items: center;
	border-radius: 100px;
	box-shadow: 0 10px 10px rgba(0, 0, 0, 0.20), 0 4px 4px rgba(0, 0, 0, 0.15);
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

ul {
	list-style-type: none;
	padding: 0 !important;
}

.fab-wrapper .actions-container {
	overflow: hidden;
	z-index: 0;
	position: relative;
}

/* Rules for using icons as black on a light background. */
.material-icons.md-dark {
	color: rgba(0, 0, 0, 0.54);
}

.material-icons.md-dark.md-inactive {
	color: rgba(0, 0, 0, 0.26);
}

/* Rules for using icons as white on a dark background. */
.material-icons.md-light {
	color: rgba(255, 255, 255, 1);
}

.material-icons.md-light.md-inactive {
	color: rgba(255, 255, 255, 0.3);
}

@media screen and (max-width: 768px) {
	.fab-list {
		margin: 2vh 0;
	}

	.fab-list li {
	}

	.fab-list li i {
	}

	.fab-main {
	}

	.fab-main i {
	}

}
</style>
