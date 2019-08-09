<template>
  <div v-if="metadata">
    <div class="sourceInfo" :style="(useIcon ? 'top: 45px; right: 17px;' : '')">
			<a v-if="false" href="#" v-on:click="clickDescargar"><download-icon
				title="Descargar"/> Descargar</a>
      &nbsp;
			<a v-if="this.useIcon" href="#" :title="'Fuente de delimitación para ' + clipping.Region.Summary.Name"
					v-on:click="clickFuente" style="color: #a7a7a7">
				<link-icon style="font-size: 13px; padding-top: 20px;" :title="'Fuente de delimitación para ' + clipping.Region.Summary.Name" />
			</a>
      <a v-else="" href="#" v-on:click="clickFuente"
				 title="Fuente de habitantes, hogares y área" style="color: #a7a7a7">
				<link-icon />
				Fuente
			</a>
    </div>
    <div style="position: absolute">
      <Modal title="Fuente" ref="showFuente" :showCancel="false"  :showOk="false"
						 v-on:cancel="closeFuente" v-on:ok="closeFuente">
				<ClippingMetadata :metadata="metadata" />
      </Modal>
    </div>
  </div>
</template>

<script>
import Modal from '@/public/components/popups/modal';
import ClippingMetadata from '@/public/components/popups/clippingMetadata';
import DownloadIcon from 'vue-material-design-icons/download.vue';
import LinkIcon from 'vue-material-design-icons/Link.vue';

export default {
	name: 'clippingSourceInfo',
	components: {
    Modal,
    DownloadIcon,
		LinkIcon,
		ClippingMetadata
	},
	props: [
    'metadata',
    'clipping',
		'useIcon'
	],
	data() {
		return {
			work: {},
			showDescargar: false,
		};
	},
  methods: {
		clickDescargar(e) {
			e.preventDefault();
			this.showDescargar = true;
		},
		closeDescargar() {
			this.showDescargar = false;
		},
		clickFuente(e) {
			e.preventDefault();
			this.$refs.showFuente.show();
		},
		closeFuente() {
			this.$refs.showFuente.hide();
		},
	},
};
</script>

<style scoped>
.sourceInfo
{
  position: absolute;
  top: 12px;
  right: 0px;
  font-size: 12px;
}

</style>
