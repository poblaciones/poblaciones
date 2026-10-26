<template>
	<div class="md-layout-item md-size-100 formRow">
		<div class="label">{{ label }}</div>
		<md-field v-on:keydown.native.enter="enter" class="customField"
							:class="messageClass(validation)">
			<md-input v-model="localValue" ref="field" @input="input" :type="(password ? 'password' : 'text')"
								autocorrect="off" autocapitalize="off" spellcheck="false"
								autofocus :placeholder="localPlaceholder"></md-input>
		</md-field>
		<div class="mp-input-error" role="alert" v-if="validation && isValidating">{{ validationMessage }}</div>
		<div class="mp-input-error" role="alert" v-if="extraError">{{ extraError }}</div>
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

	.mp-input-error {
		margin: 0 0 6px 0;
		font-size: 12px;
		line-height: 1.3;
		white-space: normal;
		overflow-wrap: anywhere;
		color: var(--md-theme-default-accent, #ff5252);
	}
</style>
