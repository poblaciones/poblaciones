<template>
	<div>
		<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>

		<div>Guardar:</div>

		<md-switch class="md-primary" v-model="newMetric.Output.HasAdditionValue">Valor (suma)</md-switch>
		<md-switch class="md-primary" v-model="newMetric.Output.HasMaxValue">Valor (máximo)</md-switch>
		<md-switch class="md-primary" v-model="newMetric.Output.HasCount">Conteo</md-switch>
		<!-- <md&#45;switch v&#45;if="newMetric.SelectedVariable.HasTotals" class="md&#45;primary" v&#45;model="newMetric.Output.HasNormalizationValue">Valor de normalización</md&#45;switch> -->
		<md-switch class="md-primary" v-model="newMetric.Output.HasMinValue">Valor (mínimo)</md-switch>

		<!-- <div>Limitar coincidencias:</div> -->
		<!-- <md&#45;switch class="md&#45;primary" v&#45;model="newMetric.Output.InSameProvince">Coincidencias en misma provincia</md&#45;switch> -->
	</div>
</template>

<script>

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
};
</script>

<style scoped>
</style>

