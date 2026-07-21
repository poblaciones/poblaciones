<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<boundary-popup ref="editPopup" @completed="popupSaved">
			</boundary-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div class="md-layout-item md-size-100">
				<mp-grid
					:items="list"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick" />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import BoundaryPopup from './BoundaryPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';

	export default {
		name: 'Boundaries',
		components: {
			BoundaryPopup,
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
		gridColumns() {
			var loc = this;
			return [
				{ property: 'Caption', caption: 'Nombre' },
				{ property: 'Group.Caption', caption: 'Grupo' },
				{
					property: 'VersionsSummary', caption: 'Contenido', html: true, sortable: false, align: 'left', size: 4,
					value: function (item) { return loc.asHtml(item.VersionsSummary); },
				},
				{
					property: 'IsPrivate', caption: 'Público', sortType: 'boolean',
					value: function (item) { return loc.formatBool(!item.IsPrivate); },
					sortValue: function (item) { return !item.IsPrivate; },
				},
				{
					property: 'IsSuggestion', caption: 'Recomendado',
					value: function (item) { return loc.formatBool(item.IsSuggestion); },
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
			this.$refs.editPopup.show(item, this.groups);
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
			arr.ReplaceByIdOrAdd(this.list, item);
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
