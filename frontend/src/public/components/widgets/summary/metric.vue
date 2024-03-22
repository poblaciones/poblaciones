<template>
	<div class="metricPanel">
		<div class="dragHandle exp-hiddable-block" v-if="!metric.IsLocked">
			<div style="top: -10px; position: absolute; left: 0; right: 0">
				<drag-horizontal title="Arrastrar para reubicar" />
			</div>
		</div>
		<template v-if="!Embedded.Readonly">
			<MetricDropdown v-if="!Embedded.Readonly" :metric="metric" :clipping="clipping" :key="metric.index"
											class="exp-hiddable-block" @RankingShown="rankingShown" />
		</template>
		<div v-if="isSimpleMetric && metric.SelectedVersion().Levels.length < 2">
			<h4 class="title" @click="clickLabel(singleLabel)" style="margin-bottom: 6px;cursor: pointer">
				<i v-if="singleLabel.Visible" :style="'border-color: ' + singleLabel.FillColor + '; color: ' + singleLabel.FillColor"
					 class="fa drop fa-tint exp-category-bullets-large smallIcon"></i>
				<i v-else class="fa drop fa-tint exp-category-bullets-large smallIcon action-muted" style="border-color: inherit" />
				{{ metric.properties.Metric.Name }} <span style="font-size: .95em" v-show="h.formatNum(singleLabel.Values.Count) !== '-'">
					({{ h.formatNum(singleLabel.Values.Count) }})
				</span>
			</h4>
			<mp-partition-badge :metric="metric" style="padding-bottom: 7px;" />

			<mp-filter-badge style="margin-top: 0.3rem; margin-bottom: 0.9rem;" v-if="hasUrbanityFilter && urbanity != 'N'"
											 :title="getUrbanityTextActive" :tooltip="getUrbanityTextTooltip"
											 @click="changeUrbanity('N')" />
		</div>
		<template v-else>
			<h4 class="title">
				{{ metric.properties.Metric.Name }}
			</h4>
			<mp-partition-badge :metric="metric" />

			<mp-filter-badge style="margin-top: 0.9rem;" v-if="hasUrbanityFilter && urbanity != 'N'"
											 :title="getUrbanityTextActive" :tooltip="getUrbanityTextTooltip"
											 @click="changeUrbanity('N')" />
			<MetricVariables v-if="metric.IsMultiLevel() && metric.LastLevelDontMultilevel()"
											 :metric="metric" :fixedLevel="metric.BottomLevel()" style="margin-bottom: -2rem;" />
			<MetricVariables :metric="metric" />
		</template>
		<div class="coverageBox" v-if="hasLegends(metric.SelectedLevel())">
			<template v-for="variable, index in metric.SelectedLevel().Variables">
				<div v-if="(index === metric.SelectedLevel().SelectedVariableIndex || metric.SelectedLevel().Variables.length == 1) && variable.Legend !== null && variable.Legend !== ''" :key="index">
					<span style="padding-right: 2px;">{{ variable.Asterisk }}</span>{{ variable.Legend }}
				</div>
			</template>
		</div>
		<div class="sourceRow">
			<div class="btn-group" v-if="!useComparer || !metric.Compare.Active" style="float: left">
				<button v-for="(ver, index) in metric.properties.Versions" :key="ver.Id" type="button"
								@click="changeSelectedVersionIndex(index)"
								class="btn btn-default btn-xs exp-serie-item"
								:class="getActive(index)">
					{{ ver.Version.Name }}
				</button>
			</div>
			<div style="padding: 0px 20px 20px 20px; float: left " v-if="useComparer && metric.Compare.Active">
				<vue-slider v-model="compareVersions" tooltip="none" :marks="true" :adsorb="true"
										labelStyle="font-size: 12px;" :width="(35 * versionsArray.length)"
										labelActiveStyle="active"
										:dotSize="14" :data="versionsArray" :lazy="true" @change="sliderChanged" :enableCross="false" :minRange="1"></vue-slider>
			</div>
			<div class="btn-group" style="float: left" v-if="!Embedded.Readonly && useComparer">
				<button type="button"
								@click="toggleCompare()"
								class="btn btn-default btn-xs exp-serie-item"
								:class="(metric.Compare.Active ? 'active' : '')">
					Dif. %
				</button>
			</div>
			<Source :sourceTitle="metric.properties.Metric.Name" v-if="!Embedded.Readonly" style="float: right"
							@clickDownload="clickDescargar" @clickSource="clickFuente" />
			<div style="clear: both; height: 0px"></div>
		</div>
			<div class="coverageBox" v-if="metric.SelectedVersion().Version.PartialCoverage">
				Cobertura: {{ metric.SelectedVersion().Version.PartialCoverage }}.
			</div>
			<div ref="rankings" v-if="metric.ShowRanking && metric.useRankings()" class="rankingBox">
				<Ranking :metric="metric" :clipping="clipping" />
			</div>
		</div>
</template>
<script>
import MetricVariables from './metricVariables';
import MetricDropdown from './metricDropdown';
import Source from './source';
import Ranking from './ranking';
import DragHorizontal from 'vue-material-design-icons/DragHorizontal.vue';
import Helper from '@/public/js/helper';
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';
// slider doc: https://nightcatsama.github.io/vue-slider-component/#/api/methods

export default {
	name: 'metric',
	components: {
		MetricDropdown,
		Source,
		DragHorizontal,
		MetricVariables,
		VueSlider,
		Ranking,
	},
	props: [
		'metric',
		'clipping',
		],
	data() {
		return { compareVersions: [null, null] };
	},
	mounted() {
		this.updateCompareVersions();
	},
	methods: {
		getActive(index) {
			if (this.metric.properties.Versions.length == 1) {
				return ' frozen';
			} else if (this.metric.properties.SelectedVersionIndex === index) {
				return ' active';
			}
			return '';
		},
		clickLabel(label) {
			label.Visible = !label.Visible;
			this.metric.UpdateMap();
		},
		clickDescargar() {
			window.Popups.MetricDownload.show(this.metric);
		},
		clickFuente() {
			window.Popups.WorkMetadata.showByMetric(this.metric, this.metric.properties.Metric.Name);
		},
		toggleCompare() {
			var loc = this;
			if (!this.metric.Compare.Active) {
				// Obtiene los geographyTuples antes de habilitar la opción...
				window.SegMap.GetGeographyTuples().then(function () {
					loc.metric.Compare.Active = true;
					loc.updateCompareVersions();
					loc.metric.UpdateSummary();
					loc.metric.UpdateMap();
				});
			} else {
				loc.metric.Compare.Active = false;
				loc.metric.UpdateSummary();
				loc.metric.UpdateMap();
			}
		},
		hasLegends(level) {
			for (var variable of level.Variables) {
				if (variable.Legend !== null && variable.Legend.length > 0) {
					return true;
				}
			}
			return false;
		},
		sliderChanged(value) {
			var minIndex = this.versionsArray.indexOf(value[0]);
			var maxIndex = this.versionsArray.indexOf(value[1]);

			if (minIndex != this.metric.Compare.SelectedVersionIndex) {
				this.metric.Compare.SelectVersion(minIndex);
			}
			if (maxIndex != this.metric.SelectedVersionIndex) {
				this.metric.SelectVersion(maxIndex);
			}
		},
		changeSelectedVersionIndex(index) {
			this.metric.SelectVersion(index);
		},
		changeUrbanity(mode) {
			this.metric.properties.SelectedUrbanity = mode;
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
		},
		changeMetricVisibility() {
			this.metric.ChangeMetricVisibility();
		},
		updateCompareVersions() {
			if (!this.metric.Compare.Active) {
				return;
			}
			var version = this.metric.Compare.SelectedVersion();
			if (version) {
				this.compareVersions = [version.Version.Name, this.metric.SelectedVersion().Version.Name];
				return;
			}
			// No tiene nada indicado... pone algo
			var versionsArray = this.versionsArray;
			if (versionsArray.length == 1) {
				this.compareVersions = [versionsArray[0], versionsArray[0]];
			} else {
				this.compareVersions = [versionsArray[versionsArray.length - 2], versionsArray[versionsArray.length -1]];
			}
		},
		rankingShown() {
			var vScrollTo = require('vue-scrollto');
			var loc = this;
			setTimeout(function () {
				vScrollTo.scrollTo(loc.$refs.rankings, 500, { container: '#panRight', force: false });
			}, 100);
		},
		remove(e) {
			e.preventDefault();
			this.metric.Remove();
		}
	},
	computed: {
			Use() {
				return window.Use;
			},
			Embedded() {
				return window.Embedded;
			},
		useComparer() {
			return window.Use.UseCompareSeries && this.metric.properties.Comparable && this.metric.properties.Versions.length > 1;
		},
			urbanity() {
				return this.metric.properties.SelectedUrbanity;
			},
			h() {
				return Helper;
			},
			hasUrbanityFilter() {
				return this.Use.UseUrbanity && this.metric.SelectedLevel().HasUrbanity;
		},
		versionsArray() {
			var ret = [];
			for (var version of this.metric.properties.Versions) {
				ret.push(version.Version.Name);
			}
			return ret;
		},
		getUrbanityTextTooltip() {
				return this.metric.GetSelectedUrbanityInfo().tooltip;
			},
			getUrbanityTextActive() {
				return this.metric.GetSelectedUrbanityInfo().label;
			},
			isSimpleMetric() {
				return (this.metric.SelectedLevel().Variables.length === 1 &&
					this.metric.SelectedLevel().Variables[0].IsSimpleCount && this.metric.SelectedLevel().Variables[0].ValueLabels.length === 1);
			},
			singleLabel() {
				var variable = this.metric.SelectedLevel().Variables[0];
				return variable.ValueLabels[0];
			}
		}
};
</script>
<style>
.vue-slider-process {
	background-color: #666 !important;
}
	.vue-slider-mark-label {
		font-size: 12px !important;
		border-radius: 26px;
		border-style: solid;
		padding: 2px 5px;
		border-radius: 20px;
		box-sizing: border-box;
		border-width: 2px;
		background-color: transparent;
		font-weight: 500;
		border-color: #66615B;
		color: #66615B;
	}

	.vue-slider-mark-label-active {
		color: #333;
		background-color: #d4d4d4;
	}
	.vue-slider-dot-handle-focus {
		box-shadow: 0px 0px 1px 2px rgba(90, 90, 90, 0.36) !important;
	}
</style>
<style scoped >
	.metricBlock {
		padding-top: 1px;
		cursor: default;
	}

	.rankingBox {
		padding: 16px 0px 0px 0px;
	}

	.smallIcon {
		font-size: 14px;
		margin-top: 2px
	}
</style>
