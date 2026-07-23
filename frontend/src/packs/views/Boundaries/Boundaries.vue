<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<boundary-popup ref="editPopup" @completed="popupSaved">
			</boundary-popup>
			<boundary-version-popup ref="editVersionPopup" @completed="versionSaved">
			</boundary-version-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div v-if="isAdmin" class="md-layout-item md-size-100">
				<md-button @click="createNewBoundary">
					<md-icon>add_circle_outline</md-icon>
					Nueva delimitación
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid
					:items="treeList"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					:canDelete="isAdmin"
					entityName="delimitación"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete"
					hasChildren />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import BoundaryPopup from './BoundaryPopup.vue';
import BoundaryVersionPopup from './BoundaryVersionPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';
import MpGridHelper from '@/backoffice/components/MpGrid.helper';

	export default {
		name: 'Boundaries',
		components: {
			BoundaryPopup,
			BoundaryVersionPopup,
			MetadataPopup
		},
	data() {
		return {
			list: [],
			uniqueMetadatas: [],
			groups: [],
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
		// El servidor entrega el listado plano, en orden, con el nivel de
		// profundidad de cada ítem (Level: 0 delimitación, 1 versión), igual
		// que en regiones (ver ClippingRegions.vue). Cada delimitación debe
		// venir seguida inmediatamente de sus versiones, sin intercalar otra
		// delimitación en el medio: BuildTreeFromLevels arma la jerarquía por
		// posición, no por una referencia explícita al padre.
		treeList() {
			return MpGridHelper.BuildTreeFromLevels(this.list, 'Level', 'Items');
		},
		gridColumns() {
			var loc = this;
			return [
				{ property: 'Caption', caption: 'Nombre' },
				{ property: 'Group.Caption', caption: 'Grupo' },
				{ property: 'Geography.Caption', caption: 'Geografía' },
				{
					property: 'ClippingRegionsSummary', caption: 'Contenido', sortable: false, align: 'left', size: 3,
					value: function (item) { return (item.Level === 1 ? item.ClippingRegionsSummary : ''); },
				},
				{
					property: 'IsPrivate', caption: 'Público', sortType: 'boolean',
					value: function (item) { return (item.Level === 0 ? loc.formatBool(!item.IsPrivate) : ''); },
					sortValue: function (item) { return !item.IsPrivate; },
				},
				{
					property: 'IsSuggestion', caption: 'Recomendado',
					value: function (item) { return (item.Level === 0 ? loc.formatBool(item.IsSuggestion) : ''); },
				},
			];
		},
		gridActions() {
			var loc = this;
			if (!this.isAdmin) {
				return [];
			}
			return [
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.openEdition(item); } },
				{
					icon: 'add_circle_outline',
					caption: 'Nueva versión',
					isEnabled: function (item) { return item.Level === 0; },
					onClick: function (grid, item) { loc.openNewVersion(item); },
				},
				{
					icon: 'label',
					caption: 'Metadatos',
					iconStyle: function (item) { return 'color: #' + loc.resolveColor(item); },
					badge: function (item) { return item.Metadata.Id; },
					isEnabled: function (item) { return !!item.Metadata; },
					onClick: function (grid, item) { loc.openMetadata(item.Metadata); },
				},
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo delimitaciones', window.Db,
				window.Db.GetBoundaries).then(function(data) {
					arr.AddRange(loc.list, data);
					loc.list.forEach(item => {
						const id = item?.Metadata?.Id;
						if (id && !this.uniqueMetadatas.includes(id)) {
							loc.uniqueMetadatas.push(id);
						}
					});
			});
		var loc = this;
		window.Context.BoundaryGroups.GetAll(function (data) {
			arr.AddRange(loc.groups, data);
		});
	},
	methods: {
		formatBool(v) {
			return (v ? 'Sí' : '-');
		},
		createNewBoundary() {
			var loc = this;
			window.Context.Factory.GetCopy('Boundary', function(data) {
					loc.openEdition(data);
			});
		},
		asHtml(text) {
			if (text) {
				return text.replace('\n', '<br>');
			} else {
				return '';
			}

		},
		openEdition(item) {
			if (item.Level === 0) {
				this.$refs.editPopup.show(item, this.groups);
			} else {
				this.$refs.editVersionPopup.show(item, item.Boundary);
			}
		},
		openNewVersion(boundary) {
			var loc = this;
			window.Context.Factory.GetCopy('BoundaryVersion', function (data) {
				loc.$refs.editVersionPopup.show(data, boundary);
			});
		},
		onRowClick(grid, item) {
			this.openEdition(item);
		},
		openMetadata(item) {
			this.$refs.editMetadataPopup.show(item);
		},
		resolveColor(item) {
			if (!item.Metadata) {
				return '';
			}
			var palete = c.GetColorPalete();
			var position = this.uniqueMetadatas.indexOf(item.Metadata.Id);
			var positionTrimed = position % palete.length;
			return palete[positionTrimed];
		},
		popupSaved(item) {
			item.Level = 0;
			arr.ReplaceByIdOrAdd(this.list, item);
		},
		versionSaved(item) {
			item.Level = 1;
			for (var n = 0; n < this.list.length; n++) {
				if (this.list[n].Level === 1 && this.list[n].Id === item.Id) {
					this.list.splice(n, 1, item);
					return;
				}
			}
			this.insertNewVersion(item);
		},
		insertNewVersion(item) {
			for (var n = 0; n < this.list.length; n++) {
				if (this.list[n].Level === 0 && this.list[n].Id === item.Boundary.Id) {
					// La inserta a continuación del bloque de versiones ya
					// existentes de esa delimitación (BuildTreeFromLevels arma la
					// jerarquía por posición, no por referencia al padre).
					var insertAt = n + 1;
					while (insertAt < this.list.length && this.list[insertAt].Level === 1 &&
								this.list[insertAt].Boundary.Id === item.Boundary.Id) {
						insertAt++;
					}
					this.list.splice(insertAt, 0, item);
					return;
				}
			}
		},
		deleteConfirmMessage(item) {
			if (item.Level === 0) {
				return 'Esta acción no puede deshacerse: se eliminará la delimitación \'' + item.Caption + '\' junto con todas sus versiones.';
			} else {
				return 'Esta acción no puede deshacerse: se eliminará la versión \'' + item.Caption + '\'.';
			}
		},
		onItemDelete(item) {
			var loc = this;
			if (item.Level === 0) {
				this.$refs.invoker.doSave(window.Db, window.Db.DeleteBoundary, item).then(function () {
					loc.removeBoundaryAndVersions(item);
				});
			} else {
				this.$refs.invoker.doSave(window.Db, window.Db.DeleteBoundaryVersion, item).then(function () {
					loc.removeFromList(item);
				});
			}
		},
		removeBoundaryAndVersions(boundary) {
			var index = 0;
			while (index < this.list.length) {
				var current = this.list[index];
				if (current === boundary || (current.Level === 1 && current.Boundary && current.Boundary.Id === boundary.Id)) {
					this.list.splice(index, 1);
				} else {
					index++;
				}
			}
		},
		removeFromList(item) {
			var index = this.list.indexOf(item);
			if (index !== -1) {
				this.list.splice(index, 1);
			}
		},
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.md-dialog-actions {
  padding: 8px 20px 8px 24px !important;
}

.close-button {
    min-width: unset;
    height: unset;
    margin: unset;
    float: right;
}

</style>
