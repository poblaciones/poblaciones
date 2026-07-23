<template>
  <div>
		<invoker ref="invoker"></invoker>
		<tree-picker-popup ref="regionPicker" @selected="onRegionSelected"></tree-picker-popup>
		<md-dialog class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>{{ boundaryVersion ? 'Versión de ' + boundaryVersion.Boundary.Caption : 'Versión de delimitación' }}</md-dialog-title>
			<md-dialog-content v-if="boundaryVersion">
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-80">
						<mp-simple-text label="Nombre" ref="inputName"
														v-model="boundaryVersion.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-80">
						<mp-select :list="geographies" listGrouping="RootCaption"
											 :model-key="false" label="Geografía"
											 helper="Nivel geográfico del que se toman los polígonos de esta versión"
											 :render="formatGeography"
											 v-model="boundaryVersion.Geography" />
					</div>
					<div class="md-layout-item md-size-100">
						<div class="separator">Regiones asociadas</div>
						<md-button @click="addRegion">
							<md-icon>add_circle_outline</md-icon>
							Agregar región
						</md-button>
						<div v-if="boundaryVersion.ClippingRegions.length === 0" class="helper">
							No hay regiones asociadas.
						</div>
						<md-table v-else md-card>
							<md-table-row slot="md-table-row" slot-scope="{ item }">
								<md-table-cell md-label="Nombre">{{ item.Caption }}</md-table-cell>
								<md-table-cell md-label="Acciones" class="mpNoWrap">
									<md-button class="md-icon-button" @click="removeRegion(item)">
										<md-icon>delete</md-icon>
										<md-tooltip md-direction="bottom">Quitar</md-tooltip>
									</md-button>
								</md-table-cell>
							</md-table-row>
						</md-table>
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import f from '@/backoffice/classes/Formatter';
import TreePickerPopup from '@/packs/components/TreePickerPopup';
import GeographySelectHelper from '@/packs/classes/GeographySelectHelper';

export default {
  name: "BoundaryVersionPopup",
  data() {
    return {
			activateEdit: false,
			boundaryVersion: null,
			geographies: [],
			allClippingRegions: [],
    };
  },
  computed: {

  },
	created() {
		// Se carga una sola vez, al montar el componente (mucho antes de
		// que se abra el popup por primera vez): igual criterio que el
		// combo de Gradient en GeographyPopup. Si se cargara recién en
		// show(), mp-select (con listGrouping) podría montarse con la
		// lista todavía vacía y fallar al intentar ubicar el valor actual
		// entre las opciones.
		var loc = this;
		window.Context.Geographies.GetAll(function (data) {
			loc.geographies = GeographySelectHelper.ResolveRootCaptions(data);
		});
	},
  methods: {
		show(boundaryVersion, boundary) {
			this.boundaryVersion = f.clone(boundaryVersion);
			// Al crear una versión nueva desde la delimitación, el factory no
			// conoce a qué delimitación pertenece: se completa acá.
			if (!this.boundaryVersion.Boundary) {
				this.boundaryVersion.Boundary = boundary;
			}
			if (!this.boundaryVersion.ClippingRegions) {
				this.boundaryVersion.ClippingRegions = [];
			}
			this.activateEdit = true;
			var loc = this;
			window.Context.ClippingRegions.GetAll(function (data) {
				loc.allClippingRegions = data;
			});
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		formatGeography(geography) {
			if (!geography) {
				return '';
			}
			return geography.Caption + (geography.Revision ? ' (' + geography.Revision + ')' : '');
		},
		addRegion() {
			var associatedIds = [];
			for (var n = 0; n < this.boundaryVersion.ClippingRegions.length; n++) {
				associatedIds.push(this.boundaryVersion.ClippingRegions[n].Id);
			}
			this.$refs.regionPicker.show('Agregar región', this.allClippingRegions, associatedIds);
		},
		onRegionSelected(region) {
			this.boundaryVersion.ClippingRegions.push(region);
		},
		removeRegion(item) {
			var index = this.boundaryVersion.ClippingRegions.indexOf(item);
			if (index !== -1) {
				this.boundaryVersion.ClippingRegions.splice(index, 1);
			}
		},
		save() {
			if (this.boundaryVersion.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return;
			}
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateBoundaryVersion,
							this.boundaryVersion).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.boundaryVersion);
			});
		}
  },
  components: {
		TreePickerPopup,
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
