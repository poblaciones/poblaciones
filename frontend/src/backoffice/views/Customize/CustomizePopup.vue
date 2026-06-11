<template>
	<div>
		<md-dialog :md-active.sync="open" class="customizePopup">
			<md-dialog-title>Personalizar</md-dialog-title>
			<md-dialog-content v-if="Work">
				<md-tabs md-dynamic-height>
					<md-tab md-label="Posición de inicio">
						<startup />
					</md-tab>
					<md-tab md-label="Indicadores predeterminados">
						<metrics section="default" />
					</md-tab>
					<md-tab md-label="Indicadores adicionales">
						<metrics section="extra" />
					</md-tab>
				</md-tabs>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="open = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Startup from '@/backoffice/views/Customize/Startup.vue';
import Metrics from '@/backoffice/views/Customize/Metrics.vue';

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
	components: { Startup, Metrics }
};
</script>

<style rel="stylesheet/scss" lang="scss">
.customizePopup .md-dialog-container {
	max-width: 1000px;
	width: 1000px;
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
</style>
