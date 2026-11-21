<template>
	<div>
		<md-dialog :md-active.sync="open" class="customizePopup mp-dialog-fixed-lg">
			<md-dialog-title>Personalizar</md-dialog-title>
			<md-dialog-content v-if="Work">
				<md-tabs md-dynamic-height>
					<md-tab md-label="Posición de inicio">
						<startup />
					</md-tab>
					<md-tab md-label="Indicadores predeterminados">
						<metrics section="default" />
					</md-tab>
					<md-tab md-label="Capas base predeterminadas">
						<basemap-layers />
					</md-tab>
					<md-tab md-label="Indicadores adicionales">
						<metrics section="extra" />
					</md-tab>
				</md-tabs>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button class="md-primary" @click="open = false">Listo</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Startup from '@/backoffice/views/Customize/Startup.vue';
import Metrics from '@/backoffice/views/Customize/Metrics.vue';
import BasemapLayers from '@/backoffice/views/Customize/BasemapLayers.vue';

export default {
	name: 'CustomizePopup',
	data() {
		return { open: false };
	},
	computed: {
		Work() { return window.Context.CurrentWork; }
	},
	methods: {
		show() { this.open = true; }
	},
	components: { Startup, Metrics, BasemapLayers }
};
</script>

<style rel="stylesheet/scss" lang="scss">
/* 40 % más que el tope global de 700 px, para que las pestañas entren en una línea. */
.md-dialog.customizePopup > .md-dialog-container {
	max-width: calc(min(980px, 95%)) !important;
}
.customizePopup .md-dialog-content {
	min-height: 360px;
	max-height: 70vh;
	overflow-y: auto;
}
/* El md-tab trae padding: 16px que aprieta las columnas;
   los md-card-content internos ya aportan su propio padding. */
.customizePopup .md-tab {
	padding: 0 !important;
}
/* Quita el doble marco: los md-card dentro del popup pierden sombra y borde,
   y el md-card-header (título del card) se oculta porque el label del tab
   ya cumple esa función. */
.customizePopup .md-card {
	box-shadow: none !important;
	border: none !important;
}
.customizePopup .md-card-header {
	display: none !important;
}
/* El switch trae un margin de 16px 16px 16px 0 que agranda cada fila de las tablas. */
.customizePopup .md-table .md-switch {
	margin: 0 !important;
}
/* Si una tabla no entra en el popup, el scroll lo tiene ella (con el encabezado fijo)
   y no el contenido completo. La altura se toma de la del contenido del popup (70vh),
   descontando todo lo que hay encima y debajo de la tabla: pestañas, texto explicativo
   (hasta tres líneas) y márgenes. Si el descuento es corto aparece un segundo scroll. */
.customizePopup .md-table .md-table-content {
	max-height: max(200px, calc(70vh - 270px));
	overflow-y: auto;
}
.customizePopup .md-table .md-table-head {
	position: sticky;
	top: 0;
	z-index: 2;
	background-color: #fff;
}
</style>
