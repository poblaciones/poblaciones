<template>
	<div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Usuario</md-dialog-title>
			<md-dialog-content v-if="user">
				<invoker ref="invoker"></invoker>

				<!-- =================== Datos del usuario =================== -->
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Nombre" ref="inputName"
														v-model="user.Firstname" @enter="save" />
					</div>
					<div class="md-layout-item md-size-60">
						<mp-simple-text label="Apellido"
														v-model="user.Lastname" @enter="save" />
					</div>

					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Contraseña" readonly onfocus="this.removeAttribute('readonly');"
														autocomplete="off"
														type="password" v-model="password" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Verificación"
														type="password" v-model="verification" readonly onfocus="this.removeAttribute('readonly');"
														autocomplete="off" @enter="save" />
					</div>

					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Correo electrónico"
														v-model="user.Email" @enter="save" />
					</div>

					<div class="md-layout-item md-size-70">
						<md-field>
							<label>Nivel de permiso</label>
							<md-select v-model="user.Privileges">
								<md-option value="P">Usuario estándar</md-option>
								<md-option value="L">Administrador sólo lectura</md-option>
								<md-option value="E">Administrador de datos</md-option>
								<md-option value="A">Administrador general</md-option>
							</md-select>
						</md-field>
					</div>
					<div class="md-layout-item md-size-70">
						<md-switch class="md-primary" :value="1" v-model="user.IsActive">
							Usuario {{ (user.IsActive ? 'activo' : 'inactivo') }}
						</md-switch>
					</div>
				</div>

				<!-- =================== API Keys =================== -->
				<div class="api-keys-section" v-if="user.Id">
					<div class="separator">API Keys</div>

					<!-- Listado de keys existentes -->
					<md-table v-if="keys.length > 0" class="keys-table">
						<md-table-row>
							<md-table-head>Descripción</md-table-head>
							<md-table-head>Creado</md-table-head>
							<md-table-head>Último uso</md-table-head>
							<md-table-head>Estado</md-table-head>
							<md-table-head></md-table-head>
						</md-table-row>
						<md-table-row v-for="k in keys" :key="k.key_id">
							<md-table-cell>{{ k.key_description || '—' }}</md-table-cell>
							<md-table-cell>{{ formatDate(k.key_created_at) }}</md-table-cell>
							<md-table-cell>{{ k.key_last_used ? formatDate(k.key_last_used) : 'Nunca' }}</md-table-cell>
							<md-table-cell>
								<md-switch class="md-primary md-dense" v-model="k.key_active"
													 :value="1" @change="toggleKey(k)">
									{{ k.key_active ? 'Activo' : 'Inactivo' }}
								</md-switch>
							</md-table-cell>
							<md-table-cell>
								<md-button class="md-icon-button md-dense" @click="deleteKey(k)">
									<md-icon>delete</md-icon>
									<md-tooltip>Eliminar key</md-tooltip>
								</md-button>
							</md-table-cell>
						</md-table-row>
					</md-table>
					<div v-else class="no-keys-hint">Este usuario no tiene API keys.</div>

					<!-- Crear nuevo key -->
					<div class="new-key-row md-layout md-gutter">
						<div class="md-layout-item md-size-70">
							<mp-simple-text label="Descripción del nuevo key"
															v-model="newKeyDescription" />
						</div>
						<div class="md-layout-item md-size-30 new-key-btn">
							<md-button class="md-raised" :disabled="!newKeyDescription.trim()"
												 @click="createKey">
								Generar key
							</md-button>
						</div>
					</div>
				</div>
			</md-dialog-content>

			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>

		<!-- Diálogo para mostrar el plain key generado (una sola vez) -->
		<md-dialog :md-active.sync="showPlainKeyDialog" :md-click-outside-to-close="false">
			<md-dialog-title>Key generado</md-dialog-title>
			<md-dialog-content>
				<p class="key-warning">
					<md-icon class="warning-icon">warning</md-icon>
					Copie este key ahora. No volverá a mostrarse.
				</p>
				<div class="plain-key-box" @click="copyPlainKey">
					{{ plainKeyToShow }}
					<md-tooltip>Hacer clic para copiar</md-tooltip>
				</div>
				<p class="key-hint">Haga clic en el key para copiarlo al portapapeles.</p>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button class="md-primary" @click="closePlainKeyDialog">Listo</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
	import f from '@/backoffice/classes/Formatter';

	export default {
		name: "UserPopup",
		data() {
			return {
				activateEdit: false,
				user: null,
				password: '',
				verification: '',
				// keys
				keys: [],
				newKeyDescription: '',
				showPlainKeyDialog: false,
				plainKeyToShow: '',
			};
		},
		methods: {
			show(user) {
				this.user = f.clone(user);
				this.password = '';
				this.verification = '';
				this.keys = [];
				this.newKeyDescription = '';
				this.activateEdit = true;
				var loc = this;
				setTimeout(() => {
					loc.$refs.inputName.focus();
				}, 100);
				// Cargar keys si el usuario ya existe
				if (user.Id) {
					this.loadKeys();
				}
			},

			save() {
				var loc = this;
				if (this.password !== '' && this.password !== this.verification) {
					alert('La contraseña y la verificación no coinciden.');
					return;
				}
				this.$refs.invoker.doSave(window.Db, window.Db.UpdateUser,
					this.user, this.password, this.verification).then(function (data) {
						loc.activateEdit = false;
						loc.$emit('completed', loc.user);
					});
			},

			// ---- Gestión de keys --------------------------------------------------

			loadKeys() {
				var loc = this;
				window.Db.GetUserKeys(this.user.Id).then(function (data) {
					loc.keys = data || [];
				});
			},

			createKey() {
				if (!this.newKeyDescription.trim()) return;
				var loc = this;
				window.Db.CreateUserKey(this.user.Id, this.newKeyDescription.trim())
					.then(function (data) {
						loc.plainKeyToShow = data.plain_key;
						loc.showPlainKeyDialog = true;
						loc.newKeyDescription = '';
						loc.loadKeys();
					});
			},

			toggleKey(key) {
				window.Db.UpdateUserKey(key.key_id, { active: key.key_active ? 1 : 0 });
			},

			deleteKey(key) {
				if (!confirm('¿Eliminar el key "' + (key.key_description || key.key_id) + '"? Esta acción no se puede deshacer.')) {
					return;
				}
				var loc = this;
				window.Db.DeleteUserKey(key.key_id).then(function () {
					loc.loadKeys();
				});
			},

			copyPlainKey() {
				if (navigator.clipboard) {
					navigator.clipboard.writeText(this.plainKeyToShow);
				}
			},

			closePlainKeyDialog() {
				this.plainKeyToShow = '';
				this.showPlainKeyDialog = false;
			},

			formatDate(dateStr) {
				if (!dateStr) return '';
				var d = new Date(dateStr);
				return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
			},
		},
		components: {}
	};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.separator {
		font-size: 0.85em;
		font-weight: 600;
		color: #757575;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 20px;
		margin-bottom: 8px;
		border-bottom: 1px solid #e0e0e0;
		padding-bottom: 4px;
	}

	.api-keys-section {
		margin-top: 8px;
	}

	.keys-table {
		margin-bottom: 12px;
	}

	.no-keys-hint {
		color: #9e9e9e;
		font-size: 0.9em;
		margin-bottom: 12px;
	}

	.new-key-row {
		align-items: flex-end;
	}

	.new-key-btn {
		display: flex;
		align-items: center;
		padding-bottom: 8px;
	}

	.key-warning {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #e65100;
		font-weight: 500;
		margin-bottom: 12px;
	}

	.warning-icon {
		color: #e65100 !important;
	}

	.plain-key-box {
		font-family: monospace;
		font-size: 0.85em;
		background: #f5f5f5;
		border: 1px solid #bdbdbd;
		border-radius: 4px;
		padding: 10px 14px;
		word-break: break-all;
		cursor: pointer;
		user-select: all;

		&:hover {
			background: #eeeeee;
		}
	}

	.key-hint {
		font-size: 0.8em;
		color: #9e9e9e;
		margin-top: 8px;
	}
</style>
