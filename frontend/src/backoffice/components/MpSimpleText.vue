<template>
	<div :style="(helper.length > 0 ? 'padding-bottom: 30px;' : 'padding-bottom: 8px;')">
		<md-field>
			<label class="mp-label" :style="(this.multiline ? 'top: 6px !important' : '')">
				{{ this.label }}</label>
			<md-input :class="(isDisabled ? 'mpDisabled' : '')" md-toggle-password v-if="!this.multiline" :placeholder="(placeholder ? placeholder : '')" :type="type" :disabled="isDisabled"
								style="font-size: 19px; width: 100%" autocomplete="off" v-model="localValue" :ref="inputId" :maxlength="(!isDisabled ? maxlength : 0)" :id="inputId" />
			<md-textarea v-if="this.multiline" :disabled="isDisabled" autocomplete="off"
									 class="mp-area" :class="(isDisabled ? 'mpDisabled' : '')" :style="minHeightRows" v-model="localValue"
									 :maxlength="(canEdit ? maxlength : 0)" :ref="inputId" :id="inputId" />
			<span v-if="suffix" class="md-suffix">{{ suffix }}</span>
			<div v-if="helper" style="line-height: 1em; position: absolute;
					 left: 0px; width: 100%; bottom: -2px;">
				<span class="md-helper-text helper" :style="helperPaddingRight + '; bottom: -18px;'">
					{{ helper }}
				</span>
			</div>
		</md-field>
	</div>
</template>

<script>

import str from '@/common/framework/str';

export default {
  name: 'MpSimpleText',
		components: {
  },
	methods: {
		ProcessTip(text) {
			text = str.Replace(text, "<br>", "#__BR__#");
			var encoded = this.htmlEncode(text);
			var retext = str.Replace(encoded, "#__BR__#", "<br>");
			return retext;
		},
		focus() {
			this.$nextTick(() => {
				this.input.$el.focus();
			});
		},
		htmlEncode(html ) {
	   return document.createElement( 'a' ).appendChild(
        document.createTextNode( html ) ).parentNode.innerHTML;
		},
		update()
		{
			var loc = this;
			if (this.type === 'number') {
				if (this.minimum !== -1) {
					var val = parseFloat(this.localValue);
					if (val < this.minimum) {
						this.localValue = this.minimum;
					}
				}
				if (this.maximum !== -1) {
					var val = parseFloat(this.localValue);
					if (val > this.maximum) {
						this.localValue = this.maximum;
					}
				}
			}
			this.$emit('input', this.localValue);
		}
  },
		computed: {
		classSize() {
			return 'md-layout-item md-size-' + (this.size ? this.size : 100);
		},
		helperPaddingRight() {
			if (this.isDisabled || this.maxlength === 0) {
				return '';
			}
			if (this.maxlength > 999) {
				return 'padding-right: 65px';
			} else if (this.maxlength > 99) {
				return 'padding-right: 55px';
			} else {
				return 'padding-right: 34px';
			}
		},
		minHeightRows() {
			return { 'min-height': (32 + 17 * this.rows) + 'px' };
		},
		isDisabled() {
			return !this.canEdit || this.$attrs.disabled;
		},
		inputId() {
			return 'textControl' + this._uid;
		},
		input() {
			return this.$refs[this.inputId];
		}
	},
	created() {
		this.localValue = this.value;
	},
	mounted() {
		var loc = this;
		this.input.$el.onkeydown = function(e) {
			if (e.keyCode === 13 && !loc.multiline) {
				loc.$emit('enter');
				return false;
			}
		};
	},
	data() {
		return {
			localValue: ''
		};
	},
  props: {
    label: String,
		maxlength: Number,
		minimum: { type: Number, default: -1 },
		maximum: { type: Number, default: -1 },
		multiline: Boolean,
		canEdit: { type: Boolean, default: true },
		type: { type: String, default: null },
		placeholder: String,
		suffix: String,
		rows: Number,
    value: {},
		helper: { type: String, default: '' },
  },
	watch: {
		'value'() {
			if (this.localValue !== this.value) {
				this.localValue = this.value;
			}
		},
		'localValue'() {
			if (this.localValue !== this.value) {
				this.update();
			}
		}
	}


};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>

.mpDisabled
{
    -webkit-text-fill-color: #999!important;
		color: red !important;
}

.mpDisabled[type="text"]:disabled
{
    -webkit-text-fill-color: #999!important;
		color: red !important;
}

</style>
