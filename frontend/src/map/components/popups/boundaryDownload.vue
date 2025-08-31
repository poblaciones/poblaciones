<template>
	<Modal title="Descargar" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="boundary">
			<table class="localTable">
				<tbody>
					<tr>
						<td style="width: 250px">Título:</td>
						<td style="width: 600px">{{ version.Metadata.Name }}</td>
					</tr>
					<tr v-if="version.Metadata.Authors">
						<td>Autores:</td>
						<td>{{ version.Metadata.Authors }}</td>
					</tr>
					<tr>
						<td>Licencia:</td>
						<td>
							<creativeCommons :license="version.Metadata.License" />
						</td>
					</tr>
					<tr v-if="useFilter">
						<td>Selección:</td>
						<td>
							<div style="margin-bottom: -7px;">
								<div v-for="region in regions" :key="region.Id"
										 class="filterElement" style="margin-bottom: 7px;">
									{{ region.Name }}
									<mp-close-button @click="removeFilter(region.Id)" title="Quitar filtro"
																	 class="exp-hiddable-block filterElement-close" />
								</div>
							</div>
						</td>
					</tr>
					<tr>
						<td>Descarga:</td>
						<td>
							<span v-if="visibleUrl">
								<button @click="process($event, format.key)" v-for="format in getDataFormats()" :key="format.key" class="downloadButton">
									<download-icon title="Descargar" /> {{ format.caption }}
								</button>
								<button @click="sendFile(resolveMetadataUrl(), true)" class="downloadButton">
									<i class="far fa-file-pdf" /> Metadatos
								</button>
							</span>
							<span v-else="">
								<img src="/static/img/spinner.gif"> Generando archivo. El proceso puede demorar varios minutos... {{ (progress ? '(' + progress + '%)' : '') }}
							</span>
						</td>
					</tr>
					<tr v-if="version.Metadata.Files && version.Metadata.Files.length > 0">
						<td>Adjuntos:</td>
						<td>
							<div class="attachmentsDownloadPanel">
								<span v-for="file in version.Metadata.Files" :key="file.Id">
									<a target="_blank" :href="resolveFileUrl(file)">
										<i class="far fa-file-pdf" /> {{ file.Caption }}
									</a>
								</span>
							</div>
						</td>
					</tr>
					<tr>
						<td>Descarga con polígonos:</td>
						<td>
							<button @click="process($event, format.key)" v-for="format in getSpatialFormats()" :key="format.key" class="downloadButton">
								<download-icon title="Descargar" /> {{ format.caption }}
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
import h from '@/map/js/helper';
import DownloadIcon from 'vue-material-design-icons/Download.vue';
import creativeCommons from '@/map/components/controls/creativeCommons.vue';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import Modal from '@/map/components/popups/modal';
import session from '@/common/framework/session';

var debounce = require('lodash.debounce');

export default {
	name: 'boundaryDownload',
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
			boundary: null,
			visibleUrl: true,
			regions: [],
			progress: null,
		};
	},
	computed: {
		Use() {
			return window.Use;
		},
		useFilter() {
			return this.regions && this.regions.length > 0;
		},
		clipping() {
			return window.SegMap.Clipping;
		},
	},
	methods: {
		show(boundary) {
			this.boundary = boundary;
			this.version = boundary.SelectedVersion();
			this.regions = [];
			if (this.clipping.FrameHasClippingCircle() || this.clipping.FrameHasClippingRegionId()) {
				this.regions = this.regions.concat(this.clipping.clipping.Region.Summary.Regions);
			}
			this.$refs.dialog.show();
		},
		getDataFormats() {
			var ret = [];
			ret.push({ caption: 'Texto (.csv)', key: 'c' });
			ret.push({ caption: 'Excel (.xlsx)', key: 'x' });
			ret.push({ caption: 'SPSS (.sav)', key: 's' });
			ret.push({ caption: 'Stata (.dta)', key: 't' });
			ret.push({ caption: 'R (.rdata)', key: 'r' });
			return ret;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.host + '/services/metadata/GetMetadataFile?m=' + this.version.Metadata.Id + h.urlParam('f', file.FileId) + h.urlParam('l', window.accessLink);
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.host + '/services/metadata/GetMetadataPdf?m=' + this.version.Metadata.Id + h.urlParam('l', window.accessLink);
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
			const a = document.getElementById('downloadAnchor');
			a.href = url;
			if (newTab) {
				a.target = '_blank';
			}
			a.click();
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
			return window.host + '/services/download/GetBoundaryFile?' + this.urlArgs(type);
		},
		startDownloadUrl(type) {
			return window.host + '/services/download/StartBoundaryDownload?' + this.urlArgs(type);
		},
		removeFilter(regionId) {
			arr.RemoveById(this.regions, regionId);
		},
		stepDownloadUrl() {
			return window.host + '/services/download/StepBoundaryDownload';
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
			return 't=' + type + '&s=b' + h.urlParam('b', this.boundary.properties.Id) + h.urlParam('v', this.version.Id) + h.urlParam('c', circle) + h.urlParam('r', clippingRegionId);
		}
	},
};
</script>

<style scoped>

</style>

