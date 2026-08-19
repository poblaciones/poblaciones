<template>
  <div>
		<invoker ref="invoker"></invoker>
		<md-dialog v-if="metricGroup" class="medium-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Categoría de indicador</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-70">
						<mp-simple-text label="Nombre" ref="inputName" :canEdit="canEdit"
														v-model="metricGroup.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-30">
						<mp-simple-text label="Orden" type="number" :canEdit="canEdit" helper="Orden en que se muestran las categorías"
														v-model="metricGroup.Order" @enter="save" />
					</div>
					<div class="md-layout-item md-size-100">
						<mp-simple-text label="Ícono" :canEdit="canEdit" helper="Clase de FontAwesome, ej. fas fa-users"
														v-model="metricGroup.Icon" @enter="save" />
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">{{ cancelCaption }}</md-button>
				<md-button v-if="canEdit" class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import f from '@/backoffice/classes/Formatter';

export default {
  name: "MetricGroupPopup",
  data() {
    return {
			activateEdit: false,
			metricGroup: null,
    };
  },
  computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		cancelCaption() {
			if (this.canEdit) {
				return 'Cancelar';
			}
			return 'Cerrar';
		},
  },
  methods: {
		show(metricGroup) {
			this.metricGroup = f.clone(metricGroup);
			this.activateEdit = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		save() {
			if (this.metricGroup.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return;
			}
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateMetricGroup,
							this.metricGroup).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.metricGroup);
			});
		}
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
