<template>
	<div>
		<md-dialog :md-active.sync="openPopup" style="width: 800px; height: 620px;left: 50%; top: 50px; margin-left: -380px;">
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
					<md-table v-model="listFiltered" md-sort="caption" md-sort-order="asc" md-card="" :md-height="250"  md-fixed-header>
						<md-table-toolbar>
							<md-field md-clearable class="md-toolbar-section-end">
								<md-input placeholder="Buscar..." v-model="search" ref="inputSearch" @input="searchOnTable" />
								<md-icon>search</md-icon>
							</md-field>
						</md-table-toolbar>

						<md-table-empty-state md-label=""
																	:md-description="notFound()">
						</md-table-empty-state>

						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="selected = item; save(); " class="selectable" md-label="Nombre" :md-sort-by="item.Caption">{{ item.Caption }}</md-table-cell>
							<md-table-cell @click.native="selected = item; save(); " md-label="Versiones" class="selectable" :md-sort-by="item.Versions.join(', ')">{{ formatVersions(item) }}</md-table-cell>
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
import arr from '@/common/framework/arr';

export default {
  name: 'Metrics',
  data() {
    return {
      openPopup: false,
			source: null,
			search: '',
			list: [],
			listFiltered: [],
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
		notFound() {
			return 'No se encontraron indicadores coincidentes con la búsqueda indicada.';
		},
		searchOnTable() {
			this.listFiltered = arr.SearchByCaption(this.list, this.search);
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
					loc.listFiltered = loc.list;
					loc.search = '';
					loc.openPopup = true;
					setTimeout(() => {
						loc.$refs.inputSearch.$el.focus();
					}, 75);
  				});
			} else if (this.Work.properties.Type === 'R') {
				window.Context.CartographyMetrics.GetAll(function(data) {
					loc.list = data;
					loc.listFiltered = loc.list;
					loc.search = '';
					loc.openPopup = true;
					setTimeout(() => {
						loc.$refs.inputSearch.$el.focus();
					}, 75);
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
