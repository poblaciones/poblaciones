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
							{{ $t('Nueva contraseña') }}
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
										{{ $t('Indique la nueva contraseña que desea utilizar.') }}
									</div>
								</div>
								<!-- TODO: el mensaje de error no entra forzar un min-width no es la mejor solución -->
								<mp-input :label="$t('Contraseña a utilizar')" :placeholder="$t('Contraseña')" @enter="next" :password="true"
										  @input="clearError" v-model="password" :validation="$v.password.$invalid"
																	 :isValidating="hasMessages" :autofocus="true"
																	 :validation-message="$t('Debe indicar una contraseña de al menos 6 caracteres.')" />
									<mp-input :label="$t('Confirmar contraseña')" :placeholder="$t('Verificación')" @enter="next" :password="true"
																	 @input="clearError" v-model="passwordCheck" :validation="$v.passwordCheck.$invalid"
																								:isValidating="hasMessages" :extraError="serverError"
																								:validation-message="$t('La contraseña y su verificación deben coincidir.')" />

										<div class="md-layout-item md-size-100 formRow">
											<md-button class="md-primary md-raised fullRowButton" @click="next">{{ $t('Siguiente') }}</md-button>
										</div>
							</div>
							<div v-else key="2">
								<div class="md-layout-item md-size-100 formRow">
									<div class="minorText">
										{{ $t('La contraseña ha sido restablecida con éxito.') }}
									</div>
								</div>
								<div class="md-layout-item md-size-100 formRow">
									<div class="md-layout-item md-size-100 formRow">
										<md-button class="md-primary md-raised fullRowButton" @click="next">{{ $t('Continuar') }}</md-button>
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
		// valida parámetros
		this.email = this.$route.query.email;
		if(str.IsEmail(this.email) == false) {
			this.$refs.messagebox.show(this.$t('Debe ingresar un correo electrónico válido'));
			return;
		}
		this.code = this.$route.query.code;
		if(/^\d{6}$/.test(this.code) == false) {
			this.$refs.messagebox.show(this.$t('Debe indicar el código.'));
			return;
		}
		window.Context.ValidateCode(this.email, this.code).then(data => {
			if (response.IsError(data.status)) {
				this.$refs.messagebox.show(data.message);
				return;
			}
		});
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
					this.serverError = this.$t('Se produjo un error.');
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
