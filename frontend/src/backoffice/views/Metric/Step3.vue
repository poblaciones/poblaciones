<template>
	<div>
		<div>
			<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>


			<div>Guardar por cada coincidencia:</div>

			<!-- <md&#45;switch class="md&#45;primary" :disabled="!canEdit" v&#45;model="Variable.Symbology.RainbowReverse" @change="reverseCustom"> -->
			<md-switch class="md-primary" v-model="newMetric.Description">Descripción</md-switch>
			<md-switch class="md-primary" v-model="newMetric.Distance">Distancia (km)</md-switch>
			<md-switch class="md-primary" v-model="newMetric.Value">Valor</md-switch>
			<md-switch class="md-primary" v-model="newMetric.Coords">Coordenada</md-switch>
			<md-switch v-if="true" class="md-primary" v-model="newMetric.NormalizationValue">Valor de normalización</md-switch>

			<div>Limitar coincidencias:</div>

			<md-switch class="md-primary" v-model="newMetric.MaxDistance">Distancia máxima
				<!-- <mp&#45;simple&#45;text :canEdit="newMetricVersionLevel.MetricVersion.Metric.CanEdit" -->
				<!-- 					label="Nombre" ref="metricInput" @enter="save" -->
				<!-- 					helper="Ej. Acceso a agua potable" -->
				<!-- 					:maxlength="75" v&#45;model="newMetricVersionLevel.MetricVersion.Metric.Caption"> -->
				<!-- </mp&#45;simple&#45;text> -->
				kms</md-switch>
			<md-switch class="md-primary" v-model="newMetric.SameProvince">Coincidencias en misma provincia</md-switch>
		</div>
	</div>
</template>

<script>

export default {
	name: 'step3',
	components: { },
	props: [
		'newMetric',
	],
	computed: { },
	mounted() { },
	methods: { },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>

