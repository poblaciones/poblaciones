<template>
	<div :style="'display: inline-block; width: 28px; margin-left: 10px; margin-right: -17px; margin-top: 4px;'
							+ (chipVisible ? '' : 'position:absolute;') +
							+ (offsetY ? 'top:' + offsetY + 'px;' : '') +
					'position: relative; ' + (topPadding ? 'padding-top: 5px' : '')">
		<v-popover popoverClass="tooltipInPopup tooltipNoBorder colorTooltip"
							 popoverArrowClass="noArrow" :open="showPicker"
							 :disabled="!canEdit" @hide="popOverClosed" @show="popOverOpened" popoverInnerClass="tooltipNoBorder">
			<mp-color-picker-chip :canEdit="canEdit" :localValue="localValue" v-show="chipVisible"
														:isDisabledObject="isDisabledObject" @show="show" />

			<div slot="popover">
				<chrome-picker :disableAlpha="true" v-show="showPickerAdvanced" v-model="localValue" @input="updateValue"
											 class="" />
				<compact-picker v-show="!showPickerAdvanced" v-model="localValue" @input="updateValue"
												:palette="palette"
												class="floatCompact" />
				<div class="extraColor extraBottomLine" @click="showPickerAdvanced = !showPickerAdvanced">
					<span v-if="showPickerAdvanced">▲</span>
					<span v-else>▼</span>
				</div>
				<div v-if="canSelectIcon && !showPickerAdvanced && canEdit" class="extraBottomLine" style="left: 3.2rem;">
					<md-button @click="iconPickerClicked" class="md-raised tinyButton" style="margin-left: 10px;">
						<i class="far fa-grin"></i>
						<md-tooltip md-direction="bottom">Seleccionar ícono</md-tooltip>
					</md-button>
				</div>

				<div v-if="isDisabledObject" class="smallSwitchPanel" v-show="!showPickerAdvanced">
					<md-switch class="md-primary smallSwitch" :disabled="!canEdit" @change="disabledChanged" v-model="isDisabled">
						Oculto al inicio
					</md-switch>
				</div>
			</div>
		</v-popover>
	</div>
</template>

<script>

import CompactPicker from 'vue-color/src/components/Compact';
import ChromePicker from 'vue-color/src/components/Chrome';
import MpColorPickerChip from './MpColorPickerChip';

export default {
	name: 'MpColorPicker',
	components: {
		CompactPicker,
		ChromePicker,
		MpColorPickerChip
	},
	methods: {
		updateValue()
		{
			var val = this.localValueHex;
			if (this.ommitHexaSign && val !== null) {
			val = val.substring(1);
			}
			this.$emit('input', val);
			if (!this.showPickerAdvanced) {
				this.hide();
			}
			this.$emit('valueChanged');
		},
		iconPickerClicked() {
			this.showPicker = false;
			this.$emit('pickIconClicked');
		},
		disabledChanged() {
			if (this.isDisabledObject) {
				this.isDisabledObject.Visible = !this.isDisabled;
				this.$emit('valueChanged');
			}
		},
		popOverOpened() {
			this.isOpen = true;
		},
		popOverClosed() {
			if (this.isOpen) {
				if (this.previousValue !== this.value) {
					this.$emit('selected');
				}
			}
			this.isOpen = false;
			this.showPickerAdvanced = false;
			this.showPicker = false;
		},
		receiveValue() {
			if (this.ommitHexaSign) {
				this.localValue = '#' + this.value;
			} else {
				this.localValue = this.value;
			}
		},
		show()
		{
			this.showPickerAdvanced = false;
			if (this.canEdit) {
				this.isDisabled = (this.isDisabledObject ? !this.isDisabledObject.Visible : false);
				this.previousValue = this.value;
				this.showPicker = true;
			}
		},
		toggle () {
			this.toggleCard = !this.toggleCard;
		},
		hide()
		{
			this.showPickerAdvanced = false;
			this.showPicker = false;
		}
	},
	computed: {
	localValueHex() {
		if (this.localValue.hex) {
			return this.localValue.hex.toUpperCase();
		} else {
			return this.localValue.toUpperCase();
		}
	},
	align() {
		var ret = '';
		if (this.verticalAlign === 'top') {
			ret += 'bottom: 27px;';
		} else if (this.verticalAlign === 'center') {
			ret += 'top: -25px;';
		}
		if (this.horizontalAlign === 'left') {
			ret += 'right: 0px;';
		} else if (this.horizontalAlign === 'center') {
			ret += 'left: -90px;';
		}
		return ret;
	},
	palette() {
		var ret = [ '#4D4D4D', '#999999', '#FFFFFF', '#F44E3B', '#FE9200', '#FCDC00',
		'#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF',
		'#333333', '#808080', '#CCCCCC', '#D33115', '#E27300', '#FCC400',
		'#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF',
		'#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00',
		'#808900', '#194D33', '#0C797D', '#0062B1', '#653294', '#AB149E',
		'#FFFFF0'];
		if (!ret.includes(this.localValueHex)) {
			ret.push(this.localValueHex);
		}
		return ret;
		}
	},
	created() {
		this.receiveValue();
	},
	data() {
		return {
			localValue: '#fb0000',
			isDisabled: false,
			showPicker: false,
			previousValue: null,
			isOpen: false,
			showPickerAdvanced: false,
			toggleCard: false,
		};
	},
	props: {
		isDisabledObject: null,
		canSelectIcon: { type: Boolean, default: false },
		chipVisible: { type: Boolean, default: true },
		offsetY: 0,
		canEdit: { type: Boolean, default: true },
		topPadding: { type: Boolean, default: true },
		ommitHexaSign: { type: Boolean, default: false },
		value: String,
		helper: String,
		verticalAlign: { type: String, default: 'bottom' },
		horizontalAlign: { type: String, default: 'right' }
	},
	watch: {
		'value' () {
			this.receiveValue();
		}
	}


	};
</script>
<style rel="stylesheet/scss" lang="scss" scoped="">
.tinyButton {
	height: 1.1rem;
	padding-top: 0px;
	min-width: unset;
	margin-top: 1px;
	margin-bottom: 2px;
	width: 2rem;
	font-size: .8rem !important ;
	box-shadow: 0 2px 1px -2px rgba(0, 0, 0, .20), 0 2px 2px 0 rgba(0, 0, 0, .14), 0 0px 2px 0 rgba(0, 0, 0, .41)!important;
}
.floatCompact {
	width: 230px;
}
.noArrow {
	display: none;
}
.crossed {
     background:
         linear-gradient(to top left,
             rgba(0,0,0,0) 0%,
             rgba(0,0,0,0) calc(50% - 0.8px),
             rgba(0,0,0,1) 50%,
             rgba(0,0,0,0) calc(50% + 0.8px),
             rgba(0,0,0,0) 100%),
         linear-gradient(to top right,
             rgba(0,0,0,0) 0%,
             rgba(0,0,0,0) calc(50% - 0.8px),
             rgba(0,0,0,1) 50%,
             rgba(0,0,0,0) calc(50% + 0.8px),
             rgba(0,0,0,0) 100%);
}
	.smallSwitchPanel {
		height: 15px;
		position: absolute;
		bottom: 7px;
		text-align: right;
		line-height: 1em;
		right: 7px;
		color: #7d7d7d;
		background-color: white;
	}
	.smallSwitch {
		margin-top: -2px;
		margin-right: 0px;
		margin-left: -65px;
		font-size: 20px;
		-moz-transform: scale(0.65);
		transform: scale(0.65);
		transform-origin: right;
	}

.extraBottomLine {
  position: absolute;
  bottom: 4px;
	font-size: 1rem;
  line-height: 1em;
  color: #666;
  background-color: white;
}
	.extraColor {
		left: 4px;
		padding: 2px;
		cursor: pointer;
	}
</style>
