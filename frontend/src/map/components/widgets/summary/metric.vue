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
				<i v-if="singleLabel.Visible" :style="'border-color: ' + singleLabel.FillColor + '; color: ' + singleLabel.FillColor + dropBorder(singleLabel.FillColor)"
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
			<MetricVariables v-if="metric.IsMultiLevel() && metric.LastLevelDontMultilevel()" @variableChanged="variableChanged"
											 :metric="metric" :fixedLevel="metric.BottomLevel()" style="margin-bottom: -2rem;" />
			<MetricVariables :metric="metric" @variableChanged="variableChanged" />
		</template>
		<div class="coverageBox" v-if="hasLegends(metric.SelectedLevel())">
			<template v-for="variable, index in metric.SelectedLevel().Variables">
				<div v-if="(index === metric.SelectedLevel().SelectedVariableIndex || metric.SelectedLevel().Variables.length == 1) && variable.Legend !== null && variable.Legend !== ''" :key="index">
					<span style="padding-right: 2px;">{{ variable.Asterisk }}</span>{{ variable.Legend }}
				</div>
			</template>
		</div>
		<div class="sourceRow">
			<div v-if="false && metric.Compare.Active" style="margin-left: 2px; margin-top: -8px; margin-bottom: 8px;">

			</div>
			<div class="btn-group" v-if="!useComparer || !metric.Compare.Active" style="float: left">
				<button v-for="(ver, index) in metric.properties.Versions" :key="ver.Id" type="button"
								@click="changeSelectedVersionIndex(index)"
								class="btn btn-default btn-xs exp-serie-item"
								:class="getActive(index)">
					{{ ver.Version.Name }}
				</button>
			</div>
			<div class="btn-group" v-if="useComparer && metric.Compare.Active" style="float: left">
				<button v-for="pair in metric.Compare.GetVersionsWithComparableVariables()" :key="pair.version.Id" type="button"
								@click="changeSelectedVersionIndexCompare(pair.index)"
								class="btn btn-default btn-xs exp-serie-item"
								:class="getActiveCompare(pair.version)">
					{{ pair.version.Version.Name }}
				</button>
			</div>
			<template v-if="!Embedded.Readonly && useComparer && hasComparableVariables">
				<div style="float:left" class="exp-hiddable-block">
					<div style="float: left; margin-left: 10px; margin-top: 6px;">
						<switches style="transform: scale(0.8)" title="Comparar" v-model="compare" theme="bootstrap"
											color="default" @changed="toggleCompare()"></switches>
					</div>
					<div v-if="compare" class="compareLabel">
						{{ compareContent }}
						<a href="#" @click="clickCompareFuente" v-if="hasCompareMetadata()"
							 title="Fuente de comparación" style="color: #a7a7a7">
							<link-icon />
						</a>
					</div>
					<div v-else style="color: #A7A7A7; cursor: pointer" class="compareLabel" @click="toggleCompare">
						Comparar
					</div>
				</div>
			</template>

			<Source :sourceTitle="metric.properties.Metric.Name" v-if="!Embedded.Readonly" style="float: right"
							@clickDownload="clickDescargar" @clickSource="clickFuente" :small="compare" />
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
import Switches from 'vue-switches';
//https://github.com/drewjbartlett/vue-switches
import MetricDropdown from './metricDropdown';
	import Source from './source';
	import arr from '@/common/framework/arr';
	import color from '@/common/framework/color';

	import Ranking from './ranking';
	import LinkIcon from 'vue-material-design-icons/Link.vue';
import DragHorizontal from 'vue-material-design-icons/DragHorizontal.vue';
import Helper from '@/map/js/helper';
import 'vue-slider-component/theme/default.css';
// slider doc: https://nightcatsama.github.io/vue-slider-component/#/api/methods

export default {
	name: 'metric',
	components: {
		MetricDropdown,
		Source,
		Switches,
		DragHorizontal,
		MetricVariables,
		Ranking,
		LinkIcon
	},
	props: [
		'metric',
		'clipping',
		],
	data() {
		return {
			compareVersions: [null, null],
			lastVersionClicked: -1,
			compare: false
		};
	},
		mounted() {
			if (this.metric.Compare.Active) {
				this.compare = true;
			}
	},
		methods: {
			dropBorder(dropColor) {
				if (color.IsReallyLightColor(dropColor)) {
					var strokeColor = color.ReduceColor(dropColor, .5);
					return '; text-shadow: 0 0 1px ' + strokeColor + '; font-size: 13px';
				}
				else {
					return '';
				}
			},
			getActiveCompare(version) {
				var minIndex = this.compareVersions[0];
				var maxIndex = this.compareVersions[1];
				if (this.metric.properties.Versions.length == 1) {
					return ' frozen';
				} else if (minIndex === version.Version.Name || maxIndex === version.Version.Name) {
					return ' active';
				}
				return '';
			},
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
			this.metric.RefreshMap();
		},
		clickDescargar() {
			window.Popups.MetricDownload.show(this.metric);
		},
		clickFuente() {
			window.Popups.WorkMetadata.showByMetric(this.metric, this.metric.properties.Metric.Name);
		},
		hasCompareMetadata() {
				return this.metric.SelectedLevel().GeographyId !== this.metric.Compare.SelectedLevel().GeographyId;
		},
		clickCompareFuente() {
			var geographyId = this.metric.SelectedLevel().GeographyId;
			var compareGeographyId = this.metric.Compare.SelectedLevel().GeographyId;
			var meta = this.metric.properties.ComparableMetadata;
			for (var item of meta.TupleGeography) {
				if (item.GeographyId === geographyId && item.CompareGeographyId === compareGeographyId) {
					var item = arr.GetById(meta.Metadata, item.MetadataId);
					window.Popups.CompareMetadata.show(item, this.metric.properties.Metric.Name);
					return;
				}
			}
			alert("No se ha encontrado metadatos para esta comparación.");
		},
		toggleCompare() {
			var loc = this;
			if (!this.metric.Compare.Active) {
				loc.metric.Compare.Active = true;
				this.compare = true;
				loc.updateCompareVersions();
			} else {
				loc.metric.Compare.Active = false;
				this.compare = false;
			}
			loc.metric.UpdateSummary();
			loc.metric.UpdateMap();

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
			changeSelectedVersionIndexCompare(index) {
				// tiene que decidir si deselecciona el derecho o el izquierdo
				var minIndex = this.versionsArray.indexOf(this.compareVersions[0]);
				var maxIndex = this.versionsArray.indexOf(this.compareVersions[1]);
				if (index === minIndex || index === maxIndex) {
					this.lastVersionClicked = index;
					return;
				}
				// si es inferior al inferior, es compare
				if (index < minIndex) {
					this.metric.Compare.SelectVersion(index);
					this.updateCompareVersions();
					return;
				}
				// si es superior al mayor, es version
				if (index > maxIndex) {
					this.metric.SelectVersion(index);
					this.updateCompareVersions();
					return;
				}
				//
				if (this.lastVersionClicked !== -1) {
					if (this.lastVersionClicked == maxIndex) {
						this.metric.SelectVersion(index);
					} else {
						this.metric.Compare.SelectVersion(index);
					}
					this.lastVersionClicked = index;
					this.updateCompareVersions();
					return;
				}
				this.metric.Compare.SelectVersion(index);
				this.updateCompareVersions();
				this.lastVersionClicked = index;
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
			variableChanged() {
				if (this.metric.Compare.Active && !this.metric.hasComparableVariables()) {
					this.toggleCompare();
				}
				this.updateCompareVersions();
			},
			updateCompareVersions() {
				if (!this.metric.Compare.Active) {
					return;
				}
				if (this.metric.Compare.SelectedVersion() &&
					this.metric.Compare.SelectedVersionIndex > this.metric.properties.SelectedVersionIndex) {
					this.metric.Compare.SelectedVersionIndex = this.metric.properties.SelectedVersionIndex;
				}
				if (this.metric.Compare.SelectedVersion() &&
					this.metric.Compare.SelectedVersionIndex == 0 && this.metric.properties.SelectedVersionIndex == 0) {
					this.metric.properties.SelectedVersionIndex = 1;
				}

				var versionsArray = this.metric.Compare.GetVersionsWithComparableVariables();
				var versionCompare = this.metric.Compare.SelectedVersion();

				if (versionCompare) {
					// avanza si ambas están en lo comparable
					if (this.versionsAreOk(versionsArray)) {
						this.compareVersions = [versionCompare.Version.Name, this.metric.SelectedVersion().Version.Name];
						window.SegMap.SaveRoute.UpdateRoute();
						return;
					}
					// Trata de moverlo...
					// Se fija si lo puede atrasar
					var selectedVersion = this.metric.SelectedVersion();
					if (versionCompare.Version === selectedVersion) {
						for (var i = 1; i < versionsArray.length; i++) {
							if (versionsArray[i] === versionCompare.Version.Name) {
								this.metric.Compare.SelectVersion(i - 1);
								versionCompare = this.metric.Compare.SelectedVersion();
								break;
							}
						}
					}
					// Se fija si lo puede adelantar
					if (versionCompare.Version === selectedVersion.Version) {
						for (var i = this.metric.SelectedVersionIdex + 1; i < versionsArray.length; i++) {
							if (versionsArray[i] !== selectedVersion.Version.Name) {
								this.metric.SelectVersion(i);
								selectedVersion = this.metric.SelectedVersion();
								break;
							}
						}
					}
					if (this.versionsAreOk(versionsArray)) {
						this.compareVersions = [versionCompare.Version.Name, this.metric.SelectedVersion().Version.Name];
						window.SegMap.SaveRoute.UpdateRoute();
						return;
					}
				}

				// No tiene nada indicado... pone algo
				var v1, v2;
				if (versionsArray.length == 1) {
					v1 = versionsArray[0];
					v2 = versionsArray[0];
				} else {
					v1 = versionsArray[versionsArray.length - 2];
					v2 = versionsArray[versionsArray.length - 1];
				}
				// Las actualiza
				if (this.metric.Compare.SelectedVersionIdex !== v1.index) {
					this.metric.Compare.SelectVersion(v1.index);
				}
				if (this.metric.properties.SelectedVersionIdex !== v2.index) {
					this.metric.SelectVersion(v2.index);
				}
				this.compareVersions = [v1.version.Version.Name, v2.version.Version.Name];
				window.SegMap.SaveRoute.UpdateRoute();
		},
			versionsAreOk(versionsArray) {
				var versionCompare = this.metric.Compare.SelectedVersion();
				if (versionCompare) {
					// avanza si ambas están en lo comparable
					var selectedVersion = this.metric.SelectedVersion();
					if (versionCompare.Version.Name != selectedVersion.Version.Name &&
						this.inVersionsArray(versionsArray, versionCompare.Version)
						&& this.inVersionsArray(versionsArray, selectedVersion.Version) &&
						this.metric.properties.SelectedVersionIndex > this.metric.Compare.SelectedVersionIndex) {
						return true;
					}
				}
				return false;
			},
		rankingShown() {
			var vScrollTo = require('vue-scrollto');
			var loc = this;
			setTimeout(function () {
				vScrollTo.scrollTo(loc.$refs.rankings, 500, { container: '#panRight', force: false });
			}, 100);
		},
		inVersionsArray(versionsArray, version) {
				for (var arrVersion of versionsArray) {
					if (arrVersion.version.Version.Name == version.Name) {
						return true;
					}
				}
				return false;
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
		hasComparableVariables() {
			return this.metric.hasComparableVariables();
		},
			Embedded() {
				return window.Embedded;
		},
		compareContent() {
			if (this.compareVersions[0] == null || this.compareVersions[1] == null) {
				return "Iniciando...";
			} else {
				return "Comparación " + this.compareVersions[0] + "-" + this.compareVersions[1];
			}
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
		},
		watch: {
			'metric'() {
				this.compare = this.metric.Compare.Active;
			},
			'compare'() {
				this.metric.Compare.Active = this.compare;
				//this.toggleCompare();
				if (this.metric.Compare.Active) {
					this.updateCompareVersions();
				}
				this.metric.UpdateSummary();
				this.metric.UpdateMap();
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
	.vue-switcher-theme--bootstrap.vue-switcher-color--default div:after {
		background-color: #888;
	}

	.vue-switcher-theme--bootstrap.vue-switcher-color--default div {
		background-color: #d7d7d7;
	}

	.vue-switcher-theme--bootstrap.vue-switcher-color--default.vue-switcher--unchecked div:after {
		background-color: #b3b3b3;
	}

	.vue-switcher-theme--bootstrap.vue-switcher-color--default.vue-switcher--unchecked div {
		background-color: #ebebeb;
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

	.compareLabel {
		margin-top: 4px;
		margin-left: 4px;
		float: left;
	}
</style>
