<template>
  <div>
		<invoker ref="invoker"></invoker>
		<md-dialog v-if="gradient" class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Gradiente</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-70">
						<mp-simple-text label="Nombre" ref="inputName" :canEdit="canEdit"
														v-model="gradient.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-30">
						<div class="mp-label">Tipo de imagen</div>
						<md-radio v-model="gradient.ImageType" class="md-primary" value="image/jpeg" :disabled="!canEdit">JPG</md-radio>
						<md-radio v-model="gradient.ImageType" class="md-primary" value="image/png" :disabled="!canEdit">PNG</md-radio>
					</div>

					<div class="md-layout-item md-size-100" v-if="isNew && canEdit">
						<div class="mp-label">Archivo de teselas (GeoPackage)</div>
						<geo-package-upload ref="geoPackage" :verify-method="verifyMethod" />
					</div>
					<div class="md-layout-item md-size-40" v-else>
						<mp-simple-text label="Máximo nivel de zoom" :canEdit="false"
														v-model="gradient.MaxZoomLevel" />
					</div>
				</div>
			</md-dialog-content>
			<stepper ref="stepper" title="Creando gradiente" @completed="importCompleted" @closed="stepperClosed"></stepper>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">{{ cancelCaption }}</md-button>
				<md-button v-if="canEdit" class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import f from '@/backoffice/classes/Formatter';
import GeoPackageUpload from '@/packs/components/GeoPackageUpload';

export default {
  name: "GradientPopup",
  data() {
    return {
			activateEdit: false,
			gradient: null,
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
			return !this.gradient.Id;
		},
		verifyMethod() {
			return function (bucketId) { return window.Db.VerifyGradientPackage(bucketId); };
		},
  },
  methods: {
		show(gradient) {
			this.gradient = f.clone(gradient);
			if (!this.gradient.ImageType) {
				this.gradient.ImageType = 'image/png';
			}
			this.activateEdit = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		save() {
			if (this.gradient.Caption.trim() === '') {
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
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateGradient,
							this.gradient).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.gradient);
			});
		},
		saveNew() {
			if (!this.$refs.geoPackage.isReady()) {
				alert('Debe completar el archivo GeoPackage antes de continuar.');
				return;
			}
			var payload = this.$refs.geoPackage.getPayload();
			var stepper = this.$refs.stepper;
			stepper.startUrl = window.Db.GetStartGradientImportUrl();
			stepper.stepUrl = window.Db.GetStepGradientImportUrl();
			stepper.args = {
				g: JSON.stringify(this.gradient),
				b: payload.bucketId,
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
		GeoPackageUpload,
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
