<template>
	<div>
		<ckeditor :editor="editor" v-model="localValue"
							@ready="onEditorReady" :style="minHeightRows"
							:disabled="isDisabled" :id="inputId" :ref="inputId" :config="config"></ckeditor>

	</div>
</template>

<script>

import str from '@/common/framework/str';
	import CKEditor from '@ckeditor/ckeditor5-vue2';
	import ClassicEditor from '@ckeditor/ckeditor5-build-balloon';
	import '@ckeditor/ckeditor5-build-classic/build/translations/es';

export default {
  name: 'MpRichArea',
		components: {
			ckeditor: CKEditor.component
  },
	methods: {
		focus() {
			this.$nextTick(() => {
				if (this.editorInstance) {
					this.editorInstance.focus();
				}
			});
		},
		preProcess(value) {
			if (value && value.length > 0 && !value.startsWith('<p')) {
				return '<p>' + value.split('\n').join('</p><p>') + '</p>';
			} else {
				return value;
			}
		},
		clearSelection() {
			if (this.editorInstance) {
				//this.editorInstance.data.viewDocument.selectiongetSelection().removeAllRanges();
			}
		},
		update()
		{
			this.$emit('input', this.localValue);
		},
		onEditorReady(editor) {
			this.editorInstance = editor;
			let container = editor.ui.view.editable.element;
			if (container) {
				container.addEventListener('mouseup', this.onEditorMouseUp);
				container.addEventListener('mousedown', this.onEditorMouseDown);
			}
		},
		onEditorMouseDown(e) {
			this.$emit('mousedown', e);
		},
		onEditorMouseUp(e) {
			this.$emit('mouseup', e);
		},
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
			return { 'min-height': (32 + 10 * this.rows) + 'px' };
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
		this.localValue = this.preProcess(this.value);
	},
	data() {
		return {
			localValue: '',
			editor: ClassicEditor,
			content: '',
			editorInstance: null,
			config: {
				// @change="handleEditorChange"
				toolbar: {
					items: ['bold', 'italic', '|', 'bulletedList', 'numberedList'],
				},
				language: 'es',
				wordcount: {
					maxCharCount: this.maxlength
				}
			},
		};
	},
  props: {
		maxlength: Number,
		canEdit: { type: Boolean, default: true },
		rows: Number,
    value: {},
  },
	watch: {
		'value'() {
			if (this.localValue !== this.value) {
				this.localValue = this.preProcess(this.value);
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
<style rel="stylesheet/scss" lang="scss" >

.mpDisabled
{
  -webkit-text-fill-color: #999!important;
	color: red !important;
}

.ck.ck-editor__editable_inline > :first-child {
	margin-top: .6em;
}

.mpDisabled[type="text"]:disabled
{
  -webkit-text-fill-color: #999!important;
	color: red !important;
}

.ck.ck-balloon-panel.ck-powered-by-balloon {
	display: none!important;
}

	.ck.ck-editor__editable.ck-focused:not(.ck-editor__nested-editable) {
		box-shadow: unset !important;
	}

	.ck-editor__editable:focus {
		border: 1px solid #448aff !important;
		background-color: white;
	}
	.ck-editor__editable {
		border: 1px solid #ebebeb !important;
		background-color: white;
	}

	.ck.ck-icon {
		font-size: 9px !important;
	}

	.ck-content p {
		margin: 2px 2px;
		padding: 0px;
	}

	.ck.ck-toolbar {
		background: white;
		padding: 0px 4px 0px 4px;
		border: 1px solid #c4c4c4;
	}

	.ck.ck-toolbar {
		border-radius: 0;
	}

	.ck.ck-toolbar {
		user-select: none;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
	}

	.ck.ck-button, a.ck.ck-button {
		min-width: 2em !important;
		min-height: 2em !important;
	}
</style>
