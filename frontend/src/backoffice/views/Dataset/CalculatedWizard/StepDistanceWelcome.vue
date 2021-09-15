<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-25" style="    text-align: center; ">
			<div class="md-card md-raised" style="width: 120px; height: 150px; padding-top: 60px;">
				<md-icon style="font-size: 80px!important;">
					radar
				</md-icon>
			</div>
		</div>
		<div class="md-layout-item md-size-70">
			<p>
				El asistente de rastreo permite hacer cálculos de distancia entre los
				elementos del dataset y otros recursos o grupos de personas en el mapa.
				Sirve para clasificar por medio de criterios tales como:
			</p>
			<ul>
				<li>¿Cuál es la distancia a la escuela más próxima?</li>
				<li>¿Qué tan lejos estamos de un radio con al menos 20% de sus hogares con NBI?</li>
				<li>¿Hay comisarías cercanas?</li>
			</ul>
			<p>
				El elemento de rastreo puede ser definido por cualquier indicador existente en Poblaciones,
				tanto de datos públicos como de las cartografías de usuario.
			</p>
		</div>
	</div>
</template>

<script>


export default {
	// Step 1
		name: 'StepDistanceWelcome',
	props: {
		type: null,
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

