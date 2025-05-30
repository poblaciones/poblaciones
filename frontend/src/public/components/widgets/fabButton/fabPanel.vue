<template>
	<div v-show="visible" :class="[ 'fab-panel', outerBorderRadiusClass ]"
			 :style="{ 'background-color': bgColor, 'max-width': width + 'px', 'width': getWidth }" ref="fabPanel">
		<div v-show="orientation == 'right'" class="fab-triangle-left" :style="{ 'border-right-color': bgColor }" ref="triangle"></div>
		<div v-show="orientation == 'bottom'"  class="fab-triangle-top" :style="{ 'border-bottom-color': bgColor }"></div>

		<div v-if="showScrollButtons" ref="scrollUp" class="fab-scroll-button-disabled top-radius" :style="style"
				 @click="scrollUp(4)" @mouseenter="scrollUpStart" @mouseleave="scrollUpStop">
			<i :class="[ actionIconSize, 'material-icons', 'no-highlight', 'fab-icon-offset' ]">arrow_drop_up</i>
		</div>
		<div :class="[ 'fab-panel-overflow', scrollBarClass, borderRadiusClass ]" ref="panelScroll"
				 :style="scrollStyle" @wheel="wheel($event)" @scroll="scrolled()">
			<ul class="fab-panel-list unselectable">
				<li v-for="(item, index) in items" :key="item.Id" :class="[ 'fab-panel-item', ellipsisClass, 'unselectable',
						(item.Header ? (index === 0 && !showScrollButtons ? 'fab-panel-item-header fab-panel-item-header-offset' : 'fab-panel-item-header') : '')]" :style="style" @click="select(item)"
						v-tooltip="{ content: item.Name, placement: 'top', classes: 'fab-tooltip', trigger: 'manual' }"
						@mouseenter="showTooltip($event.target)" @mouseleave="hideTooltip()" ref="liItems">
					{{ item.Name }}
				</li>
			</ul>
		</div>
		<div v-if="showScrollButtons" ref="scrollDown" class="fab-scroll-button bottom-radius"
				 :style="style" @click="scrollDown(4)" @mouseenter="scrollDownStart" @mouseleave="scrollDownStop">
			<i :class="[ actionIconSize, 'material-icons', 'no-highlight', 'fab-icon-offset' ]">arrow_drop_down</i>
		</div>
	</div>
</template>

<script>
import {VTooltip} from 'v-tooltip';

export default {
	name: 'fabPanel',
	directives: {
		tooltip: VTooltip,
	},
	data() {
		return {
			maxHeight: 1400,
			adjust: 0,
			visible: false,
			scrollInterval: null,
			style: {
				'--hover': this.hoverColor,
				'--height': this.scrollButtonHeight + 'px',
			},
			scrollStyle: {
				'--scrollColor': this.scrollColor,
				'--scrollBgColor': this.scrollBgColor,
			},
		};
	},
	props: {
		items: {
			default: [],
		},
		orientation: {
			default: 'right',
		},
		scrollButtons: {
			default: function() {
				return this.$isMobile() == false;
			},
		},
		scrollMode: {
			default: 'click',
			validator: function(value) {
				// valores válidos:
				return ['auto', 'click'].indexOf(value) !== -1;
			},
		},
		scrollTime: {
			default: 350, //en milisegundos
		},
		maxItems: {
			default: 8,
		},
		marginVertical: {
			default: 15, //Vertical: aplica a top y bottom
		},
		scrollButtonHeight: {
			default: 19,
		},
		ellipsis: {
			default: function() {
				return false; //this.$isMobile() == false;
			},
		},
		width: {
			default: function() {
				if(this.$isMobile()) {
					return 350;
				} else {
					return 400;
				}
			},
		},
		fixedWidth: {
			default: true,
		},
		hoverColor: {
			default: '#66615b', // marrón de los menús
		},
		scrollColor: {
			default: '#68abc0',
		},
		scrollBgColor: {
			default:  '#06769a',
		},
		actionIconSize: {
			default: 'md-38',
		},
		bgColor: {
			default: '#333333',
		},
	},
	computed: {
		ellipsisClass() {
			if(this.ellipsis) {
				return 'overflow-ellipsis';
			}
			return '';
		},
		showScrollButtons() {
			return this.scrollButtons && this.items.length > this.maxItems;
		},
		showScrollRegular() {
			return this.scrollButtons == false && this.items.length > this.maxItems;
		},
		scrollBarClass() {
			if (this.showScrollButtons) {
				return 'no-scroll-bar';
			} else {
				return 'fab-scroll-bar';
			}
		},
		borderRadiusClass() {
			if(this.showScrollButtons) {
				return 'no-radius';
			} else if(this.showScrollRegular) {
				return 'left-radius';
			}
			return 'full-radius';
		},
		outerBorderRadiusClass() {
			if(this.showScrollRegular) {
				return 'left-radius';
			}
			return 'full-radius';
		},
	},
	created() {
		window.addEventListener("resize", this.position);
	},
	destroyed() {
		window.removeEventListener("resize", this.position);
	},
	updated() {
		this.updateHeight();
		this.position();
	},
	methods: {
		updateHeight() {
			var height = this.calculateHeight();
			this.$refs.fabPanel.style.maxHeight = height + 'px';
		},
		position() {
			if(this.visible == false) {
				return;
			}
			this.$refs.fabPanel.style.top = "";
			this.$refs.triangle.style.top = "";

			var rect = this.$refs.fabPanel.getBoundingClientRect();
			// Se pasa arriba
			if (rect.top - this.marginVertical < 0) {
				this.$refs.triangle.style.top = (this.$refs.triangle.offsetTop + rect.top - this.marginVertical) + "px";
				this.$refs.fabPanel.style.top = this.marginVertical + "px";
			}

			// Se pasa abajo
			var outside = rect.bottom - (window.innerHeight || document.documentElement.clientHeight);
			if (outside + this.marginVertical > 0) {
				this.$refs.fabPanel.style.top = (this.$refs.fabPanel.offsetTop - outside - this.marginVertical) + "px";
				this.$refs.triangle.style.top = (this.$refs.triangle.offsetTop + outside + this.marginVertical) + "px";
			}
		},
		show() {
			this.visible = true;
		},
		hide() {
			this.visible = false;
			if(this.scrollButtons) {
				this.$refs.panelScroll.scrollTo(0, 0);
			}
		},
		select(item) {
			if (item !== null) {
				this.$emit('selected', item);
			}
		},
		getWidth() {
			if(this.fixedWidth) {
				return this.width + 'px';
			} else {
				return 'unset';
			}
		},
		calculateHeight() {
			var ret;
			if (this.$refs.liItems && this.$refs.liItems.length > 0) {
				ret = 0;
				for (var i = 0; i < Math.min(this.maxItems, this.$refs.liItems.length); i++) {
					ret += this.$refs.liItems[i].scrollHeight;
				}
			} else {
				ret = this.maxHeight;
			}
			if (this.scrollButtons) {
				ret += 2 * this.scrollButtonHeight;
			}
			return ret;
		},
		scrollUpStart() {
			if(this.scrollMode == 'click') {
				return;
			}
			this.scrollInterval = setInterval(() => {
				this.scrollUp();
			}, this.scrollTime);
		},
		scrollUpStop() {
			clearInterval(this.scrollInterval);
		},
		scrollDownStop() {
			clearInterval(this.scrollInterval);
		},
		scrollDownStart() {
			if(this.scrollMode == 'click') {
				return;
			}
			this.scrollInterval = setInterval(() => {
				this.scrollDown();
			}, this.scrollTime);
		},
		visiblePixelsItemTop(top, height, itemHeight) {
			if(top < itemHeight + height
				&& top > height) {
				return top - height;
			}
			return 0;
		},
		prevItemHeight(offset) {
			const items = this.$refs.liItems;
			if(items && items.length > 0) {
				const el = this.$refs.panelScroll;
				var height = 0;
				for (var i = 0; i < items.length; i++) {
					/*const delta = this.visiblePixelsItemTop(el.scrollTop, height, items[i].scrollHeight);
					if(delta > 0) {
						return delta;
					}*/
					height += items[i].scrollHeight;
					if(el.scrollTop >= height) {
						return items[Math.max(0, i - offset)].scrollTop;
					}
				};
				return 0;
			}
			return 0;
		},
		scrollUp(step = 1) {
			const el = this.$refs.panelScroll;
			const items = this.$refs.liItems;
			if (!el || !items || items.length === 0) return;

			let currentScroll = el.scrollTop;
			let firstHidden = null;
			let offset = step - 1;

			// Buscamos el primer elemento oculto arriba del viewport
			firstHidden = items[0];
			for (let i = 0; i < items.length; i++) {
				let item = items[i];
				if (!item.classList.contains('fab-panel-item-header')) {
					if (item.offsetTop < currentScroll) {
						firstHidden = items[Math.max(0, i - offset)];
					} else {
						break;
					}
				}
			}

			if (firstHidden === null) {
				return;
			}

			// Calculamos la nueva posición de scroll
			let targetScroll = firstHidden.offsetTop - el.offsetTop;
			// Nos aseguramos de no ir más allá del inicio
			el.scrollTo({
				top: Math.max(0, targetScroll),
				behavior: 'smooth'
			});
		},
		scrollDown(step = 1) {
			const el = this.$refs.panelScroll;
			const items = this.$refs.liItems;
			if (!el || !items || items.length === 0) return;
			let currentScroll = el.scrollTop;
			let lastHidden = null;
			let offset = step - 1;
			for (let i = items.length - 1; i >= 0; i--) {
				let item = items[i];
				if (!item.classList.contains('fab-panel-item-header')) {
					if (item.offsetTop - currentScroll > el.offsetHeight) {
						lastHidden = items[Math.min(items.length - 1, i + offset)];
					} else {
						break;
					}
				}
			}
			if (lastHidden === null) {
				return;
			}
			let targetScroll = lastHidden.offsetTop - el.offsetHeight + lastHidden.offsetHeight - el.offsetTop;
			let maxScroll = el.scrollHeight - el.offsetHeight;
			el.scrollTo({ top: Math.min(targetScroll, maxScroll), behavior: 'smooth' });
			return;
		},
		wheel(e) {
			e.preventDefault();
			if(e.deltaY > 0) {
				this.scrollDown(4);
			} else {
				this.scrollUp(4);
			}
		},
		scrolled() {
			const el = this.$refs.panelScroll;
			if (el) {
				if (this.$refs.scrollUp) {
					if (el.scrollTop == 0) {
						this.$refs.scrollUp.classList.replace('fab-scroll-button', 'fab-scroll-button-disabled');
					} else {
						this.$refs.scrollUp.classList.replace('fab-scroll-button-disabled', 'fab-scroll-button');
					}
				}
				if (this.$refs.scrollDown) {
					if (el.scrollTop >= el.scrollHeight - el.offsetHeight - 2) {
						this.$refs.scrollDown.classList.replace('fab-scroll-button', 'fab-scroll-button-disabled');
					} else {
						this.$refs.scrollDown.classList.replace('fab-scroll-button-disabled', 'fab-scroll-button');
					}
				}
			}
		},
		showTooltip(el) {
			if(this.$isMobile()) {
				return;
			}
			if(el.scrollWidth > el.offsetWidth) {
				el._tooltip.show();
			}
		},
		hideTooltip() {
			if(this.$isMobile()) {
				return;
			}
			this.$refs.liItems.forEach((item) => {
				item._tooltip.hide();
			});
		},
	},
};
</script>

<style>
.no-scroll-bar {
	overflow-y: scroll;
	scrollbar-width: none; /* Firefox */
	-ms-overflow-style: none; /* Internet Explorer 10+ */
}
.no-scroll-bar::-webkit-scrollbar { /* WebKit */
	width: 0;
	height: 0;
}

.overflow-ellipsis {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>

<style scoped>
.fab-panel {
	display: flex;
	flex-direction: column;
	position: fixed;
	left: 80px;
	box-shadow: 0 10px 10px rgba(0, 0, 0, 0.20), 0 4px 4px rgba(0, 0, 0, 0.15);
}

.fab-icon-offset {
	margin-top: -2px;
}

.fab-panel-overflow {
	overflow-y: auto;
	scroll-snap-type: y mandatory;
}

/* https://css-tricks.com/the-current-state-of-styling-scrollbars/ */
.fab-scroll-bar {
	scrollbar-width: thin;
	scrollbar-color: var(--scrollColor) var(--scrollBgColor);
}
.fab-scroll-bar::-webkit-scrollbar {
	width: 11px;
}
.fab-scroll-bar::-webkit-scrollbar-track {
	background: var(--scrollBgColor);
}
.fab-scroll-bar::-webkit-scrollbar-thumb {
	background-color: var(--scrollColor);
	border-radius: 6px;
	border: 3px solid var(--scrollBgColor);
}

.fab-panel-list {
	scroll-snap-align: start;
	font-size: 14px;
	text-align: left;
	list-style: none;
	padding: 0;
	margin-bottom: 0;
}

.fab-panel-item {
	font-size: 14px;
	padding: 8px 15px;
	color: white;
	white-space: nowrap;
	min-width: 260px;
	cursor: pointer;
}
.fab-panel-item:hover {
	background-color: var(--hover);
}

.fab-panel-item-header {
	background-color: #66666650;
	padding: 2px 14px;
	white-space: nowrap;
	pointer-events: none;
	text-transform: uppercase;
	font-size: 1.1rem;
}
.fab-panel-item-header-offset {
	margin-top: 9px;
}

.fab-triangle-top {
	height: 10px;
	width: 10px;
	position: absolute;
	left: 20px;
	top: -10px;
	transform: translateX(-50%);
	border-left: 10px solid transparent;
	border-right: 10px solid transparent;
	border-bottom: 10px solid;
}

.fab-triangle-left {
	height: 10px;
	width: 10px;
	position: absolute;
	top: 50%;
	left: -10px;
	transform: translateY(-50%);
	border-top: 10px solid transparent;
	border-bottom: 10px solid transparent;
	border-right: 10px solid;;
}

.fab-scroll-button {
	text-align: center;
	color: white;
	cursor: pointer;
	height: var(--height);
	background-color: #cccccc30;
}

.fab-scroll-button:hover {
	background-color: var(--hover);
}

.fab-scroll-button-disabled {
	text-align: center;
	color: #00000028;
	cursor: pointer;
	height: var(--height);
	background-color: #cccccc30;
}

.no-radius {
	border-radius: 0;
}
.left-radius {
	border-radius: 10px 0 0 10px;
}
.bottom-radius {
	border-radius: 0 0 10px 10px;
}
.top-radius {
	border-radius: 10px 10px 0 0 ;
}
.full-radius {
	border-radius: 10px;
}
</style>
