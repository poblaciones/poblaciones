<template>
	<div>
		<md-dialog :md-active.sync="open" class="accountPopup">
			<md-dialog-title>Detalles de cuenta</md-dialog-title>
			<invoker ref="invoker"></invoker>
			<md-dialog-content>

				<div v-if="!account" class="loadingArea">
					<md-progress-spinner class="md-primary" md-mode="indeterminate" :md-diameter="36" />
				</div>

				<template v-else>

					<!-- Datos personales -->
					<div class="section">
						<div class="sectionTitle">Datos personales</div>
						<div class="md-layout md-gutter">
							<div class="md-layout-item md-size-50 md-small-size-100">
								<mp-text label="Nombre" :canEdit="true" :maxlength="100"
												 @update="updateName" v-model="account.Firstname" />
							</div>
							<div class="md-layout-item md-size-50 md-small-size-100">
								<mp-text label="Apellido" :canEdit="true" :maxlength="100"

												 @update="updateName" v-model="account.Lastname" />
							</div>
						</div>
						<div class="readonlyField">
							<div class="readonlyLabel">Correo electrónico</div>
							<div class="readonlyValue">{{ account.Email }}</div>
						</div>
					</div>

					<md-divider></md-divider>

					<!-- Seguridad -->
					<div class="section">
						<div class="sectionTitle">Seguridad</div>
						<md-button class="md-raised" @click="openChangePassword">Cambiar contraseña</md-button>
					</div>

					<md-divider></md-divider>

					<!-- Almacenamiento -->
					<div class="section">
						<div class="sectionTitle">Almacenamiento</div>
						<div class="readonlyField">
							<div class="readonlyLabel">Espacio en disco utilizado</div>
							<div class="readonlyValue" v-if="diskUsageLoaded">{{ diskUsageText }}</div>
							<md-progress-spinner v-else class="md-primary" md-mode="indeterminate"
																	 :md-diameter="20" style="margin-top: 4px" />
						</div>
					</div>

					<md-divider></md-divider>

					<!-- Eliminar cuenta -->
					<div class="section">
						<div class="sectionTitle dangerTitle">Eliminar cuenta</div>
						<div class="dangerText">
							Al eliminar la cuenta se quitan los permisos asociados y se borran sus datos de acceso.
							Esta acción no puede deshacerse.
						</div>
						<md-button class="md-raised dangerButton" @click="confirmDelete = true">
							Eliminar cuenta
						</md-button>
					</div>

				</template>
			</md-dialog-content>

			<md-dialog-actions>
				<md-button @click="open = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>

		<change-password-popup ref="changePasswordPopup"></change-password-popup>

		<md-dialog-confirm
			:md-active.sync="confirmDelete"
			md-title="Eliminar cuenta"
			md-content="¿Está seguro de que desea eliminar su cuenta? Esta acción no puede deshacerse."
			md-confirm-text="Eliminar"
			md-cancel-text="Cancelar"
			@md-confirm="deleteAccount" />
	</div>
</template>

<script>
import a from '@/common/js/authentication';
import ChangePasswordPopup from '@/backoffice/views/Account/ChangePasswordPopup.vue';

export default {
	name: 'AccountPopup',
	data() {
		return {
			open: false,
			account: null,
			confirmDelete: false,
			diskUsageLoaded: false,
			diskUsageBytes: null
		};
	},
	computed: {
		diskUsageText() {
			if (this.diskUsageBytes === null || this.diskUsageBytes === undefined) {
				return 'No disponible';
			}
			return this.formatBytes(this.diskUsageBytes);
		}
	},
	methods: {
		show() {
			this.account = null;
			this.diskUsageLoaded = false;
			this.diskUsageBytes = null;
			this.confirmDelete = false;
			this.open = true;
			var loc = this;
			// Consulta 1: datos de la cuenta (rápida).
			window.Db.GetCurrentUserAccount().then(function (data) {
				loc.account = data;
			});
			// Consulta 2: espacio en disco (puede demorar; no bloquea lo anterior).
			window.Db.GetCurrentUserDiskUsage().then(function (data) {
				loc.diskUsageBytes = data;
				loc.diskUsageLoaded = true;
			});
		},
		updateName() {
			this.$refs.invoker.doBackground(window.Db, window.Db.UpdateUserName,
				this.account.Firstname, this.account.Lastname);
			return true;
		},
		openChangePassword() {
			this.$refs.changePasswordPopup.show();
		},
		deleteAccount() {
			this.$refs.invoker.doMessage('Eliminando cuenta', window.Db, window.Db.DeleteAccount)
				.then(function () { a.logoff(); });
		},
		formatBytes(bytes) {
			if (bytes === 0) { return '0 B'; }
			var units = ['B', 'KB', 'MB', 'GB', 'TB'];
			var i = Math.floor(Math.log(bytes) / Math.log(1024));
			return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
		}
	},
	components: {
		ChangePasswordPopup
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.loadingArea {
	display: flex;
	justify-content: center;
	padding: 50px 0;
}

.section {
	padding: 16px 0 14px 0;
}

.sectionTitle {
	font-size: 16px;
	font-weight: 500;
	margin-bottom: 12px;
	color: rgba(0,0,0,0.87);
}

.readonlyField {
	margin-top: 12px;
}

.readonlyLabel {
	font-size: 12px;
	color: rgba(0,0,0,0.54);
}

.readonlyValue {
	font-size: 18px;
}

.dangerTitle {
	color: #c62828;
}

.dangerText {
	font-size: 14px;
	color: rgba(0,0,0,0.7);
	margin-bottom: 12px;
}

.dangerButton {
	background-color: #c62828 !important;
	color: #fff !important;
}
</style>

<style rel="stylesheet/scss" lang="scss">
.accountPopup .md-dialog-container {
	max-width: 600px;
	width: 600px;
}
.accountPopup .md-dialog-content {
	min-height: 300px;
	max-height: 70vh;
	overflow-y: auto;
}
</style>
