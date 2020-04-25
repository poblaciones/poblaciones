<template>
	<div style="display: inline-block; width: 28px; position: relative; padding-top: 5px">

		<v-popover popoverClass="tooltipInPopup tooltipNoBorder"
							 popoverArrowClass="noArrow" :open="showPicker"
							 :disabled="!canEdit" @hide="popOverClosed" @show="popOverOpened" popoverInnerClass="tooltipNoBorder">

			<div :style="'background-color: ' + localValue" :class="'picked' + (canEdit ? ' hand': '')"
			v-on:click="show">
				<div v-show="isDisabledObject && !isDisabledObject.Visible">
					<div class="line2"></div>
				</div>
			</div>
			<div slot="popover">
				<chrome-picker :disableAlpha="true" v-show="showPickerAdvanced" v-model="localValue" @input="updateValue"
										class="" />
				<compact-picker v-show="!showPickerAdvanced" v-model="localValue" @input="updateValue"
										 :palette="palette"
										class="floatCompact" />
				<div class="extraColor" @click="showPickerAdvanced = !showPickerAdvanced">
					<md-icon v-if="showPickerAdvanced">arrow_drop_up</md-icon>
					<md-icon v-else>arrow_drop_down</md-icon>
				</div>
				<div v-if="isDisabledObject" class="disabledFeature" v-show="!showPickerAdvanced">
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

export default {
	name: 'MpColorPicker',
	components: {
		CompactPicker,
		ChromePicker
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
		},
		disabledChanged() {
			if (this.isDisabledObject) {
				this.isDisabledObject.Visible = !this.isDisabled;
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
		canEdit: { type: Boolean, default: true },
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
.picked {
	width: 30px;
	height: 23px;
	border-radius: 15px;
	border: 2px solid #828282;
}
.floatCompact {
	/* position: absolute;
	z-index: 10; */
	width: 246px;
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
.disabledFeature {
    height: 15px;
    position: absolute;
    bottom: 7px;
		width: 190px;
    line-height: 1em;
    right: 0px;
    color: #7d7d7d;
    cursor: pointer;
    background-color: white;
}
.smallSwitch {
	margin: 0px !important;
	font-size: 20px;
	-moz-transform: scale(0.65);
	transform: scale(0.65);
	transform-origin: right;
}

.line2 {
    width: 28px;
    height: 35px;
    border-bottom: 2px solid #707170;
    -webkit-transform: translateY(20px) translateX(5px) rotate(-26deg);
    position: absolute;
    top: -41px;
    left: -11px;
}
.extraColor {
  height: 15px;
  width: 15px;
  position: absolute;
  bottom: 9px;
  line-height: 1em;
  left: 0px;
  color: #7d7d7d;
  cursor: pointer;
  background-color: white;
}
</style>
