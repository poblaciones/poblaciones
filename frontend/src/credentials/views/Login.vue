<template>
	<div class="app-singlepage">
		<div class="md-layout md-alignment-top-center">
			<div class="md-layout-item md-size-100 md-small-hide" style="height: 60px">
			</div>
			<div class="md-layout-item md-size-90" style="max-width: 420px!important">
				<div class="md-layout">
					<mp-wait ref="wait" class="md-layout-item md-size-100" style="overflow: hidden;">
						<h3>
							Ingresar a Poblaciones
						</h3>
						<div class="md-layout-item md-size-100 formRow">
							<transition mode="out-in" :duration="{ enter: 400, leave: 400 }"
													enter-active-class="animated fadeIn" @before-leave="$refs.wait.Start()"
													leave-active-class="animated fadeOutLeft" @after-enter="$refs.wait.Stop()">
								<div v-if="step==1" key="1">
									<div class="md-layout-item md-size-100 formRow">
										<div class="minorText">
											Ingrese sus credenciales para poder continuar. ¿Nuevo en Poblaciones? <router-link to="signup" class="underlined">Crear una cuenta</router-link>.
										</div>

										<div class="md-layout-item md-size-100 formRow">
											<div class="minorText">
												¿Olvidó su contraseña? <router-link to="recover" class="underlined">Recuperarla</router-link>.
											</div>
											</div>
									</div>

									<mp-input validation-message="Debe indicar una dirección de correo electrónico válida."
														label="Correo electrónico" @enter="next"
														@input="clearError" v-model="email" :validation="$v.email.$invalid"
														:isValidating="hasMessages" :extraError="serverError" :autofocus="true" />

									<div class="md-layout-item md-size-100 formRow">
										<md-button class="md-primary md-raised fullRowButton" @click="next">Siguiente</md-button>
									</div>
								</div>
								<div v-else key="2">
									<div class="md-layout-item md-size-100 formRow center">
										<md-chip md-deletable @md-delete.stop.prevent="removedUser" class="userChip">
											{{ email }}
										</md-chip>
									</div>
									<div class="md-layout-item md-size-100 formRow">
										<div class="minorText">
											Ingrese su contraseña para continuar. ¿Olvidó su contraseña? <router-link to="recover" class="underlined">Recuperarla</router-link>.
										</div>
									</div>

									<mp-input label="Contraseña" @enter="next" :password="true"
														@input="clearError" v-model="password" :validation="$v.password.$invalid"
														:isValidating="hasMessages" :extraError="serverError" :autofocus="true"
														validation-message="Debe indicar una contraseña." />

									<div class="md-layout-item md-size-100 formRow">
										<md-button class="md-primary md-raised fullRowButton" @click="next">Siguiente</md-button>
									</div>
								</div>
							</transition>
						</div>
						<div class="md-layout-item md-size-100 minorText">
							También puede identificarse utilizando cuentas de las siguientes plataformas:
						</div>
						<div class="md-layout-item md-size-100">
							<div class="md-layout formRowCompact">
								<div class="md-layout-item md-size-50">
									<md-button class="md-accent md-raised fullRowButton" @click="googleLogin" style="width: 96%!important;">
										Ingresar con Google
									</md-button>
								</div>
								<div class="md-layout-item md-size-50">
									<md-button class="md-primary md-raised fullRowButton floatRight" @click="facebookLogin">
										Ingresar con Facebook
									</md-button>
								</div>
							</div>
						</div>
					</mp-wait>
				</div>
			</div>
		</div>
		<open-auth ref="openAuth"></open-auth>
	</div>
</template>
<script>
import { required, email } from 'vuelidate/lib/validators';
// https://www.npmjs.com/package/vue2-animate#sassscss
import OpenAuth from './OpenAuth';
import response from '@/common/framework/response';
import str from '@/common/framework/str';

export default {
	name: 'Signup',
	components: {
		OpenAuth,
	},
		created() {
		var loc = this;
		this.step = 1;
		this.email = this.$route.query.email;
		if (window.Context.ServerLoaded) {
			this.validateEmail();
		} else {
			window.Messages.$on('serverLoaded', args => {
				loc.validateEmail();
			});
		}
	},
	data() {
		return {
			hasMessages: false,
			email: '',
			password: '',
			step: 1,
			serverError: '',
		};
	},
	validations: {
		email: {
			required,
			email,
		},
		password: {
			required
		},
	},
	computed: {
	},
	methods: {
		messageClass(value = false) {
			return {
				'md-invalid': value && (this.hasMessages || this.serverError)
			};
		},
		validateEmail() {
			if (this.email) {
				if (str.IsEmail(this.email) == false) {
					return;
				}
				var code = this.$route.query.code;
				if (/^\d{6}$/.test(code) == false) {
					return;
				}
				window.Context.AccountExists(this.email, true).then(data => {
					if (response.IsOK(data.status)) {
						window.Context.ValidateCode(this.email, code).then(data => {
							if (response.IsOK(data.status)) {
								this.step = 2;
							}
						});
					}
				});
			}
		},
		removedUser() {
			this.serverError = '';
			this.step = 1;
		},
		next() {
			this.$v.$touch();
			if (this.step == 1) {
				this.hasMessages = this.$v.email.$invalid;
			} else {
				this.hasMessages = this.$v.password.$invalid;
			}
			if (this.hasMessages) {
				return;
			}
			if (this.step == 1) {
				this.$refs.wait.Start();
				window.Context.AccountExists(this.email, true).then(data => {
					// si fue bien, va a /users
					if (response.IsOK(data.status)) {
						this.step++;
						return;
					}
					// si fue mal, muestra el error
					this.serverError = data.message;
					this.$refs.wait.Stop();
				}).catch(err => {
					this.serverError = 'Se produjo un error.';
					this.$refs.wait.Stop();
					throw err;
				});
			} else { // step = 2
				// intenta el login...
				this.$refs.wait.Start();
				this.serverError = '';
				window.Context.Login(this.email, this.password).then(data => {
					// si fue bien, va a /users
					if (response.IsOK(data.status)) {
						var to = this.$route.query.to;
						if (to) {
							document.location = to;
						} else {
							document.location = '/users/';
						}
						return;
					}
					// si fue mal, muestra el error
					this.serverError = data.message;
					this.$refs.wait.Stop();
				}).catch(err => {
					this.serverError = 'Se produjo un error.';
					this.$refs.wait.Stop();
					throw err;
				});
			}
		},
		clearError() {
			this.serverError = '';
		},
		googleLogin() {
			this.$refs.openAuth.show(window.host + '/oauthGoogle');
		},
		facebookLogin() {
			this.$refs.openAuth.show(window.host + '/oauthFacebook');
		},
	}
};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
.macronDiaeresisLogin {
	height: 0.8rem;
	margin-left: -0.85rem;
	font-size: 1.3rem;
	margin-top: 0.05px;
}
</style>
