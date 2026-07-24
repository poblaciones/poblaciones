<template>
	<div>
		<invoker ref="invoker"></invoker>
		<geography-selection-popup ref="selectionPopup" @selected="onGeographiesSelected"></geography-selection-popup>
		<md-dialog class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>{{ dialogTitle }}</md-dialog-title>
			<md-dialog-content v-if="clippingRegion">
				<div class="helper">
					Al asociar una geografía se calculan las intersecciones entre los ítems de la región y
					los de esa geografía. El cálculo puede demorar.
				</div>
				<md-button @click="openSelection">
					<md-icon>add_circle_outline</md-icon>
					Agregar geografías
				</md-button>
				<div v-if="associated.length === 0" class="helper">
					No hay geografías asociadas.
				</div>
				<md-table v-else v-model="associated" md-card>
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell md-label="Geografía">{{ formatGeography(item.Geography) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" @click="confirmRemoveAssociation(item)">
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

import GeographySelectionPopup from './GeographySelectionPopup.vue';

export default {
	name: 'ClippingRegionGeographyPopup',
	components: {
		GeographySelectionPopup,
	},
	data() {
		return {
			activateEdit: false,
			clippingRegion: null,
			associated: [],
			allGeographies: [],
		};
	},
	computed: {
		dialogTitle() {
			if (this.clippingRegion) {
				return 'Geografías asociadas a ' + this.clippingRegion.Caption;
			}
			return 'Geografías asociadas';
		},
	},
	created() {
		var loc = this;
		window.Context.Geographies.GetAll(function (data) {
			loc.allGeographies = data;
		});
	},
	methods: {
		show(clippingRegion) {
			this.clippingRegion = clippingRegion;
			this.activateEdit = true;
			this.reloadAssociated();
		},
		reloadAssociated() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo geografías asociadas', window.Db,
					window.Db.GetClippingRegionGeographies, this.clippingRegion.Id).then(function (data) {
						loc.associated = data;
			});
		},
		formatGeography(geography) {
			if (!geography) {
				return '';
			}
			if (geography.Revision) {
				return geography.Caption + ' (' + geography.Revision + ')';
			}
			return geography.Caption;
		},
		openSelection() {
			var associatedIds = [];
			for (var n = 0; n < this.associated.length; n++) {
				associatedIds.push(this.associated[n].Geography.Id);
			}
			this.$refs.selectionPopup.show(this.allGeographies, associatedIds);
		},
		onGeographiesSelected(geographyIds) {
			if (geographyIds.length === 0) {
				return;
			}
			var stepper = this.$refs.stepper;
			stepper.startUrl = window.Db.GetStartClippingRegionGeographyCalculateUrl();
			stepper.stepUrl = window.Db.GetStepClippingRegionGeographyCalculateUrl();
			stepper.args = { r: this.clippingRegion.Id, g: geographyIds.join(',') };
			stepper.Start();
		},
		confirmRemoveAssociation(item) {
			var loc = this;
			this.$refs.invoker.confirm('Quitar geografía',
				'La asociación y las intersecciones ya calculadas para esta geografía serán eliminadas.',
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
