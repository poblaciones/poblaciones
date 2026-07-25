<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<geography-tuple-popup ref="editPopup" @completed="popupSaved">
			</geography-tuple-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>

			<div class="md-layout-item md-size-100 helper">
				Vincula los ítems de una geografía con su equivalente en una revisión anterior (por
				ejemplo, cuando cambia el nombre o el esquema de una división geográfica entre censos),
				para poder comparar series entre ediciones.
			</div>
			<div v-if="isAdmin" class="md-layout-item md-size-100">
				<md-button @click="createNewTuple">
					<md-icon>add_circle_outline</md-icon>
					Nueva equivalencia
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid
					:items="list"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					:canDelete="isAdmin"
					entityName="equivalencia"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete" />
			</div>
		</div>
		<stepper ref="stepper" title="Calculando equivalencias" @completed="calculationCompleted"></stepper>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import GeographyTuplePopup from './GeographyTuplePopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';

	export default {
		name: 'GeographyTuples',
		components: {
			GeographyTuplePopup,
			MetadataPopup,
		},
	data() {
		return {
			list: [],
			calculatingItem: null,
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
		gridColumns() {
			var loc = this;
			return [
				{
					property: 'Geography.Caption', caption: 'Geografía',
					value: function (item) { return loc.formatGeography(item.Geography); },
				},
				{
					property: 'PreviousGeography.Caption', caption: 'Geografía anterior equivalente',
					value: function (item) { return loc.formatGeography(item.PreviousGeography); },
				},
				{
					property: 'PreviousLowerGeography.Caption', caption: 'Respaldo (nivel detallado)',
					value: function (item) {
						if (item.PreviousLowerGeography) {
							return loc.formatGeography(item.PreviousLowerGeography);
						}
						return '-';
					},
				},
				{ property: 'ChildCount', caption: 'Ítems calculados', sortType: 'number' },
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
					icon: 'sync',
					caption: 'Calcular',
					onClick: function (grid, item) { loc.calculate(item); },
				},
				{
					icon: 'label',
					caption: 'Metadatos',
					isEnabled: function (item) { return !!item.Metadata; },
					onClick: function (grid, item) { loc.openMetadata(item.Metadata); },
				},
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo equivalencias', window.Db,
				window.Db.GetGeographyTuples).then(function(data) {
					arr.AddRange(loc.list, data);
			});
	},
	methods: {
		formatGeography(geography) {
			if (!geography) {
				return '';
			}
			if (geography.Revision) {
				return geography.Caption + ' (' + geography.Revision + ')';
			}
			return geography.Caption;
		},
		createNewTuple() {
			var loc = this;
			window.Context.Factory.GetCopy('GeographyTuple', function(data) {
					loc.openEdition(data);
			});
		},
		openEdition(item) {
			this.$refs.editPopup.show(item);
		},
		openMetadata(metadata) {
			var loc = this;
			window.Db.LoadMetadata(metadata).then(function (activeMetadata) {
				loc.$refs.editMetadataPopup.show(activeMetadata);
			});
		},
		onRowClick(grid, item) {
			this.openEdition(item);
		},
		popupSaved(item) {
			arr.ReplaceByIdOrAdd(this.list, item);
		},
		calculate(item) {
			var stepper = this.$refs.stepper;
			this.calculatingItem = item;
			stepper.startUrl = window.Db.GetStartGeographyTupleCalculateUrl();
			stepper.stepUrl = window.Db.GetStepGeographyTupleCalculateUrl();
			stepper.args = { t: item.Id };
			stepper.Start();
		},
		calculationCompleted() {
			var stepper = this.$refs.stepper;
			if (stepper.result && stepper.result.ChildCount !== undefined) {
				this.calculatingItem.ChildCount = stepper.result.ChildCount;
			}
		},
		deleteConfirmMessage(item) {
			return 'Esta acción no puede deshacerse: se eliminará la equivalencia entre \''
				+ this.formatGeography(item.Geography) + '\' y \'' + this.formatGeography(item.PreviousGeography) + '\'.';
		},
		onItemDelete(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteGeographyTuple, item).then(function () {
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
