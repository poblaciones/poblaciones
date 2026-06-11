<template>
	<div>
		<md-dialog :md-active.sync="open" class="passwordPopup">
			<md-dialog-title>Cambiar contraseña</md-dialog-title>
			<invoker ref="invoker"></invoker>
			<md-dialog-content>
				<mp-simple-text label="Contraseña actual" :type="'password'" :maxlength="100" v-model="current" />
				<mp-simple-text label="Nueva contraseña" :type="'password'" :maxlength="100" v-model="newPassword" />
				<mp-simple-text label="Repetir nueva contraseña" :type="'password'" :maxlength="100"
												v-model="verification" @enter="onOk" />
				<div v-if="error" class="errorText">{{ error }}</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="open = false">Cancelar</md-button>
				<md-button class="md-primary md-raised" :disabled="!canSubmit" @click="onOk">Aceptar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
	export default {
		name: 'ChangePasswordPopup',
		data() {
			return {
				open: false,
				current: '',
				newPassword: '',
				verification: '',
				error: ''
			};
		},
		computed: {
			canSubmit() {
				return this.current.length > 0 && this.newPassword.length > 0 && this.verification.length > 0;
			}
		},
		methods: {
			show() {
				this.current = '';
				this.newPassword = '';
				this.verification = '';
				this.error = '';
				this.open = true;
			},
			onOk() {
				if (!this.canSubmit) {
					return;
				}
				if (this.newPassword !== this.verification) {
					this.error = 'La verificación no coincide con la nueva contraseña.';
					return;
				}
				this.error = '';
				var loc = this;
				this.$refs.invoker.doMessage('Cambiando contraseña', window.Db,
					window.Db.ChangePassword, this.current, this.newPassword, this.verification)
					.then(function () {
						window.alert('La contraseña se cambió con éxito.');
						loc.open = false;
					});
			}
		},
		components: {
		}
	};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.errorText {
		color: red;
		font-size: 13px;
		margin-top: 8px;
	}
</style>

<!-- El diálogo se monta fuera del componente, por lo que el ancho se fija con estilo global
		 apoyado en la clase del popup. -->
<style rel="stylesheet/scss" lang="scss">
	.passwordPopup .md-dialog-container {
		max-width: 420px;
		width: 420px;
	}
</style>
