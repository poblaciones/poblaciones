<template>
	<v-popover popoverClass="tooltipInPopup tooltipNoBorder colorTooltip"
						 style=" display: inline-block;" :style="(child ? 'width: 100%;': (floatRight ? ' float: right;' : ''))"
						 popoverArrowClass="noArrow" :open="showDropDown"
						 :disabled="false" @hide="dropDownClosed" @show="dropDownOpened"
						 popoverInnerClass="tooltipNoBorder">

		<li v-if="child" style="position: relative"
				:class="(currentItem.separator ? 'liDividerNext' : '')" >

			<a v-if="!currentItem.separator" :style="' width: 100%; display: inline-block; padding-right: 28px; padding-left: '+ (15 + (currentItem.level ? currentItem.level : 0) * 14) +'px' ">
				{{ currentItem.label }}
				<i style="position: absolute; right: 10px; top: 14px; font-size: 12px" :class="icon" />
			</a>
		</li>
		<button v-else type="button" id="filterDropId" :title="tooltip"
						:class="triggerClass" :style="triggerStyle">
			<slot name="trigger">{{ label }}</slot>
			<i :class="icon" class="triggerIcon" />
		</button>

		<div slot="popover">
			<ul class="dropdown-menu dropdown-menu-right dropFilter" aria-labelledby="filterDropId">
				<template v-for="(item, index) in items">
					<li v-if="!item.items" style="position: relative" :class="(item.separator ? 'liDividerNext' : '') + ' ' + (item.liClass ? item.liClass : '')" :key="index">
						<a v-if="!item.items && !item.separator" :style="'padding-right: 28px; padding-left: '+ (15 + (item.level ? item.level : 0) * 14) +'px' "
							 @click="itemClicked(item)" :class="(item.aClass ? item.aClass : '')">
							{{ item.label }}


							<i v-if="item.icon && item.icon != 'X'"
								 style="position: absolute; right: 10px; top: 9px; color: #aaa; padding-top: 3px; font-size: 12px;"
								 :class="item.icon" />

							<X-Icon v-if="item.icon == 'X'" class="item.icon" style="position: absolute; right: 6px; top: 6px; width: 25px; height: 25px; color: #aaa; font-size: 12px;" />
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


	export default {
		name: 'dropdown',
		props: {
			floatRight: { type: Boolean, default: true },
			styleRounded: { type: Boolean, default: false },
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
			itemClicked(item) {
				this.dropDownClosed();
				// pasa el click
				this.$emit('itemClick', item);
			}
		},
			computed: {
				Use() {
					return window.Use;
				},
				// Los disparadores con texto suman labelButton, que ajusta lo que
				// lightButton resuelve suponiendo que solo lleva un ícono.
				triggerClass() {
					if (this.styleRounded) {
						return 'btn btn-default btn-xs';
					}
					return 'lightButton close' + ((this.label || this.$slots.trigger) ? ' labelButton' : '');
				},
				currentItem() {
					return { label: this.label, level: this.level, key: this.key, separator: this.separator };
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
		cursor: pointer;
	}

	.triggerIcon {
		font-size: 12px;
		padding-top: 2px;
		padding-left: 2px;
		height: 17px;
	}

	/* Ajustes sobre lightButton para un disparador que lleva texto: ese fija
	   un alto y ancho de 24px y un borde circular, pensados para los que solo
	   llevan ícono. La clase `close` que lo acompaña le saca decoraciones de
	   botón, pero de paso impone una opacidad, un color y un peso de fuente
	   que acá se reponen. */
	.labelButton {
		width: auto !important;
		height: auto !important;
		border-radius: 11px;
		font-size: 13px;
		font-weight: normal;
		padding: 6px 8px 2px 8px !important;
		margin-top: 4px;
		margin-bottom: -8px;
		white-space: nowrap;
		opacity: 1;
		color: #a9a9a9;
		/* normalize.css hace `button { text-transform: none }`, que corta la
		   herencia: restaurarla deja que mande el contenedor. */
		text-transform: inherit;
	}

	.labelButton:hover {
		color: #a9a9a9;
		opacity: 1;
	}


	.trigger > li > a {
		color: #66615b;
		font-size: 14px;
		padding: 10px 15px;
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

	.btn-group.select .trigger {
		min-width: 100%;
	}

	.trigger > li > a:hover,
	.trigger > li > a:focus {
		background-color: #66615B;
		color: rgba(255, 255, 255, 0.7);
		opacity: 1;
		text-decoration: none;
	}
</style>
