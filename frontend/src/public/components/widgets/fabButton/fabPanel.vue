<template>
	<div v-show="visible" :class="[ 'fab-panel', outerBorderRadiusClass ]"
		:style="{ 'background-color': bgColor, 'max-width': width + 'px', 'width': getWidth }" ref="fabPanel">
		<div class="fab-triangle" :style="{ 'border-right-color': bgColor }"></div>
		<div v-if="showScrollButtons" ref="scrollUp" class="fab-scroll-button-disabled top-radius" :style="style"
			@click="scrollUp" @mouseenter="scrollUpStart" @mouseleave="scrollUpStop">
			<i :class="[ actionIconSize, 'material-icons', 'no-highlight', 'fab-icon-offset' ]">arrow_drop_up</i>
		</div>
		<div :class="[ 'fab-panel-overflow', scrollBarClass, borderRadiusClass ]" ref="panelScroll"
			:style="scrollStyle" @wheel="wheel($event)" @scroll="scrolled()">
			<ul class="fab-panel-list">
				<li :class="[ 'fab-panel-item', ellipsisClass ]" v-for="item in items" :key="item.Id" :style="style" @click="select(item)"
					v-tooltip="{ content: item.Name, placement: 'top', classes: 'fab-tooltip', trigger: 'manual' }"
					@mouseenter="showTooltip($event.target)" @mouseleave="hideTooltip()" ref="liItems"
					v-ripple="rippleEffect">
					{{ item.Name }}
				</li>
			</ul>
		</div>
		<div v-if="showScrollButtons" ref="scrollDown" class="fab-scroll-button bottom-radius"
			:style="style" @click="scrollDown" @mouseenter="scrollDownStart" @mouseleave="scrollDownStop">
			<i :class="[ actionIconSize, 'material-icons', 'no-highlight', 'fab-icon-offset' ]">arrow_drop_down</i>
		</div>
	</div>
</template>

<script>
import {VTooltip} from 'v-tooltip';
import Ripple from 'vue-ripple-directive';

export default {
	name: 'fabPanel',
	directives: {
		Ripple,
		tooltip: VTooltip,
	},
	data() {
		return {
			maxMaxHeight: 230,
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
		scrollAt: {
			default: 7,
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
					return 250;
				} else {
					return 350;
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
		rippleColor: {
			default: 'light'
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
			return this.scrollButtons && this.items.length >= this.scrollAt;
		},
		showScrollRegular() {
			return this.scrollButtons == false && this.items.length >= this.scrollAt;
		},
		scrollBarClass() {
			if(this.showScrollButtons) {
				return 'no-scroll-bar';
			}
			return 'fab-scroll-bar';
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
		rippleEffect() {
			if(this.rippleColor == 'light') {
				return 'rgba(255, 255, 255, 0.35)';
			}
			return false;
		},
	},
	updated() {
		var maxHeight = this.visibleMaxHeight();
		if(this.scrollButtons) {
			maxHeight += 2 * this.scrollButtonHeight;
		}
		this.$refs.fabPanel.style.maxHeight = maxHeight + 'px';
	},
	methods: {
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
		visibleMaxHeight() {
			if(this.$refs.liItems && this.$refs.liItems.length > 0) {
				var total = this.maxMaxHeight + 1;
				this.adjust = 1;
				while(total > this.maxMaxHeight) {
					total = 0;
					this.adjust--;
					for (var i = 0; i < Math.min(this.scrollAt + this.adjust - 1, this.$refs.liItems.length); i++) {
						total += this.$refs.liItems[i].scrollHeight;
					}
				}
				return total;
			}
			return this.maxMaxHeight;
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
		prevItemHeight() {
			const items = this.$refs.liItems;
			if(items && items.length > 0) {
				const el = this.$refs.panelScroll;
				var height = 0;
				for (var i = 0; i < items.length; i++) {
					const delta = this.visiblePixelsItemTop(el.scrollTop, height, items[i].scrollHeight);
					if(delta > 0) {
						return delta;
					}
					height += items[i].scrollHeight;
					if(el.scrollTop == height) {
						return items[i].scrollHeight;
					}
				};
				return items[0].scrollHeight;
			}
			return 36;
		},
		nextItemHeight() {
			const items = this.$refs.liItems;
			if(items && items.length > 0) {
				const el = this.$refs.panelScroll;
				var height = 0;
				var text = "";
				for (var i = 0; i < items.length; i++) {
					var delta = this.visiblePixelsItemTop(el.scrollTop, height, items[i].scrollHeight);
					height += items[i].scrollHeight;
					text = items[i].innerText.trim();
					if(delta > 0 || el.scrollTop == 0 || el.scrollTop == height) {
						if(delta > 0) {
							delta = items[i].scrollHeight - delta;
						}
						const next = i + this.scrollAt + this.adjust;
						for (var j = i + 1; j < next; j++) {
							delta += items[j].scrollHeight;
						}
						if(delta > el.offsetHeight) {
							return delta - el.offsetHeight;
						}
						return items[next].scrollHeight;
					}
				};
				return items[0].scrollHeight;
			}
			return 36;
		},
		scrollUp() {
			const el = this.$refs.panelScroll;
			if(el.scrollTop == 0) {
				return;
			}
			el.scroll(0, el.scrollTop - this.prevItemHeight());
		},
		scrollDown() {
			const el = this.$refs.panelScroll;
			if(el.scrollTop == el.scrollHeight - el.offsetHeight) {
				return;
			}
			el.scroll(0, el.scrollTop + this.nextItemHeight());
		},
		wheel(e) {
			e.preventDefault();
			if(e.deltaY > 0) {
				this.scrollDown();
			} else {
				this.scrollUp();
			}
		},
		scrolled() {
			const el = this.$refs.panelScroll;
			if(el) {
				if(el.scrollTop == 0) {
					this.$refs.scrollUp.classList.replace('fab-scroll-button', 'fab-scroll-button-disabled');
				} else {
					this.$refs.scrollUp.classList.replace('fab-scroll-button-disabled', 'fab-scroll-button');
				}
				if(el.scrollTop == el.scrollHeight - el.offsetHeight) {
					this.$refs.scrollDown.classList.replace('fab-scroll-button', 'fab-scroll-button-disabled');
				} else {
					this.$refs.scrollDown.classList.replace('fab-scroll-button-disabled', 'fab-scroll-button');
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
	cursor: pointer;
}

.fab-panel-item:hover {
	background-color: var(--hover);
}

.fab-triangle {
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
}

.fab-scroll-button:hover {
	background-color: var(--hover);
}

.fab-scroll-button-disabled {
	text-align: center;
	color: #66615b;
	cursor: pointer;
	height: var(--height);
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
