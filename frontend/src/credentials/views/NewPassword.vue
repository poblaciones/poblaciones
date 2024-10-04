<template>
	<div class="app-singlepage">
		<div class="md-layout md-alignment-top-center" style="overflow: hidden;">
			<div class="md-layout-item md-size-100 md-small-hide" style="height: 60px">
			</div>
			<div class="md-layout-item md-size-90" style="max-width: 420px!important">
				<mp-alert ref="messagebox" @closed="msgClosed"></mp-alert>
				<div class="md-layout">
					<div class="md-layout-item md-size-100">
						<h3>
							Nueva contraseña
						</h3>
						<div class="md-layout-item md-size-100 formRow center">
							<md-chip class="userChip">
								{{ email }}
							</md-chip>
						</div>
						<mp-wait ref="wait" class="md-layout-item md-size-100 formRow">
							<transition mode="out-in" :duration="{ enter: 400, leave: 400 }"
											enter-active-class="animated fadeInRight" @before-leave="$refs.wait.Start()"
											leave-active-class="animated fadeOutLeft" @after-enter="$refs.wait.Stop()">
							<div v-if="step==1" key="1">
								<div class="md-layout-item md-size-100 formRow">
									<div class="minorText">
										Indique la nueva contraseña que desea utilizar.
									</div>
								</div>
								<!-- TODO: el mensaje de error no entra forzar un min-width no es la mejor solución -->
								<mp-input label="Contraseña a utilizar" placeholder="Contraseña" @enter="next" :password="true"
										  @input="clearError" v-model="password" :validation="$v.password.$invalid"
																	 :isValidating="hasMessages" :autofocus="true"
																	 validation-message="Debe indicar una contraseña de al menos 6 caracteres." />
									<mp-input label="Confirmar contraseña" placeholder="Verificación" @enter="next" :password="true"
																	 @input="clearError" v-model="passwordCheck" :validation="$v.passwordCheck.$invalid"
																								:isValidating="hasMessages" :extraError="serverError"
																								validation-message="La contraseña y su verificación deben coincidir." />

										<div class="md-layout-item md-size-100 formRow">
											<md-button class="md-primary md-raised fullRowButton" @click="next">Siguiente</md-button>
										</div>
							</div>
							<div v-else key="2">
								<div class="md-layout-item md-size-100 formRow">
									<div class="minorText">
										La contraseña ha sido restablecida con éxito.
									</div>
								</div>
								<div class="md-layout-item md-size-100 formRow">
									<div class="md-layout-item md-size-100 formRow">
										<md-button class="md-primary md-raised fullRowButton" @click="next">Continuar</md-button>
									</div>
								</div>
							</div>
							</transition>
						</mp-wait>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import str from '@/common/framework/str';
import response from '@/common/framework/response';
import { required, minLength, sameAs } from 'vuelidate/lib/validators';

export default {
	name: 'NewPassword',
	components: {
	},
	created() {
		this.step = 1;
	},
	mounted() {
		var loc = this;
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
		if (window.Context.ServerLoaded) {
			this.validateCode();
		} else {
			window.Messages.$on('serverLoaded', args => {
				loc.validateCode();
			});
		}
	},
	data() {
		return {
			hasMessages: false,
			email: '',
			code: '',
			password: '',
			passwordCheck: '',
			step: 1,
			serverError: '',
		};
	},
	validations: {
		password: {
			required,
			minLength: minLength(6)
		},
		passwordCheck: {
			sameAsPassword: sameAs('password')
		},
	},
	methods: {
		msgClosed() {
			document.location = '/';
		},
		validateCode() {
			window.Context.ValidateCode(this.email, this.code).then(data => {
				if (response.IsError(data.status)) {
					this.$refs.messagebox.show(data.message);
					return;
				}
			});
		},
		messageClass(value = false) {
			return {
				'md-invalid': value && (this.hasMessages || this.serverError)
			};
		},
		removedUser() {
			this.step = 1;
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
			if (this.step == 2) {
				this.$refs.wait.Start();
				document.location = '/users/';
				return;
			} else {
				// intenta cambiar contraseña...
				this.$refs.wait.Start();
				this.serverError = '';
				window.Context.ResetPassword(this.email, this.code, this.password).then(data => {
					// si fue bien, va a /users
					if (response.IsOK(data.status)) {
						document.location = '/users/';
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
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
</style>
