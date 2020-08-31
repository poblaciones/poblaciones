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
				<md-table style="max-width: 1100px;" v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Nombre">{{ formatName(item) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Email">{{ item.Email }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Rol">{{ formatRole(item) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Cartografías">{{ item.Cartographies }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Datos públicos">{{ item.PublicData }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Último ingreso">{{ formatDate(item.LastAccess) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" title="Modificar" @click="openEdition(item)">
								<md-icon>edit</md-icon>
							</md-button>
							<md-button class="md-icon-button" :title="'Ingresar como ' + formatName(item)" @click="onLoginAs(item)">
								<md-icon>flight_takeoff</md-icon>
							</md-button>
							<md-button class="md-icon-button" title="Eliminar" @click="onDelete(item)">
								<md-icon>delete</md-icon>
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
import arr from '@/common/js/arr';

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
		var loc = this;
		this.$refs.invoker.do(window.Db,
				window.Db.GetUsers).then(function(data) {
					arr.AddRange(loc.list, data);
					});
	},
	methods: {
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
			window.Db.LoginAs(item).then(function() {
				document.location = '/users';
			});
		},
		onDelete(item) {
			var loc = this;
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
