<template>
	<div>
		<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>

		<div>Guardar por cada coincidencia:</div>

		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasDescription">Descripción</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasDistance">Distancia (km)</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasValue">Valor</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasCoords">Coordenada</md-switch>
		<!-- <md&#45;switch v&#45;if="newMetric.SelectedVariable.HasTotals" class="md&#45;primary" :disabled="!canEdit" v&#45;model="newMetric.Output.HasNormalizationValue">Valor de normalización</md&#45;switch> -->

		<div>Limitar coincidencias:</div>
		<div class="md-layout">
			<div class="md-layout-item md-size-40 md-small-size-100">
				<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.Output.HasMaxDistance">Distancia máxima:</md-switch>
			</div>
			<div class="md-layout-item md-size-40 md-small-size-100">
				<mp-simple-text :disabled="!canEdit || !newMetric.Output.HasMaxDistance"
					:maxlength="3" type="number" v-model="newMetric.Output.MaxDistance"></mp-simple-text>
				Kms.
			</div>
			<!-- <div class="md&#45;layout&#45;item md&#45;size&#45;40 md&#45;small&#45;size&#45;100"> -->
			<!-- 	<md&#45;switch class="md&#45;primary" :disabled="!canEdit" v&#45;model="newMetric.Output.InSameProvince">Coincidencias en misma provincia</md&#45;switch> -->
			<!-- </div> -->
		</div>
	</div>
</template>

<script>

export default {
	//Step 4 para distance
	name: 'stepDistanceOutput',
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
		"newMetric.Output.MaxDistance"() {
			if(this.newMetric.Output.MaxDistance != null
				&& Number(this.newMetric.Output.MaxDistance) < 0) {
				this.newMetric.Output.MaxDistance = 0;
			}
		},
	},
};
</script>

<style scoped>
</style>

