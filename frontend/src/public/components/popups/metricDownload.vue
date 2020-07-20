<template>
	<Modal title="Descargar" ref="dialog" :showCancel="false" :showOk="false">
		<div v-if="metric">
			<table class="localTable">
				<tbody>
					<tr>
						<td style="width: 250px">Fuente:</td>
						<td style="width: 600px">{{ version.Work.Name }}</td>
					</tr>
					<tr v-if="version.Work.Type !=='P' && version.Work.Authors">
						<td>Autores:</td>
						<td>{{ version.Work.Authors }}</td>
					</tr>
					<tr>
						<td>Dataset:</td>
						<td>{{ level.Dataset.Name }}</td>
					</tr>
					<tr v-if="version.Version.PartialCoverage">
						<td>Cobertura:</td>
						<td>{{ version.Version.PartialCoverage }}</td>
					</tr>
					<tr>
						<td>Licencia:</td>
						<td>
							<creativeCommons :license="version.Work.License"/>
						</td>
					</tr>
					<tr>
						<td>Nivel:</td>
						<td v-if="version.Levels.length > 1">
							<select :disabled="!visibleUrl" v-model="downloadLevel">
								<option v-for="(level, index) in version.Levels" :key="level.Id" :value="index">{{ level.Name }}</option>
							</select>
							<div v-if="useFilter && levelOverflows" class="warningBox">
								Las áreas del nivel '{{ level.Name }}' pueden exceder a la región '{{ clipping.Region.Summary.Name }}'. Cuando esto
								suceda, serán incluidas en forma completa en la descarga.
							</div>
						</td>
						<td v-else="">{{ level.Name }}</td>
					</tr>
					<tr v-if="clipping.Region.Summary.Name">
						<td>Selección:</td>
						<td>
							<div>
								<a class="btn btn-social btn-dropbox" v-if="useFilter" v-on:click="useFilter = !useFilter">
									<close-icon title="Quitar"/> {{ clipping.Region.Summary.Name }}
								</a>
							</div>
						</td>
					</tr>
					<tr v-if="version.Work.FileUrl">
						<td>Metodología:</td>
						<td>{{ version.Work.FileUrl }}</td>
					</tr>
					<tr>
						<td>Descarga:</td>
						<td>
							<span v-if="visibleUrl">
								<button v-on:click="process($event, format.key)" v-for="format in getDataFormats()" :key="format.key" class="downloadButton">
									<download-icon title="Descargar"/> {{ format.caption }}
								</button>
								<button @click="sendFile(resolveMetadataUrl(), true)" class="downloadButton">
									<file-pdf-icon title="Descargar"/> Metadatos
								</button>
							</span>
							<span v-else="">
								<img src="/static/img/spinner.gif"> Generando archivo. El proceso puede demorar varios minutos... {{ (progress ? '(' + progress + '%)' : '') }}
						</span>
						</td>
					</tr>
					<tr v-if="version.Work.Files && version.Work.Files.length > 0">
						<td>Adjuntos:</td>
						<td>
							<span v-for="file in version.Work.Files" :key="file.Id">
								<a target="_blank" :href="resolveFileUrl(file)">
									<file-pdf-icon title="Descargar"/> {{ file.Caption }}
								</a>
							</span>
						</td>
					</tr>
					<tr v-if="level.HasArea">
						<td>Descarga con polígonos:</td>
						<td>
							<button v-on:click="process($event, format.key)" v-for="format in getSpatialFormats()" :key="format.key" class="downloadButton">
								<download-icon title="Descargar"/> {{ format.caption }}
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</Modal>
</template>

<script>
import axios from 'axios';
import h from '@/public/js/helper';
import DownloadIcon from 'vue-material-design-icons/Download.vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import creativeCommons from '@/public/components/controls/creativeCommons.vue';
import FilePdfIcon from 'vue-material-design-icons/FilePdf.vue';
import err from '@/common/js/err';
import arr from '@/common/js/arr';
import Modal from '@/public/components/popups/modal';

var debounce = require('lodash.debounce');

export default {
	name: 'metricDownload',
	props: [
		'visible',
	],
	components: {
    creativeCommons,
    DownloadIcon,
		FilePdfIcon,
    CloseIcon,
		Modal
	},
	data() {
		return {
			metric: null,
			clipping: null,
			visibleUrl: true,
			useFilter: true,
			progress: null,
			downloadLevel: 0,
		};
	},
	computed: {
		version() {
			return this.metric.properties.Versions[this.metric.properties.SelectedVersionIndex];
		},
		level() {
			return this.version.Levels[this.downloadLevel];
		},
		levelOverflows() {
			var selectedLevel = this.level;
			for(var n = this.version.Levels.length - 1; n >= 0; n--) {
				var level = this.version.Levels[n];
				if (level.Id === selectedLevel.Id) {
					return false;
				}
				if (this.useFilter && window.SegMap.Clipping.LevelMachLevels(level)) {
					return true;
				}
			}
			return false;
		}
	},
	methods: {
		show(metric, clipping) {
			this.metric = metric;
			this.clipping = clipping;
			this.useFilter = true;
			this.downloadLevel = this.version.SelectedLevelIndex;

			this.$refs.dialog.show();
		},
		getDataFormats() {
			var ret = [];
			ret.push({ caption: 'Texto (.csv)', key: 'c' });
			ret.push({ caption: 'Excel (.xlsx)', key: 'x' });
			ret.push({ caption: 'SPSS (.sav)', key: 's' });
			ret.push({ caption: 'Stata (.dta)', key: 't' });
			if (!this.level.HasArea) {
				ret.push({ caption: 'Shapefile (.shp)', key: 'h' });
			}
			return ret;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.host + '/services/metadata/GetMetadataFile?m=' + this.version.Work.MetadataId + '&f=' + file.FileId + h.urlParam('l', window.accessLink);
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.host + '/services/metadata/GetMetadataPdf?m=' + this.version.Work.MetadataId + '&d=' + this.level.Dataset.Id + '&w=' + this.version.Work.Id + h.urlParam('l', window.accessLink);
		},
		getSpatialFormats() {
			var ret = [];
			ret.push({ caption: 'Texto con GeoJSON (.csv)', key: 'cg' });
			ret.push({ caption: 'Texto con WKT (.csv)', key: 'cw' });
			ret.push({ caption: 'Excel con GeoJSON (.xlsx)', key: 'xg' });
			ret.push({ caption: 'Excel con WKT (.xlsx)', key: 'xw' });
			ret.push({ caption: 'Shapefile (.shp)', key: 'hw' });
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
			let a = document.createElement('a');
			a.style = 'display: none';
			document.body.appendChild(a);
			a.href = url;
			if (newTab) {
				a.target = '_blank';
			}
			a.click();
			document.body.removeChild(a);
		},
		process(e, type) {
			e.preventDefault();
			this.visibleUrl = false;
			this.progress = null;
			var url = this.startDownloadUrl(type);
			const loc = this;
			axios.get(url, {
				headers: (window.accessLink ? { 'Access-Link': window.accessLink } : {})
			}).then(function (res) {
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
			return axios.get(loc.stepDownloadUrl(), {
				params: { k: key },
				headers: (window.accessLink ? { 'Access-Link': window.accessLink } : {})
				}).then(function(res) {
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
			return window.host + '/services/download/GetFile?' + this.urlArgs(type);
		},
		startDownloadUrl(type) {
			return window.host + '/services/download/StartDownload?' + this.urlArgs(type);
		},
		stepDownloadUrl() {
			return window.host + '/services/download/StepDownload';
		},
		urlArgs(type) {
			var cliId = 0;
			if(this.useFilter && this.clipping.Region.Summary.Id !== null) {
				cliId = this.clipping.Region.Summary.Id;
			}
			return 't=' + type + '&d=' + this.level.Dataset.Id + '&r=' + cliId + '&w=' + this.version.Work.Id;
		}
	},
};
</script>

<style scoped>
.downloadButton {
  border: 1.5px solid #68B3C8;
  color: #68B3C8;
  border-radius: 9px; background-color: transparent;
  padding: 4px; margin-right: 10px;
  margin-bottom: 5px;
}
.warningBox {
	font-size: 13px;
  line-height: 1.4em;
  margin-top: 4px;
}
</style>

