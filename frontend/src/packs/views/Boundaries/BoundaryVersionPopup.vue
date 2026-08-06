<template>
  <div>
		<invoker ref="invoker"></invoker>
		<tree-picker-popup ref="regionPicker" @selected="onRegionSelected"></tree-picker-popup>
		<md-dialog v-if="boundaryVersion" class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>{{ dialogTitle }}</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-80">
						<mp-simple-text label="Nombre" ref="inputName" :canEdit="canEdit" helper="Hasta 20 caracteres"
														v-model="boundaryVersion.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-80">
						<mp-select :list="geographies" listGrouping="RootCaption" :canEdit="canEdit"
											 :model-key="false" label="Geografía"
											 helper="Nivel geográfico que se anexa como contexto al descargar (ej. el departamento en que se encuentra cada ítem), no de donde se toman los polígonos"
											 :render="formatGeography"
											 v-model="boundaryVersion.Geography" />
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch :disabled="!canEdit" v-model="boundaryVersion.HasOwnMetadata">Usa metadatos propios</md-switch>
						<div class="helper">
							Si está desactivado, la edición de metadatos de esta versión usa los del
							primer contenido asociado, en vez de tener los suyos propios.
						</div>
					</div>
					<div class="md-layout-item md-size-100">
						<div class="separator">Regiones asociadas</div>
						<md-button v-if="canEdit" @click="addRegion">
							<md-icon>add_circle_outline</md-icon>
							Agregar región
						</md-button>
						<div v-if="boundaryVersion.ClippingRegions.length === 0" class="helper">
							No hay regiones asociadas.
						</div>
						<md-table v-else v-model="boundaryVersion.ClippingRegions" md-card>
							<md-table-row slot="md-table-row" slot-scope="{ item }">
								<md-table-cell md-label="Nombre">{{ formatClippingRegion(item) }}</md-table-cell>
								<md-table-cell v-if="canEdit" md-label="Acciones" class="mpNoWrap">
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
				<md-button @click="activateEdit = false">{{ cancelCaption }}</md-button>
				<md-button v-if="canEdit" class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import f from '@/backoffice/classes/Formatter';
import TreePickerPopup from '@/packs/components/popups/TreePickerPopup';
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
		canEdit() {
			return window.Context.IsAdmin();
		},
		cancelCaption() {
			if (this.canEdit) {
				return 'Cancelar';
			}
			return 'Cerrar';
		},
		dialogTitle() {
			if (this.boundaryVersion) {
				return 'Versión de ' + this.boundaryVersion.Boundary.Caption;
			}
			return 'Versión de delimitación';
		},
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
		formatClippingRegion(region) {
			if (region.Version) {
				return region.Caption + ', ' + region.Version;
			}
			return region.Caption;
		},
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
			this.boundaryVersion.HasOwnMetadata = !!this.boundaryVersion.MetadataId;
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
			if (geography.Revision) {
				return geography.Caption + ' (' + geography.Revision + ')';
			}
			return geography.Caption;
		},
		addRegion() {
			var associatedIds = [];
			for (var n = 0; n < this.boundaryVersion.ClippingRegions.length; n++) {
				associatedIds.push(this.boundaryVersion.ClippingRegions[n].Id);
			}
			this.$refs.regionPicker.show('Agregar región', this.allClippingRegions, associatedIds);
		},
		onRegionSelected(region) {
			// El region que llega del picker es el nodo completo del árbol
			// (con sus descendientes y el Metadata de cada uno anidados):
			// guardarlo tal cual haría que el alta viaje con el árbol
			// entero adentro. Solo hace falta el Id para guardar y el
			// Caption/Version para mostrarlo.
			this.boundaryVersion.ClippingRegions.push({ Id: region.Id, Caption: region.Caption, Version: region.Version });
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
			if (this.boundaryVersion.Caption.length > 20) {
				alert('\'Nombre\' admite hasta 20 caracteres.');
				return;
			}
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateBoundaryVersion,
							this.boundaryVersion).then(function(data) {
								loc.boundaryVersion.ClippingRegionsSummary = data.ClippingRegionsSummary;
								loc.boundaryVersion.MetadataId = data.MetadataId;
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
