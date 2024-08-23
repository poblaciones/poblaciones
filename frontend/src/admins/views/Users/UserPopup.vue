<template>
  <div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Usuario</md-dialog-title>
			<md-dialog-content v-if="user">
				<invoker ref="invoker"></invoker>
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
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';

export default {
  name: "UserPopup",
  data() {
    return {
			activateEdit: false,
			user: null,
			password: '',
			verification: '',
    };
  },
  computed: {

  },
  methods: {
		show(user) {
			this.user = f.clone(user);
			this.activateEdit = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		save() {
			var loc = this;
			if (this.password !== '' && this.password !== this.verification) {
				alert('La contraseña y la verificación no coinciden.');
				return;
			}
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateUser,
							this.user, this.password, this.verification).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.user);
			});
		}
  },
  components: {

  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
