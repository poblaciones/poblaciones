<template>
	<div class="app-singlepage">
		<div class="md-layout md-alignment-top-center">
			<div class="md-layout-item md-size-100 md-small-hide" style="height: 60px">
			</div>
			<div class="md-layout-item md-size-90" style="max-width: 420px!important">
				<div class="md-layout">
					<mp-wait ref="wait" class="md-layout-item md-size-100" style="overflow: hidden;">
						<h3>
							HOLA TABLA!!
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
										<md-button class="md-primary md-raised fullRowButton" >Prueba</md-button>
									</div>
								</div>
							</transition>
						</div>
						<div class="md-layout-item md-size-100 minorText">
							Esto es solo una cáscara para empezar con el proyecto tabla...
						</div>
					</mp-wait>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import { required, email } from 'vuelidate/lib/validators';
// https://www.npmjs.com/package/vue2-animate#sassscss
import response from '@/common/framework/response';
import str from '@/common/framework/str';

export default {
	name: 'Layout',
	components: {
	},
		created() {
		var loc = this;
	},
	data() {
		return {

		};
	},
	computed: {
	},
	methods: {

	}
};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>


</style>
