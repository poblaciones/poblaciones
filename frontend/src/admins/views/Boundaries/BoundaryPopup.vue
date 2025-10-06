<template>
  <div>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Delimitación</md-dialog-title>
			<md-dialog-content v-if="boundary">
				<invoker ref="invoker"></invoker>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-80">
						<mp-simple-text label="Nombre" ref="inputName"
														v-model="boundary.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-80">
						<mp-select :list="groups"
											 :model-key="false" label="Grupo"
											 v-model="boundary.Group" />
					</div>
					<div class="md-layout-item md-size-40">
						<mp-simple-text label="Orden"
														v-model="boundary.Order" @enter="save" />
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="isPublic">
							Público (se encuentra visible a todos los usuarios)
						</md-switch>
					</div>
					<div class="md-layout-item md-size-100">
						<md-switch class="md-primary" v-model="boundary.IsSuggestion">
							Recomendado
						</md-switch>
						<div class="md-layout-item md-size-80" style="margin-left: 52px">
							<mp-simple-text label="Ícono para la recomendación (Material-Icon)" :canEdit="boundary.IsSuggestion"
															v-model="boundary.Icon" @enter="save" />
						</div>
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';

export default {
  name: "BoundaryPopup",
  data() {
    return {
			activateEdit: false,
			isPublic: false,
			boundary: null,
			groups: [],
    };
  },
  computed: {

  },
  methods: {
		show(boundary, groups) {
			this.groups = groups;
			this.boundary = f.clone(boundary);
			this.activateEdit = true;
			this.isPublic = !boundary.IsPrivate;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 1000);
		},
		save() {
			var loc = this;
			this.boundary.IsPrivate = !this.isPublic;

			this.$refs.invoker.doSave(window.Db, window.Db.UpdateBoundary,
							this.boundary).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.boundary);
			});
		}
  },
  components: {

  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
