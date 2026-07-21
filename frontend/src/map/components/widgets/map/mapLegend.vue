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
								<span class="mapLegendTitleText">{{ displayName(metric) }} <span class="mapLegendVersion">({{ versionLabel(metric) }})</span></span>
								<i class="fas fa-times mapLegendRemove" title="Quitar del mapa" @click.stop="removeMetric(metric)"></i>
							</div>
							<div class="mapLegendSubtitle" v-if="showVariableName(metric)">{{ selectedVariable(metric).Name }}</div>
							<div class="mapLegendItem" v-for="label in allLabels(metric)" :key="label.Id" @click="toggleLabel(metric, label)">
								<span class="mapLegendSwatch" :class="{ mapLegendSwatchDot: isDot(metric) }"
											:style="swatchStyle(metric, label)"></span>
								<span class="mapLegendLabelName" :class="{ mapLegendLabelNameOff: !label.Visible }">{{ label.Name }}</span>
							</div>
						</div>
					</template>
				</div>
				<i v-show="canScrollDown" class="fas fa-caret-down mapLegendArrow" title="Bajar" @click="scrollBy(1)"></i>
			</div>
		</transition>
		<div v-show="toolbarStates.collapsed" class="mapLegendMinimized"
				 :class="{ mapLegendMinimizedOff: minimized }" title="Leyenda" @click="minimized = !minimized">
			<i class="fas fa-list-ul"></i>
		</div>
	</div>
</template>

<script>
// Leyenda flotante de mapa: muestra, por cada indicador o delimitación
// (boundary) visible, su nombre y las categorías (ValueLabels) con su
// color. Con ShowEmptyCategories en false (indicadores) o sin datos en el
// encuadre actual (boundaries, vía ActiveBoundary.HasData), la lista se
// recorta a las categorías con datos, igual que metricValues.vue/
// boundaryValues.vue. Es una ayuda visual con dos interacciones propias,
// replicando el mismo mecanismo que usa el panel de estadísticas:
// - Clic en un cuadrado/círculo: alterna label.Visible y llama
//   metric.RefreshMap()/boundary.UpdateMap(), igual que metricValues.vue/
//   boundaryValues.vue.
// - Clic en la cruz que aparece al pasar el mouse sobre el nombre: Remove(),
//   igual que metricDropdown.vue/boundaryTopButtons.vue.
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
				return !metric.isBaseMetric && metric.Visible();
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
		displayName(metric) {
			return metric.isBoundary ? metric.properties.Name : metric.properties.Metric.Name;
		},
		// Año(s) de la versión seleccionada. En boundary, Version.Name es el
		// año directo (sin variable/Compare de por medio). En metric, mismo
		// dato que el sourceRow de metric.vue (botonera de
		// metric.properties.Versions); en comparación activa, se muestran
		// ambas versiones separadas por guión, en orden comparación-principal.
		versionLabel(metric) {
			if (metric.isBoundary) {
				return metric.SelectedVersion().Name;
			}
			if (metric.Compare.Active) {
				var compareVersion = metric.Compare.SelectedVersion();
				return (compareVersion ? compareVersion.Version.Name : '') + '-' + metric.SelectedVersion().Version.Name;
			}
			return metric.SelectedVersion().Version.Name;
		},
		// Réplica de la condición usada en metricVariables.vue: con una única
		// variable de nombre vacío (indicadores de conteo simple), el nombre de
		// variable no aporta nada y no se muestra. Boundary no tiene variable:
		// nunca hay subtítulo.
		showVariableName(metric) {
			if (metric.isBoundary) {
				return false;
			}
			var variables = metric.SelectedLevel().Variables;
			return !(variables.length === 1 && variables[0].Name === '');
		},
		// En boundary, las categorías son los ValueLabels de la versión
		// seleccionada (uno por ClippingRegion de origen), filtradas con el
		// mismo criterio que boundaryValues.vue/boundaryChart.vue (HasData).
		// En metric, las ValueLabels de la variable seleccionada, filtradas
		// con el mismo criterio que metricValues.vue (displayLabel).
		allLabels(metric) {
			if (metric.isBoundary) {
				return metric.SelectedVersion().ValueLabels.filter(function (label) {
					return metric.HasData(label);
				});
			}
			var variable = this.selectedVariable(metric);
			if (!variable) {
				return [];
			}
			var loc = this;
			return metric.getVariableValueLabels(variable).filter(function (label) {
				return loc.displayLabel(metric, variable, label);
			});
		},
		// Réplica de metricValues.vue:displayLabel. Con ShowEmptyCategories en
		// false, la lista de categorías es dinámica según los datos del
		// encuadre actual: una categoría sin zonas que la representen
		// (label.Values.Count === '') no se ofrece.
		displayLabel(metric, variable, label) {
			return label.Values && ((variable.ShowEmptyCategories && !metric.Compare.Active) || label.Values.Count !== '');
		},
		// Un boundary siempre se representa como cuadrado (son polígonos/áreas,
		// nunca ubicaciones puntuales); un indicador de puntos (IsLocationType)
		// se representa como círculo, igual que antes.
		isDot(metric) {
			return !metric.isBoundary && metric.IsLocationType();
		},
		// El color "de identidad" de la categoría: en boundary, siempre
		// LineColor (mismo criterio que boundaryValues.vue, sin importar el
		// patrón de relleno activo en el mapa); en metric, FillColor.
		swatchStyle(metric, label) {
			var color = metric.isBoundary ? label.LineColor : label.FillColor;
			if (label.Visible) {
				return 'background-color: ' + color + '; border-color: ' + color;
			}
			return 'background-color: transparent; border-color: ' + color;
		},
		toggleLabel(metric, label) {
			label.Visible = !label.Visible;
			if (metric.isBoundary) {
				metric.UpdateMap();
			} else {
				metric.RefreshMap();
			}
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

.mapLegendVersion {
	font-size: .92em;
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
