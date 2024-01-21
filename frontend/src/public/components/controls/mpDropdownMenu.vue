<template>
	<v-popover popoverClass="tooltipInPopup tooltipNoBorder colorTooltip"
						 style=" display: inline-block;" :style="(child ? 'width: 100%;': ' float: right;')"
						 popoverArrowClass="noArrow" :open="showDropDown"
						 :disabled="false" @hide="dropDownClosed" @show="dropDownOpened"
						 popoverInnerClass="tooltipNoBorder">

		<li v-if="child" style="position: relative"
				:class="(currentItem.separator ? 'liDividerNext' : '')" >

			<a :style="' width: 100%; display: inline-block;; padding-left: '+ (15 + (currentItem.level ? currentItem.level : 0) * 14) +'px' ">
				{{ currentItem.label }}
				<i style="position: absolute; right: 10px; top: 12px;" :class="icon" />
			</a>

		</li>
		<button v-else type="button" id="filterDropId"
						class="lightButton close">
			{{ label }}
			<i :style="(label ? 'float: right' : '')" :class="icon" />
		</button>

		<div slot="popover">
			<ul class="dropdown-menu dropdown-menu-right dropFilter" aria-labelledby="filterDropId">
				<template v-for="(item, index) in items">
					<li v-if="!item.items" style="position: relative" :class="(item.separator ? 'liDividerNext' : '')" :key="index">
						<a v-if="!item.items" :style="'padding-left: '+ (15 + (item.level ? item.level : 0) * 14) +'px' "
							 @click="itemClicked(item)">
							{{ item.label }}

							<i v-if="item.icon"
								 style="position: absolute; right: 10px; top: 12px; color: #aaa; font-size: 12px;"
								 :class="item.icon" />
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

	export default {
		name: 'dropdown',
		props: {
			items: { type: Array, default: function () { return []; } },
			icon: { type: String, default: '' },
			level: { type: Number, default: 0 },
			separator: { type: Boolean, default: false },
			label: { type: String, default: '' },
			child: { type: Boolean, default: false },
		},
		components: {

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
