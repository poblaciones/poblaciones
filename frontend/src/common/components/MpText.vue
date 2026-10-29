<template >
	<div :class="this.classSize + (lighterColor ? ' lighterColor' : ' defaultColor') + helperClass" :style="(helper && helper.length > 0 ? 'margin-bottom: 20px;' : '')" v-on-clickaway="away">
		<div style="position: relative;"  ref="container">
			<div :style="wrapperStyle" @dblclick="StartEdit">
				<md-field :style="fieldStyle" class="mp-editable-text" :class="fieldClass">
					<label class="mp-label unselectable" :style="labelStyle">
						{{ this.label }}
					</label>
					<md-input v-if="!this.multiline" :type="type" autocomplete="off"
										:style="inputStyle"
										:placeholder="(placeholder ? placeholder : '')"
										:class="(!editMode ? 'unselectable' : '')"
										@mousedown="mouseDown" @mouseup="mouseUp" v-model="localValue"
										:disabled="isDisabled || !editMode" :ref="inputId" :maxlength="(!isDisabled ? maxlength : 0)" />
					<md-textarea v-if="this.multiline && !this.formatted" class="mp-area" :rows="rows" :style="minHeightRows + highlightBorder" autocomplete="off"
											 :readonly="isDisabled || !editMode" @mousedown="mouseDown" @mouseup="mouseUp" v-model="localValue" :maxlength="(!isDisabled ? maxlength : 0)" :ref="inputId" />

					<mp-rich-area style="width: 100%; margin-top: 10px;" @mousedown="mouseDown" @mouseup="mouseUp" :maxlength="maxlength" :rows="rows" v-if="this.multiline && this.formatted" :canEdit="!isDisabled && editMode"
												v-model="localValue" :ref="inputId" />

					<span v-if="suffix" class="md-suffix">{{ suffix }}</span>
				</md-field>
			</div>
			<div style="line-height: 1em; margin-top: -5px;">
				<span class="md-helper-text helper" style="bottom: -18px;"
							:ref="helperId" v-html="ProcessTip(helper)"></span>
				<span class="md-helper-text error" style="color: red; bottom: -18px;">{{ errorMessage }}</span>
			</div>
			<div v-if="limitReached" class="mp-limit-tip" :style="limitTipStyle">{{ limitTipText }}</div>
			<div v-if="!isDisabled" :style="panelStyle" class="buttonsPanel">
				<button-panel ref="buttonPanel" style="position: absolute!important"
											@onCancel="cancel" @onUpdate="Update" @onEditModeChange="ChangeEditableMode" @onFocus="focus"></button-panel>
			</div>
		</div>

	</div>
</template>

<script>

import ButtonPanel from './ButtonPanel';
import { mixin as clickaway } from 'vue-clickaway';
import str from '@/common/framework/str';
import MpRichArea from './MpRichArea';

const PANEL_STEP = 55;
const PANEL_GAP = 6;
const PANEL_RIGHT_MARGIN = 80;
const PANEL_RESERVED_WIDTH = 85;
const RIGHT_PANEL_EXTRA_MARGIN = 12;
const MIN_RIGHT_FIELD_WIDTH = 40;
const RIGHT_FIELD_PADDING = 6;
const LABEL_EXTRA_WIDTH = 14;
const DEFAULT_EDIT_PANEL_WIDTH = 80;

export default {
  name: 'MpText',
	components: {
		ButtonPanel,
		MpRichArea
	},
	props: {
		label: String,
		size: String,
		error: String,
		canEdit: { type: Boolean, default: true },
		largeFont: { type: Boolean, default: false },
		multiline: Boolean,
		alignRight: { type: Boolean, default: false },
		formatted: { type: Boolean, default: false },
		lighterColor: { type: Boolean, default: false },
		suffix: String,
		type: { type: String, default: null },
		rows: Number,
		placeholder: String,
		maxlength: Number,
		value: {
			type: [String, Number],
			default: ''
		},
		helper: String,
		required: Boolean
	},
	mixins: [ clickaway ],
	methods: {
		measureWidth(element, text) {
			var style = window.getComputedStyle(element);
			var context = this.measureCanvas.getContext('2d');
			context.font = style.fontStyle + ' ' + style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
			return context.measureText(text).width;
		},
		measureTextWidth() {
			var text = String(this.localValue);
			if (text.length === 0 && this.placeholder) {
				text = this.placeholder;
			}
			return this.measureWidth(this.input.$el, text);
		},
		measureLabelWidth() {
			var labelElement = this.$el.querySelector('label');
			if (!this.label || !labelElement) {
				return 0;
			}
			return this.measureWidth(labelElement, this.label) + LABEL_EXTRA_WIDTH;
		},
		maxPanelLeft() {
			return Math.max(0, this.$refs.container.clientWidth - PANEL_RIGHT_MARGIN - this.editPanelWidth + 85);
		},
		rememberEditPanelWidth() {
			var width = this.$refs.buttonPanel.$el.offsetWidth;
			if (width > 0) {
				this.editPanelWidth = width;
			}
		},
		stepPanelLeft(required, maxLeft) {
			var left = Math.min(this.panelLeft, maxLeft);
			if (required > left) {
				left = left + Math.ceil((required - left) / PANEL_STEP) * PANEL_STEP;
			} else {
				left = left - Math.floor((left - required) / PANEL_STEP) * PANEL_STEP;
			}
			return Math.min(left, maxLeft);
		},
		observePanel() {
			this.panelObserver.disconnect();
			if (this.$refs.buttonPanel) {
				this.panelObserver.observe(this.$refs.buttonPanel.$el);
			}
		},
		updateLimitReached() {
			if (!this.editMode || !this.maxlength || this.multiline) {
				this.limitReached = false;
				return;
			}
			this.limitReached = String(this.localValue).length >= this.maxlength;
		},
		updateTextWidth() {
			if (this.shrinksToText) {
				this.contentWidth = Math.max(this.measureTextWidth() + RIGHT_FIELD_PADDING, this.measureLabelWidth());
			}
		},
		updatePanelPosition() {
			if (!this.isFloatingPanel || !this.$refs.buttonPanel) {
				return;
			}
			if (this.editMode) {
				this.rememberEditPanelWidth();
			}
			var maxLeft = this.maxPanelLeft();
			var required = Math.max(this.measureTextWidth() + PANEL_GAP, this.measureLabelWidth());
			if (this.editMode) {
				this.panelLeft = this.stepPanelLeft(required, maxLeft);
			} else {
				this.panelLeft = Math.min(required, maxLeft);
			}
		},
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
			if (this.formatted && this.multiline) {
				this.editMode = mode;
				if (mode) {
					this.input.focus();
				}
				this.input.clearSelection();
				return;
			}

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
			if (this.formatted && this.multiline) {
				this.input.clearSelection();
				return;
			}
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
				var parent = e.target.parentElement;
				if (this.isCkElement(parent)) {
					return;
				}
				var parent = parent.parentElement;
				if (this.isCkElement(parent)) {
					return;
				}

				if (this.valueChanged) {
          this.$refs.buttonPanel.showPrompt();
        } else {
          this.$refs.buttonPanel.Cancel();
        }
			}
		},
		isCkElement(ele) {
			if (ele && ele.className) {
				if (ele.className.indexOf &&
					ele.className.indexOf('ck-button') >= 0 ||
					ele.className.indexOf('ck-toolbar') >= 0) {
					return true;
				}
			}
		return false;
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
		isFloatingPanel() {
			return !this.alignRight && !this.multiline;
		},
		extraRightMargin() {
			if (!this.isFloatingPanel) {
				return RIGHT_PANEL_EXTRA_MARGIN;
			}
			return 0;
		},
		panelRightMargin() {
			return PANEL_RIGHT_MARGIN + this.extraRightMargin;
		},
		wrapperStyle() {
			return { 'padding-right': (PANEL_RESERVED_WIDTH + this.extraRightMargin) + 'px' };
		},
		shrinksToText() {
			return !this.multiline;
		},
		fieldStyle() {
			var style = { 'margin-bottom': '0px' };
			if (this.shrinksToText) {
				style.width = Math.max(MIN_RIGHT_FIELD_WIDTH, this.contentWidth) + 'px';
				style['max-width'] = '100%';
			}
			if (this.shrinksToText && this.alignRight) {
				style['margin-left'] = 'auto';
			}
			return style;
		},
		panelStyle() {
			if (this.isFloatingPanel) {
				return { position: 'absolute', top: '0px', left: this.panelLeft + 'px'};
			} else {
				return { position: 'absolute', top: '0px', right: this.panelRightMargin + 'px', width: '0px'};
			}
		},
		inputStyle() {
			var style = { 'text-overflow': 'ellipsis', width: '100%' };
			if (this.largeFont) {
				style['font-size'] = '21px';
				style['letter-spacing'] = '-1%';
			} else {
				style['font-size'] = '19px';
			}
			if (this.alignRight) {
				style['text-align'] = 'right';
			}
			return style;
		},
		labelStyle() {
			var style = '';
			if (this.multiline) {
				style += 'top: 6px !important;';
			}
			if (!this.editMode) {
				style += 'pointer-events: auto !important;';
			}
			return style;
		},
		fieldClass() {
			if (this.multiline && this.editMode) {
				return 'mp-show-count';
			}
			return '';
		},
		limitTipText() {
			return 'Límite de ' + this.maxlength + ' caracteres alcanzado';
		},
		limitTipStyle() {
			var edgeOffset = (PANEL_RESERVED_WIDTH + this.extraRightMargin) + 'px';
			if (this.alignRight) {
				return { right: edgeOffset };
			}
			return { left: '0px' };
		},
		helperClass() {
			if (this.helper && this.helper.length > 0) {
				return ' mp-has-helper';
			}
			return '';
		},
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
		this.measureCanvas = document.createElement('canvas');
		this.panelObserver = new ResizeObserver(this.updatePanelPosition);
	},
	beforeDestroy() {
		window.removeEventListener('resize', this.updatePanelPosition);
		this.panelObserver.disconnect();
	},
	mounted() {
		var loc = this;
		window.addEventListener('resize', this.updatePanelPosition);
		this.$nextTick(this.observePanel);
		this.updateTextWidth();
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
			pendingMouseUp: false,
			panelLeft: 0,
			contentWidth: 0,
			limitReached: false,
			editPanelWidth: DEFAULT_EDIT_PANEL_WIDTH
		};
	},
	watch: {
		label() {
			this.$nextTick(this.updateTextWidth);
			this.$nextTick(this.updatePanelPosition);
		},
		localValue() {
			this.updateLimitReached();
			this.updateTextWidth();
			this.updatePanelPosition();
		},
		editMode() {
			this.updateLimitReached();
			this.$nextTick(this.updatePanelPosition);
		},
		isDisabled() {
			this.$nextTick(this.observePanel);
		},
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

	.lighterColor {
		-webkit-text-fill-color: var(--mp-text-muted)!important;
	}.defaultColor {
		-webkit-text-fill-color: rgba(0,0,0,0.87);
	}


.md-layout-item .md-size-25 {
  padding: 0 !important;
}
	.mp-limit-tip {
		position: absolute;
		top: calc(100% + 2px);
		z-index: 200;
		padding: 1px 8px;
		border-radius: 4px;
		font-size: 12px;
		white-space: nowrap;
		pointer-events: none;
		color: white;
		-webkit-text-fill-color: white;
		background-color: rgba(97, 97, 97, 0.92);
	}
	.mp-has-helper .mp-limit-tip {
		top: calc(100% - 18px);
	}
	.buttonsPanel {
		z-index: 100;
	}
</style>

<style>
.mp-editable-text:not(.mp-show-count) .md-count {
	display: none !important;
}
.mp-has-helper .md-count {
	transform: translateY(10px);
}
</style>
