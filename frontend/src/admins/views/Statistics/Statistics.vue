<template>
	<div>
		<div style="display: flex; margin-top: -10px;">
			<div style="margin-top: 26px;
    font-size: 16px; margin-left: 22px">Período:</div>
			<md-field style="max-width: 100px; margin-left: 20px;">
				<md-select md-dense v-model="currentMonth" ref="input" @md-selected="loadData">
					<md-option v-for="item in months" :key="item" :value="item">
						{{ item }}
					</md-option>
				</md-select>
			</md-field>
			<md-button v-if="!isSummarized" v-on:click="calculateStats" style="margin-left: 60px; margin-top: 15px;">
				<md-icon>data_usage</md-icon> Recalcular mes
			</md-button>
		</div>
		<invoker ref="invoker"></invoker>

		<md-card>
			<md-card-content>
				<md-tabs>
					<md-tab md-label="Resumen">
						<div class="md-layout">
							<div class="md-layout-item md-size-80" style="margin-top: -10px">
								<md-table style="max-width: 900px;" v-model="totals" md-card="">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Visitas">{{ item.Caption }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Valor">{{ item.Hits }}</md-table-cell>
									</md-table-row>
								</md-table>
							</div>

							<div class="md-layout-item md-size-80" style="margin-top: 15px">
								<md-table style="max-width: 900px;" v-model="resources" md-card="">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Recursos">{{ item.Caption }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Valor">{{ item.Hits }}</md-table-cell>
									</md-table-row>
								</md-table>
							</div>
						</div>
					</md-tab>

					<md-tab md-label="Cartografías">
						<div class="md-layout">
							<div class="md-layout-item md-size-100" style="margin-top: -10px">
								<md-table :key="componentKey" style="max-width: 1100px;" ref="table" v-model="works" md-card="" md-sort="Hits" md-sort-order="desc">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Cartografías" md-sort-by="Caption">{{ item.Caption }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Consultas" md-sort-by="Hits">{{ item.Hits }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Descargas" md-sort-by="Downloads">{{ item.Downloads }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Google" md-sort-by="Google">{{ item.Google }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Backoffice" md-sort-by="Backoffice">{{ item.Backoffice }}</md-table-cell>
										<md-table-cell md-label="Acciones" class="mpNoWrap">
											<md-button class="md-icon-button" title="Ver cartografía" @click="select(item)">
												<md-icon>visibility</md-icon>
											</md-button>
										</md-table-cell>
									</md-table-row>
								</md-table>
							</div>
						</div>
					</md-tab>

					<md-tab md-label="Indicadores">
						<div class="md-layout">
							<div class="md-layout-item md-size-80" style="margin-top: -10px">
								<md-table :key="componentKey" style="max-width: 900px;" v-model="metrics" md-sort="Hits" md-sort-order="desc" md-card="">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Indicadores" md-sort-by="Caption">{{ item.Caption }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Consultas" md-sort-by="Hits">{{ item.Hits }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Google" md-sort-by="Google">{{ item.Google }}</md-table-cell>
										<md-table-cell md-label="Acciones" class="mpNoWrap">
											<md-button class="md-icon-button" title="Ver indicador" @click="selectMetric(item)">
												<md-icon>visibility</md-icon>
											</md-button>
										</md-table-cell>
									</md-table-row>
								</md-table>
							</div>
						</div>
					</md-tab>

					<md-tab md-label="Tipos de descarga">
						<div class="md-layout">
							<div class="md-layout-item md-size-80" style="margin-top: -10px">
								<md-table :key="componentKey" style="max-width: 900px;" v-model="downloadTypes" md-sort="Hits" md-sort-order="desc" md-card="">
									<md-table-row slot="md-table-row" slot-scope="{ item }">
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Tipo de archivo" md-sort-by="Caption">{{ item.Caption }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Total" md-sort-by="Hits">{{ item.Hits }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Dataset" md-sort-by="Datos">{{ item.Datos }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Dataset+WKT" md-sort-by="WKT">{{ item.WKT }}</md-table-cell>
										<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Dataset+GeoJson" md-sort-by="GeoJson">{{ item.GeoJson }}</md-table-cell>
									</md-table-row>
								</md-table>
							</div>
						</div>
					</md-tab>
				</md-tabs>
			</md-card-content>
		</md-card>

	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';

export default {
	name: 'Statistics',
	data() {
		return {
			works: [],
			metrics: [],
			downloadTypes: [],
			totals: [],
			resources: [],
			months: [],
			localCache: [],
			mounted: false,
			isSummarized: false,
			currentMonth: null,
			componentKey: 0,
			};
	},
	computed: {

	},
	mounted() {
		this.mounted = true;
		this.loadData();
	},
	methods: {
		formatDate(date) {
			return f.formatDate(date);
		},
		getFromCache(month) {
			return this.localCache[month];
		},
		toCache(data) {
			var month = this.currentMonth;
			if (!month) {
				month = data.Months[0];
			}
			this.localCache[month] = data;
		},
		formatFullName(item)
		{
			if (!item.UserSubmission) {
				return item.UserSubmissionEmail;
			} else {
				return f.formatFullName(item.UserSubmission);
			}
		},
		calculateStats() {
			var loc = this;
			this.$refs.invoker.do(window.Db,
				window.Db.ProcessStatistics, this.currentMonth).then(function (data) {
					loc.toCache(null);
					loc.loadData();
				});
		},
		loadData() {
			if (!this.mounted) {
				return;
			}
			var fromCache = this.getFromCache(this.currentMonth);
			if (fromCache) {
				this.receiveData(fromCache);
			} else {
				var loc = this;
				this.$refs.invoker.do(window.Db, window.Db.GetStatistics, this.currentMonth).then(function (data) {
					loc.toCache(data);
					loc.receiveData(data);
				});
			}
		},
		receiveData(data) {
			this.isSummarized = data.IsSummarized;
			arr.Fill(this.works, data.Works);
			arr.Fill(this.totals, data.Totals);
			arr.Fill(this.resources, data.Resources);
			arr.Fill(this.metrics, data.Metrics);
			arr.Fill(this.downloadTypes, data.DownloadTypes);

			if (data.Months.length > 0) {
				this.currentMonth = this.months[0];
				arr.Fill(this.months, data.Months);
			}
			setTimeout(() => {
				this.componentKey++;
			}, 50);
		},
		getWorkUri(element) {
			return '/map/' + element.Id;
		},
		getMetricUri(element) {
			return '/map/#/l=' + element.Id;
		},
		select(element) {
			window.open(this.getWorkUri(element), '_blank');
		},
		selectMetric(element) {
			window.open(this.getMetricUri(element), '_blank');
		},
  },
  components: {

	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-dialog-actions {
  padding: 8px 20px 8px 24px !important;
}

.close-button {
    min-width: unset;
    height: unset;
    margin: unset;
    float: right;
}

</style>
