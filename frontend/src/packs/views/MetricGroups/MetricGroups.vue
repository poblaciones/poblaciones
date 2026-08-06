<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<metric-group-popup ref="editGroupPopup" @completed="groupSaved">
			</metric-group-popup>

			<div class="md-layout-item md-size-100">
				<div v-if="canEdit">
					<md-button @click="createNewGroup">
						<md-icon>add_circle_outline</md-icon>
						Nueva categoría
					</md-button>
				</div>
				<mp-grid
					:items="groups"
					:columns="groupColumns"
					:actions="groupActions"
					:rowClick="onGroupRowClick"
					:canDelete="canEdit"
					entityName="categoría"
					:deleteConfirmMessage="groupDeleteConfirmMessage"
					@itemDelete="onGroupDelete" />
			</div>

		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import MetricGroupPopup from './MetricGroupPopup.vue';
import arr from '@/common/framework/arr';

	export default {
		name: 'MetricGroups',
		components: {
			MetricGroupPopup,
		},
	data() {
		return {
			groups: [],
			};
	},
	computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		groupColumns() {
			var loc = this;
			return [
				{ property: 'Caption', caption: 'Nombre' },
				{
					property: 'Icon', caption: 'Ícono', type: 'status', sortable: false,
					icon: function (item) { return loc.formatIcon(item.Icon); },
				},
				{ property: 'Order', caption: 'Orden', sortType: 'number' },
			];
		},
		groupActions() {
			var loc = this;
			var editIcon = 'edit';
			var editCaption = 'Modificar';
			if (!this.canEdit) {
				editIcon = 'visibility';
				editCaption = 'Ver';
			}
			return [
				{ icon: editIcon, caption: editCaption, onClick: function (grid, item) { loc.openGroupEdition(item); } },
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo categorías', window.Db,
				window.Db.GetMetricGroups).then(function(data) {
					arr.AddRange(loc.groups, data);
			});
	},
	methods: {
		// El ícono se guarda como clase FontAwesome sin el prefijo (ej.
		// 'fa-users'), pero MpGrid solo lo reconoce como ícono si empieza
		// con 'fas ' o 'fa ' (ver MpGridHelper.IsFontAwesome).
		formatIcon(icon) {
			if (!icon) {
				return null;
			}
			if (icon.indexOf('fas ') === 0 || icon.indexOf('fa ') === 0) {
				return icon;
			}
			return 'fas ' + icon;
		},
		createNewGroup() {
			var loc = this;
			window.Context.Factory.GetCopy('MetricGroup', function(data) {
					loc.openGroupEdition(data);
			});
		},
		openGroupEdition(item) {
			this.$refs.editGroupPopup.show(item);
		},
		onGroupRowClick(grid, item) {
			this.openGroupEdition(item);
		},
		groupSaved(item) {
			arr.ReplaceByIdOrAdd(this.groups, item);
		},
		groupDeleteConfirmMessage(item) {
			return 'Esta acción no puede deshacerse: se eliminará la categoría \'' + item.Caption + '\'.';
		},
		onGroupDelete(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteMetricGroup, item).then(function () {
				var index = loc.groups.indexOf(item);
				if (index !== -1) {
					loc.groups.splice(index, 1);
				}
			});
		},
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-dialog-actions {
  padding: 8px 20px 8px 24px !important;
}

</style>
