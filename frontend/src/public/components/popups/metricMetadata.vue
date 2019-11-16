<template>
  <Modal v-if="work" :title="(metric ? 'Fuente' : 'Metadatos')" ref="dialog" :showCancel="false"  :showOk="false">
		<div>
			<table class="localTable">
				<tbody>
					<tr>
						<td>Título:</td>
						<td>{{ work.Name }}</td>
					</tr>
					<tr>
						<td>Autores:</td>
						<td>{{ work.Authors }}</td>
					</tr>
					<tr v-if="level">
						<td>Dataset:</td>
						<td>{{ level.Dataset.Name }}</td>
					</tr>
					<tr v-if="work.ReleaseDate">
						<td>Publicación:</td>
						<td>{{ work.ReleaseDate }}</td>
					</tr>
					<tr v-if="work.Abstract">
						<td>Resumen:</td>
						<td>{{ work.Abstract }}</td>
					</tr>
					<tr>
						<td style="width: 120px;">Dirección:</td>
						<td>
							<a target="_blank" :href="work.Url">{{ work.Url }}</a>
						</td>
					</tr>
					<tr>
						<td>Cita (APA):</td>
						<td class="quotation">
							<span v-html="citationAPA(work)"> </span>
							<a href="#" v-clipboard="() => citationAPAText(work)" class="superSmallButton">
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
								<file-pdf-icon title="Descargar" /> Descargar
							</a>
						</td>
					</tr>
					<tr v-if="work.Files && work.Files.length > 0">
						<td>Adjuntos:</td>
						<td>
							<span v-for="file in work.Files" :key="file.Id">
								<a target="_blank" :href="resolveFileUrl(file)">
									<file-pdf-icon title="Descargar" /> {{ file.Caption }}
								</a>
							</span>
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
import creativeCommons from '@/public/components/widgets/creativeCommons.vue';
import apa from '@/common/js/citationAPA';
import Modal from '@/public/components/popups/modal';

export default {
	name: 'metricMetadataPopup',
	props: [
		'metric',
		'work',
	],
	components: {
    creativeCommons,
    FilePdfIcon,
		Modal
	},
	data() {
		return {
			downloadLevel: 0,
		};
	},
  methods: {
		show() {
			if (this.metric) {
				this.downloadLevel = this.version.SelectedLevelIndex;
			}
			this.$refs.dialog.show();
		},
		citationAPA(work) {
			return apa.onlineMapCitation(this.htmlEncode(work.Authors), this.htmlEncode(work.ReleaseDate),
					this.htmlEncode(work.Name), work.Url);
		},
		citationAPAText(work) {
			return apa.onlineMapCitation(work.Authors, work.ReleaseDate,
				work.Name, work.Url, true);
		},
		htmlEncode(html) {
			return document.createElement('a').appendChild(
				document.createTextNode(html)).parentNode.innerHTML;
		},
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.host + '/services/metadata/GetMetadataFile?m=' + this.work.MetadataId + '&f=' + file.FileId;
			} else {
				return '#';
			}
		},
		resolveMetadataUrl() {
			return window.host + '/services/metadata/GetMetadataPdf?m=' + this.work.MetadataId + (this.level ? '&d=' + this.level.Dataset.Id : '') + '&w=' + this.work.Id;
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
