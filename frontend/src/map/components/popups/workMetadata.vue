<template>
	<Modal :title="this.title" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="metric || work">
			<div class="fld">
				<div class="fld-label">Título</div>
				<div class="fld-value">{{ work.Metadata.Name }}</div>
			</div>
			<div class="fld" v-if="work.Metadata.Authors">
				<div class="fld-label">Autores</div>
				<div class="fld-value">{{ work.Metadata.Authors }}</div>
			</div>
			<div class="fld" v-if="level">
				<div class="fld-label">Dataset</div>
				<div class="fld-value">{{ level.Dataset.Name }}</div>
			</div>
			<div class="fld fld-hide-mobile" v-if="work.Metadata.ReleaseDate">
				<div class="fld-label">Publicación</div>
				<div class="fld-value">{{ formattedReleaseDate }}</div>
			</div>
			<div class="fld fld-hide-mobile" v-if="work.Metadata.Abstract">
				<div class="fld-label">Resumen</div>
				<div class="fld-value">{{ work.Metadata.Abstract }}</div>
			</div>
			<div class="fld fld-hide-mobile">
				<div class="fld-label">Dirección</div>
				<div class="fld-value">
					<a target="_blank" :href="completeUrl(work.Url)">{{ completeUrl(work.Url) }}</a>
				</div>
			</div>
			<div class="fld" v-if="work.ArkUrl">
				<div class="fld-label">Ark</div>
				<div class="fld-value">
					<a target="_blank" :href="work.ArkUrl">{{ work.ArkUrl }}</a>
					<a href="#" v-clipboard="() => work.ArkUrl" class="superSmallButton">
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
					<creativeCommons :license="work.Metadata.License" />
				</div>
			</div>
			<div class="fld" v-if="version">
				<div class="fld-label">Nivel</div>
				<div class="fld-value" v-if="version.Levels.length > 1">
					<select v-model="downloadLevel">
						<option v-for="(level, index) in version.Levels" :key="level.Id" :value="index">{{ level.Name }}</option>
					</select>
				</div>
				<div class="fld-value" v-else>{{ level.Name }}</div>
			</div>
			<div class="fld">
				<div class="fld-label">Metadatos</div>
				<div class="fld-value">
					<a target="_blank" :href="resolveMetadataUrl()">
						<i class="far fa-file-pdf" /> Consultar
					</a>
				</div>
			</div>
			<div class="fld" v-if="work.Metadata.Files && work.Metadata.Files.length > 0">
				<div class="fld-label">Adjuntos</div>
				<div class="fld-value">
					<div class="attachmentsDownloadPanel">
						<span v-for="file in work.Metadata.Files" :key="file.Id">
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
import creativeCommons from '@/map/components/controls/creativeCommons.vue';
import apa from '@/common/js/citationAPA';
import Modal from '@/map/components/popups/modal';

export default {
	name: 'workMetadataPopup',
	props: [
		'backgroundColor'
	],
	components: {
    creativeCommons,
		Modal
	},
	data() {
		return {
			downloadLevel: 0,
			metric: null,
			work: null,
			title: 'Fuente'
		};
	},
  methods: {
		showByMetric(metric, title) {
			this.metric = metric;
			this.title = title;
			this.downloadLevel = this.version.SelectedLevelIndex;
			this.work = metric.SelectedVersion().Work;
			window.SegMap.Session.Content.OpenMetadata();
			this.$refs.dialog.show();
		},
		show(work) {
			this.metric = null;
			this.title = 'Información';
			this.downloadLevel = null;
			this.work = work;
			window.SegMap.Session.Content.OpenMetadata();
			this.$refs.dialog.show();
		},
		completeUrl(url) {
			if (window.accessWorkId && window.accessLink && window.accessWorkId === this.work.Id) {
				return url + '/' + window.accessLink;
			} else {
				return url;
			}
		},
		citationAPA() {
			return apa.onlineMapCitation(this.htmlEncode(this.work.Metadata.Authors), this.htmlEncode(this.formattedYear),
				this.htmlEncode(this.work.Metadata.Name), this.completeUrl(this.work.Url));
		},
		citationAPAText() {
			return apa.onlineMapCitation(this.work.Metadata.Authors, this.formattedYear,
				this.work.Metadata.Name, this.completeUrl(this.work.Url), true);
		},
		htmlEncode(html) {
			return document.createElement('a').appendChild(
				document.createTextNode(html)).parentNode.innerHTML;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.mainHost + '/services/metadata/GetMetadataFile?m=' + this.work.Metadata.Id + '&f=' + file.FileId + h.urlParam('l', window.accessLink);
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.mainHost + '/services/metadata/GetWorkMetadataPdf?m=' + this.work.Metadata.Id + (this.level ? '&d=' + this.level.Dataset.Id : '') + '&w=' + this.work.Id + h.urlParam('l', window.accessLink);
		},
	},
	computed:
	{
		version() {
			if (this.metric) {
				return this.metric.SelectedVersion();
			} else {
				return null;
			}
		},
		formattedYear() {
			var s = this.work.Metadata.ReleaseDate;
			if (s === null) {
				return null;
			}
			if (s[4] === '-') {
				return s.substr(0, 4);
			} else {
				throw new Error('Formato de fecha no reconocido.');
			}
		},
		formattedReleaseDate() {
			var s = this.work.Metadata.ReleaseDate;
			if (s === null) {
				return null;
			}
			if (s[4] === '-') {
				return s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4);
			} else {
				throw new Error('Formato de fecha no reconocido.');
			}
		},
		level() {
			if (this.metric) {
				return this.version.Levels[this.downloadLevel];
			} else {
				return null;
			}
		}
	}
};
</script>
<style scoped>
</style>
