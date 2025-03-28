<template>
  <Modal :title="this.title" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="metric || work">
			<table class="localTable">
				<tbody>
					<tr>
						<td>Título:</td>
						<td class='tdWrappable'>{{ work.Metadata.Name }}</td>
					</tr>
					<tr v-if="work.Metadata.Authors">
						<td>Autores:</td>
						<td class='tdWrappable'>{{ work.Metadata.Authors }}</td>
					</tr>
					<tr v-if="level">
						<td>Dataset:</td>
						<td class='tdWrappable'>{{ level.Dataset.Name }}</td>
					</tr>
					<tr v-if="work.Metadata.ReleaseDate">
						<td>Publicación:</td>
						<td class='tdWrappable'>{{ formattedReleaseDate }}</td>
					</tr>
					<tr v-if="work.Metadata.Abstract">
						<td>Resumen:</td>
						<td class='tdWrappable'>{{ work.Metadata.Abstract }}</td>
					</tr>
					<tr>
						<td style="width: 120px;">Dirección:</td>
						<td class='tdWrappable'>
							<a target="_blank" :href="completeUrl(work.Url)">{{ completeUrl(work.Url) }}</a>
						</td>
					</tr>
					<tr v-if="work.ArkUrl">
						<td style="width: 120px;">Ark:</td>
						<td class='tdWrappable'>
							<a target="_blank" :href="work.ArkUrl">{{ work.ArkUrl }}</a>
							<a href="#" v-clipboard="() => work.ArkUrl" class="superSmallButton">
								Copiar
							</a>
						</td>
					</tr>
					<tr>
						<td>Cita (APA):</td>
						<td class="quotation tdWrappable">
							<span v-html="citationAPA()"> </span>
							<a href="#" v-clipboard="() => citationAPAText()" class="superSmallButton">
								Copiar
							</a>
						</td>
					</tr>
					<tr>
						<td>Licencia:</td>
						<td>
							<creativeCommons :license="work.Metadata.License" />
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
								<i class="far fa-file-pdf" /> Consultar
							</a>
						</td>
					</tr>
					<tr v-if="work.Metadata.Files && work.Metadata.Files.length > 0">
						<td>Adjuntos:</td>
						<td class='tdWrappable'>
							<div class="attachmentsDownloadPanel">
								<span v-for="file in work.Metadata.Files" :key="file.Id">
									<a target="_blank" :href="resolveFileUrl(file)">
										<i class="far fa-file-pdf" /> {{ file.Caption }}
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
import creativeCommons from '@/public/components/controls/creativeCommons.vue';
import apa from '@/common/js/citationAPA';
import Modal from '@/public/components/popups/modal';

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
