<template>
	<Modal title="Personalizar indicador" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="metric && metric.SelectedVariable()">
			<div class="popupSubTitle">
				Panel de información
			</div>
			<div class="fld">
				<div class="fld-label">Métrica</div>
				<div class="fld-value">
					<div class="btn-group">
						<button v-for="metric in metric.getValidMetrics()" :key="metric.Key" type="button" @click="changeMetric(metric.Key)" class="btn btn-default btn-xs" :class="getActive(metric.Key)">
							{{ metric.Caption }}
						</button>
					</div>
				</div>
			</div>
			<div class="popupSubTitle" v-if="anyHasArea() || !metric.SelectedVariable().IsSimpleCount">
				Opciones de mapa
			</div>
			<div class="fld" v-if="metric.SelectedLevel().HasDescriptions">
				<div class="fld-label">Mostrar descripciones</div>
				<div class="fld-value">
					<label class="radio-inline">
						<input type="radio" name="descripciones" value="1" @change="updateShowDescriptions()" v-model="metric.SelectedVariable().ShowDescriptions">Sí
					</label>
					<label class="radio-inline">
						<input type="radio" name="descripciones" value="0" @change="updateShowDescriptions()" v-model="metric.SelectedVariable().ShowDescriptions">No
					</label>
				</div>
			</div>
			<div class="fld" v-if="!metric.SelectedVariable().IsSimpleCount">
				<div class="fld-label">Mostrar valores</div>
				<div class="fld-value">
					<label class="radio-inline">
						<input type="radio" name="valores" value="1" @change="updateShowValues()" v-model="metric.SelectedVariable().ShowValues">Sí
					</label>
					<label class="radio-inline">
						<input type="radio" name="valores" value="0" @change="updateShowValues()" v-model="metric.SelectedVariable().ShowValues">No
					</label>
				</div>
			</div>
			<div class="fld" v-if="usePerimeter && metric.SelectedVariable().Perimeter">
				<div class="fld-label">Mostrar perímetros</div>
				<div class="fld-value">
					<label class="radio-inline">
						<input type="radio" name="perimeter" value="1" @change="metric.RefreshMap()" v-model="metric.SelectedVariable().ShowPerimeter">Sí
					</label>
					<label class="radio-inline">
						<input type="radio" name="perimeter" value="0" @change="metric.RefreshMap()" v-model="metric.SelectedVariable().ShowPerimeter">No
					</label>
				</div>
			</div>
			<div class="fld" v-if="showOpacityOptions()">
				<div class="fld-label">Transparencia</div>
				<div class="fld-value">
					<div class="btn-group">
						<button type="button" @click="changeOpacity('H')" class="btn btn-default btn-xs" :class="getActiveOpacity('H')">
							Baja
						</button>
						<button type="button" @click="changeOpacity('M')" class="btn btn-default btn-xs" :class="getActiveOpacity('M')">
							Media
						</button>
						<button type="button" @click="changeOpacity('L')" class="btn btn-default btn-xs" :class="getActiveOpacity('L')">
							Alta
						</button>
					</div>
				</div>
			</div>
			<div class="fld" v-if="anyHasArea() && showGradientOptions()">
				<div class="fld-label">Ajuste poblacional</div>
				<div class="fld-value">
					<div class="btn-group">
						<button type="button" @click="changeGradientOpacity('H')" class="btn btn-default btn-xs" :class="getActiveGradientOpacity('H')">
							Bajo
						</button>
						<button type="button" @click="changeGradientOpacity('M')" class="btn btn-default btn-xs" :class="getActiveGradientOpacity('M')">
							Medio
						</button>
						<button type="button" @click="changeGradientOpacity('L')" class="btn btn-default btn-xs" :class="getActiveGradientOpacity('L')">
							Alto
						</button>
					</div>
				</div>
			</div>
			<div class="fld" v-if="anyHasArea()">
				<div class="fld-label">Trama</div>
				<div class="fld-value">
					<PatternButtons :patterns="metric.getValidPatterns()" :customPattern="metric.SelectedVariable().CustomPattern"
													:defaultPattern="metric.SelectedVariable().Pattern" @change="changePattern" />
				</div>
			</div>
			<div class="fld" v-if="metric.SelectedLevel().Dataset.AreSegments">
				<div class="fld-label">Ancho</div>
				<div class="fld-value">
					<div class="btn-group">
						<button type="button" @click="changeWidth(1)" class="btn btn-default btn-xs" :class="getActiveWidth(1)">
							Fino
						</button>
						<button type="button" @click="changeWidth(2)" class="btn btn-default btn-xs" :class="getActiveWidth(2)">
							Intermedio
						</button>
						<button type="button" @click="changeWidth(3)" class="btn btn-default btn-xs" :class="getActiveWidth(3)">
							Grueso
						</button>
					</div>
				</div>
			</div>
		</div>
	</Modal>
</template>

<script>
import Modal from '@/map/components/popups/modal';
import PatternButtons from '@/map/components/controls/patternButtons';

export default {
	name: 'customize',
	components: {
		Modal,
		PatternButtons
	},
	props: [
		'backgroundColor'
	],
	data() {
		return {
			metric: null
		};
	},
	computed: {
		usePerimeter() {
			return window.SegMap.Configuration.UsePerimeter;
		}
	},
	methods: {
		getActive(key) {
			if(key === this.metric.properties.SummaryMetric) {
				return ' active';
			} else {
				return '';
			}
		},
		updateShowDescriptions() {
			var value = this.metric.SelectedVariable().ShowDescriptions;
			this.metric.SetShowDescriptionsToSelectedVariableSet(value);
			this.metric.RefreshMap();
		},
		updateShowValues() {
			var value = this.metric.SelectedVariable().ShowValues;
			this.metric.SetShowValuesToSelectedVariableSet(value);
			this.metric.RefreshMap();
		},
		show(metric) {
			this.metric = metric;
			this.$refs.dialog.show();
		},
		getActiveGradientOpacity(key) {
			if (key === this.metric.SelectedVariable().GradientOpacity) {
				return ' active';
			} else {
				return '';
			}
		},
		getActiveWidth(key) {
			if (key === this.metric.SelectedVariable().borderWidth) {
				return ' active';
			} else {
				return '';
			}
		},
		getActiveOpacity(key) {
			if (key === this.metric.SelectedVariable().Opacity) {
				return ' active';
			} else {
				return '';
			}
		},
		changeMetric(key) {
			this.metric.properties.SummaryMetric = key;
		},
		changePattern(key) {
			var newPattern = key;
			if (key === this.metric.SelectedVariable().Pattern) {
				newPattern = '';
			}
			if (this.metric.SelectedVariable().CustomPattern !== newPattern) {
				this.metric.SelectedVariable().CustomPattern = newPattern;
				this.metric.RefreshMap();
			}
		},
		changeWidth(width) {
			if (this.metric.SelectedVariable().borderWidth !== width) {
				this.metric.SelectedVariable().borderWidth = width;
				this.metric.RefreshMap();
			}
		},
		changeOpacity(key) {
			if (this.metric.SelectedVariable().Opacity !== key) {
				var variables = this.metric.GetAllVariables();
				for (var n = 0; n < variables.length; n++) {
					variables[n].Opacity = key;
				}
				this.metric.UpdateOpacity(window.SegMap.frame.Zoom);
				this.metric.RefreshMap();
			}
		},
		changeGradientOpacity(key) {
			var variables = this.metric.GetAllVariables();
			var changed = false;
			for (var n = 0; n < variables.length; n++) {
				if (variables[n] !== 'N' && variables[n] !== key) {
					variables[n].GradientOpacity = key;
					changed = true;
				}
			}
			if (changed) {
				this.metric.UpdateOpacity(window.SegMap.frame.Zoom);
				this.metric.RefreshMap();
			}
		},
		showGradientOptions() {
			if (!window.SegMap.Configuration.UseGradients || this.metric.SelectedVariable().GradientOpacity === 'N') {
				return;
			}
			return (this.metric.SelectedLevel().Dataset.HasGradient);
		},
		showOpacityOptions() {
			if (this.anyHasArea()) {
				return true;
			}
			return this.metric.IsLocationType() && this.metric.SelectedMarker().Size === 'F';
		},
		anyHasArea() {
			var ret = false;
			this.metric.SelectedVersion().Levels.forEach(function (level) {
				if (level.HasArea && !level.Dataset.AreSegments) {
					ret = true;
				}
			});
			return ret;
		},
	},
};
</script>

<style scoped>
</style>

