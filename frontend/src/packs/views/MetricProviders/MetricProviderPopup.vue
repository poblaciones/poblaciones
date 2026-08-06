<template>
  <div>
		<invoker ref="invoker"></invoker>
		<md-dialog v-if="metricProvider" class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Origen de indicador</md-dialog-title>
			<md-dialog-content>
				<div class="md-layout md-gutter">
					<div class="md-layout-item md-size-70">
						<mp-simple-text label="Nombre" ref="inputName" :canEdit="canEdit"
														v-model="metricProvider.Caption" @enter="save" />
					</div>
					<div class="md-layout-item md-size-30">
						<mp-simple-text label="Orden" type="number" :canEdit="canEdit" helper="Orden en que se muestran los orígenes"
														v-model="metricProvider.Order" @enter="save" />
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
  name: "MetricProviderPopup",
  data() {
    return {
			activateEdit: false,
			metricProvider: null,
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
		show(metricProvider) {
			this.metricProvider = f.clone(metricProvider);
			this.activateEdit = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputName.focus();
			}, 100);
		},
		save() {
			if (this.metricProvider.Caption.trim() === '') {
				alert('Debe indicar un valor para \'Nombre\'.');
				return;
			}
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateMetricProvider,
							this.metricProvider).then(function(data) {
								loc.activateEdit = false;
								loc.$emit('completed', loc.metricProvider);
			});
		}
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
