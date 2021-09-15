<template>
	<div class="md-layout" v-if="newMetric.SelectedLevel && newMetric.SelectedVariable">
		<div class="md-layout-item md-size-100 mp-label">
			Variables a crear como resultado del conteo
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding" v-if="!newMetric.SelectedVariable.IsSimpleCount">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasAdditionValue">Valor (suma)</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding" v-if="!newMetric.SelectedVariable.IsSimpleCount">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasMaxValue">Valor (máximo)</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding" v-if="!newMetric.SelectedVariable.IsSimpleCount">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasMinValue">Valor (mínimo)</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100 leftpadding">
			<md-switch class="md-primary" v-model="newMetric.OutputArea.HasCount" :disabled="newMetric.SelectedVariable.IsSimpleCount">Conteo</md-switch>
		</div>

		<div class="md-layout-item md-size-100 md-layout-item-separated mp-label">
			Criterios de inclusión
		</div>
		<div class="md-layout-item md-size-45" v-if="Dataset.properties.Type != 'L'">
			<md-radio class="md-primary" :value="false" v-model="newMetric.Area.IsInclusionPoint">Por polígono del elemento</md-radio>
		</div>
		<div class="md-layout-item md-size-55" style="display:flex">
			<md-radio class="md-primary" :value="true" v-model="newMetric.Area.IsInclusionPoint"
								v-if="Dataset.properties.Type != 'L'">
				Por distancia desde el centroide:
			</md-radio>
			<div v-else style="padding-top: 15px; padding-right: 15px;" class="leftpadding">
				Distancia máxima:
			</div>
			<mp-simple-text style="padding-bottom: 8px; margin-top: -12px; width: 45px;"
											class="md-size-10" :disabled="!newMetric.Area.IsInclusionPoint" preffix="km"
											type="number" v-model="newMetric.Area.InclusionDistance"></mp-simple-text>
			<div style="padding-top: 15px; padding-left: 3px; padding-bottom: 30px;">Kms.</div>
		</div>

		<template v-if="newMetric.SelectedLevel.Dataset.Type != 'L'">
			<div class="md-layout-item md-size-100 mp-label">
				Criterios de inclusión de los objetivos
			</div>
			<div class="md-layout-item md-size-45 md-small-size-100">
				<md-radio class="md-primary" :value="true" v-model="newMetric.Area.IsInclussionFull">Todo el elemento debe estar dentro</md-radio>
			</div>
			<div class="md-layout-item md-size-55 md-small-size-100">
				<md-radio class="md-primary" :value="false" v-model="newMetric.Area.IsInclussionFull">Solamente el centroide debe estar dentro</md-radio>
			</div>
		</template>
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
			if (this.newMetric.Area.IsInclusionPoint
				&& str.IsIntegerGreaterThan0(this.newMetric.Area.InclusionDistance) == false) {
				alert("Debe ingresar la distancia máxima en kilómetros.");
				return false;
			}
			if (!this.newMetric.SelectedVariable.IsSimpleCount) {
				if (!this.newMetric.OutputArea.HasMaxValue &&
					!this.newMetric.OutputArea.HasMinValue &&
					!this.newMetric.OutputArea.HasCount &&
					!this.newMetric.OutputArea.HasAdditionValue) {
					alert("Debe elegir algún valor para guardar.");
					return false;
				}
			}
			return true;
		}
	},
	watch: {
		"newMetric.Area.InclusionDistance"() {
			if (this.newMetric.Area.InclusionDistance != null
				&& Number(this.newMetric.Area.InclusionDistance) < 0) {
				this.newMetric.Area.InclusionDistance = 0;
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

