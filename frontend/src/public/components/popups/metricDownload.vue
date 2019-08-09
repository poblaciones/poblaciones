<template>
	<Modal title="Descargar" ref="dialog" :showCancel="false"  :showOk="false">
		<div>
			<table class="localTable">
				<tbody>
					<tr>
						<td style="width: 250px">Fuente:</td>
						<td style="width: 500px">{{ version.Work.Name }}</td>
					</tr>
					<tr v-if="version.Work.Type !=='P'">
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
								<img src="/static/img/spinner.gif"> Generando archivo. El proceso puede demorar varios minutos...
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
import DownloadIcon from 'vue-material-design-icons/download.vue';
import CloseIcon from 'vue-material-design-icons/close.vue';
import creativeCommons from '@/public/components/widgets/creativeCommons.vue';
import FilePdfIcon from 'vue-material-design-icons/FilePdf.vue';
import err from '@/common/js/err';
import arr from '@/common/js/arr';
import Modal from '@/public/components/popups/modal';

var debounce = require('lodash.debounce');

export default {
	name: 'metricDownload',
	props: [
		'metric',
		'clipping',
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
			visibleUrl: true,
			useFilter: true,
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
		show() {
			this.useFilter = true;
			this.downloadLevel = this.version.SelectedLevelIndex;
			this.$refs.dialog.show();
		},
		getDataFormats() {
			var ret = [];
			ret.push({ caption: 'SPSS (.sav)', key: 's' });
			ret.push({ caption: 'Texto (.csv)', key: 'c' });
			return ret;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.host + '/services/metadata/GetMetadataFile?m=' + this.version.Work.MetadataId + '&f=' + file.FileId;
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.host + '/services/metadata/GetMetadataPdf?m=' + this.version.Work.MetadataId + '&d=' + this.level.Dataset.Id + '&w=' + this.version.Work.Id;
		},
		getSpatialFormats() {
			var ret = [];
			ret.push({ caption: 'SPSS con GeoJSON (.sav)', key: 'sg' });
			ret.push({ caption: 'SPSS con WKT (.sav)', key: 'sw' });
			ret.push({ caption: 'Texto con GeoJSON (.csv)', key: 'cg' });
			ret.push({ caption: 'Texto con WKT (.csv)', key: 'cw' });
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
			var url = this.startDownloadUrl(type);
			const loc = this;
			axios.get(url).then(function(res) {
				if(res.data.done === false) {
					loc.processStep(type, res.data.key, 0);
				} else {
					loc.sendFileByType(type);
					loc.showUrls();
				}
			}).catch(function(error) {
			loc.showUrls();
				err.errDialog('process', 'crear el archivo', error);
			});
		},
		processStep(type, key, i) {
			const loc = this;
			return axios.get(loc.stepDownloadUrl(), {
				params: { k: key }
				}).then(function(res) {
					if(i >= 1000) {
						throw new Error('Hard limit reached');
						}
					i++;

					if(res.data.done === false) {
						return loc.processStep(type, res.data.key, i);
					} else {
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

