<template>
	<Modal title="Fuente" ref="showFuente" :showCancel="false" :showOk="false">
		<div>
			<div>
				<table class="localTable">
					<tbody>
						<tr>
							<td>Título:</td>
							<td>{{ metadata.Caption }}</td>
						</tr>
						<tr v-if="metadata.Abstract">
							<td>Resumen:</td>
							<td>{{ metadata.Abstract }}</td>
						</tr>
						<tr v-if="metadata.Authors">
							<td>Autores:</td>
							<td>{{ metadata.Authors }}</td>
						</tr>
						<tr v-if="metadata.Institution">
							<td>Institución:</td>
							<td>{{ metadata.Institution }}</td>
						</tr>
						<tr v-if="metadata.Date">
							<td>Publicación:</td>
							<td>{{ metadata.Date }}</td>
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
									<file-pdf-icon title="Descargar" /> Descargar
								</a>
							</td>
						</tr>
						<tr v-if="metadata.Files && metadata.Files.length > 0">
							<td>Adjuntos:</td>
							<td>
								<span v-for="file in metadata.Files" :key="file.Id">
									<a target="_blank" :href="resolveFileUrl(file)">
										<file-pdf-icon title="Descargar" /> {{ file.Caption }}
									</a>
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</Modal>
</template>


<script>
import h from '@/public/js/helper';
import FilePdfIcon from 'vue-material-design-icons/FilePdf.vue';
import creativeCommons from '@/public/components/widgets/creativeCommons.vue';
import str from '@/common/js/str';
import Modal from '@/public/components/popups/modal';

export default {
	name: 'clippingMetadataPopup',
	props: [
		'metadata',
	],
	components: {
    creativeCommons,
		FilePdfIcon,
		Modal
	},
  methods: {
		resolveFileUrl(file) {
			if (file.Web) {
				return file.Web;
			} else if (file.FileId) {
				return window.host + '/services/metadata/GetMetadataFile?m=' + this.metadata.Id + '&f=' + file.FileId;
      } else {
				return '#';
			}
		},
		show() {
			this.$refs.showFuente.show();
		},
		resolveMetadataUrl() {
			return window.host + '/services/metadata/GetMetadataPdf?m=' + this.metadata.Id;
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
