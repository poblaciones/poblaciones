<template>
	<div v-if="Dataset && Dataset.Columns">
		<invoker ref="invoker"></invoker>
		<div v-if="Dataset && Dataset.Columns">
			<div class='md-layout md-gutter'>
				<div class='md-layout-item md-size-100'>
					<invoker ref="invoker"></invoker>
					<md-card>
						<md-card-header class="largeText">
							Información adicional <md-icon class="rightIcon">article</md-icon>
						</md-card-header>
						<md-card-content>
							<div class='md-layout md-gutter'>
								<div class='md-layout-item md-size-50 md-small-size-100'>
									<mp-select label='Variable con la descripción de los elementos' :allowNull='true'
														 @selected='UpdateRegen' :canEdit='canEdit' placeholder="Seleccione la variable..."
														 helper='Ej. Nombre de la escuela. '
														 :list='Dataset.Columns' v-model='Dataset.properties.CaptionColumn'
														 :render="formatColumn" />
								</div>
								<div v-if="useTextures" class='md-layout-item md-size-50 md-small-size-100'>
									<mp-select label="Textura" :list="validTextures" :modelKey="true" :canEdit="canEdit"
														 v-model="Dataset.properties.TextureId" @selected="Update" />
								</div>

								<div class='md-layout-item md-size-50 md-small-size-100'>
									<mp-select label='Imágenes' :allowNull='true'
														 @selected='Update' :canEdit='canEdit'
														 helper='Especifique la variable con la dirección de las imágenes. Ej. https://wikicommons.org/jupiter.png'
														 :list='Dataset.Columns' v-model='Dataset.properties.ImagesColumn'
														 :render="formatColumn" />
								</div>

								<div class='md-layout-item md-size-50 md-small-size-100'>
									<div class="mp-label labelSeparator">
										Mostrar panel al hacer click en elementos del mapa
									</div>
									<div>
										<md-switch v-model="Dataset.properties.ShowInfo" :disabled="!canEdit" class="md-primary" @change="Update">
											{{ infoEnabledStatus }}
										</md-switch>
									</div>
								</div>
							</div>
						</md-card-content>
					</md-card>
				</div>
				<div class='md-layout-item md-size-100'>

					<md-card v-if="Dataset.properties.Type == 'L'">
						<md-card-header class="largeText">
							Opciones del marcador <md-icon class="rightIcon">room</md-icon>
						</md-card-header>
						<md-card-content>
							<div class='md-layout md-gutter'>
								<div class='md-layout-item md-size-50 md-size-small-100'>
									<div class="mp-label labelSeparator">Tamaño</div>
									<md-radio v-model="Dataset.properties.Marker.Size" :disabled="!canEdit" class="md-primary" @change="Update" value="S">
										<md-icon class="optSmall" title="Pequeño">room</md-icon>
									</md-radio>
									<md-radio v-model="Dataset.properties.Marker.Size" :disabled="!canEdit" class="md-primary" @change="Update" value="M">
										<md-icon class="optMedium" title="Mediano">room</md-icon>
									</md-radio>
									<md-radio v-model="Dataset.properties.Marker.Size" :disabled="!canEdit" class="md-primary" @change="Update" value="L">
										<md-icon class="optLarge" title="Grande">room</md-icon>
									</md-radio>
									<div style="margin-top: -15px;">
										<md-switch v-model="Dataset.properties.Marker.AutoScale" :disabled="!canEdit" class="md-primary" @change="Update">
											Ajustar tamaño al cambiar el zoom
										</md-switch>
									</div>
								</div>
								<div class='md-layout-item md-size-50 md-size-small-100'>
									<div class="mp-label labelSeparator">Marco</div>
									<md-radio v-model="Dataset.properties.Marker.Frame" :disabled="!canEdit" class="md-primary" @change="Update" value="P">Pin</md-radio>
									<md-radio v-model="Dataset.properties.Marker.Frame" :disabled="!canEdit" class="md-primary" @change="Update" value="C">Círculo</md-radio>
									<md-radio v-model="Dataset.properties.Marker.Frame" :disabled="!canEdit" class="md-primary" @change="Update" value="B">Cuadrado</md-radio>
								</div>
								<div class='md-layout-item md-size-50 md-size-small-100'>
									<div>
									<div class='mp-label labelSeparator'>Tipo de contenido</div>
									<md-radio v-model="Dataset.properties.Marker.Type" :disabled="!canEdit" class="md-primary" @change="Update" value="N">Ninguno</md-radio>
									<md-radio v-model="Dataset.properties.Marker.Type" :disabled="!canEdit" class="md-primary" @change="UpdateRegen" value="I">Ícono</md-radio>
									<md-radio v-model="Dataset.properties.Marker.Type" :disabled="!canEdit" class="md-primary" @change="UpdateRegen" value="T">Texto</md-radio>
									</div>
									<div>
										<div class="mp-label labelSeparator">Ubicación de la descripción</div>
										<md-radio v-model="Dataset.properties.Marker.DescriptionVerticalAlignment" :disabled="!canEdit" class="md-primary" @change="Update" value="B">Abajo</md-radio>
										<md-radio v-model="Dataset.properties.Marker.DescriptionVerticalAlignment" :disabled="!canEdit" class="md-primary" @change="Update" value="M">Superpuesto</md-radio>
										<md-radio v-model="Dataset.properties.Marker.DescriptionVerticalAlignment" :disabled="!canEdit" class="md-primary" @change="Update" value="T">Arriba</md-radio>
									</div>
								</div>
								<div class='md-layout-item md-size-50 md-size-small-100'>
									<div class='mp-label labelSeparator'>Contenido</div>
									<md-radio v-model="Dataset.properties.Marker.Source" :disabled="!canEdit || Dataset.properties.Marker.Type == 'N'" class="md-primary" @change="Update" value="F">Fijo</md-radio>
									<md-radio v-model="Dataset.properties.Marker.Source" :disabled="!canEdit || Dataset.properties.Marker.Type == 'N'" class="md-primary" @change="UpdateRegen" value="V">Variable</md-radio>
									<template v-if="Dataset.properties.Marker.Source == 'F'">
										<div class='currentIcon' v-if="Dataset.properties.Marker.Type == 'I'">
											<i v-if='Dataset.properties.Marker.Symbol' :class="Dataset.properties.Marker.Symbol"></i>
											<span v-else style="font-size: 14px;">[Ninguno]</span>
											<template v-if="canEdit">
												<md-button @click="showPicker" class="md-raised" style="margin-top: -6px;">
													Seleccionar
													<md-icon>edit</md-icon>
												</md-button>
												<mp-icon-font-picker ref="iconPicker" v-model="Dataset.properties.Marker.Symbol" searchBox="Buscar..." v-on:selectIcon="iconSelected"></mp-icon-font-picker>
											</template>
										</div>
										<div style="float: right" v-if="Dataset.properties.Marker.Type == 'I' && Dataset.properties.Marker.Source == 'F' && Dataset.properties.Marker.Symbol">
											{{ Dataset.properties.Marker.Symbol }}
										</div>

										<div class='currentIcon' v-if="Dataset.properties.Marker.Type == 'T' && Dataset.properties.Marker.Source == 'F'"
												 style="margin-top: -20px">
											<mp-text :canEdit="canEdit && Dataset.properties.Marker.Type != 'N'"
															 label="" :maxlength="4"
															 @update="Update" class="smaller"
															 v-model="Dataset.properties.Marker.Text" style="width: 100px;" />
										</div>
									</template>
									<div class='' v-else style="margin-top: -20px">
											<mp-select label='' :canEdit="canEdit && Dataset.properties.Marker.Type != 'N'"
															 v-model='Dataset.properties.Marker.ContentColumn'
															 list-key='Id' @selected="UpdateRegen"
															 :list='columnsForContent'
															 :render='formatColumn'
															 helper='Variable de la cual tomar el contenido' />
									</div>
									</div>
								</div>
						</md-card-content>
					</md-card>
				</div>
			</div>
		</div>
	</div>
</template>
<script>

	import f from '@/backoffice/classes/Formatter';
	import MpIconFontPicker from '@/backoffice/components/MpIconFontPicker';

	export default {
		name: 'identityTab',
		components: {
			MpIconFontPicker
		},
		computed: {
			Dataset() {
				return window.Context.CurrentDataset;
			},
			Work() {
				return window.Context.CurrentWork;
			},
			infoEnabledStatus() {
				return (this.Dataset.properties.ShowInfo ? 'Activado' : 'Desactivado');
			},
			canEdit() {
				if (this.Work) {
					return this.Work.CanEdit();
				} else {
					return false;
				}
			},
			useTextures() {
				return window.Context.Configuration.UseTextures;
			},
			columnsForContent() {
				if (this.Dataset.properties.Marker.Type === 'I') {
					return this.Dataset.GetTextColumns();
				} else {
					return this.Dataset.Columns;
				}
			},
			validTextures() {
				return [{ Id: 0, Caption: 'Ninguna' },
				{ Id: 3, Caption: 'Confederación Argentina (1873)' },
				{ Id: 4, Caption: 'Ferrocarriles en explotación (1925)' }];
			}
		},
		data() {
			return {

			};
		},
		methods: {
			formatColumn(column) {
				return f.formatColumn(column);
			},
			showPicker() {
				this.$refs.iconPicker.show();
			},
			iconSelected(selectedIcon) {
				this.Update();
			},
			Update() {
				if (this.Dataset.properties.TextureId === 0) {
					this.Dataset.properties.TextureId = null;
				}
				this.$refs.invoker.do(this.Dataset, this.Dataset.Update);
			},
			UpdateRegen() {
				if (this.Dataset.properties.TextureId === 0) {
					this.Dataset.properties.TextureId = null;
				}
				this.$refs.invoker.do(this.Dataset, this.Dataset.UpdateRegen);
			}
		}
	};
</script>

<style rel='stylesheet/scss' lang='scss' scoped>

	.currentIcon {
		padding: 9px 0px 9px 6px;
		border-radius: 3px;
		font-size: 28px;
		display: inline-block;
		color: #777777 !important;
	}

	.labelSeparator {
		margin-top: 16px;
		margin-bottom: -2px;
	}

	.rightIcon {
		margin-top: -4px;
		-webkit-text-fill-color: #c3c3c3;
	}

	.smaller {
		margin-bottom: -10px;
		overflow: hidden;
	}

	.optSmall {
		margin-left: -8px;
		margin-top: -3px;
	}

	.optMedium {
		font-size: 37px !important;
		margin-left: -4px;
		margin-top: -6px;
	}

	.optLarge {
		font-size: 50px !important;
		margin-top: -15px;
	}
</style>
