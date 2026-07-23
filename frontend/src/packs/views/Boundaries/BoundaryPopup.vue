<template>
  <div>
		<invoker ref="invoker"></invoker>
		<md-dialog :md-active.sync="activateEdit" :md-click-outside-to-close="false">
			<md-dialog-title>Delimitación</md-dialog-title>
			<md-dialog-content v-if="boundary">
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
					<div class="md-layout-item md-size-80">
						<mp-simple-text label="Tag" helper="Identificador para exponerlo vía WFS (todavía no implementado). Se autocompleta a partir del nombre (minúsculas, sin acentos, espacios como guion bajo), pero se puede ajustar a mano."
														v-model="boundary.Tag" @enter="save" />
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
			suppressTagWatch: false,
    };
  },
  computed: {

  },
	watch: {
		'boundary.Caption'(newValue) {
			if (this.boundary && !this.suppressTagWatch) {
				this.boundary.Tag = this.sanitizeTag(newValue);
			}
		},
	},
  methods: {
		// Minúsculas, sin acentos, espacios (y cualquier otro caracter no
		// alfanumérico) como guion bajo: mismo criterio que usa el sistema
		// para exponer el nombre vía WFS.
		sanitizeTag(caption) {
			if (!caption) {
				return '';
			}
			return caption
				.toLowerCase()
				.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '_')
				.replace(/^_+|_+$/g, '');
		},
		show(boundary, groups) {
			this.groups = groups;
			// Evita que asignar el clon inicial (que ya dispara el watch de
			// Caption) sobreescriba un Tag ya guardado: la auto-actualización
			// debe aplicar solo a cambios que haga el usuario después.
			this.suppressTagWatch = true;
			this.boundary = f.clone(boundary);
			this.activateEdit = true;
			this.isPublic = !boundary.IsPrivate;
			var loc = this;
			this.$nextTick(function () {
				loc.suppressTagWatch = false;
			});
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		save() {
			if (this.boundary.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return;
			}
			if (!this.boundary.Group) {
				alert('Debe indicar un valor para \'Grupo\'.');
				return;
			}
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
