<template>
	<Modal title="Iniciar sesión" ref="dialog" :showCancel="false" :showOk="true"
				 :backgroundColor="backgroundColor" :maxWidth="480">
		<div class="loginMessage">
			Para hacer anotaciones en el mapa tenés que iniciar sesión, así podés guardar tus anotaciones en tu cuenta.
		</div>
		<div slot="footer" class="loginButtons">
			<button type="button" class="mp-btn" @click="close">Cancelar</button>
			<button type="button" class="mp-btn" @click="register">Registrarse</button>
			<button type="button" class="mp-btn" @click="login">Ingresar</button>
		</div>
	</Modal>
</template>

<script>
import Modal from '@/map/components/popups/modal';
import authentication from '@/common/js/authentication';

export default {
	name: 'annotationsLogin',
	components: {
		Modal
	},
	props: [
		'backgroundColor'
	],
	methods: {
		show() {
			this.$refs.dialog.show();
		},
		close() {
			this.$refs.dialog.close();
		},
		login() {
			authentication.redirectLogin();
		},
		register() {
			authentication.redirectRegister();
		}
	}
};
</script>

<style scoped>
.loginMessage {
	padding: 5px 0px 10px 0px;
}
.loginButtons {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	width: 100%;
}
</style>
