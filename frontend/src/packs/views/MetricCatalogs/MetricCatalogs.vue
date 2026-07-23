<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<metric-group-popup ref="editGroupPopup" @completed="groupSaved">
			</metric-group-popup>
			<metric-provider-popup ref="editProviderPopup" @completed="providerSaved">
			</metric-provider-popup>

			<div class="md-layout-item md-size-100">
				<div class="separator">Categorías de indicadores</div>
				<div v-if="isAdmin">
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
					:canDelete="isAdmin"
					entityName="categoría"
					:deleteConfirmMessage="groupDeleteConfirmMessage"
					@itemDelete="onGroupDelete" />
			</div>

			<div class="md-layout-item md-size-100" style="margin-top: 20px">
				<div class="separator">Orígenes de indicadores</div>
				<div v-if="isAdmin">
					<md-button @click="createNewProvider">
						<md-icon>add_circle_outline</md-icon>
						Nuevo origen
					</md-button>
				</div>
				<mp-grid
					:items="providers"
					:columns="providerColumns"
					:actions="providerActions"
					:rowClick="onProviderRowClick"
					:canDelete="isAdmin"
					entityName="origen"
					:deleteConfirmMessage="providerDeleteConfirmMessage"
					@itemDelete="onProviderDelete" />
			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import MetricGroupPopup from './MetricGroupPopup.vue';
import MetricProviderPopup from './MetricProviderPopup.vue';
import arr from '@/common/framework/arr';

	export default {
		name: 'MetricCatalogs',
		components: {
			MetricGroupPopup,
			MetricProviderPopup,
		},
	data() {
		return {
			groups: [],
			providers: [],
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
		groupColumns() {
			return [
				{ property: 'Caption', caption: 'Nombre' },
				{ property: 'Icon', caption: 'Ícono' },
				{ property: 'Order', caption: 'Orden', sortType: 'number' },
			];
		},
		groupActions() {
			var loc = this;
			if (!this.isAdmin) {
				return [];
			}
			return [
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.openGroupEdition(item); } },
			];
		},
		providerColumns() {
			return [
				{ property: 'Caption', caption: 'Nombre' },
				{ property: 'Order', caption: 'Orden', sortType: 'number' },
			];
		},
		providerActions() {
			var loc = this;
			if (!this.isAdmin) {
				return [];
			}
			return [
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.openProviderEdition(item); } },
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo categorías', window.Db,
				window.Db.GetMetricGroups).then(function(data) {
					arr.AddRange(loc.groups, data);
			});
		this.$refs.invoker.doMessage('Obteniendo orígenes', window.Db,
				window.Db.GetMetricProviders).then(function(data) {
					arr.AddRange(loc.providers, data);
			});
	},
	methods: {
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
		createNewProvider() {
			var loc = this;
			window.Context.Factory.GetCopy('MetricProvider', function(data) {
					loc.openProviderEdition(data);
			});
		},
		openProviderEdition(item) {
			this.$refs.editProviderPopup.show(item);
		},
		onProviderRowClick(grid, item) {
			this.openProviderEdition(item);
		},
		providerSaved(item) {
			arr.ReplaceByIdOrAdd(this.providers, item);
		},
		providerDeleteConfirmMessage(item) {
			return 'Esta acción no puede deshacerse: se eliminará el origen \'' + item.Caption + '\'.';
		},
		onProviderDelete(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteMetricProvider, item).then(function () {
				var index = loc.providers.indexOf(item);
				if (index !== -1) {
					loc.providers.splice(index, 1);
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
