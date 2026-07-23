<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<gradient-popup ref="editPopup" @completed="popupSaved">
			</gradient-popup>
			<div v-if="isAdmin" class="md-layout-item md-size-100">
				<md-button @click="createNewGradient">
					<md-icon>add_circle_outline</md-icon>
					Nuevo gradiente
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid
					:items="list"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					:canDelete="isAdmin"
					entityName="gradiente"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete" />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import GradientPopup from './GradientPopup.vue';
import arr from '@/common/framework/arr';

	export default {
		name: 'Gradients',
		components: {
			GradientPopup,
		},
	data() {
		return {
			list: [],
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
		gridColumns() {
			return [
				{ property: 'Caption', caption: 'Nombre' },
				{
					property: 'ImageType', caption: 'Tipo de imagen',
					value: function (item) { return (item.ImageType === 'image/jpeg' ? 'JPG' : 'PNG'); },
				},
				{ property: 'MaxZoomLevel', caption: 'Zoom máximo', sortType: 'number' },
			];
		},
		gridActions() {
			var loc = this;
			if (!this.isAdmin) {
				return [];
			}
			return [
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.openEdition(item); } },
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo gradientes', window.Db,
				window.Db.GetGradients).then(function(data) {
					arr.AddRange(loc.list, data);
			});
	},
	methods: {
		createNewGradient() {
			var loc = this;
			window.Context.Factory.GetCopy('Gradient', function(data) {
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
		deleteConfirmMessage(item) {
			return 'Esta acción no puede deshacerse: se eliminará el gradiente \'' + item.Caption + '\'.';
		},
		onItemDelete(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteGradient, item).then(function () {
				var index = loc.list.indexOf(item);
				if (index !== -1) {
					loc.list.splice(index, 1);
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
