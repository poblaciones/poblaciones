<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<geography-tuple-popup ref="editPopup" @completed="popupSaved">
			</geography-tuple-popup>
			<items-list-popup ref="itemsPopup">
			</items-list-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>

			<div class="md-layout-item md-size-100 helper">
				Vincula los ítems de una geografía con su equivalente en una revisión anterior
				para poder comparar series entre ediciones.
			</div>
			<div v-if="canEdit" class="md-layout-item md-size-100">
				<md-button @click="createNewTuple">
					<md-icon>add_circle_outline</md-icon>
					Nueva equivalencia
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid
					compact
					:items="treeList"
					:columns="gridColumns"
					:actions="gridActions"
					:canDelete="canEdit"
					:isItemDeleteEnabled="isItemDeleteEnabled"
					entityName="equivalencia"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete"
					hasChildren />
			</div>
		</div>
		<stepper ref="stepper" title="Calculando equivalencias" @completed="calculationCompleted"></stepper>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import GeographyTuplePopup from './GeographyTuplePopup.vue';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';
import f from '@/backoffice/classes/Formatter';

// Nivel artificial: agrupa las equivalencias por Geography (no viene del
// servidor, que entrega una lista plana). Con muchas revisiones cruzadas,
// una fila por tupla ("Departamentos 2022 - Departamentos 2010") es
// difícil de leer; agrupada por la geografía actual, cada una de sus
// equivalencias anteriores queda como hija.
const PARENT_LEVEL = -1;

	export default {
		name: 'GeographyTuples',
		components: {
			GeographyTuplePopup,
			ItemsListPopup,
			MetadataPopup,
		},
	data() {
		return {
			list: [],
			calculatingItem: null,
			uniqueMetadatas: [],
			};
	},
	computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		treeList() {
			var groupsByGeographyId = {};
			var order = [];
			for (var i = 0; i < this.list.length; i++) {
				var tuple = this.list[i];
				var geoId = tuple.Geography.Id;
				if (!groupsByGeographyId[geoId]) {
					var groupNode = {
						Id: 'geo-' + geoId,
						Level: PARENT_LEVEL,
						Geography: tuple.Geography,
						Items: [],
					};
					groupsByGeographyId[geoId] = groupNode;
					order.push(groupNode);
				}
				groupsByGeographyId[geoId].Items.push(tuple);
			}
			return order;
		},
		gridColumns() {
			var loc = this;
			return [
				{
					property: 'Geography.Caption', caption: 'Geografía',
					value: function (item) {
						if (item.Level === PARENT_LEVEL) {
							return loc.formatGeography(item.Geography);
						}
						return loc.formatGeography(item.PreviousGeography);
					},
					tooltip: function (item) {
						if (item.Level === PARENT_LEVEL) {
							return null;
						}
						return item.Metadata ? item.Metadata.Title : null;
					},
				},
				{
					property: 'ChildCount', caption: 'Ítems calculados', sortType: 'number',
					value: function (item) {
						if (item.Level === PARENT_LEVEL) {
							return '';
						}
						return item.ChildCount;
					},
				},
			];
		},
		// 'Nueva equivalencia' (creación) y 'Calcular' (modifica datos) solo
		// con permiso de edición. 'Ver ítems' y 'Metadatos' son consulta
		// pura: siempre visibles.
		gridActions() {
			var loc = this;
			return [
				{
					icon: 'add_circle_outline',
					caption: 'Nueva equivalencia',
					isEnabled: function (item) { return item.Level === PARENT_LEVEL && loc.canEdit; },
					onClick: function (grid, item) { loc.createNewTupleFor(item.Geography); },
				},
				{
					icon: 'sync',
					caption: 'Calcular',
					isEnabled: function (item) { return item.Level !== PARENT_LEVEL && loc.canEdit; },
					onClick: function (grid, item) { loc.calculate(item); },
				},
				{
					icon: 'search',
					caption: 'Ver ítems',
					isEnabled: function (item) { return item.Level !== PARENT_LEVEL; },
					onClick: function (grid, item) { loc.openItems(item); },
				},
				{
					icon: 'label',
					caption: 'Metadatos',
					iconStyle: function (item) { return 'color: #' + loc.resolveColor(item); },
					badge: function (item) { return item.MetadataId; },
					isEnabled: function (item) { return item.Level !== PARENT_LEVEL && !!item.MetadataId; },
					onClick: function (grid, item) { loc.openMetadata({ Id: item.MetadataId }); },
				},
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo equivalencias', window.Db,
				window.Db.GetGeographyTuples).then(function(data) {
					arr.AddRange(loc.list, data);
					loc.list.forEach(function (item) {
						var id = item.MetadataId;
						if (id && !loc.uniqueMetadatas.includes(id)) {
							loc.uniqueMetadatas.push(id);
						}
					});
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
					loc.$refs.editPopup.show(data);
			});
		},
		// Desde el '+' de un grupo ya existente: la geografía actual llega
		// preseleccionada, el usuario solo tiene que elegir la equivalente
		// anterior.
		createNewTupleFor(geography) {
			var loc = this;
			window.Context.Factory.GetCopy('GeographyTuple', function(data) {
					data.Geography = geography;
					loc.$refs.editPopup.show(data);
			});
		},
		openMetadata(metadata) {
			var loc = this;
			window.Db.LoadMetadata(metadata).then(function (activeMetadata) {
				loc.$refs.editMetadataPopup.show(activeMetadata);
			});
		},
		resolveColor(item) {
			if (!item.MetadataId) {
				return '';
			}
			var palete = c.GetColorPalete();
			var position = this.uniqueMetadatas.indexOf(item.MetadataId);
			var positionTrimed = position % palete.length;
			return palete[positionTrimed];
		},
		isItemDeleteEnabled(item) {
			return item.Level !== PARENT_LEVEL;
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
		openItems(item) {
			this.$refs.itemsPopup.show(
				'Ítems de ' + this.formatGeography(item.PreviousGeography),
				[
					{ property: 'Caption', caption: 'Nombre actual' },
					{ property: 'Code', caption: 'Código actual' },
					{ property: 'PreviousCaption', caption: 'Nombre anterior' },
					{ property: 'PreviousCode', caption: 'Código anterior' },
					{ property: 'IsPartial', caption: 'Parcial' },
					{ property: 'Id', caption: 'Id' },
				],
				function (offset, pageSize) {
					return window.Db.GetGeographyTupleCalculatedItems(item.Id, offset, pageSize);
				}
			);
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
