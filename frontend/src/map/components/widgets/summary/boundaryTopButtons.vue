<template>
	<div>
		<div class="btn-group pull-right exp-hiddable-unset" style="clear:both; margin-top: 2px">
			<h5 class="title">
				<mp-close-button @click="clickQuitar" title="Quitar delimitación"
												 v-if="!boundary.IsLocked" class="exp-hiddable-block" />

				<mp-dropdown-menu :items="menuItems" @itemClick="dropdownSelected"
											 icon="fas fa-ellipsis-v" />
			</h5>
		</div>
	</div>
</template>

<script>
// Análogo reducido de metricDropdown.vue: mismas opciones salvo Rankings,
// Filtro (urbanidad), Mostrar valores y Zoom al indicador, que no aplican a
// boundary (pedido explícito).
export default {
	name: 'boundaryTopButtons',
	props: [
		'boundary',
	],
	methods: {
		clickCustomize() {
			window.Popups.BoundaryCustomize.show(this.boundary);
		},
		clickQuitar() {
			this.boundary.Remove();
		},
		toggleChart() {
			this.boundary.ShowChart = (this.boundary.ShowChart == 1 ? '0' : '1');
			window.SegMap.SaveRoute.UpdateRoute();
		},
		toggleDescriptions() {
			this.boundary.showDescriptions = !this.boundary.showDescriptions;
			this.boundary.UpdateMap();
		},
		clickDescargar() {
			window.Popups.BoundaryDownload.show(this.boundary);
		},
		clickFuente() {
			window.Popups.ClippingMetadata.show(this.boundary.SelectedVersion().Metadata, this.boundary.properties.Name);
		},
		dropdownSelected(item) {
			switch (item.key) {
				case 'SETTINGS':
					this.clickCustomize();
					break;
				case 'CHART':
					this.toggleChart();
					break;
				case 'DESCRIPTIONS':
					this.toggleDescriptions();
					break;
				case 'DOWNLOAD':
					this.clickDescargar();
					break;
				case 'SOURCE':
					this.clickFuente();
					break;
				case 'REMOVE':
					this.clickQuitar();
					break;
			}
		},
	},
	computed: {
		Use() {
			return window.Use;
		},
		menuItems() {
			var ret = [];
			ret.push({ label: 'Personalizar', key: 'SETTINGS', icon: 'fas fa-sliders-h' });
			if (this.boundary.useChart()) {
				ret.push({ 'separator': true });
				ret.push({
					label: (this.boundary.ShowChart == 1 ? 'Ocultar gráfico' : 'Mostrar gráfico'),
					key: 'CHART',
				});
			}
			ret.push({ 'separator': true });
			ret.push({
				label: (this.boundary.showDescriptions ? 'Ocultar descripciones' : 'Mostrar descripciones'),
				key: 'DESCRIPTIONS',
			});
			ret.push({ 'separator': true });
			ret.push({ label: 'Fuente', key: 'SOURCE' });
			ret.push({ label: 'Descargar', key: 'DOWNLOAD' });
			if (!this.boundary.IsLocked) {
				ret.push({ 'separator': true });
				ret.push({ label: 'Quitar', key: 'REMOVE' });
			}
			return ret;
		},
	},
};
</script>

<style scoped>
.vellipsis:after {
	content: '\2807';
	font-size: .8em;
}

.activeButton {
	opacity: .45;
}
</style>
