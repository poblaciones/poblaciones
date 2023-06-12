<template>
	<div class="md-layout-item md-size-100 formRow">
		<div class="label">{{ label }}</div>
		<md-field v-on:keydown.native.enter="enter" class="customField"
							:class="messageClass(validation)">
			<md-input v-model="localValue" ref="field" @input="input" :type="(password ? 'password' : 'text')"
								autocorrect="off" autocapitalize="off" spellcheck="false"
								autofocus :placeholder="localPlaceholder"></md-input>
			<span class="md-error" v-if="validation">{{ validationMessage }}</span>
			<span class="md-error">{{ extraError }}</span>
		</md-field>
	</div>

</template>

<script>

export default {
	name: 'MpInput',
	components: {

	},
	props: {
		validation: null,
		validationMessage: '',
		placeholder: '',
		extraError: '',
		label: '',
		isValidating: { type: Boolean, default: false },
		password: { type: Boolean, default: false },
		value: { type: String, default: '' },
		autofocus: { type: Boolean, default: false }
	},
	mounted() {
		if (this.autofocus) {
			setTimeout(() => {
				this.$refs.field.$el.focus();
			}, 200);
		}
		this.localPlaceholder = (this.placeholder ? this.placeholder : this.label);
	},
	data() {
		return {
			localValue: '',
			localPlaceholder: '',
		};
	},

	computed: {
	},
	methods: {
		enter(e) {
			this.$emit('enter', e);
		},
		input() {
			this.$emit('input', this.localValue);
			this.$emit('value', this.localValue);
		},
		messageClass(value = false) {
			return {
				'md-invalid': (value && this.isValidating) || this.extraError
			};
		},
	},
	watch: {
		'value'() {
			if (this.localValue !== this.value) {
				this.localValue = this.value;
			}
		},
		'localValue'() {
			if (this.localValue !== this.value) {
				this.input();
			}
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>


</style>
