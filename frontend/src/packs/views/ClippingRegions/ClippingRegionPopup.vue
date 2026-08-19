<template>
  <div>
		<invoker ref="invoker"></invoker>
		<tree-picker-popup ref="parentPicker" @selected="onParentSelected"></tree-picker-popup>
		<md-dialog v-if="clippingRegion" class="medium-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Región</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-100">
						<div class="full-row-separator">Descripción</div>
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Nombre" ref="inputName" :canEdit="canEdit"
														helper="Nombre de la entidad mapeada, ej. Provincias, Departamentos"
														v-model="clippingRegion.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-30">
						<mp-simple-text label="Versión" :canEdit="canEdit"
														helper="Para distinguir ediciones de una misma región, ej. 2010, 2022"
														v-model="clippingRegion.Version" @enter="save" />
					</div>
					<div class="md-layout-item md-size-100" v-if="isNew">
						<div class="mp-label">Región padre (opcional)</div>
						<div class="helper">
							Ej. la región padre de Departamentos sería Provincias. Si no elige ninguna, la
							región queda en el nivel raíz del país.
						</div>
						<div class="mp-readonly-value">
							<div class="mp-readonly-text">
								{{
 parentCaption
								}}
							</div>
							<md-button v-if="canEdit" class="md-icon-button" @click="pickParent">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Elegir</md-tooltip>
							</md-button>
							<md-button v-if="canEdit && clippingRegion.Parent" class="md-icon-button" @click="clippingRegion.Parent = null">
								<md-icon>clear</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</div>
					</div>

					<div class="md-layout-item md-size-40" v-if="false">
						<mp-simple-text label="Campo de código"
														helper="Columna del archivo usada como código de sus ítems al importar"
														v-model="clippingRegion.FieldCodeName" />
					</div>

					<div class="md-layout-item md-size-100" v-if="isNew && canEdit">
						<div class="mp-label">Archivo geográfico (GeoPackage)</div>
						<geo-package-upload ref="geoPackage" :fields="importFields" />
					</div>

					<div class="md-layout-item md-size-100">
						<div class="full-row-separator">Presentación en el mapa</div>
					</div>
					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Ícono" v-model="clippingRegion.Symbol" :canEdit="canEdit"
														helper="Icono de FontAwesome o de MapIcons para etiquetas en el mapa"
														@enter="save" />
					</div>
					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Color (hexadecimal)" :canEdit="canEdit" helper="Ej. FF7043"
														v-model="clippingRegion.Color" @enter="save" />
					</div>
					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Zoom mínimo" :canEdit="canEdit" type="number"
														helper="Mínimo para mostrar el nombre de sus ítems como etiqueta"
														v-model="clippingRegion.LabelsMinZoom" @enter="save" />
					</div>
					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Zoom máximo" :canEdit="canEdit" type="number"
														helper="Hasta qué nivel de zoom se muestra esa etiqueta"
														v-model="clippingRegion.LabelsMaxZoom" @enter="save" />
					</div>

					<div class="md-layout-item md-size-20">
						<mp-simple-text label="Prioridad" :canEdit="canEdit" type="number"
														helper="A mayor prioridad, más precedencia al resolver superposiciones"
														v-model="clippingRegion.Priority" @enter="save" />
					</div>
					<div class="md-layout-item md-size-100">
						<div class="full-row-separator">Indexación</div>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" :disabled="!canEdit" v-model="useInSearch">
							Buscador: ofrecer este nivel al autocompletar el ingreso de regiones y en el buscador del mapa*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" :disabled="!canEdit" v-model="clippingRegion.IndexCode">
							Códigos: indexar los códigos (además de las descripciones) de los ítems para búsquedas*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" :disabled="!canEdit" v-model="clippingRegion.IsCrawlerIndexer">
							Usarlo como criterio de segmentación hacia crawlers*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100 helper">
						* Si modifica estos valores debe actualizar el caché de regiones utilizando la opción
						Configuración &gt; Cachés &gt; Regiones y delimitaciones &gt; Actualizar en el módulo
						de 'Logs y Mantenimiento' (sitio/logs).
					</div>
				</div>
			</md-dialog-content>
			<stepper ref="stepper" title="Creando región" @completed="importCompleted" @closed="stepperClosed"></stepper>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">{{ cancelCaption }}</md-button>
				<md-button v-if="canEdit" class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';
import TreePickerPopup from '@/packs/components/popups/TreePickerPopup';
import GeoPackageUpload from '@/packs/components/GeoPackageUpload';

export default {
  name: "ClippingRegionPopup",
  data() {
    return {
			activateEdit: false,
			clippingRegion: null,
			useInSearch: 0,
			importResult: null,
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
		isNew() {
			return !this.clippingRegion.Id;
		},
		parentCaption() {
			if (this.clippingRegion.Parent) {
				return this.clippingRegion.Parent.Caption;
			}
			return 'Ninguna';
		},
		// El código del padre solo hace falta mapearlo cuando la región va a
		// tener una categoría padre: sin eso, cada ítem del archivo no tendría
		// con qué ítem padre vincularse.
		importFields() {
			var fields = [
				{ key: 'code', label: 'Código', required: true },
				{ key: 'caption', label: 'Nombre', required: false },
			];
			if (this.clippingRegion.Parent) {
				fields.push({ key: 'parentCode', label: 'Código del padre', required: true });
			}
			return fields;
		},
  },
  methods: {
		show(clippingRegion) {
			this.clippingRegion = f.clone(clippingRegion);
			this.activateEdit = true;
			this.useInSearch = !clippingRegion.NoAutocomplete;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		pickParent() {
			var loc = this;
			window.Context.ClippingRegions.GetAll(function (data) {
				var excludeIds = [];
				if (loc.clippingRegion.Id) {
					excludeIds = [loc.clippingRegion.Id];
				}
				loc.$refs.parentPicker.show('Elegir categoría padre', data, excludeIds);
			});
		},
		onParentSelected(item) {
			// El item que llega del picker es el nodo completo del árbol
			// (con sus descendientes y el Metadata de cada uno anidados):
			// guardarlo tal cual haría que el alta viaje con el árbol
			// entero adentro. Solo hace falta el Id para guardar y el
			// Caption/Version para mostrarlo.
			this.clippingRegion.Parent = { Id: item.Id, Caption: item.Caption, Version: item.Version };
		},
		save() {
			if (this.clippingRegion.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return;
			}
			if (this.isNew) {
				this.saveNew();
			} else {
				this.saveEdit();
			}
		},
		saveEdit() {
			var loc = this;
			this.clippingRegion.NoAutocomplete = !this.useInSearch;

			this.$refs.invoker.doSave(window.Db, window.Db.UpdateClippingRegion,
							this.clippingRegion).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.clippingRegion);
			});
		},
		saveNew() {
			if (!this.$refs.geoPackage.isReady()) {
				alert('Debe completar el archivo GeoPackage y el mapeo de columnas antes de continuar.');
				return;
			}
			this.clippingRegion.NoAutocomplete = !this.useInSearch;
			var payload = this.$refs.geoPackage.getPayload();
			var stepper = this.$refs.stepper;
			stepper.startUrl = window.Db.GetStartClippingRegionImportUrl();
			stepper.stepUrl = window.Db.GetStepClippingRegionImportUrl();
			stepper.args = {
				c: JSON.stringify(this.clippingRegion),
				b: payload.bucketId,
				m: JSON.stringify(payload.mapping),
			};
			stepper.Start();
		},
		importCompleted() {
			// Solo guarda el resultado: el cierre del popup ocurre en
			// stepperClosed, cuando el usuario ya vio la pantalla de resultado
			// del Stepper (para no taparle el éxito o el error con el cierre).
			this.importResult = this.$refs.stepper.result;
		},
		stepperClosed(success) {
			if (success) {
				this.activateEdit = false;
				this.$emit('completed', this.importResult);
			}
		}
  },
  components: {
		TreePickerPopup,
		GeoPackageUpload,
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
