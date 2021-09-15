<template>
	<div>
		<md-dialog :md-active.sync="openAdd">
			<md-dialog-title>
				Agregar permiso
			</md-dialog-title>
			<invoker ref="invoker"></invoker>
			<md-dialog-content>
				<mp-simple-text label="Correo electrónico"
						ref="inputUser" :maxlength="100" v-model="user"/>

				<md-field>
					<label>Nivel de permiso</label>
					<md-select v-model="level">
						<md-option value="V">Puede ver</md-option>
						<md-option value="E">Puede editar</md-option>
						<md-option value="A">Puede administrar</md-option>
					</md-select>
				</md-field>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="openAdd = false">Cancelar</md-button>
				<md-button class="md-primary" @click="onAddOk()">Aceptar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';

export default {
	name: 'PermissionPopup',
	data() {
		return {
			user: '',
			level: '',
			openAdd: false
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
	},
	methods: {
		show() {
			this.user = '';
			this.level = 'E';
			this.openAdd = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputUser.focus();
      }, 100);

		},
		onAddOk() {
			let loc = this;
			this.$refs.invoker.doSave(this.Work,
														this.Work.AddPermission,
														this.user, this.level)
												.then(function() {
														loc.openAdd = false;
														});
		},
	},
  components: {
	}
};
</script>
