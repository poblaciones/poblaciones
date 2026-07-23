<template>
	<div>
		<invoker ref="invoker"></invoker>
		<md-dialog class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Geografías asociadas{{ clippingRegion ? ' a ' + clippingRegion.Caption : '' }}</md-dialog-title>
			<md-dialog-content v-if="clippingRegion">

				<div class="separator">Ya asociadas</div>
				<div v-if="associated.length === 0" class="helper">
					No hay geografías asociadas.
				</div>
				<md-table v-else md-card>
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell md-label="Geografía">{{ item.Geography.Caption }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" @click="confirmRemoveAssociation(item)">
								<md-icon>delete</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>

				<div class="separator" style="margin-top: 20px">Agregar geografías</div>
				<div class="helper">
					Marque una o varias geografías y presione 'Asociar seleccionadas'. El cálculo de las
					intersecciones puede demorar.
				</div>
				<div class="geographyCheckList">
					<template v-for="group in groupedByRootCaption">
						<div class="geographyGroupHeader" :key="'header-' + group.caption">{{ group.caption }}</div>
						<md-checkbox v-for="geo in group.items" :key="geo.Id"
							v-model="checkedIds[geo.Id]"
							:disabled="isAssociated(geo.Id)">
							{{ geo.Caption }}
						</md-checkbox>
					</template>
				</div>
				<md-button class="md-primary" :disabled="!hasChecked" @click="associateChecked">
					<md-icon>link</md-icon>
					Asociar seleccionadas
				</md-button>
			</md-dialog-content>
			<stepper ref="stepper" title="Calculando intersecciones" @completed="calculationCompleted"></stepper>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import GeographySelectHelper from '@/packs/classes/GeographySelectHelper';

export default {
	name: 'ClippingRegionGeographyPopup',
	data() {
		return {
			activateEdit: false,
			clippingRegion: null,
			associated: [],
			allGeographies: [],
			checkedIds: {},
		};
	},
	computed: {
		hasChecked() {
			for (var id in this.checkedIds) {
				if (this.checkedIds[id]) {
					return true;
				}
			}
			return false;
		},
		// Agrupa por RootCaption, mismo criterio que el resto de los
		// combos de geografía del sistema (georreferenciar, versión de
		// delimitación, equivalencias): jerarquía en profundidad por
		// árbol, con el RootCaption heredado a los niveles internos.
		groupedByRootCaption() {
			var associatedIds = [];
			for (var n = 0; n < this.associated.length; n++) {
				associatedIds.push(this.associated[n].Geography.Id);
			}
			var groups = {};
			var order = [];
			for (var i = 0; i < this.allGeographies.length; i++) {
				var geo = this.allGeographies[i];
				var key = (geo.RootCaption ? geo.RootCaption : geo.Caption);
				if (!groups[key]) {
					groups[key] = [];
					order.push(key);
				}
				groups[key].push(geo);
			}
			var ret = [];
			for (var j = 0; j < order.length; j++) {
				ret.push({ caption: order[j], items: groups[order[j]] });
			}
			return ret;
		},
	},
	methods: {
		show(clippingRegion) {
			this.clippingRegion = clippingRegion;
			this.activateEdit = true;
			this.allGeographies = [];
			this.checkedIds = {};
			var loc = this;
			window.Context.Geographies.GetAll(function (data) {
				loc.allGeographies = GeographySelectHelper.ResolveRootCaptions(data);
			});
			this.reloadAssociated();
		},
		reloadAssociated() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo geografías asociadas', window.Db,
					window.Db.GetClippingRegionGeographies, this.clippingRegion.Id).then(function (data) {
						loc.associated = data;
			});
		},
		isAssociated(geographyId) {
			for (var n = 0; n < this.associated.length; n++) {
				if (this.associated[n].Geography.Id === geographyId) {
					return true;
				}
			}
			return false;
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
		associateChecked() {
			var geographyIds = [];
			for (var id in this.checkedIds) {
				if (this.checkedIds[id]) {
					geographyIds.push(id);
				}
			}
			if (geographyIds.length === 0) {
				return;
			}
			var stepper = this.$refs.stepper;
			stepper.startUrl = window.Db.GetStartClippingRegionGeographyCalculateUrl();
			stepper.stepUrl = window.Db.GetStepClippingRegionGeographyCalculateUrl();
			stepper.args = { r: this.clippingRegion.Id, g: geographyIds.join(',') };
			stepper.Start();
		},
		calculationCompleted() {
			// El cierre visual (con éxito o error) queda a cargo del propio
			// Stepper; acá solo se refresca la lista de asociadas de fondo y se
			// limpia lo que estaba marcado (ya se procesó).
			this.checkedIds = {};
			this.reloadAssociated();
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.geographyCheckList {
	max-height: 320px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	padding: 8px 16px;
	margin-bottom: 12px;
}

.geographyGroupHeader {
	font-weight: 600;
	color: #757575;
	margin-top: 12px;
	margin-bottom: 2px;

	&:first-child {
		margin-top: 0;
	}
}

</style>
