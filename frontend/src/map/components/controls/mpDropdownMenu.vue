<template>
	<v-popover popoverClass="tooltipInPopup tooltipNoBorder colorTooltip"
						 style=" display: inline-block;" :style="(child ? 'width: 100%;': (floatRight ? ' float: right;' : ''))"
						 popoverArrowClass="noArrow" :open="showDropDown"
						 :disabled="false" @hide="dropDownClosed" @show="dropDownOpened" @apply-show="adjustMenuToViewport"
						 popoverInnerClass="tooltipNoBorder">

		<li v-if="child" style="position: relative"
				:class="(currentItem.separator ? 'mp-menu__item--divided' : '')" >

			<a v-if="!currentItem.separator" :style="' width: 100%; display: inline-block; padding-right: 28px; padding-left: '+ (15 + (currentItem.level ? currentItem.level : 0) * 14) +'px' ">
				{{ currentItem.label }}
				<i style="position: absolute; right: 10px; top: 14px; font-size: 12px" :class="icon" />
			</a>
		</li>
		<button v-else type="button" id="filterDropId" :title="tooltip" :aria-label="triggerAriaLabel" aria-haspopup="true"
						:class="triggerClass" :style="triggerStyle">
			<slot name="trigger">{{ label }}</slot>
			<i :class="icon" class="triggerIcon" />
		</button>

		<div slot="popover">
			<ul ref="menu" class="mp-menu dropFilter" :style="menuStyle" aria-labelledby="filterDropId">
				<template v-for="(item, index) in items">
					<li v-if="!item.items" style="position: relative" :class="(item.separator ? 'mp-menu__item--divided' : '') + ' ' + (item.liClass ? item.liClass : '')" :key="index">
						<a v-if="!item.items && !item.separator" :href="item.href" :target="item.target" :style="'padding-right: 28px; padding-left: '+ (15 + (item.level ? item.level : 0) * 14) +'px' "
							 @click="itemClicked(item, $event)" :class="(item.aClass ? item.aClass : '')">
							{{ item.label }}


							<i v-if="item.icon && item.icon != 'X'"
								 style="position: absolute;"
								 :class="item.icon" class="mp-menu__icon" />

							<X-Icon v-if="item.icon == 'X'" :class="item.icon" class="mp-menu__icon--x"  />
						</a>

					</li>
					<mp-dropdown-menu v-else :items="item.items" :child="true" :key="index" :level="item.level" :separator="item.separator"
									:label="item.label" icon="fas fa-chevron-right" @itemClick="itemClicked" />
				</template>
			</ul>
		</div>
	</v-popover>
</template>

<script>

	// https://materialdesignicons.com/cdn/1.9.32/
	import XIcon from '@/common/assets/xicon.svg';


	const VIEWPORT_MARGIN_PX = 8;

	export default {
		name: 'dropdown',
		props: {
			floatRight: { type: Boolean, default: true },
			// 'ghost' (glifo suave de cabecera), 'icon' (circular de 32 px), 'float' (40 px sobre el mapa) o 'pill' (texto con fondo al pasar el mouse)
			variant: { type: String, default: 'ghost' },
			items: { type: Array, default: function () { return []; } },
			icon: { type: String, default: '' },
			level: { type: Number, default: 0 },
			tooltip: { type: String, default: '' },
			separator: { type: Boolean, default: false },
			label: { type: String, default: '' },
			child: { type: Boolean, default: false },
			// Estilo inline del disparador. Va por prop y no por clase porque
			// el CSS scoped del padre no alcanza a los hijos de este componente.
			triggerStyle: { type: String, default: '' },
		},
		components: {
			XIcon
		},
		data() {
			return {
				showDropDown: false,
				isDropDownOpen: false,
				menuShiftX: 0,
			};
		},
		methods: {
			dropDownOpened() {
				this.showDropDown = true;
				this.isDropDownOpen = true;
				this.$emit('dropDownOpened');
			},
			dropDownClosed() {
				this.showDropDown = false;
				this.isDropDownOpen = false;
			},
			itemClicked(item, event) {
				this.dropDownClosed();
				// Con href, ctrl/cmd/shift + clic los resuelve el navegador (pestaña o ventana nueva)
				if (item.href && this.isModifiedClick(event)) {
					return;
				}
				// pasa el click
				this.$emit('itemClick', item, event);
			},
			isModifiedClick(event) {
				return event.ctrlKey || event.metaKey || event.shiftKey;
			},
			adjustMenuToViewport() {
				this.menuShiftX = 0;
				// Popper posiciona el popover en el primer frame; recién en el segundo la medición es válida.
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						this.shiftMenuInsideViewport();
					});
				});
			},
			// Popper no ve el menú (es absolute dentro del popover), por eso no lo acota al viewport.
			shiftMenuInsideViewport() {
				var menuLeft = this.$refs.menu.getBoundingClientRect().left;
				if (menuLeft < VIEWPORT_MARGIN_PX) {
					this.menuShiftX = VIEWPORT_MARGIN_PX - menuLeft;
				}
			}
		},
			computed: {
				Use() {
					return window.Use;
				},
				triggerClass() {
					if (this.variant === 'float') {
						return 'mp-btn mp-btn--float';
					}
					if (this.variant === 'icon') {
						return 'mp-icon-btn triggerSpaced';
					}
					if (this.variant === 'pill') {
						return 'mp-btn mp-btn--soft';
					}
					if (this.label || this.$slots.trigger) {
						return 'mp-icon-btn mp-icon-btn--sm mp-icon-btn--label';
					}
					return 'mp-icon-btn mp-icon-btn--sm mp-icon-btn--ghost';
				},
				triggerAriaLabel() {
					if (this.label) {
						return null;
					}
					if (this.tooltip) {
						return this.tooltip;
					}
					return null;
				},
				currentItem() {
					return { label: this.label, level: this.level, key: this.key, separator: this.separator };
				},
				menuStyle() {
					return { '--menu-shift-x': this.menuShiftX + 'px' };
				}
		},
	};
</script>

<style scoped>
	.vellipsis:after {
		content: '\2807';
		font-size: .8em;
	}

	.activeButton {
		opacity: .45;
	}

	.filterDropdownButton {
		font-size: 11px;
		margin-left: -5px;
		margin-right: 3px;
	}

	.dropFilter {
		margin-top: 0px;
		transform: translate(calc(20px + var(--menu-shift-x, 0px)), 4px);
		cursor: pointer;
		overflow: hidden;
	}

	.triggerIcon {
		font-size: 14px;
	}

	.mp-btn--float .triggerIcon {
		font-size: inherit;
	}

	.mp-btn--soft .triggerIcon {
		margin-left: .255em;
	}

	.triggerSpaced {
		margin: 0 2px 0 1px;
	}


	.trigger > li > a {
		color: #66615b;
		font-size: 16px;
		padding: 8px 15px;
		-webkit-transition: none;
		-moz-transition: none;
		-o-transition: none;
		-ms-transition: none;
		transition: none;

	}

		.trigger > li > a img {
			margin-top: -3px;
		}

		.trigger > li > a:focus {
			outline: 0 !important;
		}

	.trigger > li > a:hover,
	.trigger > li > a:focus {
		background-color: #66615B;
		color: rgba(255, 255, 255, 0.7);
		opacity: 1;
		text-decoration: none;
	}
</style>
