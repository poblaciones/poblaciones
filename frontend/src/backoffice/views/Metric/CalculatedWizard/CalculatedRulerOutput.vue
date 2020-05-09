<template>
	<div>
		<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>

		<div>Guardar por cada coincidencia:</div>

		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasDescription">Descripción</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasDistance">Distancia (km)</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasValue">Valor</md-switch>
		<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasCoords">Coordenada</md-switch>
		<md-switch v-if="newMetric.SelectedVariable.HasTotals" class="md-primary" :disabled="!canEdit" v-model="newMetric.HasNormalizationValue">Valor de normalización</md-switch>

		<div>Limitar coincidencias:</div>
		<div class="md-layout">
			<div class="md-layout-item md-size-40 md-small-size-100">
				<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.HasMaxDistance">Distancia máxima:</md-switch>
			</div>
			<div class="md-layout-item md-size-40 md-small-size-100">
				<mp-simple-text :disabled="!canEdit || !newMetric.HasMaxDistance"
												:maxlength="3" type="number" v-model="newMetric.MaxDistance"></mp-simple-text>
				Kms.
			</div>
			<div class="md-layout-item md-size-40 md-small-size-100">
				<md-switch class="md-primary" :disabled="!canEdit" v-model="newMetric.InSameProvince">Coincidencias en misma provincia</md-switch>
			</div>
		</div>
	</div>
</template>

<script>

export default {
	//Step 4 para Ruler
	name: 'calculatedRulerOutput',
	props: {
		newMetric: {
			type: Object,
			default: function() {
				return {};
			},
		},
		canEdit: Boolean,
	},
	computed: {
		// "newMetric.MaxDistance"() {
		// 	if(this.newMetric.MaxDistance != null
		// 		&& Number(this.newMetric.MaxDistance) < 0) {
		// 		this.newMetric.MaxDistance = 0;
		// 	}
		// },
	},
};
</script>

<style scoped>
</style>

