<template>
	<div>
		<div>Indique el tipo de indicador que desea crear:</div>

		<mp-large-button @click="distanceClick" :toggled="type == 'distance'" text="Distancia" ico="fas fa-ruler" />
		<mp-large-button @click="areaClick" :toggled="type == 'area'" text="Contenido" ico="fas fa-draw-polygon" />
	</div>
</template>

<script>


export default {
	// Step 1
	name: 'stepType',
	data() {
		return {
			type: 'distance',
		};
	},
	methods: {
		distanceClick(e) {
			this.type = 'distance';
			e.preventDefault();
			// this.$emit('distanceClick', e);
		},
		areaClick(e) {
			this.type = 'area';
			e.preventDefault();
			// this.$emit('areaClick', e);
		},
	},
};
</script>

<style scoped>
</style>

