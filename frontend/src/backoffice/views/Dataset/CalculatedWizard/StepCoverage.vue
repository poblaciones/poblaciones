<template>
	<div v-if="newMetric.SelectedLevel">
		<div class="md-layout">
			<div class="md-layout-item md-size-100">
				<div>Establezca los criterios de inclusión para el contenido en las áreas:</div>
			</div>
			<div class="md-layout-item md-size-100">
				<md-radio v-if="newMetric.SelectedLevel.Dataset.Type != 'L'" class="md-primary" :value="false" v-model="newMetric.Area.IsInclusionPoint">Por polígono del elemento</md-radio>
			</div>
			<div class="md-layout-item md-size-100" style="display:flex">
				<md-radio class="md-primary" :value="true" v-model="newMetric.Area.IsInclusionPoint">
				Por distancia desde el centroide:
				</md-radio>
				<mp-simple-text style="padding-bottom: 8px; margin-top: -12px; width: 45px;"
								class="md-size-10" :disabled="!newMetric.Area.IsInclusionPoint" preffix="km"
												type="number" v-model="newMetric.Area.InclusionDistance"></mp-simple-text>
				<div style="padding-top: 15px; padding-left: 3px; padding-bottom: 30px;">Kms.</div>
			</div>
		</div>
		<template v-if="newMetric.SelectedLevel.Dataset.Type != 'L'">
			<div class="md-layout-item md-size-100">
				Criterios de inclusión de los objetivos:
			</div>
			<div class="md-layout-item md-size-100">
				<div style="display: flex;">
					<md-radio class="md-primary" :value="true" v-model="newMetric.IsInclussionFull">Todo el elemento debe estar dentro</md-radio>
					<md-radio class="md-primary" :value="false" v-model="newMetric.IsInclussionFull">Solamente el centroide debe estar dentro</md-radio>
				</div>
			</div>
		</template>
	</div>
</template>

<script>
import str from '@/common/js/str';

export default {
	// Step 3 para Distance
	name: 'stepCoverage',
	props: {
		newMetric: {
			type: Object,
			default: function() {
				return {};
			},
		},
	},
	methods: {
		validate() {
			if (this.newMetric.Area.IsInclusionPoint
				&& str.IsIntegerGreaterThan0(this.newMetric.Area.InclusionDistance) == false) {
				alert("Debe ingresar la distancia máxima en kilómetros.");
				return false;
			}
			return true;
		}
	},
	watch: {
		"newMetric.Area.InclusionDistance"() {
			if(this.newMetric.Area.InclusionDistance != null
				&& Number(this.newMetric.Area.InclusionDistance) < 0) {
				this.newMetric.Area.InclusionDistance = 0;
			}
		},
	},
};
</script>

<style scoped>
</style>

