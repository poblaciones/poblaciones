<template>
	<Modal title="Descargar" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="metric">
			<div class="fld">
				<div class="fld-label">Fuente</div>
				<div class="fld-value">{{ version.Work.Metadata.Name }}</div>
			</div>
			<div class="fld" v-if="version.Work.Type !== 'P' && version.Work.Metadata.Authors">
				<div class="fld-label">Autores</div>
				<div class="fld-value">{{ version.Work.Metadata.Authors }}</div>
			</div>
			<div class="fld">
				<div class="fld-label">Dataset</div>
				<div class="fld-value">{{ level.Dataset.Name }}</div>
			</div>
			<div class="fld">
				<div class="fld-label">Licencia</div>
				<div class="fld-value">
					<creativeCommons :license="version.Work.Metadata.License" />
				</div>
			</div>
			<div class="fld-pair">
				<div class="fld">
					<div class="fld-label">Nivel</div>
					<div class="fld-value" v-if="version.Levels.length > 1 && !metric.Compare.Active">
						<select :disabled="!visibleUrl" v-model="downloadLevel">
							<option v-for="(level, index) in version.Levels" :key="level.Id" :value="index">{{ level.Name }}</option>
						</select>
						<div v-if="useFilter && levelOverflows" class="warningBox">
							Las áreas del nivel '{{ level.Name }}' pueden exceder a las regiones seleccionadas. Cuando esto
							suceda, las áreas parcialmente coincidentes serán incluidas en forma completa en la descarga.
						</div>
					</div>
					<div class="fld-value" v-else>{{ level.Name }}</div>
				</div>
				<div class="fld" v-if="hasUrbanityFilter">
					<div class="fld-label">Filtro</div>
					<div class="fld-value">
						<select :disabled="!visibleUrl" v-model="downloadUrbanity">
							<option v-for="(value, key) in metric.GetUrbanityFilters()" :key="key" :value="key">{{ value.label }}</option>
						</select>
						<div class="warningBox">
							{{ metric.GetUrbanityFilters()[downloadUrbanity].tooltip }}
						</div>
					</div>
				</div>
			</div>
			<div class="fld" v-if="useFilter">
				<div class="fld-label">Selección</div>
				<div class="fld-value fld-chips">
					<div v-for="region in regions" :key="region.Id" class="filterElement">
						{{ region.Name }}
						<mp-close-button @click="removeFilter(region.Id)" title="Quitar filtro"
														 class="exp-hiddable-block filterElement-close" />
					</div>
				</div>
			</div>
			<div class="fld" v-if="hasPartitions">
				<div class="fld-label">{{ partitions.Name }}</div>
				<div class="fld-value">
					<select v-model="downloadPartition">
						<option v-for="item in partitions.Values" :key="item.Value" :value="item.Value">{{ item.Caption }}</option>
					</select>
				</div>
			</div>
			<div class="fld">
				<div class="fld-label">Descarga</div>
				<div class="fld-value">
					<div v-if="visibleUrl" class="btn-set">
						<button @click="process($event, format.key)" v-for="format in getDataFormats()" :key="format.key" class="mp-btn mp-btn--solid">
							<download-icon title="Descargar" /> {{ format.caption }}
						</button>
						<button @click="sendFile(resolveMetadataUrl(), true)" class="mp-btn mp-btn--solid">
							<i class="far fa-file-pdf" /> Metadatos
						</button>
						<button @click="sendFile(resolveMetadataDictionaryUrl(), true)" class="mp-btn mp-btn--solid">
							<i class="far fa-file-excel" /> Diccionario de datos
						</button>
					</div>
					<div v-else>
						<img src="/static/img/spinner.gif"> Generando el archivo. El proceso puede demorar varios minutos... {{ (progress ? '(' + progress + '%)' : '') }}
					</div>
				</div>
			</div>
			<div class="fld" v-if="version.Work.Metadata.Files && version.Work.Metadata.Files.length > 0">
				<div class="fld-label">Adjuntos</div>
				<div class="fld-value">
					<div class="attachmentsDownloadPanel">
						<span v-for="file in version.Work.Metadata.Files" :key="file.Id">
							<a target="_blank" :href="resolveFileUrl(file)">
								<i class="far fa-file-pdf" /> {{ file.Caption }}
							</a>
						</span>
					</div>
				</div>
			</div>
			<div class="fld" v-if="level.HasArea || level.Dataset.AreSegments">
				<div class="fld-label">Descarga con polígonos</div>
				<div class="fld-value btn-set">
					<button @click="process($event, format.key)" v-for="format in getSpatialFormats()" :key="format.key" class="mp-btn mp-btn--solid">
						<download-icon title="Descargar" /> {{ format.caption }}
					</button>
				</div>
			</div>
		</div>
	</Modal>
</template>

<script>
import axios from 'axios';
import h from '@/map/js/helper';
import DownloadIcon from 'vue-material-design-icons/Download.vue';
import creativeCommons from '@/map/components/controls/creativeCommons.vue';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import Modal from '@/map/components/popups/modal';
import session from '@/common/framework/session';

var debounce = require('lodash.debounce');

export default {
	name: 'metricDownload',
	props: [
		'visible',
		'backgroundColor'
	],
	components: {
    creativeCommons,
    DownloadIcon,
    Modal
	},
	data() {
		return {
			metric: null,
			regions: [],
			visibleUrl: true,
			progress: null,
			downloadLevel: 0,
			downloadUrbanity: 'N',
			downloadPartition: null
		};
	},
	computed: {
		version() {
			return this.metric.properties.Versions[this.metric.properties.SelectedVersionIndex];
		},
		clipping() {
			return window.SegMap.Clipping;
		},
		level() {
			return this.version.Levels[this.downloadLevel];
		},
		Use() {
			return window.Use;
		},
		hasPartitions() {
			return this.partitions !== null;
		},
		partitions() {
			return this.metric.SelectedLevel().Partitions;
		},
		useFilter() {
			return this.regions && this.regions.length > 0;
		},
		hasUrbanityFilter() {
			return this.Use.UseUrbanity && this.level.HasUrbanity;
		},
		levelOverflows() {
			var selectedLevel = this.level;
			for(var n = this.version.Levels.length - 1; n >= 0; n--) {
				var level = this.version.Levels[n];
				if (level.Id === selectedLevel.Id) {
					return false;
				}
				if (this.useFilter && this.clipping.LevelMachLevels(level)) {
					return true;
				}
			}
			return false;
		}
	},
	methods: {
		show(metric) {
			this.metric = metric;
			this.regions = [];
			if (this.clipping.FrameHasClippingCircle() || this.clipping.FrameHasClippingRegionId()) {
				this.regions = this.regions.concat(this.clipping.clipping.Region.Summary.Regions);
			}
			this.downloadLevel = this.version.SelectedLevelIndex;
			this.downloadUrbanity = this.metric.properties.SelectedUrbanity;
			this.downloadPartition = this.metric.GetSelectedPartition();
			this.$refs.dialog.show();
		},
		getDataFormats() {
			var ret = [];
			ret.push({ caption: 'Texto (.csv)', key: 'c' });
			ret.push({ caption: 'Excel (.xlsx)', key: 'x' });
			ret.push({ caption: 'SPSS (.sav)', key: 's' });
			ret.push({ caption: 'Stata (.dta)', key: 't' });
			ret.push({ caption: 'R (.rdata)', key: 'r' });
			if (!this.level.HasArea) {
				ret.push({ caption: 'Shapefile (.shp)', key: 'h' });
				ret.push({ caption: 'GeoPackage (.gpkg)', key: 'g' });
			}

			return ret;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.mainHost + '/services/metadata/GetMetadataFile?m=' + this.version.Work.Metadata.Id + h.urlParam('f', file.FileId) + h.urlParam('l', window.accessLink);
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.mainHost + '/services/metadata/GetWorkMetadataPdf?m=' + this.version.Work.Metadata.Id + '&d=' + this.level.Dataset.Id + '&w=' + this.version.Work.Id + h.urlParam('l', window.accessLink);
		},
		resolveMetadataDictionaryUrl() {
			return window.host + '/services/metadata/GetWorkMetadataDictionary?m=' + this.version.Work.Metadata.Id + '&d=' + this.level.Dataset.Id + '&w=' + this.version.Work.Id + h.urlParam('l', window.accessLink);
		},
		getSpatialFormats() {
			var ret = [];
			//ret.push({ caption: 'Texto con GeoJSON (.csv)', key: 'cg' });
			ret.push({ caption: 'Texto con WKT (.csv)', key: 'cw' });
			ret.push({ caption: 'Shapefile (.shp)', key: 'hw' });
			ret.push({ caption: 'GeoPackage (.gpkg)', key: 'gw' });
			return ret;
		},
		showUrls: debounce(function() {
								this.visibleUrl = true;
							}, 3000)
		,
		sendFileByType(type) {
			var url = this.getFileUrl(type);
			this.sendFile(url);
		},
		sendFile(url, newTab = false) {
			const a = document.getElementById('downloadAnchor');
			a.href = url;
			if (newTab) {
				window.open(url, '_blank');
			} else {
				window.location.href = url;
			}
		},
		process(e, type) {
			e.preventDefault();
			this.visibleUrl = false;
			this.progress = null;
			window.SegMap.Session.Content.Download(type);
			var url = this.startDownloadUrl(type);
			const loc = this;
			axios.get(url, session.AddSession(url, {
				headers: (window.accessLink ? { 'Access-Link': window.accessLink } : {})
			})).then(function (res) {
				session.ReceiveSession(url, res);
				if(res.data.done === false) {
					loc.processStep(type, res.data, 0);
				} else {
					loc.progress = 100;
					loc.sendFileByType(type);
					loc.showUrls();
				}
			}).catch(function(error) {
			loc.showUrls();
				err.errDialog('process', 'crear el archivo', error);
			});
		},
		processStep(type, data, i) {
			var key = data.key;
			if (data.slice && data.totalSlices && data.slice < data.totalSlices) {
				this.progress = parseInt(data.slice * 100 / data.totalSlices);
			}
			const loc = this;
			var url = loc.stepDownloadUrl();
			return axios.get(url, session.AddSession(url, {
				params: { k: key },
				headers: (window.accessLink ? { 'Access-Link': window.accessLink } : {})
			})).then(function (res) {
					session.ReceiveSession(url, res);
					if(i >= 1000) {
						throw new Error('Hard limit reached');
						}
					i++;

					if(res.data.done === false) {
						return loc.processStep(type, res.data, i);
					} else {
						loc.progress = 100;
						loc.sendFileByType(type);
						loc.showUrls();
					}
				}).catch(function(error) {
				loc.showUrls();
				err.errDialog('processStep', 'crear el archivo', error);
			});
		},
		getFileUrl(type) {
			return window.host + '/services/download/GetDatasetFile?' + this.urlArgs(type);
		},
		startDownloadUrl(type) {
			return window.host + '/services/download/StartDatasetDownload?' + this.urlArgs(type);
		},
		stepDownloadUrl() {
			return window.host + '/services/download/StepDatasetDownload';
		},
		removeFilter(regionId) {
			arr.RemoveById(this.regions, regionId);
		},
		urlArgs(type) {
			var clippingRegionId = null;
			var circle = null;
			if (this.useFilter) {
				if (this.clipping.FrameHasClippingCircle()) {
					circle = h.getCircleParam(this.clipping.frame.ClippingCircle);
				} else if (this.regions) {
					clippingRegionId = arr.GetIds(this.regions).join(',');
				}
			}
			var urbanity = (this.level.HasUrbanity ? this.downloadUrbanity : null);
			var partition = (this.partitions ? this.downloadPartition : null);
			var compareDatasetId = '';
			if (this.metric.Compare.Active)
			{
				compareDatasetId = this.metric.Compare.SelectedLevel().Dataset.Id;
			}

			return 't=' + type + h.urlParam('d', this.level.Dataset.Id) + h.urlParam('p', compareDatasetId) +  h.urlParam('c', circle) + h.urlParam('r', clippingRegionId)
				+ h.urlParam('u', urbanity) + h.urlParam('g', partition) + h.urlParam('w', this.version.Work.Id);
		}
	},
};
</script>

<style scoped>

</style>

