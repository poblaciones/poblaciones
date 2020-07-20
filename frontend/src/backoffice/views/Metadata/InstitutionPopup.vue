<template>
	<md-dialog :md-active.sync="openEditableInstitution" style="min-height: 520px">
		<md-dialog-title>
			Institución
		</md-dialog-title>
		<md-dialog-content v-if="item">
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-80 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Nombre de la institución" ref="datasetInput"
									helper="Indique el nombre de la institución, evitando siglas o acrónimos. Ej. Instituto de Estadística Nacional."
									:maxlength="200" v-model="item.Caption" />
				</div>
				<div class="md-layout-item md-size-50 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Correo electrónico" helper="Dirección de correo electrónico institucional."
									:maxlength="50" v-model="item.Email" />
				</div>
				<div class="md-layout-item md-size-50 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Teléfono" helper="Teléfono institucional, incluyendo códigos de área. (Ej. +54 11 524-1124.)"
									:maxlength="50" v-model="item.Phone" />
				</div>
				<div class="md-layout-item md-size-65 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Dirección postal" helper="Ubicación de la institución (Ej. Carreli 1720 (2321) Montevideo"
									:maxlength="200" v-model="item.Address" />
				</div>
				<div class="md-layout-item md-size-35 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="País" helper="País correspondiente a la dirección indicada (Ej. Uruguay)"
									:maxlength="50" v-model="item.Country" />
				</div>
				<div class="md-layout-item md-size-65 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Página web" helper="Sitio web de la institución (Ej. https://vedol.gov/)"
									:maxlength="255" v-model="item.Web" />
				</div>
				<div class="md-layout-item md-size-35 md-small-size-100">
					<div class="label-primary-color">Selección de color primario</div>
					<mp-color-picker :canEdit="Work.CanEdit()" :ommitHexaSign="true" v-model="item.PrimaryColor" />
				</div>
				<div class="md-layout-item md-size-65 md-small-size-100">
					<img class="imagen-preview" style="" :src="this.watermarkImage" alt="">
					<md-button style="float: right; background-color: #ececec;"
								v-if="watermarkImage"
								title="Quitar"
								class="md-icon-button md-button-mini"
								v-on:click="clear">
						<md-icon>close</md-icon>
					</md-button>
					<label class="file-select">
						<div class="select-button">
							<md-icon>add_circle_outline</md-icon>
							Agregar logo
						</div>
						<input @change="handleImage" class="file-select" type="file" accept="image/*"/>
					</label>
				</div>
			</div>

		</md-dialog-content>
		<md-dialog-actions>
			<div v-if="Work.CanEdit()">
				<md-button @click="openEditableInstitution = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Aceptar</md-button>
			</div>
			<div v-else="">
				<md-button @click="openEditableInstitution = false">Cerrar</md-button>
			</div>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
	import Context from '@/backoffice/classes/Context';
  	import h from '@/public/js/helper';

	export default {
	name: 'InstitutionPopup',
	data() {
		return {
			item: null,
			closeParentCallback: null,
			openEditableInstitution: false,
			watermarkImage: null,
			imageHasChanged: false,
			extension: null,
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		institutionSelected() {
			if (this.item && this.item.Institution) {
				return this.item.Institution.Id;
			} else {
				return -1;
			}
		}
	},
	methods: {
		show(item, closeParentCallback) {
			this.item = item;
			if (closeParentCallback) {
				this.closeParentCallback = closeParentCallback;
			} else {
				this.closeParentCallback = null;
			}
			this.openEditableInstitution = true;

			var loc = this;
			setTimeout(() => {
				loc.$refs.datasetInput.focus();
				if (this.item && this.item.Watermark){
					loc.getInstitutionWatermark();
				}
			}, 100);
		},
		getInstitutionWatermark(){
			var loc = this;
			loc.$refs.invoker.do(
				this.Work, this.Work.GetInstitutionWatermark, this.item
			).then(
				function (dataUrl) {
					loc.watermarkImage = dataUrl;
				}
			);
		},
		handleImage(e) {
			const selectedImage = e.target.files[0];
			this.extension = h.extractFileExtension(selectedImage.name);
			this.createBase64Image(selectedImage);
		},
		createBase64Image(fileObject) {
			const reader = new FileReader();
			reader.onload = (e) => {
				this.watermarkImage = e.target.result;
				this.imageHasChanged = true;
			};
			reader.readAsDataURL(fileObject);
		},
		save() {
			if (this.item.Caption === null || this.item.Caption.trim() === '') {
				alert('Debe indicar un nombre.');
				return;
			}
			if (this.item.Country === null || this.item.Country.trim() === '') {
				alert('Debe indicar el país.');
				return;
			}
			var loc = this;
			this.$refs.invoker.do(
				this.Work, this.Work.UpdateInstitution, this.item, this.container, this.imageHasChanged? this.watermarkImage: null
			).then(
				function () {
					loc.openEditableInstitution = false;
					loc.$emit('onSelected', loc.container.Institution);
					if (loc.closeParentCallback !== null) {
						loc.closeParentCallback();
					}
				}
			);
		},
		clear() {
			this.item.Watermark = null;
			this.watermarkImage = null;
			this.imageHasChanged = true;
		}
	},
 	props: {
		container: Object
	},
	components: {
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
/*.form-wrapper {
  margin: 20px;
}

.md-card .md-title {
  margin-top: 0;
  font-size: 18px;
  letter-spacing: 0;
  line-height: 18px;
}

.md-card-header {
  padding: 10px;
}*/

.md-field {
  margin: 12px 0 30px !important;
}

.md-button-mini{
  width: 30px;
  min-width: 30px;
  height: 30px;
  margin: 20px 2px;
}

.imagen-preview {
	min-height: unset ! important;
	padding: 6px !important;
  width: 80%;
  margin-top: 20px;
}

.file-select > input[type="file"] {
  display: none;
}

.label-primary-color{
	font-size: 16px;
	color: black;
	margin-top: 30px;
}
</style>
