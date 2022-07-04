<template>
	<div>
		<title-bar title="Estadísticas" :help="`<p>
		En el panel de estadísticas puede ver la cantidad de visitas que tuvo la cartografía desde que fue publicada.
		</p>`" />
		<div class="app-container">
		<invoker ref="invoker"></invoker>

		<div class="md-layout md-gutter">
			<div class="md-layout-item md-size-80 md-small-size-100">
				<md-card>
					<div class="md-layout-item md-size-100" style="padding: 10px 18px; margin-bottom: -34px">
						<span class="largeText">
							Período:
						</span>
						<span>
							<md-radio v-model="useHistory" class="md-primary medium-radio" @change="UpdateData" :value="false"></md-radio>
							Recientes
						</span>
						<span>
							<md-radio v-model="useHistory" class="md-primary medium-radio" @change="UpdateData" :value="true"></md-radio>
							Histórico:
							<mp-select :modelKey="true" :list="historyPeriods" v-model="currentPeriod" :canEdit="useHistory"
												 :allow-null="false" @selected="UpdateData" style="width: 220px; margin-left: 10px; display: inline-block"></mp-select>
						</span>
					</div>

					<md-card-content>
						<md-tabs>
							<md-tab md-label="General">
								<hits-table :list="general" label="General" :loading="loading" :periods="periods" style="margin-top: -10px" />
							</md-tab>
							<md-tab md-label="Consultas">
								<hits-table :list="hits" label="Indicadores" :loading="loading" :periods="periods" style="margin-top: -10px" />
							</md-tab>
							<md-tab md-label="Descargas">
								<hits-table :list="downloads" label="Datasets" :loading="loading" :periods="periods" style="margin-top: -10px" />
								<hits-table :list="attachments" label="Adjuntos" :loading="loading" :periods="periods" :showMessageOnEmpty="false" style="margin-top: 15px" />
							</md-tab>
							<md-tab md-label="Visitas por región">
								<div class="md-layout" style="margin-top: -10px">
									<div class="md-layout-item md-size-90 md-xlarge-size-60 md-small-size-100">
										<md-table v-model="regions" md-card="" v-if="!loading && regions.length > 0">
											<md-table-row slot="md-table-row" slot-scope="{ item }">
												<md-table-cell md-label="Visitas por región" :style="padTabbed(item.Caption)">{{ item.Caption }}</md-table-cell>
												<template v-for="(period, index) in periods">
													<md-table-cell :md-label="dateFormatter.FormatLabelMonth(period, false)" :key="period">{{ item['Values' + index] }}</md-table-cell>
												</template>
											</md-table-row>
										</md-table>
										<div v-else>
											<span v-if="!loading">
												No hay actividad registrada para este período.
											</span>
										</div>
									</div>
								</div>
							</md-tab>
						</md-tabs>
					</md-card-content>
				</md-card>
			</div>
		</div>
		</div>
	</div>
</template>

<script>

import HitsTable from './HitsTable';
import str from '@/common/framework/str';
import date from '@/common/framework/date';

export default {
	name: 'Statistics',
	data() {
		return {
			useHistory: false,
			currentPeriod: null,
			regions: [],
			hits: [],
			downloads: [],
			attachments: [],
			general: [],
			periods: [],
			dataCache: {},
			loading: false
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		dateFormatter() {
			return date;
		},
		historyPeriods() {
			var ret = [];
			for (var item of this.Work.StatsQuarters) {
				ret.push({ Id: item, Caption: date.FormatLabelQuarter(item) });
			}
			/*for (var item of this.Work.StatsMonths) {
				ret.push({ Id: item, Caption: item });
			}*/
			return ret;
		},
		key() {
			var month = (this.useHistory ? this.currentPeriod : null);
			if (month) {
				return month;
			} else {
				return 'null';
			}
		},
		stableUrlHref() {
			var url = str.AbsoluteUrl(this.Work.PublicUrl());
			if (url) {
				return " (<a href='" + url + "' target='_blank'>" + url + "</a>)";
			} else {
				return "";
			}
		},
	},
	mounted() {
		if (this.historyPeriods.length > 0) {
			this.currentPeriod = this.historyPeriods[0].Id;
		}
		this.GetData();
	},
	methods: {
		UpdateData() {
			if (this.dataCache[this.key]) {
				this.LoadData(this.dataCache[this.key]);
			} else {
				this.GetData(this.key);
			}
		},
		GetData(key) {
			var loc = this;
			this.loading = true;
			this.$refs.invoker.doMessage('Obteniendo información', this.Work,
				this.Work.GetWorkStatistics, key).then(function (data) {
					loc.dataCache[key] = data;
					loc.LoadData(data);
					loc.loading = false;
				}).catch(function () {
					loc.loading = false;
				});
			return true;
		},
		LoadData(data) {
			this.regions = this.processList(data.region);
			this.general = this.processList(data.work);
			this.hits = this.processList(data.metric);
			this.downloads = this.processList(data.download);
			this.attachments = this.processList(data.attachment);
			this.periods = data.periods;
		},
		padTabbed(text) {
			if (text && text.length > 0 && text[0] == "\t") {
				return 'padding-left: 20px';
			} else {
				return '';
			}
		},
		processList(list) {
			var ret = [];
			for (var key in list) {
				// check if the property/key is defined in the object itself, not in parent
				if (list.hasOwnProperty(key)) {
					ret.push({
						Caption: key,
						Values0: list[key].d0, Values1: list[key].d1, Values2: list[key].d2
					});
				}
			}
			return ret;
		}
	},
	components: {
		HitsTable
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.medium-radio {
		margin: 8px 6px 8px 30px;
		vertical-align: sub;
	}

</style>
