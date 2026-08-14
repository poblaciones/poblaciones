<template>
	<div>
		<table class="localTableCompact">
			<tbody>
				<tr>
					<td colspan="2" class="statsHeader"></td>
					<td class="statsHeader textRight" style="min-width: 75px; padding-left: 15px; line-height: 2.3rem">
						<div style="margin-right: -12px">
							<mp-dropdown-menu :items="metricItems" icon="fas fa-caret-down"
																triggerStyle="min-width: 50px;"
																:tooltip="currentMetric.Title" @itemClick="metricSelected">
								<span slot="trigger" v-html="boundary.valueHeader()"></span>
							</mp-dropdown-menu>
						</div>
					</td>
				</tr>
				<tr @click="clickLabel(label)" v-for="label in visibleLabels" class="hand" :key="label.Id">
					<template v-if="label.Visible">
						<td class="dataBox center">
							<i :style="'border-color: ' + label.LineColor + '; color: ' + label.LineColor + dropBorder(label.LineColor)"
								 class="fa drop fa-tint exp-category-bullets"></i>
						</td>
						<td class="dataBox" style="width: 100%">
							{{ label.Name }}
						</td>
						<td style="width: 75px" class="textRight" :class="getMuted()">{{ formattedValue(label) }}</td>
					</template>
					<template v-else>
						<td class="dataBox action-muted center">
							<i class="fa drop fa-tint exp-category-bullets" style="border-color: inherit"></i>
						</td>
						<td class="dataBox text-muted" style="width: 100%">
							{{ label.Name }}
						</td>
						<td class="text-muted textRight">{{ formattedValue(label) }}</td>
					</template>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
import color from '@/common/framework/color';

// Tabla de ValueLabels de un boundary abierto por ClippingRegion, análoga a
// metricValues.vue pero sin la parte que no aplica acá (Summary.js con sus
// 7 métricas configurables, niveles múltiples con pin, comparación entre
// versiones). Una única columna rotable -N (cantidad, default), % de N, Km2,
// % de Km2-, con los mismos Key/Caption/encabezados que sus equivalentes en
// metricValues.vue. El cálculo y el formato viven en ActiveBoundary
// (CalculateValue/FormatValue), compartidos con boundaryChart.vue.
export default {
	name: 'boundaryValues',
	props: [
		'boundary',
	],
	computed: {
		// Una categoría sin datos en el encuadre actual (Value/Km2 vacíos) no
		// se ofrece: ver ActiveBoundary.HasData.
		visibleLabels() {
			var boundary = this.boundary;
			return boundary.SelectedVersion().ValueLabels.filter(function (label) {
				return boundary.HasData(label);
			});
		},
		// La etiqueta corta es la que se ve como encabezado de la columna
		// (puede traer HTML, así que acá se usa su versión en texto plano).
		metricItems() {
			var ret = [];
			var metrics = this.boundary.getValidMetrics();
			for (var n = 0; n < metrics.length; n++) {
				ret.push({
					label: this.boundary.getValueHeaderText(metrics[n].Key) + ' - ' + metrics[n].Caption,
					key: metrics[n].Key,
					icon: (metrics[n].Key === this.currentMetric.Key ? 'fas fa-check' : ''),
				});
				// Los grupos los define getValidMetrics: acá solo se traducen.
				if (metrics[n].GroupEnd && n < metrics.length - 1) {
					ret.push({ 'separator': true });
				}
			}
			return ret;
		},
		currentMetric() {
			var ret = this.boundary.getValidMetrics();
			for (var n = 0; n < ret.length; n++) {
				if (ret[n].Key === this.boundary.summaryMetric) {
					return ret[n];
				}
			}
			return ret[0];
		},
	},
	methods: {
		formattedValue(label) {
			return this.boundary.FormatValue(this.boundary.CalculateValue(label));
		},
		dropBorder(dropColor) {
			if (color.IsReallyLightColor(dropColor)) {
				var strokeColor = color.ReduceColor(dropColor, .5);
				return '; text-shadow: 0 0 1px ' + strokeColor + '; font-size: 13px';
			} else {
				return '';
			}
		},
		getMuted() {
			if (this.boundary.IsUpdatingSummary) {
				return ' text-muted';
			} else {
				return '';
			}
		},
		metricSelected(item) {
			this.clickMetric(item.key);
		},
		clickMetric(key) {
			this.boundary.summaryMetric = key;
			window.SegMap.SaveRoute.UpdateRoute();
		},
		clickLabel(label) {
			label.Visible = !label.Visible;
			this.boundary.UpdateMap();
		},
	},
};
</script>

<style scoped>
.textRight {
	text-align: right;
}
.statsHeader {
	text-align: right;
	color: #a9a9a9;
	font-weight: 300;
	font-size: 13px;
	height: 16px;
	padding: 0px;
	text-transform: uppercase;
}
.dataBox {
	padding-left: 2px!important;
	padding-right: 2px!important;
	padding-bottom: 5px!important;
}
.localTableCompact {
}
.localTableCompact td {
	border: 0px;
	padding: 3px;
	vertical-align: top;
}
</style>
