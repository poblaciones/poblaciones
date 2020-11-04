<template>
	<md-dialog :md-active.sync="openEditableInstitution" style="min-height: 520px">
		<md-dialog-title>
			Institución
		</md-dialog-title>
		<md-dialog-content v-if="item">
			<invoker ref="invoker"></invoker>

			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Nombre de la institución" ref="datasetInput"
									helper="Indique el nombre completo de la institución. Ej. Instituto de Estadística Nacional."
									:maxlength="200" v-model="item.Caption" />
				</div>
				<div class="md-layout-item md-size-55 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Correo electrónico" helper="Dirección de correo electrónico institucional."
									:maxlength="50" v-model="item.Email" />
				</div>
				<div class="md-layout-item md-size-45 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Teléfono" helper="Incluir códigos de área y prefijos."
									:maxlength="50" v-model="item.Phone" />
				</div>
				<div class="md-layout-item md-size-55 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="Dirección postal" helper="Ej. Carreli 1720 (2321), Montevideo."
									:maxlength="200" v-model="item.Address" />
				</div>
				<div class="md-layout-item md-size-45 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
									label="País" helper="Ej. Uruguay."
									:maxlength="50" v-model="item.Country" />
				</div>
				<div class="md-layout-item md-size-55 md-small-size-100">
					<mp-simple-text :canEdit="Work.CanEdit()" @enter="save"
													label="Sitio web de la institución" helper="Ej. https://vedol.gov/."
													:maxlength="255" v-model="item.Web" />
					<div>
						<div class="mp-label">Color primario</div>
						<mp-color-picker :canEdit="Work.CanEdit()" :ommitHexaSign="true" v-model="currentColor" />
						<div class="md-helper-text helper">Fondo a utilizar en los marcos superiores de las cartografías de la institución.</div>
					</div>
				</div>
				<div class="md-layout-item md-size-45 md-small-size-100">
					<mp-image-upload label="Marca de agua" :previewImage="watermarkPreviewImage"
													 v-model="imageToSend" @clear="clearImage"
													 helper="Imagen para utilizar como marca de agua sobre el mapa (altura recomendada: 240px)." />
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
	import f from '@/backoffice/classes/Formatter';


	export default {
	name: 'InstitutionPopup',
	data() {
		return {
			item: null,
			defaultColor: '00A0D2',
			closeParentCallback: null,
			openEditableInstitution: false,
			watermarkPreviewImage: null,
			imageToSend: null,
			currentColor: null,
			imageHasChanged: false
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
			this.item = f.clone(item);
			this.currentColor = item.PrimaryColor;
			this.watermarkPreviewImage = null;
			if (!this.currentColor) {
				this.currentColor = this.defaultColor;
			}
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
					loc.watermarkPreviewImage = dataUrl;
				}
			);
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
			if (this.currentColor === this.defaultColor) {
				this.item.PrimaryColor = null;
			} else {
				this.item.PrimaryColor = this.currentColor;
			}
			this.$refs.invoker.do(
				this.Work, this.Work.UpdateInstitution, this.item, this.container, this.imageToSend
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
		clearImage() {
			this.item.Watermark = null;
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

.md-field {
  margin: 12px 0 30px !important;
}

.label-primary-color{
	font-size: 16px;
	color: black;
	margin-top: 30px;
}
</style>
