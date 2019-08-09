<template>
	<div>
	<md-dialog :md-active.sync="showDialog">
		<md-dialog-title>Indicador</md-dialog-title>
		<md-dialog-content>
		<invoker ref="invoker"></invoker>
			<div v-if="newMetricVersionLevel" class="md-layout md-gutter">
				<div class="md-layout-item md-size-100 md-small-size-100">
					<mp-simple-text :canEdit="newMetricVersionLevel.MetricVersion.Metric.CanEdit"
										label="Nombre" ref="metricInput" @enter="save"
										helper="Ej. Acceso a agua potable"
										:maxlength="75"  v-model="newMetricVersionLevel.MetricVersion.Metric.Caption"
								>
					</mp-simple-text>

				</div>
				<div v-if="Work.IsPublicData()" class='md-layout-item md-size-75 md-small-size-100'>
					<mp-select :canEdit="newMetricVersionLevel.MetricVersion.Metric.CanEdit"
											label='Categoría'
										 v-model="newMetricVersionLevel.MetricVersion.Metric.MetricGroup"
										 list-key='Id'
										 :list='MetricGroups'
										 helper='Indique el tipo de información del indicador.'
										 />
				</div>

				<div class="md-layout-item md-size-60 md-small-size-100">
					<mp-simple-text
									label="Edición" ref="metricInput"  @enter="save"
									helper="Año de referencia de la edición o serie de datos. Ej. 2010"
									:maxlength="10"  v-model="newMetricVersionLevel.MetricVersion.Caption"
								></mp-simple-text>
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
				<md-button @click="hide">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
      </md-dialog-actions>

		</md-dialog>
	</div>
</template>

<script>

import axios from 'axios';
import f from '@/backoffice/classes/Formatter';

export default {
  name: 'MetricPopup',
	components: {
	},
  methods:  {
		show(level) {
			// Se pone visible
			this.MetricVersionLevel = level;
			this.newMetricVersionLevel = f.clone(level);
			this.showDialog = true;
		},
		hide() {
			this.showDialog = false;
		},
		save() {
			if (this.newMetricVersionLevel.MetricVersion.Metric.Caption === null ||
				this.newMetricVersionLevel.MetricVersion.Metric.Caption.trim() === '') {
				alert("Debe indicar un valor para el nombre del indicador.");
				return;
			}
			if (this.newMetricVersionLevel.MetricVersion.Caption === null ||
				this.newMetricVersionLevel.MetricVersion.Caption.trim() === '') {
				alert("Debe indicar un valor para 'Edición'.");
				return;
			}
			var loc = this;
			this.$refs.invoker.do(this.Dataset,
					loc.Dataset.UpdateMetricVersionLevel, loc.newMetricVersionLevel).then(function(data) {
						loc.MetricVersionLevel.MetricVersion.Caption = loc.newMetricVersionLevel.MetricVersion.Caption;
						loc.MetricVersionLevel.MetricVersion.Metric.Caption = loc.newMetricVersionLevel.MetricVersion.Metric.Caption;
						loc.hide();
					});
		},
  },
	computed: {
		 Dataset() {
      return window.Context.CurrentDataset;
    },
		 Work() {
      return window.Context.CurrentWork;
    },
		MetricGroups() {
			return window.Context.MetricGroups.list;
		},
		title() {
			if (this.metricVersionLevel !== null) {
				return this.metricVersionLevel.MetricVersion.Metric.Caption;
			} else {
				return null;
			}
		}
	},
	data() {
		return {
			showDialog: false,
			newMetricVersionLevel: null,
			MetricVersionLevel: null
		};
	},
};
</script>

<style lang="scss">
</style>

