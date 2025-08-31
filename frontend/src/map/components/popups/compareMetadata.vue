<template>
	<Modal :title="title" ref="showFuente" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="metadata">
			<div>
				<table class="localTable">
					<tbody>
						<tr>
							<td>Título:</td>
							<td class='tdWrappable'>{{ metadata.Name }}</td>
						</tr>
						<tr v-if="metadata.Authors">
							<td>Autores:</td>
							<td class='tdWrappable'>{{ metadata.Authors }}</td>
						</tr>
						<tr v-if="metadata.Institution">
							<td>Institución:</td>
							<td class='tdWrappable'>{{ metadata.Institution }}</td>
						</tr>
						<tr v-if="metadata.Date">
							<td>Publicación:</td>
							<td class='tdWrappable'>{{ metadata.Date }}</td>
						</tr>
						<tr v-if="metadata.Abstract">
							<td>Resumen:</td>
							<td class='tdWrappable'>{{ metadata.Abstract }} </td>
						</tr>
						<tr>
							<td>Cita (APA):</td>
							<td class="quotation tdWrappable">
								<span v-html="citationAPA(metadata)"> </span>
								<a href="#" v-clipboard="() => citationAPAText(metadata)" class="superSmallButton">
									Copiar
								</a>
							</td>
						</tr>
						<tr>
							<td>Licencia:</td>
							<td>
								<creativeCommons :license="metadata.License" />
							</td>
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
						<tr v-if="metadata.Files && metadata.Files.length > 0">
							<td>Adjuntos:</td>
							<td class='tdWrappable'><div class="attachmentsDownloadPanel">
								<span v-for="file in metadata.Files" :key="file.Id">
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
		</div>
	</Modal>
</template>


<script>
import h from '@/map/js/helper';
import creativeCommons from '@/map/components/controls/creativeCommons.vue';
import str from '@/common/framework/str';
import apa from '@/common/js/citationAPA';
import Modal from '@/map/components/popups/modal';

export default {
	name: 'compareMetadataPopup',
	props: [
		'backgroundColor'
	],
	components: {
    creativeCommons,
		Modal
	},
	data() {
		return {
			metadata: null,
			title: 'Fuente'
		};
	},
  methods: {
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.mainHost + '/services/metadata/GetMetadataFile?m=' + this.metadata.Id + '&f=' + file.FileId + h.urlParam('l', window.accessLink);
      } else {
				return '#';
			}
		},
		show(metadata, title) {
			this.metadata = metadata;
			this.title = title;
			this.$refs.showFuente.show();
		},
		citationAPA(metadata) {
			return apa.onlineMapCitation(this.htmlEncode(metadata.Authors), this.htmlEncode(metadata.Date),
					this.htmlEncode(metadata.Name));
		},
		citationAPAText(metadata) {
			return apa.onlineMapCitation(metadata.Authors, metadata.Date,
				metadata.Name, null, true);
		},
		htmlEncode(html) {
			return document.createElement('a').appendChild(
				document.createTextNode(html)).parentNode.innerHTML;
		},
		resolveMetadataUrl() {
			return window.mainHost + '/services/metadata/GetMetadataPdf?m=' + this.metadata.Id + h.urlParam('l', window.accessLink);
		},
		calculateHref(workId) {
		var pathArray = window.location.pathname.split('/');
		if (pathArray.length > 0 && str.isNumeric(pathArray[pathArray.length - 1])) {
					pathArray.pop();
				}
				var path = pathArray.join('/');
				path = h.ensureFinalBar(path);
				return h.qualifyURL(path + workId);
		}
	},
	computed: {

	}
};
</script>
<style scoped>
</style>
