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
		<md-card-content>
			<md-tabs>

				<md-tab md-label="General">
					<hits-table :list="general" label="General" style="margin-top: -10px" />
				</md-tab>

				<md-tab md-label="Consultas">
					<hits-table :list="hits" label="Indicadores" style="margin-top: -10px" />
				</md-tab>

				<md-tab md-label="Descargas">
					<hits-table :list="downloads" label="Datasets" style="margin-top: -10px" />
					<hits-table :list="attachments" label="Adjuntos" style="margin-top: 15px" />
				</md-tab>

				<md-tab md-label="Visitas por región">
					<div class="md-layout" style="margin-top: -10px">
						<div class="md-layout-item md-size-90 md-xlarge-size-60 md-small-size-100">
							<md-table v-model="regions" md-card="">
								<md-table-row slot="md-table-row" slot-scope="{ item }">
									<md-table-cell md-label="Visitas por región" :style="padTabbed(item.Caption)">{{ item.Caption }}</md-table-cell>
									<md-table-cell md-label="90 días">{{ item.LastQuarter }}</md-table-cell>
									<md-table-cell md-label="30 días">{{ item.LastMonth }}</md-table-cell>
									<md-table-cell md-label="7 días">{{ item.LastWeek }}</md-table-cell>
								</md-table-row>
							</md-table>
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
import str from '@/common/js/str';

export default {
	name: 'Statistics',
	data() {
		return {
			regions: [],
			hits: [],
			downloads: [],
			attachments: [],
			general: [],
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
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
		this.LoadData();
	},
	methods: {
		LoadData() {
			var loc = this;
			this.$refs.invoker.do(this.Work,
				this.Work.GetWorkStatistics).then(function (data) {
					loc.regions = loc.processList(data.region);
					loc.general = loc.processList(data.work);
					loc.hits = loc.processList(data.metric);
					loc.downloads = loc.processList(data.download);
					loc.attachments = loc.processList(data.attachment);
				});
			return true;
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
					ret.push({ Caption: key, LastQuarter: list[key].d0, LastMonth: list[key].d1, LastWeek: list[key].d2 });
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


</style>
