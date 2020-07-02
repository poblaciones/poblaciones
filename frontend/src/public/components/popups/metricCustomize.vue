<template>
	<Modal title="Personalizar" ref="dialog" :showCancel="false" :showOk="false">
		<div v-if="metric">
			<table class="localTable">
				<tr>
					<td colspan="2">
						<div class="popupSubTitle">
							Panel de información
						</div>
					</td>
				</tr>
				<tr>
					<td>Métrica:</td>
					<td>
						<div class="btn-group">
							<button v-for="metric in metric.getValidMetrics()" :key="metric.Key" type="button" v-on:click="changeMetric(metric.Key)" class="btn btn-default btn-xs" :class="getActive(metric.Key)">
								{{ metric.Caption }}
							</button>
						</div>
					</td>
				</tr>
				<tr>
					<td colspan="2">
						<div class="popupSubTitle">
							Opciones de mapa
						</div>
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
				<tr>
					<td>Transparencia:</td>
					<td>
						<div class="btn-group">
							<button type="button" v-on:click="changeTransparency('B')" class="btn btn-default btn-xs" :class="getActiveTransparency('B')">
								Baja
							</button>
							<button type="button" v-on:click="changeTransparency('M')" class="btn btn-default btn-xs" :class="getActiveTransparency('M')">
								Media
							</button>
							<button type="button" v-on:click="changeTransparency('A')" class="btn btn-default btn-xs" :class="getActiveTransparency('A')">
								Alta
							</button>
						</div>
					</td>
				</tr>
				<tr v-if="anyHasArea()">
					<td>Trama:</td>
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
		getActiveTransparency(key) {
			if(key === this.metric.properties.Transparency) {
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
		changeTransparency(key) {
			if (this.metric.properties.Transparency !== key) {
				this.metric.properties.Transparency = key;
				this.metric.UpdateMap();
			}
		},
		anyHasArea() {
			var ret = false;
			this.metric.SelectedVersion().Levels.forEach(function (level) {
				if (level.HasArea) {
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
</style>

