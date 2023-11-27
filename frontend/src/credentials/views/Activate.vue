<template>
	<div class="app-singlepage">
		<div class="md-layout md-alignment-top-center">
			<div class="md-layout-item md-size-100 md-small-hide" style="height: 60px">
			</div>
			<div class="md-layout-item md-size-90" style="max-width: 420px!important">
				<mp-alert ref="messagebox" @closed="msgClosed"></mp-alert>
				<mp-wait ref="wait" class="md-layout">
					<div class="md-layout-item md-size-100" style="overflow: hidden;">
						<h3>
							Activar cuenta
						</h3>
						<div class="md-layout-item md-size-100 formRow center">
							<md-chip class="userChip">
								{{ email }}
							</md-chip>
						</div>
						<div class="minor-text">
							Para comenzar a utilizar la cuenta complete el siguiente formulario.
						</div>
						<div class="md-layout-item md-size-100 formRow">
							<div class="label">Nombre completo</div>
							<md-field class="customField" :class="messageClass($v.firstname.$invalid || $v.lastname.$invalid)">
								<md-input v-on:keydown.native.enter="next" autocorrect="off" autocapitalize="off" spellcheck="false"
										v-model="firstname" ref="nombre" placeholder="Nombre" @input="clearError"></md-input>
								<md-input v-on:keydown.native.enter="next" autocorrect="off" autocapitalize="off" spellcheck="false"
										v-model="lastname" placeholder="Apellido" @input="clearError"></md-input>
								<span class="md-error">Debe indicar su nombre y apellido.</span>
							</md-field>
						</div>

						<mp-input label="Contraseña a utilizar" placeholder="Contraseña" @enter="next" :password="true"
							@input="clearError" v-model="password" :validation="$v.password.$invalid"
							:isValidating="hasMessages"
							validation-message="Debe indicar una contraseña de al menos 6 caracteres." />

						<mp-input validation-message="La contraseña y su verificación deben coincidir."
								label="Confirmar contraseña" placeholder="Verificación" @enter="next" :password="true"
								@input="clearError" v-model="passwordCheck" :validation="$v.passwordCheck.$invalid"
								:isValidating="hasMessages" :extraError="serverError" />
						<div class="md-layout-item md-size-100 formRowCompact">
							<md-button class="md-primary md-raised fullRowButton" @click="next">Siguiente</md-button>
						</div>
					</div>
				</mp-wait>
			</div>
		</div>
	</div>
</template>

<script>
import { required, minLength, sameAs } from 'vuelidate/lib/validators';
import response from '@/common/framework/response';
import tokenTypeEnum from '@/common/enums/tokenTypeEnum';
import str from '@/common/framework/str';
// https://www.npmjs.com/package/vue2-animate#sassscss

export default {
	name: 'Signup',
	components: {
	},
	data() {
		return {
			firstname: '',
			lastname: '',
			email: '',
			code: '',
			type: '',
			serverError: '',
			password: '',
			passwordCheck: '',
			hasMessages: false,
		};
	},
	mounted() {
		setTimeout(() => {
			this.$refs.nombre.$el.focus();
		}, 250);
		// valida parámetros
		this.email = this.$route.query.email;
		if(str.IsEmail(this.email) == false) {
			this.$refs.messagebox.show('Debe ingresar un correo electrónico válido');
			return;
		}
		this.code = this.$route.query.code;
		if(/^\d{6}$/.test(this.code) == false) {
			this.$refs.messagebox.show('Debe indicar el código.');
			return;
		}
		window.Context.ValidateCode(this.email, this.code).then(data => {
			if (response.IsError(data.status)) {
				this.$refs.messagebox.show(data.message);
				return;
			} else {
				this.type = data.type;
				if(this.type == tokenTypeEnum.Permission) {
					window.Context.AccountExists(this.email, true).then(data => {
						if (response.IsOK(data.status)) {
							if (data.loggedNow) {
								document.location = '/users/';
							} else {
								this.$router.push({ path: '/signin', query: { email: this.email, code: this.code } });
							}
						}
					});
				}
			}
		});
	},
	validations: {
		firstname: {
			required
		},
		lastname: {
			required,
		},
		password: {
			required,
			minLength: minLength(6)
		},
		passwordCheck: {
			sameAsPassword: sameAs('password')
		}
	},
	methods: {
		msgClosed() {
			document.location = '/';
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
			this.$refs.wait.Start();
			this.serverError = '';
			window.Context.Activate(this.email, this.password, this.firstname, this.lastname, this.code, this.type).then(data => {
				if (response.IsOK(data.status)) {
					// si va bien, redirige
					this.$refs.wait.Stop();
					if (data.target) {
						document.location = data.target;
					} else {
						document.location = '/users/';
					}
					return;
				}
				this.serverError = data.message;
				this.$refs.wait.Stop();
			}).catch(err => {
				this.serverError = 'Se produjo un error.';
				this.$refs.wait.Stop();
				throw err;
			});
		},
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
</style>
