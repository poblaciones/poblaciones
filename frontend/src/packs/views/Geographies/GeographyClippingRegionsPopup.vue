<template>
	<div>
		<invoker ref="invoker"></invoker>
		<clipping-region-selection-popup ref="selectionPopup" @selected="onRegionsSelected"></clipping-region-selection-popup>
		<items-list-popup ref="itemsPopup">
		</items-list-popup>
		<md-dialog class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>{{ dialogTitle }}</md-dialog-title>
			<md-dialog-content v-if="geography">
				<div class="helper">
					Al asociar una región se calculan las intersecciones entre sus ítems y los de esta
					geografía (mismo vínculo que se edita desde 'Geografías asociadas' en cada región). El
					cálculo puede demorar.
				</div>
				<md-button v-if="canEdit" @click="openSelection">
					<md-icon>add_circle_outline</md-icon>
					Agregar regiones
				</md-button>
				<div v-if="associated.length === 0" class="helper">
					No hay regiones asociadas.
				</div>
				<md-table v-else v-model="sortedAssociated" md-card>
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell md-label="Región" :style="{ paddingLeft: (item.Level * 20) + 'px' }">
							{{ formatClippingRegion(item.ClippingRegion) }}
						</md-table-cell>
						<md-table-cell md-label="Ítems">{{ item.ItemCount }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" @click="openItems(item)">
								<md-icon>search</md-icon>
								<md-tooltip md-direction="bottom">Ver ítems</md-tooltip>
							</md-button>
							<md-button v-if="canEdit" class="md-icon-button" @click="confirmRemoveAssociation(item)">
								<md-icon>delete</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>
			</md-dialog-content>
			<stepper ref="stepper" title="Calculando intersecciones" @completed="calculationCompleted"></stepper>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import ClippingRegionSelectionPopup from '@/packs/components/popups/ClippingRegionSelectionPopup.vue';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';

export default {
	name: 'GeographyClippingRegionsPopup',
	components: {
		ClippingRegionSelectionPopup,
		ItemsListPopup,
	},
	data() {
		return {
			activateEdit: false,
			geography: null,
			associated: [],
			allClippingRegions: [],
		};
	},
	computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		dialogTitle() {
			if (this.geography) {
				var caption = this.geography.Caption;
				if (this.geography.Revision) {
					caption += ' (' + this.geography.Revision + ')';
				}
				return 'Regiones asociadas a ' + caption;
			}
			return 'Regiones asociadas';
		},
		// this.associated viene ordenado alfabéticamente por el backend
		// (no tiene por qué conocer la jerarquía completa): acá se busca
		// cada una en allClippingRegions (que sí la tiene, con Level ya
		// calculado) para ordenarlas e indentarlas como en el listado
		// principal de regiones, sin necesitar el armado de árbol
		// completo de MpGrid.
		sortedAssociated() {
			var loc = this;
			var ret = this.associated.slice();
			ret.forEach(function (item) {
				var found = loc.findInAllClippingRegions(item.ClippingRegion.Id);
				if (found) {
					item.Level = found.Level;
					item.SortOrder = loc.allClippingRegions.indexOf(found);
				} else {
					item.Level = 0;
					item.SortOrder = loc.allClippingRegions.length;
				}
			});
			ret.sort(function (a, b) { return a.SortOrder - b.SortOrder; });
			return ret;
		},
	},
	created() {
		var loc = this;
		window.Context.ClippingRegions.GetAll(function (data) {
			loc.allClippingRegions = data;
		});
	},
	methods: {
		show(geography) {
			this.geography = geography;
			this.activateEdit = true;
			this.reloadAssociated();
		},
		formatClippingRegion(region) {
			if (region.Version) {
				return region.Caption + ', ' + region.Version;
			}
			return region.Caption;
		},
		findInAllClippingRegions(id) {
			for (var n = 0; n < this.allClippingRegions.length; n++) {
				if (this.allClippingRegions[n].Id === id) {
					return this.allClippingRegions[n];
				}
			}
			return null;
		},
		reloadAssociated() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo regiones asociadas', window.Db,
					window.Db.GetGeographyClippingRegions, this.geography.Id).then(function (data) {
						loc.associated = data;
			});
		},
		openSelection() {
			var associatedIds = [];
			for (var n = 0; n < this.associated.length; n++) {
				associatedIds.push(this.associated[n].ClippingRegion.Id);
			}
			this.$refs.selectionPopup.show(this.allClippingRegions, associatedIds);
		},
		openItems(item) {
			this.$refs.itemsPopup.show(
				'Ítems de ' + this.formatClippingRegion(item.ClippingRegion),
				[
					{ property: 'Caption', caption: 'Nombre' },
					{ property: 'Code', caption: 'Código' },
					{ property: 'IntersectionPercent', caption: '% intersección' },
					{ property: 'Id', caption: 'Id' },
				],
				function (offset, pageSize) {
					return window.Db.GetClippingRegionGeographyIntersectionItems(item.Id, offset, pageSize);
				}
			);
		},
		onRegionsSelected(clippingRegionIds) {
			if (clippingRegionIds.length === 0) {
				return;
			}
			var stepper = this.$refs.stepper;
			stepper.startUrl = window.Db.GetStartGeographyClippingRegionsCalculateUrl();
			stepper.stepUrl = window.Db.GetStepGeographyClippingRegionsCalculateUrl();
			stepper.args = { g: this.geography.Id, r: clippingRegionIds.join(',') };
			stepper.Start();
		},
		confirmRemoveAssociation(item) {
			var loc = this;
			this.$refs.invoker.confirm('Quitar región',
				'La asociación y las intersecciones ya calculadas para esta región serán eliminadas.',
				function () {
					loc.removeAssociation(item);
				});
		},
		removeAssociation(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteClippingRegionGeography, item).then(function () {
				var index = loc.associated.indexOf(item);
				if (index !== -1) {
					loc.associated.splice(index, 1);
				}
			});
		},
		calculationCompleted() {
			// El cierre visual (con éxito o error) queda a cargo del propio
			// Stepper; acá solo se refresca la lista de asociadas.
			this.reloadAssociated();
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
