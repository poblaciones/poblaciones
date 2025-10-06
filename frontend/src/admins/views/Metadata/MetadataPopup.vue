<template>
  <div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-content style="min-width: 1290px!important; min-height: 800px!important">
				<invoker ref="invoker"></invoker>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-100">
						<Metadata :metadataProperty="metadata" :canEditProperty="true"></Metadata>
					</div>
				</div>
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

</style>
