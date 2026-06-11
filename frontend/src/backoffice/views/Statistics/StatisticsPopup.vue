<template>
	<div>
		<md-dialog :md-active.sync="open" class="statisticsPopup">
			<md-dialog-title>Estadísticas</md-dialog-title>
			<invoker ref="invoker"></invoker>
			<md-dialog-content>
				<div class="md-layout-item md-size-100" style="padding: 0 0 6px 0; margin-bottom: -20px; margin-top: -15px;">
					<span class="largeText">Período: </span>
					<span>
						<md-radio v-model="useHistory" class="md-primary medium-radio" @change="UpdateData" :value="false"></md-radio>
						Recientes
					</span>
					<span>
						<md-radio v-model="useHistory" class="md-primary medium-radio" @change="UpdateData" :value="true"></md-radio>
						Histórico:
						<mp-select :modelKey="true" :list="historyPeriods" v-model="currentPeriod" :canEdit="useHistory"
											 :allow-null="false" @selected="UpdateData" style="width: 250px; margin-left: 10px; display: inline-block"></mp-select>
					</span>
				</div>
				<md-tabs md-dynamic-height>
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
					<md-tab md-label="Por región">
						<div class="md-layout" style="margin-top: -10px">
							<div class="md-layout-item md-size-100">
								<md-table v-model="regions" md-card="" v-if="!loading && regions.length > 0">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell md-label="Región" :style="padTabbed(item.Caption)">{{ item.Caption }}</md-table-cell>
										<template v-for="(period, index) in periods">
											<md-table-cell :md-label="dateFormatter.FormatLabelMonth(period, false)" :key="period">{{ item['Values' + index] }}</md-table-cell>
										</template>
									</md-table-row>
								</md-table>
								<div v-else style="margin-top: 10px;">
									<span v-if="!loading">No hay actividad registrada para este período.</span>
								</div>
							</div>
						</div>
					</md-tab>
				</md-tabs>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="open = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import HitsTable from '@/backoffice/views/Statistics/HitsTable';
import date from '@/common/framework/date';

export default {
	name: 'StatisticsPopup',
	data() {
		return {
			open: false,
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
		Work() { return window.Context.CurrentWork; },
		dateFormatter() { return date; },
		historyPeriods() {
			return this.Work.StatsQuarters.map(item => ({
				Id: item, Caption: date.FormatLabelQuarter(item)
			}));
		},
		key() {
			return (this.useHistory && this.currentPeriod) ? this.currentPeriod : 'null';
		}
	},
	methods: {
		show() {
			this.dataCache = {};
			this.useHistory = false;
			if (this.historyPeriods.length > 0) {
				this.currentPeriod = this.historyPeriods[0].Id;
			}
			this.open = true;
			this.GetData();
		},
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
				}).catch(function () { loc.loading = false; });
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
			return (text && text[0] === '\t') ? 'padding-left: 20px' : '';
		},
		processList(list) {
			var ret = [];
			for (var key in list) {
				if (list.hasOwnProperty(key)) {
					ret.push({ Caption: key, Values0: list[key].d0, Values1: list[key].d1, Values2: list[key].d2 });
				}
			}
			return ret;
		}
	},
	components: { HitsTable }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.medium-radio {
	margin: 8px 6px 8px 30px;
	vertical-align: sub;
}
</style>

<style rel="stylesheet/scss" lang="scss">
.statisticsPopup .md-dialog-container {
	max-width: 820px;
	width: 820px;
}

/* Altura estable: mínimo cómodo para que no colapse,
   tope con scroll para que no se estire en pantallas grandes. */
.statisticsPopup .md-dialog-content {
	min-height: 360px;
	max-height: 70vh;
	overflow-y: auto;
}

/* El md-tab trae padding: 16px que recorta el ancho útil de la tabla. */
.statisticsPopup .md-tab {
	padding: 0 !important;
}

/* La tabla debe ocupar todo el ancho del tab en lugar de quedar
   con un ancho mínimo y scroll horizontal. */
.statisticsPopup .md-table,
.statisticsPopup .md-table-content,
.statisticsPopup .md-table .md-content {
	width: 100% !important;
	max-width: 100% !important;
}
</style>
