<template>
	<div>
		<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>

		<div>Guardar:</div>

		<md-switch class="md-primary" v-model="newMetric.OutputArea.HasAdditionValue">Valor (suma)</md-switch>
		<md-switch class="md-primary" v-model="newMetric.OutputArea.HasMaxValue">Valor (máximo)</md-switch>
		<md-switch class="md-primary" v-model="newMetric.OutputArea.HasCount">Conteo</md-switch>
		<md-switch class="md-primary" v-model="newMetric.OutputArea.HasMinValue">Valor (mínimo)</md-switch>
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

