<template>
	<div class="download-button">
		<div v-if="working">
			<img src="/static/img/spinner.gif"> Generando el archivo... {{ progressText }}
		</div>
		<div v-else class="btn-set">
			<download-menu caption="Dataset" :formats="dataFormats" @select="start" />
			<download-menu v-if="spatialFormats.length > 0" caption="Geometrías" :formats="spatialFormats" @select="start" />
		</div>
	</div>
</template>

<script>
import DownloadMenu from '@/map/components/controls/downloadMenu';

// Botones «Dataset» y «Geometrías» con la lista de formatos de cada uno. La lógica
// de descarga (formatos, pedido y generación del archivo) es la del ActiveDownloader recibido.
export default {
	name: 'downloadButton',
	props: {
		downloader: {
			type: Object,
			required: true
		}
	},
	components: {
		DownloadMenu
	},
	data() {
		return {
			working: false,
			progress: null
		};
	},
	computed: {
		dataFormats() {
			return this.downloader.GetDataFormats();
		},
		spatialFormats() {
			return this.downloader.GetSpatialFormats();
		},
		progressText() {
			if (this.progress) {
				return '(' + this.progress + '%)';
			}
			return '';
		}
	},
	methods: {
		start(format) {
			var loc = this;
			this.working = true;
			this.progress = null;
			return this.downloader.Run(format.key, function (percent) {
				loc.progress = percent;
			}).then(function () {
				loc.working = false;
			});
		}
	}
};
</script>
