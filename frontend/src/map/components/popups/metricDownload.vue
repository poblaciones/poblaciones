<template>
	<Modal title="Descargar" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor" @hidden="cancelDownload">
		<div v-if="metric && downloader">
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
					<div v-for="region in regions" :key="region.Id" class="mp-chip-filter">
						{{ region.Name }}
						<mp-close-button @click="removeFilter(region.Id)" title="Quitar filtro"
														 class="exp-hiddable-block mp-chip-filter-close" />
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
						<download-menu caption="Dataset" :formats="getDataFormats()" @select="process" />
						<download-menu v-if="getSpatialFormats().length > 0" caption="Geometrías" :formats="getSpatialFormats()" @select="process" />
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
	name: 'metricDownload',
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
			metric: null,
			downloader: null,
			visibleUrl: true,
			progress: null
		};
	},
	computed: {
		version() {
			return this.downloader.GetVersion();
		},
		clipping() {
			return window.SegMap.Clipping;
		},
		level() {
			return this.downloader.GetLevel();
		},
		Use() {
			return window.Use;
		},
		regions() {
			return this.downloader.regions;
		},
		downloadLevel: {
			get() { return this.downloader.levelIndex; },
			set(value) { this.downloader.levelIndex = value; }
		},
		downloadUrbanity: {
			get() { return this.downloader.urbanity; },
			set(value) { this.downloader.urbanity = value; }
		},
		downloadPartition: {
			get() { return this.downloader.partition; },
			set(value) { this.downloader.partition = value; }
		},
		hasPartitions() {
			return this.partitions !== null;
		},
		partitions() {
			return this.downloader.GetPartitions();
		},
		useFilter() {
			return this.downloader.UsesFilter();
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
			this.downloader = ActiveDownloader.ForMetric(metric);
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

