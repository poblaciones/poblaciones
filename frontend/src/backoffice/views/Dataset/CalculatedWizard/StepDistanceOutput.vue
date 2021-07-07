<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-100">
			Indique qué valores desea guardar como resultado de la búsqueda.
		</div>
		<div class="md-layout-item-separation"></div>
		<div class="md-layout-item md-size-100">
			Guardar:
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100" v-if="hasDescription" >
			<md-switch class="md-primary" v-model="newMetric.Output.HasDescription">Descripción</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100">
			<md-switch class="md-primary" v-model="newMetric.Output.HasValue">Valor</md-switch>
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100">
			<md-switch class="md-primary" v-model="newMetric.Output.HasCoords">Coordenadas</md-switch>
		</div>
		<div class="md-layout-item md-size-100 md-layout-item-separated">
			Limitar coincidencias:
		</div>
		<div class="md-layout-item md-size-30 md-small-size-100" style="display: inline-flex;">
			<md-switch class="md-primary" v-model="newMetric.Output.HasMaxDistance">
			</md-switch>
			<mp-simple-text type="number" label="Distancia máxima" suffix="km" :disabled="!newMetric.Output.HasMaxDistance"
											v-model="newMetric.Output.MaxDistance"></mp-simple-text>

		</div>
	</div>
</template>

<script>
import str from '@/common/framework/str';

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
			const MAX_VALID_DISTANCE = 500;

			if (this.newMetric.Output.HasMaxDistance) {
				if(str.IsIntegerGreaterThan0(this.newMetric.Output.MaxDistance) == false) {
					alert("Debe ingresar la distancia máxima en kilómetros.");
					return false;
				}
				if(str.IsIntegerGreaterThan(this.newMetric.Output.MaxDistance, MAX_VALID_DISTANCE)) {
					alert("La distancia no puede ser mayor a " + MAX_VALID_DISTANCE + " km.");
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

