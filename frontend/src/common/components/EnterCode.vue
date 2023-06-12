<template>
	<mp-wait ref="wait" class="formRow">
		<div class="md-layout">
			<div class="md-layout-item md-size-100" style="padding-right: 155px; padding-left: 150px;">
				<div class="label">{{ $tc('key.CODE') }}</div>
				<md-field v-on:keydown.native.enter="next" :md-counter="false" @input="clearError" class="customField"
							style="min-width: 115px!important;">
					<md-input v-model="code" maxlength="6" ref="code" autocorrect="off"
							autocapitalize="off" spellcheck="false" class="mono" placeholder="------"></md-input>
				</md-field>
			</div>
			<div class="md-layout-item md-size-100" style="padding-left: 150px;">
				<span class="label-error" v-if="$v.code.$invalid && hasMessages">{{ $t('Debe indicar el código.') }}</span>
				<span class="label-error">{{ serverError }}</span>
			</div>
			<div class="md-layout-item md-size-100 formRow">
				<md-button class="md-primary md-raised fullRowButton" @click="next">{{ $t('Siguiente') }}</md-button>
			</div>
		</div>
	</mp-wait>
</template>

<script>
import { required } from 'vuelidate/lib/validators';
import response from '@/common/framework/response';
// https://www.npmjs.com/package/vue2-animate#sassscss

export default {
	name: 'Signup',
	components: {

	},
	mounted() {
		this.serverError = '';
		if (this.autofocus) {
			setTimeout(() => {
				this.$refs.code.$el.focus();
			}, 200);
		}
	},
	props: {
		email: '',
		target: '',
		autofocus: { type: Boolean, default: false }
	},
	data() {
		return {
			hasMessages: false,
			code: '',
			serverError: '',
		};
	},
	validations: {
		code: {
			required,
		},
	},
	computed: {

	},
	methods: {
		focus() {
			setTimeout(() => {
				this.$refs.code.$el.focus();
			}, 200);
		},
		messageClass(value = false) {
			return {
				'md-invalid': value && (this.hasMessages || this.serverError)
			};
		},
		clearError() {
			this.serverError = '';
		},
		next() {
			this.$v.$touch();
			this.hasMessages = this.$v.$invalid;
			if (this.hasMessages) {
				return;
			}
			// valida el código...
			this.$refs.wait.Start();
			this.serverError = '';
			window.Context.ValidateCode(this.email, this.code).then(data => {
				if (response.IsOK(data.status)) {
					this.$refs.wait.Stop();
					if (this.target === '/users') {
						document.location = '/users/';
					} else {
						this.$router.push({ path: this.target, query: { email: this.email, code: this.code } });
					}
					return;
				}
				// si fue mal, muestra el error
				this.serverError = data.message;
				this.$refs.wait.Stop();
			}).catch(err => {
				this.$refs.wait.Stop();
				throw err;
			});
		},
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.label-error {
	position: absolute;
	margin-top: -6px;
	color: var(--md-theme-default-accent, #ff5252) !important;
	font-size: 12px;
}
.mono {
	font-family: courier, monospace, monospace !important;
	font-size: 26px !important;
	color: rgb(193,193,193);
}
.mono::-webkit-input-placeholder {
	font-family: courier, monospace, monospace !important;
	font-size: 26px !important;
	color: rgb(193,193,193);
}

.mono:-ms-input-placeholder {
	font-family: courier, monospace, monospace !important;
	font-size: 26px !important;
	color: rgb(193,193,193);
}

.mono:-moz-placeholder {
	font-family: courier, monospace, monospace !important;
	font-size: 26px !important;
	color: rgb(193,193,193);
}

.mono::placeholder {
	font-family: courier, monospace, monospace !important;
	font-size: 26px !important;
	color: rgb(193,193,193);
}
.mono::-moz-placeholder {
	font-family: courier, monospace, monospace !important;
	font-size: 26px !important;
	color: rgb(193,193,193);
}
</style>
