<template >
	<div :class="this.classSize" class="defaultColor" :style="(helper && helper.length > 0 ? 'margin-bottom: 20px;' : '')" v-on-clickaway="away">
		<div class="md-layout ">
			<div class="md-layout-item md-size-75" v-on:dblclick="StartEdit">
				<md-field style="margin-bottom: 0px">
					<label class="mp-label unselectable" :style="(this.multiline ? 'top: 6px !important' : '')">
						{{ this.label }}
					</label>
					<md-input v-if="!this.multiline" :type="type" style="text-overflow: ellipsis; width: 100%" autocomplete="off"
										:style="'font-size: ' + (largeFont ? '24' : '19') + 'px'"
										:placeholder="(placeholder ? placeholder : '')"
										:class="(!editMode ? 'unselectable' : '')"
										v-on:mousedown="mouseDown" v-on:mouseup="mouseUp" v-model="localValue"
										:disabled="isDisabled || !editMode" :ref="inputId" :maxlength="(!isDisabled ? maxlength : 0)" />
					<md-textarea v-if="this.multiline" class="mp-area" :style="minHeightRows + highlightBorder" autocomplete="off"
											 :readonly="isDisabled || !editMode" v-model="localValue" :maxlength="(!isDisabled ? maxlength : 0)" :ref="inputId" />
					<span v-if="suffix" class="md-suffix">{{ suffix }}</span>
				</md-field>
				<div :style="'line-height: 1em;' + (!isDisabled && maxlength > 0 ? ' padding-right: 34px' : '')">
					<span class="md-helper-text helper" style="bottom: -18px;"
								:ref="helperId" v-html="ProcessTip(helper)"></span>
					<span class="md-helper-text error" style="color: red; bottom: -18px;">{{ errorMessage }}</span>
				</div>
			</div>
			<div v-if="!isDisabled" class="md-layout-item md-size-25">
				<button-panel ref="buttonPanel" style="position: absolute"
					@onCancel="cancel" @onUpdate="Update" @onEditModeChange="ChangeEditableMode" @onFocus="focus"
						></button-panel>
			</div>
		</div>

	</div>
</template>

<script>

import ButtonPanel from './ButtonPanel';
import { mixin as clickaway } from 'vue-clickaway';
import str from '@/common/js/str';

export default {
  name: 'MpText',
	components: {
    ButtonPanel
	},
	mixins: [ clickaway ],
	methods: {
		cancel() {
			this.localValue = this.value;
		},
		StartEdit() {
			if (!this.isDisabled && !this.$refs.buttonPanel.editableMode) {
				var loc = this;
				setTimeout(() => {
					loc.$refs.buttonPanel.EditField();
				}, 75);
			}
		},
		CheckBluring(ele) {
			if (this.$refs.buttonPanel.HasFocus() === false && ele !== this.input.$el) {
        if (this.valueChanged) {
          this.$refs.buttonPanel.showPrompt();
        } else {
          if (this.$refs.buttonPanel && this.$refs.buttonPanel.editableMode) {
            this.$refs.buttonPanel.Cancel();
          }
        }
      }
		},
		ProcessTip(text) {
			if (text === undefined) {
					return '';
				}
			text = str.Replace(text, "<br>", "#__BR__#");
			var encoded = this.htmlEncode(text);
			var retext = str.Replace(encoded, "#__BR__#", "<br>");
			return retext;
		},
		focus() {
     	this.input.$el.focus();
		},
		ChangeEditableMode(mode) {
      if (mode) {
				var len = this.input.$el.value.length;
				var offset = -1;
				if (this.multiline) {
					offset = this.input.$el.scrollTop;
				}
				this.input.$el.selectionStart = 0;
				this.input.$el.selectionEnd = len;
				if (offset != -1) {
					var loc = this;
					setTimeout(() => {
						loc.input.$el.scrollTop = offset;
					}, 50);
				}
			} else {
				this.clearSelection();
			}
			this.editMode = mode;
		},
		clearSelection() {
			this.input.$el.selectionStart = 0;
			this.input.$el.selectionEnd = 0;
			var sel = window.getSelection ? window.getSelection() : document.selection;
			if (sel) {
				if (sel.removeAllRanges) {
					sel.removeAllRanges();
				} else if (sel.empty) {
					sel.empty();
				}
			}
		},
		htmlEncode(html ) {
	   return document.createElement( 'a' ).appendChild(
        document.createTextNode( html ) ).parentNode.innerHTML;
		},
		mouseUp() {
			this.pendingMouseUp = false;
		},
		mouseDown() {
			this.pendingMouseUp = true;
		},
		away(e) {
			if (this.$refs.buttonPanel && this.$refs.buttonPanel.editableMode) {
				if (this.pendingMouseUp) {
					this.pendingMouseUp = false;
					return;
				}
				if (this.valueChanged) {
          this.$refs.buttonPanel.showPrompt();
        } else {
          this.$refs.buttonPanel.Cancel();
        }
			}
    },
		Update() {
			this.localValue = this.localValue.trim();
			const REQUIRED = 'Debe indicar un valor.';
			if (this.required && this.localValue === '') {
				this.localError = REQUIRED;
				return false;
			}
			if (this.localError === REQUIRED) {
				this.localError = '';
			}
			this.$emit('value', this.localValue);
			this.$emit('input', this.localValue);
			this.$emit('update', this.localValue);
			return true;
		},
  },
	computed: {
		classSize() {
			return 'md-layout-item md-size-' + (this.size ? this.size : 100);
		},
		isDisabled() {
			return !this.canEdit || this.$attrs.disabled;
		},
		valueChanged() {
			return this.localValue !== this.value;
		},
		minHeightRows() {
			return { 'min-height': (32 + 17 * this.rows) + 'px' };
		},
		highlightBorder() {
			if (this.editMode) {
				return '; border: 1px solid #448aff!important;';
			} else {
				return '';
			}
		},
		errorMessage() {
			var ret = '';
			if (this.error) {
				ret = this.error;
			}
			if (this.error && this.localError) {
				ret += '. ';
			}
			return ret + this.localError;
		},
		helperId() {
			return 'helper' + this._uid;
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
		this.input.$el.onblur = () => {
     setTimeout(() => {
				this.CheckBluring(document.activeElement);
      }, 75);
    };
    this.input.$el.onkeydown = function(e) {
			if (e.keyCode === 13 && !loc.multiline) {
				setTimeout(() => {
					loc.$refs.buttonPanel.Save();
					loc.input.$el.blur();
				}, 75);
  			return false;
			}
			if (e.keyCode === 27) {
				setTimeout(() => {
					loc.$refs.buttonPanel.Cancel();
					loc.input.$el.blur();
				}, 75);
  			return false;
			}
    };
	},
	data() {
		return {
			localValue: '',
			localError: '',
			editMode: false,
			pendingMouseUp: false
		};
	},
  props: {
    label: String,
    size: String,
    error: String,
		canEdit: { type: Boolean, default: true },
		largeFont: { type: Boolean, default: false},
		multiline: Boolean,
		suffix: String,
		type: { type: String, default: null },
		rows: Number,
		placeholder: String,
		maxlength: Number,
    value: String,
		helper: String,
		required: Boolean
  },
	watch: {
	'value' () {
			if (this.valueChanged) {
				this.localValue = this.value;
			}
		}
	}


};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>

.error {
	font-size: 11px;
}

.md-field.md-theme-default.md-focused .md-input, .md-field.md-theme-default.md-focused .md-textarea, .md-field.md-theme-default.md-has-value .md-input, .md-field.md-theme-default.md-has-value .md-textarea {
	-webkit-text-fill-color: unset !important;
}

.defaultColor {
	-webkit-text-fill-color: rgba(0,0,0,0.87);
}


.md-layout-item .md-size-25 {
  padding: 0 !important;
}
</style>
