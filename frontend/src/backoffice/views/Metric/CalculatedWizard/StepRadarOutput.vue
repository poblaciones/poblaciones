<template>
	<div>
		<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>

		<div>Guardar:</div>

		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasAdditionValue">Valor (suma)</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasMaxValue">Valor (máximo)</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasCount">Conteo</md-switch>
		<md-switch v-if="newMetric.SelectedVariable.HasTotals" class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasNormalizationValue">Valor de normalización</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasMinValue">Valor (mínimo)</md-switch>

		<div>Limitar coincidencias:</div>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.InSameProvince">Coincidencias en misma provincia</md-switch>
	</div>
</template>

<script>

export default {
	//Step 3 para Radar
	name: 'stepRadarOutput',
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

