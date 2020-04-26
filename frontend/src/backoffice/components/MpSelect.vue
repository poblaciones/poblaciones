<template>
	<div style="margin-bottom: 20px;">
		<md-field>
			<label class="mp-label">
				{{ this.label }}</label>
			<md-select :title="format(currentObjectSelected)" md-dense
								 v-model="localSelectValue" ref="input"
								 :disabled="isDisabled"
								 @md-selected="selected">
				<md-option v-if="allowNull" :value="-1111111">{{ nullLabel }}</md-option>
				<md-option v-for="item in list" :key="item[listKey]" :value="item[listKey]">
					{{ format(item) }}
				</md-option>
			</md-select>
		</md-field>
		<div v-if="helper" style="line-height: 1em; margin-top: -7px;">
			<span class="md-helper-text helper">
				{{ helper }}
			</span>
		</div>
	</div>
</template>

<script>


export default {
  name: 'MpSelect',
	components: {
  },
	methods: {
		focus() {
			this.$nextTick(() => {
				this.input.$el.focus();
			});
		},
		htmlEncode(html ) {
	   return document.createElement( 'a' ).appendChild(
        document.createTextNode( html ) ).parentNode.innerHTML;
		},
		selected() {
			if (this.isInUpdate) {
				this.isInUpdate = false;
				return;
			}
			this.updateValue();
			if (this.value === this.localValue ||
				(this.value === null && (this.localValue === '' || this.localValue === null))) {
				return;
			}
			this.$emit('input', this.localValue);
			this.$emit('selected');
		},
		updateValue() {
			if (this.allowNull && this.localSelectValue === -1111111) {
				this.localValue = null;
			} else if (this.modelKey) {
				this.localValue = this.localSelectValue;
			} else {
				var n = this.findById(this.localSelectValue);
				if (n !== -1) {
					this.localValue = this.list[n];
				}
			}
		},
		receiveValue() {
			this.localValue = this.value;
			if (this.allowNull && (this.localValue === null || this.localValue === "")) {
				this.setLocalSelected(-1111111);
			} else if (this.modelKey || this.value === null) {
				this.setLocalSelected(this.value);
			} else {
				var n = this.findById(this.value[this.listKey]);
				if (n !== -1) {
					this.setLocalSelected(this.list[n][this.listKey]);
				}
			}
		},
		setLocalSelected(val) {
			if (val !== this.localSelectValue) {
				this.localSelectValue = val;
				this.isInUpdate = true;
			}
		},
		findById(val) {
			if (this.list === null) {
				return -1;
			}
			for(var i = 0; i < this.list.length; i++) {
				if (val === this.list[i][this.listKey]) {
					return i;
				}
			}
			return -1;
		},
		format(item) {
			if (item === null && this.allowNull) {
				return this.nullLabel;
			} else if (item === null) {
				return '';
			} else if (this.render) {
				return this.render(item);
			} else {
				if (item[this.listCaption] === undefined) {
					throw new Error('El item \'' + JSON.stringify(item) + '\' no contiene una propiedad \'' + this.listCaption + '\'.');
				} else {
					return item[this.listCaption];
				}
			}
		}
  },
	computed: {
		classSize() {
			return 'md-layout-item md-size-' + (this.size ? this.size : 100);
		},
		isDisabled() {
			return !this.canEdit || this.$attrs.disabled;
		},
		currentObjectSelected() {
			var n = this.findById(this.localSelectValue);
			if (n !== -1) {
				return this.list[n];
			} else {
				return null;
			}
		},
		input() {
			return this.$refs.input;
		}
	},
	created() {
		if (this.value !== null) {
			this.receiveValue();
		}
	},
	data() {
		return {
			localValue: '',
			localSelectValue: '',
			isInUpdate: false
		};
	},
  props: {
    label: String,
		list: Array,
		listKey: { type: String, default: 'Id' },
		listCaption: { type: String, default: 'Caption' },
		value: {},
		render: { type: Function, default: null },
		modelKey: { type: Boolean, default: false },
		allowNull: { type: Boolean, default: false },
		nullLabel: { type: String, default: '[Ninguna]' },
		canEdit: { type: Boolean, default: true },
		helper: String,
  },
	watch: {
		'value'() {
			this.receiveValue();
		}
	}


};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
</style>
