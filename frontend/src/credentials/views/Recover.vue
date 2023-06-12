<template>
	<div class="app-singlepage">
		<div class="md-layout md-alignment-top-center" style="overflow: hidden;">
			<div class="md-layout-item md-size-100 md-small-hide" style="height: 60px">
			</div>
			<div class="md-layout-item md-size-90" style="max-width: 420px!important">
				<div class="md-layout">
					<div class="md-layout-item md-size-100">
						<h3>
							Restablecer contraseña
						</h3>
						<mp-wait ref="wait" class="md-layout-item md-size-100 formRow">
							<transition mode="out-in" :duration="{ enter: 400, leave: 400 }"
											enter-active-class="animated fadeIn" @before-leave="$refs.wait.Start()"
											leave-active-class="animated fadeOutLeft" @after-enter="$refs.wait.Stop()">
							<div v-if="step==1" key="1">
								<div class="md-layout-item md-size-100 formRow">
									<div class="minorText">
										Ingrese su dirección para poder enviarle un link de recuperación de contraseña.
									</div>
								</div>
								<div class="md-layout-item md-size-100 formRow">

									<mp-input validation-message="Debe indicar una dirección de correo electrónico válida."
										label="Correo electrónico" @enter="next"
										@input="clearError" v-model="email" :validation="true"
										:isValidating="hasMessages" :extraError="serverError" :autofocus="true" />

										<div class="md-layout-item md-size-100 formRow">
											<md-button class="md-primary md-raised fullRowButton" @click="next">Siguiente</md-button>
										</div>
								</div>
							</div>
							<div v-else key="2">
								<div class="minorText">
									¡Mensaje enviado con éxito! Siga el link en el mensaje o indique a continuación el código recibido.
								</div>
								<enter-code :email="email" :autofocus="true" target="newPassword" />
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
import EnterCode from '@/common/components/EnterCode';
import { required, email } from 'vuelidate/lib/validators';
import response from '@/common/framework/response';
// https://www.npmjs.com/package/vue2-animate#sassscss

export default {
	name: 'Recover',
	components: {
		EnterCode
	},
	created() {
		this.step = 1;
	},
	data() {
		return {
			hasMessages: false,
			email: '',
			code: '',
			step: 1,
			serverError: '',
		};
	},
	validations: {
		email: {
			required,
			email,
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
		clearError() {
			this.serverError = '';
		},
		next() {
			this.$v.$touch();
			this.hasMessages = this.$v.$invalid;
			if (this.hasMessages) {
				return;
			}
			if (this.step == 1) {
				// envía mail...
				this.$refs.wait.Start();
				this.serverError = '';
				window.Context.BeginRecover(this.email).then(data => {
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
			}
		},
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
</style>
