<template>
	<div>
		<div>Indique qué valores desea guardar en el dataset durante el cálculo del indicador:</div>

		<div>Guardar por cada coincidencia:</div>

		<md-switch class="md-primary" v-show="hasDescription" v-model="newMetric.Output.HasDescription">Descripción</md-switch>
		<md-switch class="md-primary" v-model="newMetric.Output.HasValue">Valor</md-switch>
		<md-switch class="md-primary" v-model="newMetric.Output.HasCoords">Coordenada</md-switch>

		<div>Limitar coincidencias:</div>
		<div class="md-layout">
			<div class="md-layout-item md-size-40 md-small-size-100" style="display: inline-flex;">
				<md-switch class="md-primary" v-model="newMetric.Output.HasMaxDistance">
				</md-switch>
				<mp-simple-text type="number" label="Distancia máxima (kilómetros)" :disabled="!newMetric.Output.HasMaxDistance"
												v-model="newMetric.Output.MaxDistance"></mp-simple-text>

			</div>
		</div>
	</div>
</template>

<script>
import str from '@/common/js/str';

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
	},
	computed: {
		hasDescription() {
			if(this.newMetric.SelectedLevel != null) {
				return this.newMetric.SelectedLevel.HasDescriptions;
			}
			return false;
		},
	},
	methods: {
		validate() {
			const MAX_VALID_DISTANCE = 5500;

			if (this.newMetric.Output.HasMaxDistance) {
				if(str.IsIntegerGreaterThan0(this.newMetric.Output.MaxDistance) == false) {
					alert("Debe ingresar la distancia máxima en kms.");
					return false;
				}
				if(str.IsIntegerGreaterThan(this.newMetric.Output.MaxDistance, MAX_VALID_DISTANCE)) {
					alert("La distancia debe ser menor a " + MAX_VALID_DISTANCE + " kms.");
					return false;
				}
			}
			return true;
		}
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

