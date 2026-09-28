<template>
	<transition name="legendSlideDown">
		<div v-show="visible" class="clippingLegend">
			<i class="fas fa-chevron-down clippingLegendCollapseButton" title="Ocultar leyendas" @click="minimized = true"></i>
			<div class="clippingLegendType" v-if="regions.length > 0">{{ regionType }}</div>
			<div class="clippingLegendName" v-if="regions.length > 0">
				<span v-for="(region, index) in regions" :key="region.Id" class="clippingLegendRegion">
					{{ region.Name }}<i class="fas fa-times clippingLegendRemoveRegion" title="Quitar de la selección"
															 @click.stop="removeRegion(region)"></i>{{ separatorFor(index) }}
				</span>
			</div>
			<div class="clippingLegendRow">
				<span>Habitantes</span>
				<span class="clippingLegendValue"><AnimatedNumber :value="population" /></span>
			</div>
			<div class="clippingLegendRow">
				<span>Hogares</span>
				<span class="clippingLegendValue"><AnimatedNumber :value="households" /></span>
			</div>
			<div class="clippingLegendRow">
				<span>Área (km<sup>2</sup>)</span>
				<span class="clippingLegendValue"><AnimatedNumber :value="areaKm2" format="km" /></span>
			</div>
		</div>
	</transition>
</template>

<script>
import AnimatedNumber from '@/map/components/controls/animatedNumber.vue';

// Resumen flotante del clipping activo, mismo dato que el bloque superior
// del panel de estadísticas (widgets/summary/clipping.vue: population,
// households, areaKm2 sobre clipping.Region.Summary, con la misma animación
// vía AnimatedNumber). La línea de título muestra el nombre de cada región
// seleccionada (con una cruz para quitarla, mismo método que
// clipping.vue:removeRegion) o, si no hay ninguna región seleccionada,
// simplemente "Población". Arriba del título, cuando hay región, el mismo
// texto que clipping.vue muestra en clippingBlockHeader (region.TypeName).
//
// Se muestra y oculta en simultáneo con mapLegend: mismo criterio
// (toolbarStates.collapsed y toolbarStates.legendMinimized) y mismo estilo
// de texto superpuesto transparente.
//
// En pantallas chicas ($isMobile(), mismo criterio que mapLegend.vue) no se
// muestra nunca, para simplificar la UI. La cruz de quitar una región queda
// oculta por defecto y aparece con el mouse sobre el panel, igual que la
// cruz de quitar indicador y el botón de ocultar en mapLegend.vue.
export default {
	name: 'clippingLegend',
	components: {
		AnimatedNumber,
	},
	props: [
		'clipping',
		'toolbarStates',
	],
	data() {
		return {
			isMobile: false,
		};
	},
	computed: {
		// Mismo estado compartido que mapLegend.minimized: al ocultar desde
		// cualquiera de los dos paneles, se ocultan ambos.
		minimized: {
			get() {
				return this.toolbarStates.legendMinimized;
			},
			set(value) {
				this.toolbarStates.legendMinimized = value;
			},
		},
		hasSummary() {
			return !!(this.clipping && this.clipping.Region && this.clipping.Region.Summary);
		},
		visible() {
			return this.toolbarStates.collapsed && !this.toolbarStates.legendMinimized && this.hasSummary && !this.isMobile;
		},
		// Solo cuenta como "región seleccionada" la que tiene Name; sin
		// selección, Regions puede seguir trayendo un elemento sin nombre
		// (mismo criterio que clipping.vue:hasSummaryName).
		regions() {
			if (!this.hasSummary) {
				return [];
			}
			var regions = this.clipping.Region.Summary.Regions || [];
			return regions.filter(function (region) { return region.Name; });
		},
		regionType() {
			return this.regions.length > 0 ? this.regions[0].TypeName : null;
		},
		// Año de la revisión censal seleccionada, mismo dato que el sourceRow
		// de widgets/summary/clipping.vue (la botonera sobre clipping.Region.Levels).
		clippingVersion() {
			var levels = this.clipping.Region.Levels;
			var level = levels ? levels[this.clipping.Region.SelectedLevelIndex] : null;
			return level ? level.Revision : null;
		},
		population() {
			return this.hasSummary ? this.clipping.Region.Summary.Population : 0;
		},
		households() {
			return this.hasSummary ? this.clipping.Region.Summary.Households : 0;
		},
		areaKm2() {
			return this.hasSummary ? this.clipping.Region.Summary.AreaKm2 : 0;
		},
	},
	mounted() {
		this.isMobile = this.$isMobile();
	},
	methods: {
		// Réplica de clipping.vue:removeRegion.
		removeRegion(region) {
			if (window.SegMap.Clipping.FrameHasClippingCircle()) {
				window.SegMap.Clipping.ResetClippingCircle();
			} else {
				window.SegMap.Clipping.ResetClippingRegion(region.Id);
			}
		},
		separatorFor(index) {
			return index < this.regions.length - 1 ? ', ' : '';
		},
	},
};
</script>

<style scoped>

.legendSlideDown-enter-active, .legendSlideDown-leave-active {
	transition: transform .3s ease, opacity .3s ease;
}
.legendSlideDown-enter, .legendSlideDown-leave-to {
	transform: translateY(-60px);
	opacity: 0;
}

.clippingLegend {
	position: absolute;
	top: 75px;
	right: 33px;
	z-index: 900;
	width: 257px;
	text-align: left;
	display: flex;
	flex-direction: column;
	pointer-events: auto;
	background-color: var(--color-fondo-leyenda);
	padding-left: 13px;
	padding-top: 9px;
	padding-bottom: 9px;
	padding-right: 10px;
	border-radius: 8px;
}

.clippingLegendCollapseButton {
	position: absolute;
	top: 6px;
	right: -21px;
	opacity: 0;
	cursor: pointer;
	padding: 2px;
	color: var(--color-texto-leyenda);
	font-size: 1em;
	transition: opacity .15s ease;
}

.clippingLegend:hover .clippingLegendCollapseButton {
	opacity: 1;
}

.clippingLegendType {
	font-size: .8em;
	color: var(--color-texto-leyenda);
}

.clippingLegendName {
	font-size: 1.2em;
	color: var(--color-texto-leyenda);
	margin-bottom: 4px;
}

.clippingLegendVersion {
	font-size: .92em;
}

.clippingLegendRemoveRegion {
	display: none;
	pointer-events: auto;
	cursor: pointer;
	font-size: .65em;
	margin-left: 6px;
	margin-right: 2px;
}

.clippingLegend:hover .clippingLegendRemoveRegion {
	display: inline;
}

.clippingLegendRow {
	font-size: .85em;
	color: var(--color-texto-leyenda);
	display: flex;
	justify-content: space-between;
}

.clippingLegendValue {
	text-align: right;
}
</style>
