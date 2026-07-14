<template>
	<div class="metricPanel">
		<div class="dragHandle exp-hiddable-block" v-if="!boundary.IsLocked">
			<div style="top: -10px; position: absolute; left: 0; right: 0">
				<drag-horizontal title="Arrastrar para reubicar" />
			</div>
		</div>
		<BoundaryTopButtons :boundary="boundary" :key="boundary.index"
												class="exp-hiddable-block" v-if="!Embedded.Readonly" />
		<div v-if="boundary.SelectedVersion().IsSimpleCount">
			<h4 class="title" @click="clickLabel(singleLabel)" style="margin-bottom: 6px;cursor: pointer">
				<i v-if="singleLabel.Visible" :style="'border-color: ' + singleLabel.LineColor + '; color: ' + singleLabel.LineColor"
					 class="fa drop fa-tint exp-category-bullets-large smallIcon"></i>
				<i v-else class="fa drop fa-tint exp-category-bullets-large smallIcon action-muted" style="border-color: inherit" />
				{{ boundary.properties.Name }} <span style="font-size: .95em" v-if="boundaryCount || boundaryCount === 0" :class="getMuted()">
					({{ h.formatNum(boundaryCount) }})
				</span>
			</h4>
		</div>
		<template v-else>
			<h4 class="title" style="margin-bottom: 6px;">{{ boundary.properties.Name }}</h4>
			<div class="variableRow hand" @click="toggleCollapse()">
				<i :class="dropClass()" class="fas drop fasVariable fa-left fa-circle exp-hiddable-inline"
					 @click.stop="toggleVisible()"></i>
				Cantidad de regiones
				<span class="hand exp-hiddable-inline">
					<chevron-down-icon v-if="boundary.SelectedVersion().LabelsCollapsed" title="Mostrar categorías" />
					<chevron-up-icon v-else title="Ocultar categorías" />
				</span>
			</div>
			<BoundaryChart v-if="useCharts && boundary.ShowChart == 1 && boundary.useChart()"
										 v-show="!boundary.SelectedVersion().LabelsCollapsed" :boundary="boundary" />
			<BoundaryValues :boundary="boundary" v-show="!boundary.SelectedVersion().LabelsCollapsed" />
		</template>

		<div class="sourceRow" v-if="!Embedded.Readonly">
			<div class="btn-group" style="float: left">
				<button v-for="(ver, index) in boundary.properties.Versions" :key="ver.Id" type="button"
								@click="changeSelectedVersionIndex(index)"
								class="btn btn-default btn-xs exp-serie-item"
								:class="getActive(index)">
					{{ ver.Name }}
				</button>
			</div>

			<Source style="float:right" :sourceTitle="boundary.properties.Name"
							@clickDownload="clickDescargar" @clickSource="clickFuente" />

			<div style="clear: both; height: 0px">
			</div>
		</div>
		<div class="exp-showable-block" style="margin-top: -1.25rem" />
	</div>
</template>

<script>
import BoundaryTopButtons from './boundaryTopButtons';
import BoundaryValues from './boundaryValues';
import BoundaryChart from './boundaryChart';
import DragHorizontal from 'vue-material-design-icons/DragHorizontal.vue';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import ChevronUpIcon from 'vue-material-design-icons/ChevronUp.vue';
import Helper from '@/map/js/helper';
import Source from './source';

export default {
	name: 'boundary',
	components: {
		BoundaryTopButtons,
		BoundaryValues,
		BoundaryChart,
		DragHorizontal,
		ChevronDownIcon,
		ChevronUpIcon,
		Source,
	},
	props: [
		'boundary',
		'clipping',
	],
	methods: {
		clickLabel(label) {
			label.Visible = !label.Visible;
			this.boundary.UpdateMap();
		},
		// Control maestro de la línea "Cantidad de regiones": muestra u oculta
		// TODO el boundary (a diferencia de clickLabel, que es por categoría).
		// Reconecta boundary.visible/ChangeVisibility, que en el caso con más
		// de una categoría ya no se dispara desde el título.
		toggleVisible() {
			this.boundary.ChangeVisibility();
		},
		dropClass() {
			return this.boundary.visible ? 'dropMetric' : 'dropMetricMuted';
		},
		toggleCollapse() {
			var version = this.boundary.SelectedVersion();
			// $set, no asignación directa: LabelsCollapsed no viene en el payload
			// de GetSelectedBoundary (mismo motivo que Values en ActiveBoundary.
			// UpdateSummary: una propiedad nueva en un objeto ya reactivo no es
			// detectada por Vue 2 sin $set/Vue.set).
			this.$set(version, 'LabelsCollapsed', !version.LabelsCollapsed);
			window.SegMap.SaveRoute.UpdateRoute();
		},
		getActive(index) {
			if (this.boundary.properties.Versions.length == 1) {
				return ' frozen';
			} else if (this.boundary.properties.SelectedVersionIndex === index) {
				return ' active';
			}
			return '';
		},
		getMuted() {
			if (this.boundary.IsUpdatingSummary) {
				return ' text-muted';
			} else {
				return '';
			}
		},
		changeSelectedVersionIndex(index) {
			this.boundary.SelectVersion(index);
		},
		remove(e) {
			e.preventDefault();
			this.boundary.Remove();
		},
		clickDescargar() {
			window.Popups.BoundaryDownload.show(this.boundary);
		},
		clickFuente() {
			window.Popups.ClippingMetadata.show(this.boundary.SelectedVersion().Metadata, this.boundary.properties.Name);
		},
	},
		computed: {
			Use() {
				return window.Use;
			},
			Embedded() {
				return window.Embedded;
			},
			useCharts() {
				return window.Use.UseCharts;
			},
			h() {
				return Helper;
			},
			boundaryCount() {
				return this.boundary.SelectedVersion().Count;
			},
			singleLabel() {
				return this.boundary.SelectedVersion().ValueLabels[0];
			}
		}
};
</script>

<style scoped>

.metricBlock
{
	padding-top: 1px;
	cursor: default;
}
	.smallIcon {
		font-size: 14px;
		margin-top: 2px
	}
.variableRow
{
	padding: 0.6rem 0rem 0rem 0rem;
}
.fa-left
{
	text-align: left;
	width: 12px;
	vertical-align: baseline;
}
.fasVariable
{
	font-size: 12px;
  vertical-align: top;
  padding-top: 4px;
  margin-right: 2px;
}
</style>
