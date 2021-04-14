<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-100">
			Indique el tipo de búsqueda a realizar para completar el rastreo:
		</div>
		<div class="md-layout-item-separation"></div>
		<div class="md-layout-item md-size-100">
			<mp-large-button @click="distanceClick" :toggled="type == 'distance'" text="Encontrar el elemento más próximo" ico="fas fa-ruler" />
			<mp-large-button @click="areaClick" :toggled="type == 'area'" text="Sumarizar los elementos en un área" ico="fas fa-draw-polygon" />
		</div>
	</div>
</template>

<script>


export default {
	// Step 1
	name: 'stepType',
	data() {
		return {
			type: null,
		};
	},
	methods: {
		distanceClick(e) {
			this.type = 'distance';
			e.preventDefault();
			this.$emit('raiseNext', e);
		},
		areaClick(e) {
			this.type = 'area';
			e.preventDefault();
			this.$emit('raiseNext', e);
		},
		validate() {
			if (this.type === null) {
				alert('Debe seleccionar un tipo de indicador calculado.');
				return false;
			}
			return true;
		}
	},
};
</script>

<style scoped>
</style>

