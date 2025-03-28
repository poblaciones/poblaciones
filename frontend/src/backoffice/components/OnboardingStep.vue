<template>
	<div>
		<invoker ref="invoker"></invoker>
		<div class="md-layout md-gutter" v-if="step.Enabled">
			<div class="md-layout-item md-size-100" style="margin-top: -15px; margin-bottom: 12px">
				<md-button class="md-icon-button" @click="clickLeft"
									 :class="(step.ImageAlignment == 'L' ? 'md-raised' : '')" title="Alinear imagen a la izquierda">
					<md-icon>format_align_right</md-icon>
					<i class="md-icon md-icon-font md-theme-default" style="
									position: absolute;
									left: 0;
									background-color: white;
									zoom: .6;
									top: 8px;
							">crop_din</i>
				</md-button>
				<md-button class="md-icon-button" @click="clickCentered"
									 :class="(step.ImageAlignment == 'C' ? 'md-raised' : '')" title="Alinear imagen abajo">
					<md-icon>format_align_justify</md-icon>
					<i class="md-icon md-icon-font md-theme-default" style="
									position: absolute;
									left: 8px;
									background-color: white;
									zoom: .6;
									top: 15px;
							">crop_din</i>
				</md-button>
				<md-button class="md-icon-button" @click="clickRight"
									 :class="(step.ImageAlignment == 'R' ? 'md-raised' : '')" title="Alinear imagen a la derecha">
					<md-icon>format_align_left</md-icon>
					<i class="md-icon md-icon-font md-theme-default" style="
						position: absolute;
						right: 0;
						background-color: white;
						zoom: .6;
						top: 8px;
				">crop_din</i>
				</md-button>
			</div>
			<div class="md-layout-item md-size-80">
				<mp-text :canEdit="Work.CanEdit()" label="Título" :maxlength="50"
								 :helper="'Encabezado del asistente en el ' + stepDefinition.Label.toLowerCase() + '. Ej. Indicadores sanitarios de Canelones, 2010.'"
								 :required="true" @update="Update"
								 v-model="step.Caption" />
			</div>
		</div>
		<div class="md-layout md-gutter" v-if="step.ImageAlignment != 'C'">
			<div class="md-layout-item md-size-30" v-if="step.ImageAlignment == 'L'">
				<mp-image-upload label="" :previewImage="previewImage"
												 v-model="imageToSend" :canEdit="stepEditable"
												 :maxWidth="200"
												 :maxHeight="200"
												 :minWidth="150"
												 class="uploader"
												 @clear="clearImage"
												 @changed="Update"
												 :helper="imageHelper" />
			</div>
			<div class="md-layout-item md-size-70">
				<mp-text :canEdit="stepEditable" :formatted="true" style="margin-top: -30px"
								 label=""
								 :maxlength="500" :multiline="true"
								 :rows="20"
								 :helper="stepDefinition.Helper" @update="Update"
								 v-model="step.Content" />
			</div>
			<div class="md-layout-item md-size-30" v-if="step.ImageAlignment == 'R'">
				<mp-image-upload label="" :previewImage="previewImage"
												 v-model="imageToSend" :canEdit="stepEditable"
												 :maxWidth="200"
												 :maxHeight="200"
												 :minWidth="150"
												 class="uploader"
												 @clear="clearImage"
												 @changed="Update"
												 :helper="imageHelper" />
			</div>
			<!--div class="md-layout-item md-size-30">
				<md-switch class="md-primary" v-model="circleImage" @change="updateSettings" :disabled="!stepEditable">
					Imagen circular.
				</md-switch>
			</div-->
		</div>
		<div class="md-layout md-gutter" v-else>
			<div class="md-layout-item md-size-80">
				<mp-text :canEdit="stepEditable" :formatted="true" style="margin-top: -30px"
								 label=""
								 :maxlength="500" :multiline="true"
								 :rows="10"
								 :helper="stepDefinition.Helper" @update="Update"
								 v-model="step.Content" />
			</div>
			<div class="md-layout-item md-size-75">
				<mp-image-upload label="" :previewImage="previewImage"
												 v-model="imageToSend" :canEdit="stepEditable"
												 :maxWidth="200"
												 :maxHeight="200"
												 :minWidth="150"
												 class="uploader"
												 @clear="clearImage"
												 @changed="Update"
												 :helper="imageHelper" />
			</div>
		</div>
		<div class="md-layout-item md-size-100" v-if="step.Content == '' && !step.Image">
			<div class="md-helper-text helper" style="margin-top: 8px">
				* El {{ stepDefinition.Label.toLowerCase() }} no posee ni una imagen ni texto en su contenido por lo que no será utilizado.
			</div>
		</div>
	</div>
	<!--div class="md-layout md-gutter">
				 <div class="md-layout-item md-size-100">
					 <md-switch class="md-primary" v-model="step.Enabled" @change="Update" :disabled="!Work.CanEdit()">
						 {{
	(this.step.Enabled ? 'Paso activo. Si lo desactiva, el paso no será parte del asistente.'
									 : 'Paso desactivado. Si lo activa, el paso volverá a ser parte del asistente.')
						 }}
					 </md-switch>
				 </div>
			 </div-->
</template>
<script>
export default {
	name: 'onboardingStep',
	components: {
		},
		props: {
			step: Object,
			stepDefinition: Object,
		},
		mounted() {
			var loc = this;
			setTimeout(() => {
				if (loc.step.Image) {
					loc.getStepImage();
				}
			}, 250);
	},
	data() {
		return {
			previewImage: '',
			imageToSend: null,
			imageHelper: 'Imagen para utilizar (altura máxima: 250px).'
			};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		stepEditable() {
			return this.Work.CanEdit() && this.step.Enabled;
		}
	},
	methods: {
		getStepImage() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo imagen',
				this.Work, this.Work.GetStepImage, this.step.Order
			).then(
				function (dataUrl) {
					loc.previewImage = dataUrl;
				}
			);
		},
		clearImage() {
			this.step.Image = null;
			this.Update();
		},
		clickLeft() {
			this.step.ImageAlignment = "L";
			this.updateSettings();
		},
		clickCentered() {
			this.step.ImageAlignment = "C";
			this.updateSettings();
		},
		clickRight() {
			this.step.ImageAlignment = "R";
			this.updateSettings();
		},
		updateSettings() {
			this.Update();
		},
		Update() {
			var loc = this;
			this.$refs.invoker.doSave(this.Work, this.Work.UpdateOnboardingStep, this.step, this.imageToSend).then(
				function (data) {
					loc.step.Image = data.Image;
					loc.imageToSend = null;
					loc.getStepImage();
				});
		}
	}
};
</script>

<style rel="stylesheet/scss">

	.uploader {
		border: 1px solid rgb(235, 235, 235);
				padding: 12px;

								height: 100%;
	}

.ck-content p {
		font-size: 16px;
		margin-bottom: 1.2em;
		text-align: left;
		line-height: 1.4em;
	}

</style>
