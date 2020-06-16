<template>
	<div v-if="Dataset && Dataset.Columns">
		<invoker ref="invoker"></invoker>
		<div class="dParagrah">
			Indique, si corresponde, una variable para reconocer la descripción de los elementos del dataset o imágenes (urls a las imágenes) de los mismos.
		</div>
		<div class='md-layout md-gutter'>
			<div class='md-layout-item md-size-45 md-small-size-90'>
				<mp-select label='Descripción' :allowNull='true'
									 @selected='Update' :canEdit='canEdit'
									 helper='Variable con descripción. Ej. Nombre de la escuela. '
									 :list='Dataset.Columns' v-model='Dataset.properties.CaptionColumn'
									 :render="formatColumn" />
			</div>
			<div class='md-layout-item md-size-10 md-small-size-10'>
			</div>
			<div class='md-layout-item md-size-40 md-small-size-90'>
				<mp-select label='Imágenes' :allowNull='true'
									 @selected='Update' :canEdit='canEdit'
									 helper='Variable con ruta hacia imágenes. Ej. Foto de la escuela. '
									 :list='Dataset.Columns' v-model='Dataset.properties.ImagesColumn'
									 :render="formatColumn" />
			</div>
		</div>
			<div v-if="Dataset && Dataset.Columns">
				<invoker ref="invoker"></invoker>
				<div class="dParagrah" style="padding-bottom: 0px; padding-top: 20px">
					Mostrar panel con información al hacer click en elementos del mapa.
				</div>
				<div class='md-layout'>
					<div class='md-layout-item md-size-50 md-small-size-100'>
						<md-switch v-model="Dataset.properties.ShowInfo" :disabled="!canEdit" class="md-primary" @change="Update">
							{{ infoEnabledStatus }}
						</md-switch>
					</div>
				</div>
				<div v-if="Dataset.properties.Type == 'L'">
					<div class="dParagrah" style="padding-top: 20px">
						Indique opcionalmente un ícono para los elementos del dataset.
					</div>
					<div class='md-layout'>
						<div class='md-layout-item md-size-100 md-size-small-100'>
							<div class='mp-label'>
								Ícono
							</div>
							<div class='currentIcon'>
								<i v-if='Dataset.properties.Symbol' :class="Dataset.properties.Symbol"></i>
								<span v-else style="font-size: 14px;">[Predeterminado]</span>
								<template v-if="canEdit">
									<md-button @click="showPicker" class="md-raised" style="margin-top: -6px;">
										Seleccionar
										<md-icon>edit</md-icon>
									</md-button>
									<mp-icon-font-picker ref="iconPicker" v-model="Dataset.properties.Symbol" searchBox="Buscar..." v-on:selectIcon="iconSelected"></mp-icon-font-picker>
								</template>
							</div>
						</div>
						<div class='md-layout-item md-size-100 md-size-small-100'>
							<md-switch v-model="Dataset.properties.ScaleSymbol" :disabled="!canEdit" class="md-primary" @change="Update">
								Redimensionar el ícono al cambiar el zoom.
							</md-switch>
						</div>

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
      this.$refs.invoker.do(this.Dataset, this.Dataset.Update);
		}
	}
};
</script>


<style rel='stylesheet/scss' lang='scss' scoped>
.currentIcon {
	padding: 9px 0px 9px 6px;
  border-radius: 3px;
  font-size: 28px;
  color: #777777!important;
}
</style>

