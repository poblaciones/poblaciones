<template>
	<Modal :title="title" ref="showFuente" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="metadata">
			<div class="fld">
				<div class="fld-label">Título</div>
				<div class="fld-value">{{ metadata.Name }}</div>
			</div>
			<div class="fld" v-if="metadata.Authors">
				<div class="fld-label">Autores</div>
				<div class="fld-value">{{ metadata.Authors }}</div>
			</div>
			<div class="fld" v-if="metadata.Institution">
				<div class="fld-label">Institución</div>
				<div class="fld-value">{{ metadata.Institution }}</div>
			</div>
			<div class="fld fld-hide-mobile" v-if="metadata.Date">
				<div class="fld-label">Publicación</div>
				<div class="fld-value">{{ metadata.Date }}</div>
			</div>
			<div class="fld fld-hide-mobile" v-if="metadata.Abstract">
				<div class="fld-label">Resumen</div>
				<div class="fld-value">{{ metadata.Abstract }}</div>
			</div>
			<div class="fld fld-hide-mobile" v-if="boundaryId !== null">
				<div class="fld-label">Dirección</div>
				<div class="fld-value">
					<a target="_blank" :href="resolvePublicUrl()">{{ resolvePublicUrl() }}</a>
				</div>
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
					<span v-html="citationAPA(metadata)"> </span>
					<a href="#" v-clipboard="() => citationAPAText(metadata)" class="superSmallButton">
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
						<span v-for="file in metadata.Files" :key="file.Id">
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
import str from '@/common/framework/str';
import apa from '@/common/js/citationAPA';
import Modal from '@/map/components/popups/modal';

export default {
	name: 'clippingMetadataPopup',
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
			title: 'Fuente',
			// Id de la delimitación cuyo metadata se muestra. A diferencia del
			// work, un boundary no persiste su propia ruta estable ni su Ark en
			// los metadatos (sus metadatos son los del/los clipping_region que
			// agrupa esa versión, y varios boundaries pueden compartir uno): se
			// arman al vuelo a partir de este id. null: metadata de un work, sin
			// ruta estable propia que mostrar acá.
			boundaryId: null
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
		show(metadata, title, boundaryId) {
			this.metadata = metadata;
			this.title = title;
			if (boundaryId === undefined) {
				this.boundaryId = null;
			} else {
				this.boundaryId = boundaryId;
			}
			this.$refs.showFuente.show();
		},
		citationAPA(metadata) {
			return apa.onlineMapCitation(this.htmlEncode(metadata.Authors), this.htmlEncode(metadata.Date),
				this.htmlEncode(metadata.Name), this.availablePublicUrl);
		},
		citationAPAText(metadata) {
			return apa.onlineMapCitation(metadata.Authors, metadata.Date,
				metadata.Name, this.availablePublicUrl, true);
		},
		htmlEncode(html) {
			return document.createElement('a').appendChild(
				document.createTextNode(html)).parentNode.innerHTML;
		},
		resolveMetadataUrl() {
			var url = window.mainHost + '/services/metadata/GetMetadataPdf?m=' + this.metadata.Id + h.urlParam('l', window.accessLink);
			if (this.boundaryId !== null) {
				url += h.urlParam('b', this.boundaryId);
			}
			return url;
		},
		// Ruta estable de la delimitación (/map/b<id>), resuelta contra el
		// ShortUrlPattern configurado en el servidor.
		resolvePublicUrl() {
			var location = '';
			if (this.boundaryId) {
				location = '/map/b' + this.boundaryId;
			}
			return str.PatternUrl(location, window.SegMap.Configuration.ShortUrlPattern);
		}
	},
	computed: {
		availablePublicUrl() {
			return (this.metadata.Ark ? this.metadata.Ark : this.resolvePublicUrl());
		}
	}
};
</script>
<style scoped>
</style>
