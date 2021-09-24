<template>
	<div>
		<md-dialog :md-active.sync="showDialog">
			<md-dialog-title>Indicador</md-dialog-title>

			<pick-metric ref="pickMetric" @onSelectedMetric="doBind">
			</pick-metric>

			<md-dialog-content>
				<invoker ref="invoker"></invoker>
				<div v-if="newMetricVersionLevel" class="md-layout md-gutter">
					<div class="md-layout-item md-size-100 md-small-size-100">
						<mp-simple-text :canEdit="newMetricVersionLevel.MetricVersion.Metric.CanEdit"
														label="Nombre" ref="metricInput" @enter="save"
														helper="Ej. Acceso a agua potable"
														:maxlength="150" v-model="newMetricVersionLevel.MetricVersion.Metric.Caption">
						</mp-simple-text>
					</div>
					<div v-if="Work.IsPublicData()" class='md-layout-item md-size-75 md-small-size-100'>
						<mp-select :canEdit="newMetricVersionLevel.MetricVersion.Metric.CanEdit"
											 label='Categoría'
											 v-model="newMetricVersionLevel.MetricVersion.Metric.MetricGroup"
											 list-key='Id'
											 :list='MetricGroups'
											 helper='Indique el tipo de información del indicador.' />
					</div>
					<div v-if="Work.IsPublicData()" class='md-layout-item md-size-75 md-small-size-100'>
						<mp-select :canEdit="newMetricVersionLevel.MetricVersion.Metric.CanEdit"
											 label='Origen'
											 v-model="newMetricVersionLevel.MetricVersion.Metric.MetricProvider"
											 list-key='Id'
											 :list='MetricProviders'
											 helper='Indique la fuente agrupada del indicador.' />
					</div>
					<div class="md-layout-item md-size-60 md-small-size-100">
						<mp-simple-text label="Edición" @enter="save"
														helper="Año de referencia de la edición o serie de datos. Ej. 2010"
														:maxlength="20" v-model="newMetricVersionLevel.MetricVersion.Caption"></mp-simple-text>
					</div>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="bind" class="leftActionButton" v-if="SameMetricVersions && SameMetricVersions.length < 2">
					<md-icon>link</md-icon>
					Vincular
					<md-tooltip md-direction="bottom">Poner en serie con un indicador existente</md-tooltip>
				</md-button>
				<md-button @click="unbind" class="leftActionButton" v-if="SameMetricVersions && SameMetricVersions.length > 1">
					<md-icon>link_off</md-icon>
					Desvincular
					<md-tooltip md-direction="bottom">Desvincular de la serie ({{ SameMetricVersionsAsText }})</md-tooltip>
				</md-button>

				<md-button @click="hide">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
			</md-dialog-actions>
			<mp-confirm ref="confirmDialog"
									title="Cambiar el nombre del indicador"
									text="Al cambiar el nombre del indicador, modificará el nombre para toda la serie (las diferentes versiones del indicador). Si solamente desea cambiar el nombre para esta versión, debe desvincular primero esta versión."
									confirm-text="Renombrar"
									@confirm="doSave" />
			<mp-confirm ref="confirmUnbindDialog"
									title="Desvincular la versión"
									text="Si desvincula la versión del indicador, el mismo ya no será parte de la serie y formará un indicador nuevo."
									confirm-text="Desvincular"
									@confirm="doUnbind" />
		</md-dialog>
	</div>
</template>

<script>

import axios from 'axios';
import f from '@/backoffice/classes/Formatter';
import PickMetric from './PickMetric.vue';

export default {
  name: 'MetricPopup',
		components: {
			PickMetric
	},
  methods: {
		show(level) {
			// Se pone visible
			this.MetricVersionLevel = level;
			this.newMetricVersionLevel = f.clone(level);
			this.SameMetricVersions = null;
			this.showDialog = true;
			var loc = this;
			this.Work.GetMetricVersionsByMetric(this.MetricVersionLevel.MetricVersion.Metric).then(function (data) {
				loc.SameMetricVersions = data;
			});
			setTimeout(() => {
					this.$refs.metricInput.focus();
				}, 75);
		},
		hide() {
			this.showDialog = false;
		},
		bind() {
			this.$refs.pickMetric.show();
		},
		unbind() {
			this.$refs.confirmUnbindDialog.show();
		},
		doUnbind() {
			this.newMetricVersionLevel.MetricVersion.Metric.Id = null;
			this.newMetricVersionLevel.MetricVersion.Id = null;
			this.SameMetricVersions = [];
		},
		doBind(metric) {
			this.newMetricVersionLevel.MetricVersion.Id = null;
			this.newMetricVersionLevel.MetricVersion.Metric = metric;
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
			if (this.SameMetricVersions && this.SameMetricVersions.length > 1
						&& this.MetricVersionLevel.MetricVersion.Metric.Caption !== this.newMetricVersionLevel.MetricVersion.Metric.Caption) {
				this.$refs.confirmDialog.show();
				return;
			} else {
				this.doSave();
			}
		},
		doSave() {
			var loc = this;
			this.$refs.invoker.doSave(this.Dataset,
					loc.Dataset.UpdateMetricVersionLevel, loc.newMetricVersionLevel).then(function(data) {
						loc.MetricVersionLevel.MetricVersion.Caption = loc.newMetricVersionLevel.MetricVersion.Caption;
						loc.MetricVersionLevel.MetricVersion.Metric.Caption = loc.newMetricVersionLevel.MetricVersion.Metric.Caption;

						loc.MetricVersionLevel.Id = data.LevelId;
						loc.MetricVersionLevel.MetricVersion.Id = data.MetricVersionId;
						loc.MetricVersionLevel.MetricVersion.Metric.Id = data.MetricId;

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
		MetricProviders() {
			return window.Context.MetricProviders.list;
		},
		SameMetricVersionsAsText() {
			var ret = '';
			for (var version of this.SameMetricVersions) {
				ret += ', ' + version.Caption;
			}
			return ret.substr(2);
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
			MetricVersionLevel: null,
			SameMetricVersions: null
		};
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.leftActionButton {
		position: absolute;
		left: 8px;
	}
</style>

