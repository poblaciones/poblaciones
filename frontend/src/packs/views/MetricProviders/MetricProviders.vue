<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<metric-provider-popup ref="editProviderPopup" @completed="providerSaved">
			</metric-provider-popup>

			<div class="md-layout-item md-size-100" style="margin-top: 20px">
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
import MetricProviderPopup from './MetricProviderPopup.vue';
import arr from '@/common/framework/arr';

	export default {
		name: 'MetricProviders',
		components: {
			MetricProviderPopup,
		},
	data() {
		return {
			providers: [],
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
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
		this.$refs.invoker.doMessage('Obteniendo orígenes', window.Db,
				window.Db.GetMetricProviders).then(function(data) {
					arr.AddRange(loc.providers, data);
			});
	},
	methods: {
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
