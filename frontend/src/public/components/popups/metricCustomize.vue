<template>
	<Modal title="Personalizar indicador" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="metric && metric.SelectedVariable()">
			<table class="localTable">
				<tr>
					<td colspan="2">
						<div class="popupSubTitle">
							Panel de información
						</div>
					</td>
				</tr>
				<tr>
					<td class="col1 optionsLabel">Métrica:</td>
					<td>
						<div class="btn-group">
							<button v-for="metric in metric.getValidMetrics()" :key="metric.Key" type="button" v-on:click="changeMetric(metric.Key)" class="btn btn-default btn-xs" :class="getActive(metric.Key)">
								{{ metric.Caption }}
							</button>
						</div>
					</td>
				</tr>
				<tr v-if="anyHasArea() || !metric.SelectedVariable().IsSimpleCount">
					<td colspan="2">
						<div class="popupSubTitle">
							Opciones de mapa
						</div>
					</td>
				</tr>
				<tr v-if="metric.SelectedLevel().HasDescriptions">
					<td class="nowrapwords">Mostrar descripciones:</td>
					<td>
						<label class="radio-inline">
							<input type="radio" name="descripciones" value="1" v-on:change="metric.UpdateMap()" v-model="metric.SelectedVariable().ShowDescriptions">Sí
						</label>
						<label class="radio-inline">
							<input type="radio" name="descripciones" value="0" v-on:change="metric.UpdateMap()" v-model="metric.SelectedVariable().ShowDescriptions">No
						</label>
					</td>
				</tr>
				<tr v-if="!metric.SelectedVariable().IsSimpleCount">
					<td class="nowrapwords">Mostrar valores:</td>
					<td>
						<label class="radio-inline">
							<input type="radio" name="valores" value="1" v-on:change="metric.UpdateMap()" v-model="metric.SelectedVariable().ShowValues">Sí
						</label>
						<label class="radio-inline">
							<input type="radio" name="valores" value="0" v-on:change="metric.UpdateMap()" v-model="metric.SelectedVariable().ShowValues">No
						</label>
					</td>
				</tr>
				<tr v-if="metric.SelectedVariable().Perimeter">
					<td class="nowrapwords">Mostrar perímetros:</td>
					<td>
						<label class="radio-inline">
							<input type="radio" name="perimeter" value="1" v-on:change="metric.UpdateMap()" v-model="metric.SelectedVariable().ShowPerimeter">Sí
						</label>
						<label class="radio-inline">
							<input type="radio" name="perimeter" value="0" v-on:change="metric.UpdateMap()" v-model="metric.SelectedVariable().ShowPerimeter">No
						</label>
					</td>
				</tr>
				<tr v-if="anyHasArea()">
					<td class="optionsLabel">Transparencia:</td>
					<td>
						<div class="btn-group">
							<button type="button" v-on:click="changeOpacity('H')" class="btn btn-default btn-xs" :class="getActiveOpacity('H')">
								Baja
							</button>
							<button type="button" v-on:click="changeOpacity('M')" class="btn btn-default btn-xs" :class="getActiveOpacity('M')">
								Media
							</button>
							<button type="button" v-on:click="changeOpacity('L')" class="btn btn-default btn-xs" :class="getActiveOpacity('L')">
								Alta
							</button>
						</div>
					</td>
				</tr>
				<tr v-if="anyHasArea() && showGradientOptions()">
					<td class="optionsLabel">Ajuste poblacional:</td>
					<td>
						<div class="btn-group">
							<button type="button" v-on:click="changeGradientOpacity('H')" class="btn btn-default btn-xs" :class="getActiveGradientOpacity('H')">
								Bajo
							</button>
							<button type="button" v-on:click="changeGradientOpacity('M')" class="btn btn-default btn-xs" :class="getActiveGradientOpacity('M')">
								Medio
							</button>
							<button type="button" v-on:click="changeGradientOpacity('L')" class="btn btn-default btn-xs" :class="getActiveGradientOpacity('L')">
								Alto
							</button>
						</div>
					</td>
				</tr>
				<tr v-if="anyHasArea()">
					<td class="optionsLabel">Trama:</td>
					<td>
						<div class="btn-group">
							<button v-for="pattern in range(metric.getValidPatterns(), 0, 3)" :key="pattern.Key" type="button" v-on:click="changePattern(pattern.Key)" class="btn btn-default btn-xs" :class="getActivePattern(pattern.Key)">
								{{ pattern.Caption }}
							</button>
						</div>
						<div class="btn-group" style="margin-top: 5px">
							<button v-for="pattern in range(metric.getValidPatterns(), 4, 20)" :key="pattern.Key" type="button" v-on:click="changePattern(pattern.Key)" class="btn btn-default btn-xs" :class="getActivePattern(pattern.Key)">
								{{ pattern.Caption }}
							</button>
						</div>
					</td>
				</tr>
				<tr v-if="metric.SelectedLevel().Dataset.AreSegments">
					<td class="optionsLabel">Ancho:</td>
					<td>
						<div class="btn-group">
							<button type="button" v-on:click="changeWidth(1)" class="btn btn-default btn-xs" :class="getActiveWidth(1)">
								Fino
							</button>
							<button type="button" v-on:click="changeWidth(2)" class="btn btn-default btn-xs" :class="getActiveWidth(2)">
								Intermedio
							</button>
							<button type="button" v-on:click="changeWidth(3)" class="btn btn-default btn-xs" :class="getActiveWidth(3)">
								Grueso
							</button>
						</div>
					</td>
				</tr>
			</table>
		</div>
	</Modal>
</template>

<script>
import Modal from '@/public/components/popups/modal';

export default {
	name: 'customize',
	components: {
		Modal
	},
	props: [
		'backgroundColor'
	],
	data() {
		return {
			metric: null
		};
	},
	methods: {
		getActive(key) {
			if(key === this.metric.properties.SummaryMetric) {
				return ' active';
			} else {
				return '';
			}
		},
		range(col, from, to) {
			var ret = [];
			for(var n = 0; n < col.length; n++) {
				if (n >= from && n <= to) {
					ret.push(col[n]);
				}
			}
			return ret;
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
		getActivePattern(key) {
			if(key === this.metric.SelectedVariable().CustomPattern ||
				(this.metric.SelectedVariable().CustomPattern === '' && key === this.metric.SelectedVariable().Pattern)) {
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
				this.metric.UpdateMap();
			}
		},
		changeWidth(width) {
			if (this.metric.SelectedVariable().borderWidth !== width) {
				this.metric.SelectedVariable().borderWidth = width;
				this.metric.UpdateMap();
			}
		},
		changeOpacity(key) {
			if (this.metric.SelectedVariable().Opacity !== key) {
				var variables = this.metric.GetAllVariables();
				for (var n = 0; n < variables.length; n++) {
					variables[n].Opacity = key;
				}
				this.metric.UpdateMap();
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
				this.metric.UpdateMap();
			}
		},
		showGradientOptions() {
			if (!window.SegMap.Configuration.UseGradients || this.metric.SelectedVariable().GradientOpacity === 'N') {
				return;
			}
			return (this.metric.SelectedLevel().Dataset.HasGradient);
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
	.nowrapwords {
		white-space: nowrap;
	}
	.col1 {
		width: 150px;
	}
</style>

