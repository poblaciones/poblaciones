<template>
	<div>
		<div>Establezca los criterios de inclusión para el contenido en las áreas:</div>

		<md-radio v-if="newMetric.SelectedLevel.Dataset.Type != 'L'" class="md-primary" :disabled="!canEdit" :value="false" v-model="newMetric.IsInclusionPoint">Por polígono del elemento</md-radio>
		<md-radio class="md-primary" :disabled="!canEdit" :value="true" v-model="newMetric.IsInclusionPoint">Por distancia desde el centroide / punto:</md-radio>
		<md-field class="md-size-10">
			<mp-simple-text class="md-size-10" :disabled="!canEdit || !newMetric.IsInclusionPoint" :maxlength="3" type="number" v-model="newMetric.InclusionDistance"></mp-simple-text>
			Kms.
		</md-field>

		<div v-if="newMetric.SelectedLevel.Dataset.Type != 'L'">Criterios de inclusión de los objetivos:
			<md-radio class="md-primary" :disabled="!canEdit" :value="true" v-model="newMetric.IsInclussionFull">Todo el elemento debe estar dentro</md-radio>
			<md-radio class="md-primary" :disabled="!canEdit" :value="false" v-model="newMetric.IsInclussionFull">Solamente el centroide debe estar dentro</md-radio>
		</div>
	</div>
</template>

<script>

export default {
	// Step 3 para ruler
	name: 'calculatedArea',
	props: {
		newMetric: {
			type: Object,
			default: function() {
				return {};
			},
		},
		canEdit: Boolean,
	},
	watch: {
		"newMetric.InclusionDistance"() {
			if(this.newMetric.InclusionDistance != null
				&& Number(this.newMetric.InclusionDistance) < 0) {
				this.newMetric.InclusionDistance = 0;
			}
		},
	},
};
</script>

<style scoped>
</style>

