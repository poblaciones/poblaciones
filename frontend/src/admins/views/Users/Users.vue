<template>
	<div>
		<div class="md-layout">
			<div class="md-layout-item md-size-25">
				<md-button @click="createNewUser">
					<md-icon>add_circle_outline</md-icon>
					Agregar usuario
				</md-button>
			</div>
		</div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<user-popup ref="editPopup" @completed="popupSaved">
			</user-popup>
			<div class="md-layout-item md-size-100">
				<mp-grid
					:items="list"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					canDelete
					entityName="usuario"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete" />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import UserPopup from './UserPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';

	export default {
	name: 'Usuarios',
	data() {
		return {
			list: []
			};
	},
	computed: {
		gridColumns() {
			var loc = this;
			return [
				{ property: 'FullName', caption: 'Nombre' },
				{ property: 'Email', caption: 'Email' },
				{ property: 'FormattedRole', caption: 'Rol' },
				{
					property: 'Cartographies',
					caption: 'Cartografías',
					sortType: 'number',
					value: function (item) { return item.Cartographies + item.PublicData; },
					tooltip: function (item) { return item.CartographiesNames; },
				},
				{
					property: 'LastAccess',
					caption: 'Último ingreso',
					sortType: 'date',
					value: function (item) { return loc.formatDate(item.LastAccess); },
				},
			];
		},
		gridActions() {
			var loc = this;
			return [
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.openEdition(item); } },
				{ icon: 'flight_takeoff', caption: function (item) { return 'Ingresar como ' + loc.formatName(item); }, onClick: function (grid, item) { loc.onLoginAs(item); } },
			];
		},
	},
	mounted() {

	},
	methods: {
		loadData() {
			if (this.list.length == 0) {
				var loc = this;
				this.$refs.invoker.doMessage('Obteniendo usuarios', window.Db,
					window.Db.GetUsers).then(function (data) {
						for (var n = 0; n < data.length; n++) {
							data[n].FormattedRole = loc.formatRole(data[n]);
							data[n].FullName = loc.formatName(data[n]);
						}
						arr.AddRange(loc.list, data);
					});
			}
		},
		formatRole(v) {
			var ret = '';
			if (v.Privileges === 'A') {
				ret = 'Administrador general';
			} else if (v.Privileges === 'E') {
				ret = 'Administrador de datos';
			} else if (v.Privileges === 'L') {
				ret = 'Administrador sólo lectura';
			} else if (v.Privileges === 'P') {
				ret = 'Usuario estándar';
			} else {
				ret = 'No reconocido';
			}
			if (!v.IsActive) {
				ret += ' (Sin activación)';
			}
			return ret;
		},
		formatName(v) {
			var ret = '';
			if (v.Firstname !== null) {
				ret = v.Firstname + ' ';
			}
			if (v.Lastname !== null) {
				ret += v.Lastname;
			}
			return ret.trim();
		},
		formatDate(date) {
				return f.formatDate(date);
		},
		createNewUser() {
			var loc = this;
			window.Context.Factory.GetCopy('User', function(data) {
					loc.openEdition(data);
			});
    },
		openEdition(item) {
			this.$refs.editPopup.show(item);
		},
		onRowClick(grid, item) {
			this.openEdition(item);
		},
		popupSaved(item) {
			arr.ReplaceByIdOrAdd(this.list, item);
		},
		onLoginAs(item) {
			window.Db.LoginAs(item).then(function () {
				window.open('/users', '_blank');
			});
		},
		deleteConfirmMessage() {
			return 'El usuario seleccionado será eliminado';
		},
		onItemDelete(item) {
			var loc = this;
			this.$refs.invoker.doMessage('Eliminando', window.Db, window.Db.DeleteUser, item).then(function () {
				arr.Remove(loc.list, item);
			});
		},
  },
  components: {
      UserPopup,
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>


</style>
