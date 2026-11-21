<template>
	<Modal :title="title" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor" @hidden="cancelDownloads">
		<div v-if="metadata">
			<div class="fld">
				<div class="fld-label">Título</div>
				<div class="fld-value">{{ metadata.Name }}</div>
			</div>
			<div class="fld" v-if="filled(metadata.Authors)">
				<div class="fld-label">Autores</div>
				<div class="fld-value">{{ metadata.Authors }}</div>
			</div>
			<div class="fld fld-hide-mobile" v-if="filled(metadata.Date)">
				<div class="fld-label">Publicación</div>
				<div class="fld-value">{{ metadata.Date }}</div>
			</div>
			<div class="fld fld-hide-mobile" v-if="filled(metadata.Abstract)">
				<div class="fld-label">Resumen</div>
				<div class="fld-value">{{ metadata.Abstract }}</div>
			</div>
			<div class="fld" v-if="metadata.Ark">
				<div class="fld-label">Ark</div>
				<div class="fld-value">
					<a target="_blank" :href="metadata.Ark">{{ metadata.Ark }}</a>
					<a href="#" v-clipboard="() => metadata.Ark" class="superSmallButton">
						Copiar
					</a>
				</div>
			</div>
			<div class="fld">
				<div class="fld-label">Cita (APA)</div>
				<div class="fld-value quotation">
					<span v-html="citationAPA()"> </span>
					<a href="#" v-clipboard="() => citationAPAText()" class="superSmallButton">
						Copiar
					</a>
				</div>
			</div>
			<div class="fld">
				<div class="fld-label">Licencia</div>
				<div class="fld-value">
					<creativeCommons :license="metadata.License" />
				</div>
			</div>
			<div class="fld">
				<div class="fld-label">Metadatos</div>
				<div class="fld-value">
					<a target="_blank" :href="resolveMetadataUrl()">
						<i class="far fa-file-pdf" /> Consultar
					</a>
				</div>
			</div>
			<div class="fld" v-if="metadata.Files && metadata.Files.length > 0">
				<div class="fld-label">Adjuntos</div>
				<div class="fld-value">
					<div class="attachmentsDownloadPanel">
						<span v-for="file in metadata.Files" :key="file.FileId + file.Caption">
							<a target="_blank" :href="resolveFileUrl(file)">
								<i class="far fa-file-pdf" /> {{ file.Caption }}
							</a>
						</span>
					</div>
				</div>
			</div>
			<div class="fld" v-if="canDownload">
				<div class="fld-label">Descarga</div>
				<div class="fld-value">
					<div v-if="downloaders.length > 0">
						<div v-for="item in downloaders" :key="item.key" class="download-item">
							<div v-if="downloaders.length > 1" class="download-item-caption">{{ item.caption }}</div>
							<download-button :downloader="item.downloader" />
						</div>
					</div>
					<span v-else-if="loadingDownload">
						<img src="/static/img/spinner.gif"> Preparando la descarga...
					</span>
				</div>
			</div>
		</div>
	</Modal>
</template>

<script>
import h from '@/map/js/helper';
import creativeCommons from '@/map/components/controls/creativeCommons.vue';
import str from '@/common/framework/str';
import apa from '@/common/js/citationAPA';
import Modal from '@/map/components/popups/modal';
import DownloadButton from '@/map/components/controls/downloadButton';
import ActiveDownloader from '@/map/classes/ActiveDownloader';
import err from '@/common/framework/err';
import BasemapLayerSet from '@/map/classes/BasemapLayerSet';

// Metadatos de una capa base del panel «Detalles del mapa». Para indicadores y
// delimitaciones suma el acceso a la descarga de sus datos.
export default {
	name: 'basemapMetadataPopup',
	props: [
		'backgroundColor'
	],
	components: {
		creativeCommons,
		DownloadButton,
		Modal
	},
	data() {
		return {
			layer: null,
			downloaders: [],
			loadingDownload: false
		};
	},
	computed: {
		metadata() {
			if (this.layer === null) {
				return null;
			}
			return this.layer.Metadata;
		},
		title() {
			if (this.layer === null) {
				return 'Fuente';
			}
			return 'Fuente de ' + this.layer.Caption;
		},
		canDownload() {
			return this.layer !== null && BasemapLayerSet.IsLoadable(this.layer);
		}
	},
	methods: {
		show(layer) {
			this.cancelDownloads();
			this.layer = layer;
			this.downloaders = [];
			this.loadingDownload = false;
			this.$refs.dialog.show();
			if (BasemapLayerSet.IsLoadable(layer)) {
				this.prepareDownload(layer);
			}
		},
		// Cerrar la ventana descarta los archivos que se estuvieran preparando.
		cancelDownloads() {
			for (var item of this.downloaders) {
				item.downloader.Cancel();
			}
		},
		// Hay un descargador por cada indicador de la capa (una delimitación es una sola).
		// Trabajan sobre los activos: si todavía no se pidieron, se piden (quedan ocultos
		// si la capa está apagada).
		prepareDownload(layer) {
			var loc = this;
			this.loadingDownload = true;
			window.SegMap.EnsureBasemapLayerLoaded(layer).then(function (activeLayers) {
				loc.loadingDownload = false;
				if (loc.layer === layer) {
					loc.downloaders = loc.createDownloaders(layer, activeLayers);
				}
			}, function (error) {
				loc.loadingDownload = false;
				err.errDialog('prepareDownload', 'preparar la descarga', error);
			});
		},
		createDownloaders(layer, activeLayers) {
			var ret = [];
			for (var i = 0; i < activeLayers.length; i++) {
				var downloader;
				if (layer.Type === BasemapLayerSet.TYPE_BOUNDARY) {
					downloader = ActiveDownloader.ForBoundary(activeLayers[i]);
				} else {
					downloader = ActiveDownloader.ForMetric(activeLayers[i]);
				}
				ret.push({ key: i, caption: downloader.GetCaption(), downloader: downloader });
			}
			return ret;
		},
		filled(text) {
			return text !== null && text !== undefined && String(text).trim().length > 0;
		},
		publicUrl() {
			if (this.metadata.Ark) {
				return this.metadata.Ark;
			}
			return str.PatternUrl('', window.SegMap.Configuration.ShortUrlPattern);
		},
		citationAPA() {
			return apa.onlineMapCitation(this.htmlEncode(this.metadata.Authors), this.htmlEncode(this.metadata.Date),
				this.htmlEncode(this.metadata.Name), this.publicUrl());
		},
		citationAPAText() {
			return apa.onlineMapCitation(this.metadata.Authors, this.metadata.Date,
				this.metadata.Name, this.publicUrl(), true);
		},
		htmlEncode(html) {
			return document.createElement('a').appendChild(
				document.createTextNode(html)).parentNode.innerHTML;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.mainHost + '/services/metadata/GetMetadataFile?m=' + this.metadata.Id + '&f=' + file.FileId + h.urlParam('l', window.accessLink);
			} else {
				return '#';
			}
		},
		// El PDF depende de la cartografía dueña (metadatos de un indicador) o de la
		// delimitación; en etiquetas y rasters no hay ninguna de las dos.
		resolveMetadataUrl() {
			var url = window.mainHost + '/services/metadata/GetMetadataPdf?m=' + this.metadata.Id + h.urlParam('l', window.accessLink);
			if (this.metadata.WorkId) {
				url += h.urlParam('w', this.metadata.WorkId);
			}
			if (this.metadata.BoundaryId) {
				url += h.urlParam('b', this.metadata.BoundaryId);
			}
			return url;
		}
	}
};
</script>
<style scoped>
.download-item + .download-item {
	margin-top: 8px;
}

.download-item-caption {
	font-size: 13px;
	margin-bottom: 4px;
}
</style>
