<template>
	<div class="md-layout" v-if="newMetric.SelectedLevel && newMetric.SelectedVariable">
		<div class="md-layout-item md-size-100 mp-label">
			Variables a crear como resultado del conteo
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding" v-if="!newMetric.SelectedVariable.IsSimpleCount">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasSumValue">Valor (suma)</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding" v-if="!newMetric.SelectedVariable.IsSimpleCount">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasMinValue">Valor (mínimo)</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding" v-if="!newMetric.SelectedVariable.IsSimpleCount">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasMaxValue">Valor (máximo)</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasCount" :disabled="newMetric.SelectedVariable.IsSimpleCount">Conteo</md-switch>
		</div>
		<div class="md-layout-item md-size-100 md-layout-item-separated mp-label">
			Criterios de inclusión
		</div>
		<div class="md-layout-item md-size-100" style="display:flex">
			<md-radio class="md-primary" :value="true" v-model="newMetric.OutputArea.IsInclusionPoint"
							 style="margin-left: 10px;"
							v-if="Dataset.properties.Type != 'L'">
				Distancia desde el centroide:
			</md-radio>
			<div v-else style="padding-top: 15px; padding-right: 15px;" class="leftpadding">
				Distancia máxima:
			</div>
			<mp-simple-text style="padding-bottom: 8px; margin-top: -12px; width: 45px;"
											class="md-size-10" :disabled="!newMetric.OutputArea.IsInclusionPoint" preffix="km"
											type="number" v-model="newMetric.OutputArea.InclusionDistance"></mp-simple-text>
			<div style="padding-top: 15px; padding-left: 3px; padding-bottom: 30px;">Kms.</div>
		</div>
		<div class="md-layout-item md-size-100" v-if="Dataset.properties.Type != 'L'"
				 style="margin-top: -25px">
			<md-radio class="md-primary" :value="false" style="margin-left: 10px;"
						 v-model="newMetric.OutputArea.IsInclusionPoint">Polígono del elemento</md-radio>
		</div>
	</div>
</template>

<script>
import str from '@/common/framework/str';

export default {
	//Step 3 para area
	name: 'stepAreaOutput',
	props: {
		newMetric: {
			type: Object,
			default: function() {
				return {};
			},
		},
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		Dataset() {
			return window.Context.CurrentDataset;
		},
	},
	methods: {
		validate() {
			const MAX_VALID_DISTANCE = 500;

			if (this.newMetric.OutputArea.IsInclusionPoint) {
				if (str.IsNumberGreaterThan0(this.newMetric.OutputArea.InclusionDistance) == false) {
					alert("Debe ingresar la distancia máxima en kilómetros.");
					return false;
				}
				if (str.IsNumberGreaterThan(this.newMetric.OutputArea.InclusionDistance, MAX_VALID_DISTANCE)) {
					alert("La distancia no puede ser mayor a " + MAX_VALID_DISTANCE + " km.");
					return false;
				}
				this.newMetric.OutputArea.InclusionDistance = Number(this.newMetric.OutputArea.InclusionDistance);
			}
			if (!this.newMetric.SelectedVariable.IsSimpleCount) {
				if (!this.newMetric.OutputArea.HasMaxValue &&
					!this.newMetric.OutputArea.HasMinValue &&
					!this.newMetric.OutputArea.HasCount &&
					!this.newMetric.OutputArea.HasSumValue) {
					alert("Debe elegir algún valor para guardar.");
					return false;
				}
			}
			return true;
		}
	},
	watch: {
		"newMetric.OutputArea.InclusionDistance"() {
			if (this.newMetric.OutputArea.InclusionDistance != null
				&& Number(this.newMetric.OutputArea.InclusionDistance) < 0) {
				this.newMetric.OutputArea.InclusionDistance = 0;
			}
		},
	},
};
</script>

<style scoped>

	.leftpadding {
		padding-left: 10px;
	}
</style>

