<template>
	<div>
		<md-dialog :md-active.sync="openPopup" style="width: 550px; height: 520px">

			<md-dialog-title>
				Seleccionar versión de indicador
			</md-dialog-title>
			<md-dialog-content>
			<invoker ref="invoker"></invoker>
				<p>
					Seleccione la versión de indicador a la que desea agregar un nivel.
				</p>
			<div class="md-layout">
				<div class="md-layout-item">
					<md-table v-model="list" md-sort="caption" md-sort-order="asc" md-card="">
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="selected = item; save(); " class="selectable" md-label="Nombre" :md-sort-by="item.Metric.Caption">{{ item.Metric.Caption }}</md-table-cell>
							<md-table-cell @click.native="selected = item; save(); " md-label="Version" class="selectable" :md-sort-by="item.Caption">{{ item.Caption }}</md-table-cell>
						</md-table-row>
					</md-table>
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
				<md-button @click="openPopup = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Seleccionar</md-button>
		</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';

export default {
  name: 'MetricVersions',
  data() {
    return {
      openPopup: false,
      source: null,
			selected: null
    };
  },
	props: {
    list: {
			type: Array,
			default: function () {
        return [];
      }
		}
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
		Dataset() {
      return window.Context.CurrentDataset;
    },
  },
  methods: {
    save() {
			if (this.selected === null) {
				alert('No ha seleccionado ninguna versión de indicador.');
				return;
			}
			this.openPopup = false;
			this.$emit('onSelectMetricVersion', this.selected);
    },
    show(metricVersions) {
			this.openPopup = true;
    },
  },
  components: {

	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-dialog-actions {
  padding: 8px 20px 8px 24px !important;
}

.close-button {
    min-width: unset;
    height: unset;
    margin: unset;
    float: right;
}

</style>
