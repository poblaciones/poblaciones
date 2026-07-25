<template>
  <div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="true" class="wide-dialog">
			<md-dialog-content class="extraWideDialog">
				<invoker ref="invoker"></invoker>
				<Metadata :metadataProperty="metadata" :canEditProperty="true"></Metadata>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';

import Metadata from '@/backoffice/views/Metadata/Metadata';

export default {
		name: "MetadataPopup",
		components: {
			Metadata
		},
  data() {
    return {
			activateEdit: false,
			clippingRegion: null,
			useInSearch: 0,
			metadata: null,
    };
  },
  computed: {

  },
  methods: {
		show(activeMetadata) {
			this.metadata = activeMetadata;
			// Se pone visible...
			this.activateEdit = true;
		},
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.extraWideDialog {
		min-height: 800px !important;
		min-width: 920px;
		max-width: unset;
		padding: 00px;
		margin-right: -20px;
		padding-right: 20px;
		margin-bottom: -32px;
	}
</style>
