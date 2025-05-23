<template>
	<div>
		<permission-popup ref="editPopup">
		</permission-popup>
		<title-bar title="Permisos" :help="`
								<p>
									Al asignar permisos, otras personas pueden ver o modificar sus contenidos
									antes de ser publicados. Es posible asignar tres niveles de acceso:
								</p>
								<ul style='padding-left: 20px;'>
									<li>
										Ver: permite a otras personas ingresar a consultar los metadatos, datasets e indicadores.
									</li>
									<li>
										Editar: habilita a modificar la información, agregando o quitando datasets e indicadores o alterando los metadatos.
									</li>
									<li>
										Administrar: al igual que al editar, permite modificar los contenidos, pudiendo además
										delegar permisos a otras personas y eliminar la cartografía por completo.
									</li>
								</ul>` + extraHelp('PermissionsSection')" />
			<div class="app-container">
			<invoker ref="invoker"></invoker>

			<div v-if="Work.CanAdmin()" class="md-layout">
				<md-button @click="onAdd()">
					<md-icon>add_circle_outline</md-icon>
					Agregar permiso
				</md-button>
			</div>
			<div class="md-layout">
				<div class="md-layout-item md-size-80 md-xlarge-size-50 md-small-size-100">
					<md-table v-model="list" md-card="">
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell md-label="Usuario">{{ formatUser(item.User) }}</md-table-cell>
							<md-table-cell md-label="Permiso">{{ formatPermission(item.Permission) }}</md-table-cell>
							<md-table-cell md-label="Acciones" v-if="Work.CanAdmin()" class="mpNoWrap">
								<md-button v-if="Work.CanAdmin()" class="md-icon-button" @click="onDelete(item)">
									<md-icon>delete</md-icon>
									<md-tooltip md-direction="bottom">Quitar permiso</md-tooltip>
								</md-button>
							</md-table-cell>
						</md-table-row>
					</md-table>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import PermissionPopup from './PermissionPopup';

export default {
	name: 'Permissions',
  components: {
		PermissionPopup
	},
	data() {
		return {
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		list() {
			return this.Work.Permissions;
		}
	},
	methods: {
		formatUser(user) {
			var name = '';
			if (user.Firstname !== null) {
				name += user.Firstname;
			}
			if (user.Lastname !== null) {
				name += ' ' + user.Lastname;
			}
			if (name.trim() == '') {
				return user.Email;
			} else {
				return name.trim() + ' (' + user.Email + ')';
			}
		},
		formatPermission(permission) {
			switch (permission)
			{
				case 'V':
					return 'Puede ver';
				case 'E':
					return 'Puede editar';
				case 'A':
					return 'Puede administrar';
				default:
					return 'Indeterminado';
			}
		},
		extraHelp(section) {
			if (window) {
				return window.Context.HelpLinkSection(window.Context.Configuration.Help[section]);
			} else {
				return '';
			}
		},
		onAdd() {
			this.$refs.editPopup.show();
		},
		onDelete(item) {
			if (this.Work.IsLastAdministrator(item)) {
				alert('Debe asignar otro administrador antes de poder remover al último administrador de ' + this.Work.ThisWorkLabel() + '.');
				return;
			}
			this.$refs.invoker.message = 'Quitando permiso...';
			this.$refs.invoker.confirmDo('Quitar permiso', 'El permiso serán eliminado',
					this.Work, this.Work.DeletePermission, item);
		},
	},
};
</script>
