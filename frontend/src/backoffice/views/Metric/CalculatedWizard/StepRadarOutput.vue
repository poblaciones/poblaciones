<template>
	<div>
		<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>

		<div>Guardar:</div>

		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasAdditionValue">Valor (suma)</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasMaxValue">Valor (máximo)</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasCount">Conteo</md-switch>
		<md-switch v-if="newMetric.SelectedVariable.HasTotals" class="md-primary" :disabled="!canEdit" v-model="newMetric.HasNormalizationValue">Valor de normalización</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasMinValue">Valor (mínimo)</md-switch>

		<div>Limitar coincidencias:</div>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.InSameProvince">Coincidencias en misma provincia</md-switch>
	</div>
</template>

<script>

export default {
	//Step 3 para Radar
	name: 'calculatedRadarOutput',
	props: {
		newMetric: {
			type: Object,
			default: function() {
				return {};
			},
		},
		canEdit: Boolean,
	},
};
</script>

<style scoped>
</style>

