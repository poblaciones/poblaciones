<template>
  <Modal :title="(metric ? 'Fuente' : 'Metadatos')" ref="dialog" :showCancel="false" :showOk="false">
		<div v-if="metric || work">
			<table class="localTable">
				<tbody>
					<tr>
						<td>Título:</td>
						<td>{{ work.Name }}</td>
					</tr>
					<tr v-if="work.Authors">
						<td>Autores:</td>
						<td>{{ work.Authors }}</td>
					</tr>
					<tr v-if="level">
						<td>Dataset:</td>
						<td>{{ level.Dataset.Name }}</td>
					</tr>
					<tr v-if="work.ReleaseDate">
						<td>Publicación:</td>
						<td>{{ formattedReleaseDate }}</td>
					</tr>
					<tr v-if="work.Abstract">
						<td>Resumen:</td>
						<td>{{ work.Abstract }}</td>
					</tr>
					<tr>
						<td style="width: 120px;">Dirección:</td>
						<td>
							<a target="_blank" :href="completeUrl(work.Url)">{{ completeUrl(work.Url) }}</a>
						</td>
					</tr>
					<tr>
						<td>Cita (APA):</td>
						<td class="quotation">
							<span v-html="citationAPA()"> </span>
							<a href="#" v-clipboard="() => citationAPAText()" class="superSmallButton">
								Copiar
							</a>
						</td>
					</tr>
					<tr>
						<td>Licencia:</td>
						<td>
							<creativeCommons :license="work.License" />
						</td>
					</tr>
					<tr v-if="version">
						<td>Nivel:</td>
						<td v-if="version.Levels.length > 1">
							<select v-model="downloadLevel">
								<option v-for="(level, index) in version.Levels" :key="level.Id" :value="index">{{ level.Name }}</option>
							</select>
						</td>
						<td v-else="">{{ level.Name }}</td>
					</tr>
					<!--<tr> //TODO: -->
					<!--	<td>Cita:</td>-->
					<!--	<td>(Armar algo simil APA… no sé si tiene sentido)</td>-->
					<!--</tr>-->
					<tr>
						<td>Metadatos:</td>
						<td>
							<a target="_blank" :href="resolveMetadataUrl()">
								<file-pdf-icon title="Consultar" /> Consultar
							</a>
						</td>
					</tr>
					<tr v-if="work.Files && work.Files.length > 0">
						<td>Adjuntos:</td>
						<td><div class="attachmentsDownloadPanel">
							<span v-for="file in work.Files" :key="file.Id">
								<a target="_blank" :href="resolveFileUrl(file)">
									<file-pdf-icon title="Descargar" /> {{ file.Caption }}
								</a>
							</span>
						</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</Modal>
</template>


<script>
import h from '@/public/js/helper';
import FilePdfIcon from 'vue-material-design-icons/FilePdf.vue';
import creativeCommons from '@/public/components/controls/creativeCommons.vue';
import apa from '@/common/js/citationAPA';
import Modal from '@/public/components/popups/modal';

export default {
	name: 'workMetadataPopup',
	components: {
    creativeCommons,
    FilePdfIcon,
		Modal
	},
	data() {
		return {
			downloadLevel: 0,
			metric: null,
			work: null
		};
	},
  methods: {
		showByMetric(metric) {
			this.metric = metric;
			this.downloadLevel = this.version.SelectedLevelIndex;
			this.work = metric.SelectedVersion().Work;
			this.$refs.dialog.show();
		},
		show(work) {
			this.metric = null;
			this.downloadLevel = null;
			this.work = work;
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
			return apa.onlineMapCitation(this.htmlEncode(this.work.Authors), this.htmlEncode(this.formattedYear),
					this.htmlEncode(this.work.Name), this.completeUrl(this.work.Url));
		},
		citationAPAText() {
			return apa.onlineMapCitation(this.work.Authors, this.formattedYear,
				this.work.Name, this.completeUrl(this.work.Url), true);
		},
		htmlEncode(html) {
			return document.createElement('a').appendChild(
				document.createTextNode(html)).parentNode.innerHTML;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.host + '/services/metadata/GetMetadataFile?m=' + this.work.MetadataId + '&f=' + file.FileId + h.urlParam('l', window.accessLink);
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.host + '/services/metadata/GetWorkMetadataPdf?m=' + this.work.MetadataId + (this.level ? '&d=' + this.level.Dataset.Id : '') + '&w=' + this.work.Id + h.urlParam('l', window.accessLink);
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
			var s = this.work.ReleaseDate;
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
			var s = this.work.ReleaseDate;
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
