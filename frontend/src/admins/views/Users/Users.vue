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
				<md-table style="max-width: 1100px;" v-model="list"  md-sort="FullName" md-sort-order="asc" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Nombre" md-sort-by="FullName">{{ item.FullName }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Email" md-sort-by="Email">{{ item.Email }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Rol" md-sort-by="FormattedRole">{{ item.FormattedRole }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Cartografías" md-sort-by="Cartographies">
							{{ item.Cartographies + item.PublicData  }}
							<md-tooltip md-direction="bottom"> {{ item.CartographiesNames }}</md-tooltip>
						</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Último ingreso" md-sort-by="LastAccess">{{ formatDate(item.LastAccess)
								}}
</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" @click="openEdition(item)">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Modificar</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" @click="onLoginAs(item)">
								<md-icon>flight_takeoff</md-icon>
								<md-tooltip md-direction="bottom">Ingresar como {{ formatName(item) }}</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" @click="onDelete(item)">
								<md-icon>delete</md-icon>
								<md-tooltip md-direction="bottom">Eliminar</md-tooltip>
							</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>
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
		popupSaved(item) {
			arr.ReplaceByIdOrAdd(this.list, item);
		},
		onLoginAs(item) {
			window.Db.LoginAs(item).then(function () {
				window.open('/users', '_blank');
			});
		},
		onDelete(item) {
			var loc = this;
			this.$refs.invoker.message = 'Eliminando...';
			this.$refs.invoker.confirmDo('Eliminar usuario', 'El usuario seleccionado será eliminado',
					window.Db, window.Db.DeleteUser, item, function() {
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
