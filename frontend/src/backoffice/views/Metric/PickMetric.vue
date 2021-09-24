<template>
	<div>
		<md-dialog :md-active.sync="openPopup" style="width: 550px; height: 520px;left: 50%; margin-left: -200px;">
			<md-dialog-title>
				Seleccionar indicador
			</md-dialog-title>
			<md-dialog-content>
			<invoker ref="invoker"></invoker>
				<p>
					Seleccione el indicador al que desea agregarle una nueva edición.
				</p>
			<div class="md-layout">
				<div class="md-layout-item">
					<md-table v-model="list" md-sort="caption" md-sort-order="asc" md-card="">
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="selected = item; save(); " class="selectable" md-label="Nombre" :md-sort-by="item.Caption">{{ item.Caption }}</md-table-cell>
							<md-table-cell @click.native="selected = item; save(); " md-label="Versions" class="selectable" :md-sort-by="item.Versions.join(', ')">{{ formatVersions(item) }}</md-table-cell>
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
  name: 'Metrics',
  data() {
    return {
      openPopup: false,
      source: null,
			list: [],
			selected: null
    };
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
  },
  methods: {
    save() {
			if (this.selected === null) {
				alert('No ha seleccionado ningún indicador.');
				return;
			}
			this.openPopup = false;
			this.$emit('onSelectedMetric', this.selected);
    },
		formatVersions(item) {
			if (item === null) {
				return '-';
			} else {
				return item.Versions.join(', ');
			}
		},
    show() {
			var loc = this;
			if (this.Work.properties.Type === 'P') {
				window.Context.PublicMetrics.GetAll(function(data) {
					loc.list = data;
			    loc.openPopup = true;
  				});
			} else if (this.Work.properties.Type === 'R') {
				window.Context.CartographyMetrics.GetAll(function(data) {
					loc.list = data;
			    loc.openPopup = true;
  				});
			} else throw new Error('Tipo de obra no reconocida.');

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
