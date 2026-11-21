<template>
	<Modal title="Descargar" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor" @hidden="cancelDownload">
		<div v-if="boundary && downloader">
			<div class="fld">
				<div class="fld-label">Título</div>
				<div class="fld-value">{{ version.Metadata.Name }}</div>
			</div>
			<div class="fld" v-if="version.Metadata.Authors">
				<div class="fld-label">Autores</div>
				<div class="fld-value">{{ version.Metadata.Authors }}</div>
			</div>
			<div class="fld">
				<div class="fld-label">Licencia</div>
				<div class="fld-value">
					<creativeCommons :license="version.Metadata.License" />
				</div>
			</div>
			<div class="fld" v-if="useFilter">
				<div class="fld-label">Selección</div>
				<div class="fld-value fld-chips">
					<div v-for="region in regions" :key="region.Id" class="mp-chip-filter">
						{{ region.Name }}
						<mp-close-button @click="removeFilter(region.Id)" title="Quitar filtro"
														 class="exp-hiddable-block mp-chip-filter-close" />
					</div>
				</div>
			</div>
			<div class="fld">
				<div class="fld-label">Descarga</div>
				<div class="fld-value">
					<div v-if="visibleUrl" class="btn-set">
						<download-menu caption="Dataset" :formats="getDataFormats()" @select="process" />
						<download-menu v-if="getSpatialFormats().length > 0" caption="Geometrías" :formats="getSpatialFormats()" @select="process" />
						<button @click="sendFile(resolveMetadataUrl(), true)" class="mp-btn mp-btn--solid">
							<i class="far fa-file-pdf" /> Metadatos
						</button>
					</div>
					<div v-else>
						<img src="/static/img/spinner.gif"> Generando el archivo... {{ (progress ? '(' + progress + '%)' : '') }}
					</div>
				</div>
			</div>
			<div class="fld" v-if="version.Metadata.Files && version.Metadata.Files.length > 0">
				<div class="fld-label">Adjuntos</div>
				<div class="fld-value">
					<div class="attachmentsDownloadPanel">
						<span v-for="file in version.Metadata.Files" :key="file.Id">
							<a target="_blank" :href="resolveFileUrl(file)">
								<i class="far fa-file-pdf" /> {{ file.Caption }}
							</a>
						</span>
					</div>
				</div>
			</div>
		</div>
	</Modal>
</template>

<script>
import h from '@/map/js/helper';
import DownloadMenu from '@/map/components/controls/downloadMenu';
import creativeCommons from '@/map/components/controls/creativeCommons.vue';
import Modal from '@/map/components/popups/modal';
import ActiveDownloader from '@/map/classes/ActiveDownloader';

var debounce = require('lodash.debounce');

export default {
	name: 'boundaryDownload',
	props: [
		'visible',
		'backgroundColor'
	],
	components: {
    creativeCommons,
    DownloadMenu,
    Modal
	},
	data() {
		return {
			boundary: null,
			downloader: null,
			visibleUrl: true,
			progress: null,
		};
	},
	computed: {
		Use() {
			return window.Use;
		},
		version() {
			return this.downloader.GetVersion();
		},
		regions() {
			return this.downloader.regions;
		},
		useFilter() {
			return this.downloader.UsesFilter();
		},
	},
	methods: {
		show(boundary) {
			this.boundary = boundary;
			this.downloader = ActiveDownloader.ForBoundary(boundary);
			this.visibleUrl = true;
			this.progress = null;
			this.$refs.dialog.show();
		},
		// Cerrar la ventana descarta el archivo que se estuviera preparando.
		cancelDownload() {
			if (this.downloader) {
				this.downloader.Cancel();
			}
		},
		getDataFormats() {
			return this.downloader.GetDataFormats();
		},
		getSpatialFormats() {
			return this.downloader.GetSpatialFormats();
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
			return window.host + '/services/metadata/GetMetadataPdf?m=' + this.version.Metadata.Id
				+ h.urlParam('l', window.accessLink) + h.urlParam('b', this.boundary.properties.Id);
		},
		showUrls: debounce(function() {
								this.visibleUrl = true;
							}, 3000)
		,
		sendFile(url, newTab = false) {
			ActiveDownloader.SendFile(url, newTab);
		},
		process(format) {
			var loc = this;
			this.visibleUrl = false;
			this.progress = null;
			this.downloader.Run(format.key, function (percent) {
				loc.progress = percent;
			}).then(function () {
				loc.showUrls();
			});
		},
		removeFilter(regionId) {
			this.downloader.RemoveRegion(regionId);
		}
	},
};
</script>

<style scoped>

</style>

