<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-25" style="text-align: center; ">
			<div class="md-card md-raised" style="width: 120px; height: 150px; padding-top: 60px;">
				<md-icon style="font-size: 80px!important;">
					functions
				</md-icon>
			</div>
		</div>
		<div class="md-layout-item md-size-70">
			<p>
				El asistente de conteo permite estimar la cantidad de recursos o grupos de personas alrededor
				de los elementos del dataset.
				Sirve para clasificar por medio de criterios tales como:
			</p>
			<ul>
				<li>¿Cuántas personas viven en los polígonos del dataset?</li>
				<li>¿Qué incidencia de hogares con NBI hay a 5km de los establecimientos?</li>
				<li>¿Cerca de qué centros de salud (contenidos en el dataset) hay mayor presencia de la población objetivo?</li>
			</ul>
			<p>
				El elemento a contabilizar puede ser definido por cualquier indicador existente en Poblaciones,
				tanto de datos públicos como de las cartografías de usuario.
			</p>
		</div>
	</div>
</template>

<script>

export default {
	// Step 1
	name: 'StepWelcomeArea',
	props: {
		newMetric: {
			type: Object,
			default: function () {
				return {};
			},
		},
	},
	methods: {
		validate() {
			return true;
		}
	},
};
</script>

<style scoped>
</style>

