<template>
	<div class="app-singlepage">
		<div class="md-layout md-alignment-top-center" style="overflow: hidden;">
			<div class="md-layout-item md-size-100 md-small-hide" style="height: 60px">
			</div>
			<div class="md-layout-item md-size-90" style="max-width: 420px!important">
				<div class="md-layout">
					<div class="md-layout-item md-size-100">
						<h3>
							Crear una cuenta
						</h3>
						<mp-wait ref="wait" class="md-layout-item md-size-100 formRow">
							<transition mode="out-in" :duration="{ enter: 400, leave: 400 }"
													enter-active-class="animated fadeIn" @before-leave="$refs.wait.Start()"
													leave-active-class="animated fadeOutLeft" @after-enter="$refs.wait.Stop()">
								<div v-if="step==1" key="1">
									<div class="md-layout-item md-size-100 formRow">
										<div class="minorText">
											Inicie la registración indicando la dirección con la cual identificar la cuenta.
											¿Tiene una cuenta?<router-link to="signin" class="underlined">Ingresar</router-link>.
										</div>
									</div>
									<mp-input label="Correo electrónico" @enter="next" :autofocus="true"
														@input="clearError" v-model="email" :validation="$v.email.$invalid"
														:isValidating="hasMessages" :extraError="serverError"
														validation-message="Debe indicar una dirección de correo electrónico válida." />
									<div class="md-layout-item md-size-100 formRowCheckbox">
										<md-field :class="messageClass($v.acceptTerms.$invalid)" style="margin-bottom: 35px!important;
																height: 50px;margin-top: -25px;">
											<md-checkbox v-on:keydown.native.enter="next" class="md-primary md-raised fullRowButton" v-model="acceptTerms">
												He leído y acepto los
											</md-checkbox>
											<div class="labelExtra">
												<a href="/terminos" target="_blank" class="underlined">Términos y Condiciones</a>.
											</div>
											<span class="md-error">Debe aceptar los Términos y condiciones para poder continuar.</span>
										</md-field>
									</div>
									<div class="md-layout-item md-size-100">
										<div class="md-layout">
											<div class="md-layout-item md-size-100 formRowCompact">
												<md-button class="md-primary md-raised fullRowButton" @click="next">Siguiente</md-button>
											</div>
										</div>
									</div>
									<div class="md-layout-item md-size-100  minorText formRowCompact">
										También puede crear la cuenta utilizando las siguientes plataformas para identificarse:
									</div>
									<div class="md-layout-item md-size-100">
										<div class="md-layout formRowCompact">
											<div class="md-layout-item md-size-50">
												<md-button class="md-accent md-raised fullRowButton" @click="googleSignup" style="width: 96%!important;">
													Registrarse con Google
												</md-button>
											</div>
											<div class="md-layout-item md-size-50">
												<md-button class="md-primary md-raised fullRowButton floatRight" @click="facebookSignup">
													Registrarse con Facebook
												</md-button>
											</div>
										</div>
									</div>
								</div>
								<div v-else key="2">
									<div>
										<div class="minorText">
											¡El mensaje de activación fue enviado con éxito! Para comenzar a utilizar la cuenta, siga el link en el mensaje o introduzca a continuación el código recibido.
										</div>
										<enter-code :email="email" :autofocus="true" target="activate" />
									</div>
								</div>
							</transition>
						</mp-wait>
					</div>
				</div>
			</div>
		</div>
		<open-auth ref="openAuth" :terms="acceptTerms"></open-auth>
	</div>
</template>

<script>
	import { required, email, checked, minLength, sameAs } from 'vuelidate/lib/validators';
import EnterCode from '@/common/components/EnterCode';
import OpenAuth from './OpenAuth';
import response from '@/common/framework/response';

export default {
	name: 'Signup',
	components: {
		OpenAuth,
		EnterCode
	},
	mounted() {


	},
	data() {
		return {
			step: 1,
			acceptTerms: false,
			serverError: '',
			email: '',
			hasMessages: false,
		};
	},
	validations: {
		email: {
			required,
			email,
		},
		acceptTerms: {
			checked: value => value === true
		}
	},
	computed: {
	},
	methods: {
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
			window.Context.Register(this.email, this.password, this.firstname, this.lastname).then(data => {
				if (response.IsOK(data.status)) {
					// si va bien, redirige
					this.$refs.wait.Stop();
					this.step++;
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
		googleSignup() {
			this.$refs.openAuth.show(window.host + '/oauthGoogle', true);
		},
		facebookSignup() {
			this.$refs.openAuth.show(window.host + '/oauthFacebook', true);
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.labelExtra {
	display: inline;
	margin-left: 5px;
	font-size: .95rem !important;
	margin-top: 12px;
}
.formRowCheckbox {
	margin-bottom: 0px !important;
	margin-top: 20px !important;
}
</style>
