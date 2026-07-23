<template>
  <div>
		<invoker ref="invoker"></invoker>
		<tree-picker-popup ref="parentPicker" @selected="onParentSelected"></tree-picker-popup>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Región</md-dialog-title>
			<md-dialog-content v-if="clippingRegion">
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Nombre" ref="inputName"
														v-model="clippingRegion.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-50">
						<mp-simple-text label="Version"
														v-model="clippingRegion.Version" @enter="save" />
					</div>

					<div class="md-layout-item md-size-100" v-if="isNew">
						<div class="mp-label">Categoría padre (opcional)</div>
						<div>
							{{ parentCaption }}
							<md-button class="md-icon-button" @click="pickParent">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Elegir</md-tooltip>
							</md-button>
							<md-button v-if="clippingRegion.Parent" class="md-icon-button" @click="clippingRegion.Parent = null">
								<md-icon>clear</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</div>
					</div>
					<div class="md-layout-item md-size-100" v-else-if="clippingRegion.Parent">
						<div class="mp-label">Categoría padre</div>
						<div>{{ clippingRegion.Parent.Caption }}</div>
					</div>

					<div class="md-layout-item md-size-100" v-if="isNew">
						<div class="mp-label">Archivo geográfico (GeoPackage)</div>
						<geo-package-upload ref="geoPackage" :fields="importFields" />
					</div>
					<div class="md-layout-item md-size-40" v-else>
						<mp-simple-text label="Nombre del campo de código" :canEdit="false"
														v-model="clippingRegion.FieldCodeName" />
					</div>

					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Menor nivel de zoom"
														v-model="clippingRegion.LabelsMinZoom" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Mayor nivel de zoom"
														v-model="clippingRegion.LabelsMaxZoom" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Símbolo"
														v-model="clippingRegion.Symbol" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Color (hexadecimal)" helper="Ej. FF7043"
														v-model="clippingRegion.Color" @enter="save" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Prioridad"
														v-model="clippingRegion.Priority" @enter="save" />
					</div>

					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="useInSearch">
							Incluirlo en las etiquetas y en el buscador del mapa*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="clippingRegion.IndexCode">
							Indexar los códigos de sus ítems para búsqueda*
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="clippingRegion.IsCrawlerIndexer">
							Utilizarlo al segmentar para crawlers*
						</md-switch>
					</div>
					* Si modifica estos valores debe actualizar el caché de regiones utilizando  la opción
					Configuración &gt; Cachés &gt; Regiones y delimitaciones&gt; Actualizar en el módulo
					de 'Logs y Mantenimiento' (sitio/logs).
				</div>
			</md-dialog-content>
			<stepper ref="stepper" title="Creando región" @completed="importCompleted" @closed="stepperClosed"></stepper>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">{{ isNew ? 'Crear' : 'Guardar' }}</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';
import TreePickerPopup from '@/packs/components/TreePickerPopup';
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
		isNew() {
			return !this.clippingRegion.Id;
		},
		parentCaption() {
			return (this.clippingRegion.Parent ? this.clippingRegion.Parent.Caption : '[Ninguna, es de nivel raíz]');
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
				var excludeIds = (loc.clippingRegion.Id ? [loc.clippingRegion.Id] : []);
				loc.$refs.parentPicker.show('Elegir categoría padre', data, excludeIds);
			});
		},
		onParentSelected(item) {
			this.clippingRegion.Parent = item;
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
