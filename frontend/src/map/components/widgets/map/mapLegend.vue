<template>
	<div>
		<transition name="legendSlide">
			<div v-show="visible && !minimized" class="mapLegend" :class="{ mapLegendTouch: isTouchDevice }">
				<div class="mapLegendHeader">
					<i class="fas fa-chevron-down mapLegendCollapseButton" title="Ocultar leyendas" @click="minimized = true"></i>
				</div>
				<i v-show="canScrollUp" class="fas fa-caret-up mapLegendArrow" title="Subir" @click="scrollBy(-1)"></i>
				<div ref="body" class="mapLegendBody thinScroll" :style="{ maxHeight: bodyMaxHeight }" @scroll="updateScrollState">
					<template v-for="metric in visibleMetrics">
						<div class="mapLegendGroup" :key="metric.index">
							<div class="mapLegendTitle">
								<span class="mapLegendTitleText">{{ metric.properties.Metric.Name }}</span>
								<i class="fas fa-times mapLegendRemove" title="Quitar del mapa" @click.stop="removeMetric(metric)"></i>
							</div>
							<div class="mapLegendSubtitle" v-if="showVariableName(metric)">{{ selectedVariable(metric).Name }}</div>
							<div class="mapLegendItem" v-for="label in allLabels(metric)" :key="label.Id" @click="toggleLabel(metric, label)">
								<span class="mapLegendSwatch" :class="{ mapLegendSwatchDot: metric.IsLocationType() }"
											:style="swatchStyle(label)"></span>
								<span class="mapLegendLabelName" :class="{ mapLegendLabelNameOff: !label.Visible }">{{ label.Name }}</span>
							</div>
						</div>
					</template>
				</div>
				<i v-show="canScrollDown" class="fas fa-caret-down mapLegendArrow" title="Bajar" @click="scrollBy(1)"></i>
			</div>
		</transition>
		<div v-show="toolbarStates.collapsed && visibleMetrics.length > 0" class="mapLegendMinimized"
				 :class="{ mapLegendMinimizedOff: minimized }" title="Leyenda" @click="minimized = !minimized">
			<i class="fas fa-list-ul"></i>
		</div>
	</div>
</template>

<script>
// Leyenda flotante de mapa: muestra, por cada indicador visible, su nombre,
// la variable seleccionada y todas las categorías (ValueLabels) con su
// color. Es una ayuda visual con dos interacciones propias, replicando el
// mismo mecanismo que usa el panel de estadísticas:
// - Clic en un cuadrado/círculo: alterna label.Visible y llama
//   metric.RefreshMap(), igual que metricValues.vue/metric.vue.
// - Clic en la cruz que aparece al pasar el mouse sobre el nombre del
//   indicador: metric.Remove(), igual que metricDropdown.vue.
//
// Coordinación con el panel de estadísticas: el panel expandido de la
// leyenda solo se muestra con toolbarStates.collapsed en true (panel de
// estadísticas oculto). El ícono de la esquina, en cambio, queda visible en
// todo ese mismo período (esté la leyenda expandida o minimizada) y usa su
// color para indicar el estado: color normal si la leyenda está expandida,
// gris claro si está minimizada. Se oculta por completo únicamente cuando
// el panel de estadísticas vuelve a estar visible.
//
// La cruz de quitar indicador y el botón de ocultar (arriba a la derecha)
// están ocultos por defecto y aparecen con el mouse sobre el panel completo,
// para no competir visualmente con los datos. En dispositivos táctiles no
// hay hover, así que se muestran siempre (isTouchDevice, mismo criterio que
// mpBasemapButton.vue). En pantallas chicas ($isMobile(), del plugin
// vue-mobile-detection registrado en main.js) el panel arranca minimizado.
// Se usa $isMobile() en vez de window.SegMap.Configuration.IsMobile porque
// este componente se monta antes de que window.SegMap exista (se crea recién
// en SetupMap, luego de la carga de configuración).
//
// El estado minimizado vive en toolbarStates.legendMinimized (no en data
// local): lo comparte con clippingLegend.vue, que se oculta en simultáneo, y
// con SegmentedMap.RefreshSummaries, que deja de pedir resúmenes mientras
// tanto el panel de estadísticas como la leyenda están ocultos.
//
// El max-height del cuerpo con scroll se calcula en JS, no en CSS puro,
// porque #holder (el contenedor del mapa) cambia de posición y alto según
// haya o no panel de work visible (workPanel.vue lo maneja con manipulación
// directa del DOM, sin exponer un dato reactivo). Se mide con
// getBoundingClientRect().top sobre #holder y se observa con ResizeObserver
// para recalcular cuando cambia.
export default {
	name: 'mapLegend',
	props: [
		'metrics',
		'toolbarStates',
	],
	data() {
		return {
			isTouchDevice: false,
			canScrollUp: false,
			canScrollDown: false,
			resizeObserver: null,
			holderResizeObserver: null,
			holderTopOffset: 0,
		};
	},
	computed: {
		// Estado compartido con clippingLegend.vue vía toolbarStates, para que
		// ambos paneles se oculten en simultáneo (ver también SegmentedMap.js:
		// RefreshSummaries se salta mientras collapsed && legendMinimized).
		minimized: {
			get() {
				return this.toolbarStates.legendMinimized;
			},
			set(value) {
				this.toolbarStates.legendMinimized = value;
			},
		},
		visible() {
			return this.toolbarStates.collapsed && this.visibleMetrics.length > 0;
		},
		visibleMetrics() {
			return this.metrics.filter(function (metric) {
				return !metric.isBoundary && !metric.isBaseMetric && metric.Visible();
			});
		},
		// 280px sin panel de work. Con panel de work, se descuenta además su
		// alto real (holderTopOffset) más 40px extra.
		bodyMaxHeight() {
			var workExtra = this.holderTopOffset > 0 ? 40 : 0;
			return 'calc(100vh - 280px - ' + (this.holderTopOffset + workExtra) + 'px)';
		},
	},
	watch: {
		visibleMetrics() {
			this.$nextTick(this.updateScrollState);
		},
	},
	mounted() {
		this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		if (this.$isMobile()) {
			this.minimized = true;
		}
		if (window.ResizeObserver) {
			this.resizeObserver = new ResizeObserver(this.updateScrollState);
			this.resizeObserver.observe(this.$refs.body);
			var holder = document.getElementById('holder');
			if (holder) {
				this.holderResizeObserver = new ResizeObserver(this.updateHolderTopOffset);
				this.holderResizeObserver.observe(holder);
			}
		}
		this.updateHolderTopOffset();
		this.updateScrollState();
	},
	beforeDestroy() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
		if (this.holderResizeObserver) {
			this.holderResizeObserver.disconnect();
		}
	},
	methods: {
		selectedVariable(metric) {
			return metric.SelectedVariable();
		},
		// Réplica de la condición usada en metricVariables.vue: con una única
		// variable de nombre vacío (indicadores de conteo simple), el nombre de
		// variable no aporta nada y no se muestra.
		showVariableName(metric) {
			var variables = metric.SelectedLevel().Variables;
			return !(variables.length === 1 && variables[0].Name === '');
		},
		allLabels(metric) {
			var variable = this.selectedVariable(metric);
			if (!variable) {
				return [];
			}
			return metric.getVariableValueLabels(variable);
		},
		swatchStyle(label) {
			if (label.Visible) {
				return 'background-color: ' + label.FillColor + '; border-color: ' + label.FillColor;
			}
			return 'background-color: transparent; border-color: ' + label.FillColor;
		},
		toggleLabel(metric, label) {
			label.Visible = !label.Visible;
			metric.RefreshMap();
		},
		removeMetric(metric) {
			metric.Remove();
		},
		updateScrollState() {
			var body = this.$refs.body;
			if (!body) {
				return;
			}
			this.canScrollUp = body.scrollTop > 0;
			this.canScrollDown = (body.scrollTop + body.clientHeight) < body.scrollHeight - 1;
		},
		updateHolderTopOffset() {
			var holder = document.getElementById('holder');
			this.holderTopOffset = holder ? holder.getBoundingClientRect().top : 0;
		},
		scrollBy(direction) {
			this.$refs.body.scrollBy({ top: direction * 120, behavior: 'smooth' });
		},
	},
};
</script>

<style scoped>
.legendSlide-enter-active, .legendSlide-leave-active {
	transition: transform .3s ease, opacity .3s ease;
}
.legendSlide-enter, .legendSlide-leave-to {
	transform: translateX(60px);
	opacity: 0;
}

.mapLegend {
	position: absolute;
	right: 10px;
	bottom: 95px;
	z-index: 900;
	max-width: 280px;
	/* Garantiza 200px libres arriba, donde se ubica clippingLegend, aunque la
	   ventana se achique. */
	max-height: calc(100vh - 200px);
	display: flex;
	flex-direction: column;
	align-items: center;
	background-color: transparent;
	pointer-events: none;
}

.mapLegendHeader {
	align-self: flex-end;
	pointer-events: auto;
}

.mapLegendCollapseButton {
	opacity: 0;
	cursor: pointer;
	padding: 2px;
	color: #5a5858;
	font-size: 1em;
	text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff, .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
	transition: opacity .15s ease;
}

.mapLegend:hover .mapLegendCollapseButton {
	opacity: 1;
}

.mapLegendArrow {
	pointer-events: auto;
	cursor: pointer;
	font-size: 1.4em;
	color: #5a5858;
	text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;
}

.mapLegendBody {
	pointer-events: auto;
	overflow-y: auto;
	width: 100%;
	background-color: #cdcdcd50;
	padding-left: 13px;
	padding-top: 11px;
	padding-bottom: 2px;
	padding-right: 10px;
	border-radius: 8px;
}

.mapLegendGroup {
	margin-bottom: 10px;
}

.mapLegendTitle {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.mapLegendTitleText {
	font-size: 1em;
	font-weight: 700;
	color: #333333;
	text-shadow: .75px .75px 1px #ffffffa0, -.75px -1px 1px #ffffffa0, -.75px .75px 1px #ffffffa0, .75px -1px 1px #ffffffa0, .75px .75px 1px #ffffffa0, -.75px -1px 1px #ffffffa0, -.75px 1px 1px #ffffffa0, .75px -.75px 1px #ffffffa0;
}

.mapLegendRemove {
	opacity: 0;
	cursor: pointer;
	font-size: .75em;
	color: #333333;
	text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff, .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
	transition: opacity .15s ease;
}

.mapLegend:hover .mapLegendRemove {
	opacity: 1;
}

.mapLegendTouch .mapLegendRemove, .mapLegendTouch .mapLegendCollapseButton {
	opacity: 1;
}

.mapLegendSubtitle {
	font-size: .82em;
	font-weight: 400;
	color: #000;
	text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff, .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
	margin-bottom: 3px;
}

.mapLegendItem {
	display: flex;
	align-items: center;
	margin-top: 2px;
	cursor: pointer;
}

.mapLegendSwatch {
	width: 14px;
	height: 14px;
	min-width: 14px;
	margin-right: 6px;
	border: 1px solid rgba(0, 0, 0, .35);
}

.mapLegendSwatchDot {
	border-radius: 50%;
}

.mapLegendLabelName {
	font-size: .82em;
	color: #000;
	text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff, .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
}

.mapLegendLabelNameOff {
	opacity: .55;
}

.mapLegendMinimized {
	position: absolute;
	z-index: 900;
	right: 55px;
	bottom: 58px;
	line-height: .8em;
	font-size: 1em;
	cursor: pointer;
	color: #5a5858;
	background-color: #fbfbfb;
	box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
	background-clip: padding-box;
	border-radius: 2px;
	padding: 6px 6px;
	-webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
	transition: background-color .15s ease, color .15s ease;
}

.mapLegendMinimized:hover {
	background-color: #f4f4f4;
}

.mapLegendMinimizedOff {
	background-color: #ececec;
	color: #b5b5b5;
}

.mapLegendMinimizedOff:hover {
	background-color: #e2e2e2;
}
</style>
