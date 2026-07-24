<template>
  <div>
		<invoker ref="invoker"></invoker>
		<tree-picker-popup ref="parentPicker" @selected="onParentSelected"></tree-picker-popup>
		<md-dialog class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>
				Geografía {{
				(geography.Parent ? ' en ' + geography.Parent.Caption : '')
				 }}
			</md-dialog-title>
			<md-dialog-content v-if="geography">
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-33">
						<mp-simple-text label="Nombre" ref="inputName"
														helper="Nombre de la entidad mapeada, ej. Provincias, Departamentos"
														v-model="geography.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-33">
						<mp-simple-text label="Nombre corto" helper="Usado donde no entra el nombre completo"
														v-model="geography.CaptionShort" @enter="save" />
					</div>
					<div class="md-layout-item md-size-33">
						<mp-simple-text label="Revisión"
														helper="Distingue revisiones de una unidad geográfica (ej. 2010, 2022)"
														v-model="geography.Revision" @enter="save" />
					</div>

					<div class="md-layout-item md-size-100" v-if="isNew">
						<div class="mp-label">Categoría padre (opcional)</div>
						<div class="helper">
							Ej. la categoría padre de Departamentos sería Provincias. Si no elige ninguna, la
							geografía queda en el nivel raíz de un relevamiento propio.
						</div>
						<div class="mp-readonly-value">
							{{ parentCaption }}
							<md-button class="md-icon-button" @click="pickParent">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Elegir</md-tooltip>
							</md-button>
							<md-button v-if="geography.Parent" class="md-icon-button" @click="geography.Parent = null">
								<md-icon>clear</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</div>
					</div>

					<div class="md-layout-item md-size-60" v-if="!geography.Parent">
						<mp-simple-text label="Nombre del relevamiento"
														helper="Sirve para agrupar las geografías en los listados para georreferenciar por código. Ej. Censo 2010"
														v-model="geography.RootCaption" @enter="save" />
					</div>

					<div class="md-layout-item md-size-100" v-if="isNew">
						<div class="mp-label">Archivo geográfico (GeoPackage)</div>
						<geo-package-upload ref="geoPackage" :fields="importFields" />
					</div>
					<template v-if="false">
						<div class="md-layout-item md-size-33">
							<mp-simple-text label="Campo de código" helper="Columna del archivo usada como código al importar"
															v-model="geography.FieldCodeName" @enter="save" />
						</div>
						<div class="md-layout-item md-size-33">
							<mp-simple-text label="Campo de nombre" helper="Columna del archivo usada como nombre al importar"
															v-model="geography.FieldCaptionName" @enter="save" />
						</div>
						<div class="md-layout-item md-size-33">
							<mp-simple-text label="Campo de urbanidad" helper="Columna del archivo usada como urbano/rural al importar"
															v-model="geography.FieldUrbanityName" @enter="save" />
						</div>
					</template>

					<div class="md-layout-item md-size-100">
						<div class="separator">Presentación en el mapa</div>
					</div>
					<div class="md-layout-item md-size-33">
						<mp-simple-text label="Zoom máximo" type="number" :minimum="1" :maximum="22"
														helper="Zoom sugerido cuando haya niveles de menor desagregación disponibles"
														v-model="geography.MaxZoom" @enter="save" />
					</div>
					<div class="md-layout-item md-size-33">
						<mp-select :key="'gradient-' + gradients.length" :list="gradients" :model-key="false" label="Gradiente"
											 helper="Gradiente de color con el que suavizar la información"
											 :allow-null="true" nullLabel="[Ninguno]"
											 v-model="geography.Gradient" />
					</div>
					<div class="md-layout-item md-size-33">
						<mp-simple-text label="Luminancia del gradiente" type="number"
														helper="Intensidad predeterminada del gradiente"
														v-model="geography.GradientLuminance" @enter="save" />
					</div>

					<div class="md-layout-item md-size-100">
						<div class="separator">Comportamiento</div>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="geography.UseForClipping">
							Considerarla para calcular el total población del panel de resúmen
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="geography.IsTrackingLevel">
							Es el nivel de seguimiento (geografía por la que se georreferencian las capas de puntos)
						</md-switch>
					</div>
				</div>
			</md-dialog-content>
			<stepper ref="stepper" title="Creando geografía" @completed="importCompleted" @closed="stepperClosed"></stepper>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">{{ saveButtonLabel }}</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import f from '@/backoffice/classes/Formatter';
import TreePickerPopup from '@/packs/components/TreePickerPopup';
import GeoPackageUpload from '@/packs/components/GeoPackageUpload';

export default {
  name: "GeographyPopup",
  data() {
    return {
			activateEdit: false,
			geography: null,
			gradients: [],
			importResult: null,
    };
  },
  computed: {
		isNew() {
			return !this.geography.Id;
		},
		saveButtonLabel() {
			if (this.isNew) {
				return 'Crear';
			}
			return 'Guardar';
		},
		parentCaption() {
			if (this.geography.Parent) {
				return this.geography.Parent.Caption;
			}
			return '[Ninguna, es de nivel raíz]';
		},
		// El código del padre solo hace falta mapearlo cuando la geografía va
		// a tener una categoría padre: sin eso, cada ítem del archivo no
		// tendría con qué ítem padre vincularse.
		importFields() {
			var fields = [
				{ key: 'code', label: 'Código', required: true },
				{ key: 'caption', label: 'Nombre', required: false },
				{ key: 'population', label: 'Población', required: true },
				{ key: 'households', label: 'Hogares', required: true },
				{ key: 'children', label: 'Niños', required: true },
				{ key: 'urbanity', label: 'Urbano/rural/disperso', required: false },
			];
			if (this.geography.Parent) {
				fields.push({ key: 'parentCode', label: 'Código del padre', required: true });
			}
			return fields;
		},
  },
	created() {
		// Se carga una sola vez, al montar el componente (mucho antes de
		// que se abra el popup por primera vez): si se cargara recién en
		// show(), mp-select podría intentar sincronizar el Gradient actual
		// contra una lista todavía vacía y quedar sin marcar nada (ver
		// MpSelect.receiveValue(), que no se vuelve a ejecutar solo porque
		// la lista cambie más tarde). La key dinámica del select es una
		// segunda red de seguridad para el caso en que igual llegue tarde.
		var loc = this;
		window.Db.GetGradients().then(function (data) {
			loc.gradients = data;
		});
	},
  methods: {
		show(geography) {
			this.geography = f.clone(geography);
			this.activateEdit = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		pickParent() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo geografías', window.Db,
					window.Db.GetGeographies).then(function (data) {
						var excludeIds = [];
						if (loc.geography.Id) {
							excludeIds = [loc.geography.Id];
						}
						loc.$refs.parentPicker.show('Elegir categoría padre', data, excludeIds);
			});
		},
		onParentSelected(item) {
			this.geography.Parent = item;
			this.geography.RootCaption = null;
		},
		save() {
			if (this.geography.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return;
			}
			if (!this.geography.CaptionShort || this.geography.CaptionShort.trim() === '') {
				alert('Debe indicar un valor para \'Nombre corto\'.');
				return;
			}
			if (!this.geography.Revision || this.geography.Revision.trim() === '') {
				alert('Debe indicar un valor para \'Revisión\'.');
				return;
			}
			if (!this.geography.Parent && (!this.geography.RootCaption || this.geography.RootCaption.trim() === '')) {
				alert('Debe indicar un valor para \'Nombre del relevamiento\' cuando no hay categoría padre.');
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
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateGeography,
							this.geography).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.geography);
			});
		},
		saveNew() {
			if (!this.$refs.geoPackage.isReady()) {
				alert('Debe completar el archivo GeoPackage y el mapeo de columnas antes de continuar.');
				return;
			}
			var payload = this.$refs.geoPackage.getPayload();
			var stepper = this.$refs.stepper;
			stepper.startUrl = window.Db.GetStartGeographyImportUrl();
			stepper.stepUrl = window.Db.GetStepGeographyImportUrl();
			stepper.args = {
				g: JSON.stringify(this.geography),
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
