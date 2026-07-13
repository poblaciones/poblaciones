<template>
	<div>
		<div class="chartContainer" style="margin-bottom: -10px">
			<quick-chart :data="chartData"
									 :width="518"
									 :height="122"
									 :yLabel="boundary.valueHeader()"
									 :stacked-normalize="normalized"
									 :theme="{
                     selection: '#D50000',    /* Rojo al seleccionar */
                     disabled: '#EEEEEE',     /* Gris muy claro al deshabilitar */
                     zoneBg: '#FFFFFF',       /* Fondo blanco puro */
                     zoneStroke: '#333333'    /* Borde negro */
                   }"
									 :layout="{
                     top: 10, right: 10, bottom: 20, left: 40,
                     inner: 30
                   }"
									 :isUpdating="boundary.IsUpdatingSummary"
									 @select="handleSelect" />
		</div>
	</div>
</template>

<script>
import QuickChart from '@/map/components/controls/quickChart';

// Análogo de metricChart.vue, sin Summary.js: usa
// ActiveBoundary.CalculateValue/FormatValue (mismas fórmulas que consume la
// tabla de boundaryValues.vue) para no duplicar el cálculo entre ambos.
export default {
	name: 'boundaryChart',
	props: [
		'boundary',
	],
	components: {
		QuickChart,
	},
	data() {
		return {
			chartType: 'bar',
			normalized: false,
		};
	},
	computed: {
		chartData() {
			var boundary = this.boundary;
			var serie = {
				text: boundary.SelectedVersion().Name,
				values: [],
			};
			for (var label of boundary.SelectedVersion().ValueLabels) {
				if (!boundary.HasData(label)) {
					continue;
				}
				var calculated = boundary.CalculateValue(label);
				serie.values.push({
					label: label.Name,
					value: calculated,
					valueFormatted: boundary.FormatValue(calculated),
					color: label.LineColor,
					enabled: label.Visible,
					labelObject: label,
				});
			}
			return {
				type: this.chartType,
				series: [serie],
			};
		},
	},
	watch: {
		'boundary.summaryMetric'(newValue) {
			if (newValue === 'P' || newValue === 'A') {
				this.chartType = 'stacked';
				this.normalized = true;
			} else {
				this.chartType = 'bar';
				this.normalized = false;
			}
		},
	},
	methods: {
		handleSelect(val) {
			var value = this.chartData.series[val.seriesIndex].values[val.valueIndex];
			value.labelObject.Visible = !value.labelObject.Visible;
			this.boundary.UpdateMap();
		},
	},
};
</script>

<style scoped>
.chartContainer {
	display: flex;
	background: #fff;
	padding: 0px;
}
.chartContainer > * {
	flex: 1;
	min-width: 0;
}
</style>
