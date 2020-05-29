<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-100">
			Indique el tipo de indicador que desea crear.
		</div>
		<div class="md-layout-item-separation"></div>
		<div class="md-layout-item md-size-100">
			<mp-large-button @click="distanceClick" :toggled="type == 'distance'" text="Distancia" ico="fas fa-ruler" />
			<mp-large-button @click="areaClick" :toggled="type == 'area'" text="Contenido" ico="fas fa-draw-polygon" />
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
			// this.$emit('distanceClick', e);
		},
		areaClick(e) {
			this.type = 'area';
			e.preventDefault();
			// this.$emit('areaClick', e);
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

