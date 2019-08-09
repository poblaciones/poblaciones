<template>
	<div>
		<md-dialog :md-active.sync="openSources" style="width: 750px">

			<md-dialog-title>
				Agregar fuente
			</md-dialog-title>
			<md-dialog-content>
			<invoker ref="invoker"></invoker>

			<source-popup ref="SourcePopup"></source-popup>
			<div v-if="Work.CanEdit()" class="md-layout">
				<md-button @click="CreateNewSource()">
					<md-icon>add_circle_outline</md-icon>
					Crear nueva fuente
				</md-button>
			</div>
			<div class="md-layout">
				<div class="md-layout-item">
					<md-table v-model="sources" md-sort="caption" md-sort-order="asc" md-card="">
						<md-table-row slot="md-table-row" slot-scope="{ item }">
							<md-table-cell @click.native="selected = item; save(); "  class="selectable" md-label="Nombre" :md-sort-by="item.Caption">{{ item.Caption }}</md-table-cell>
							<md-table-cell @click.native="selected = item; save(); " md-label="Edición" class="selectable" :md-sort-by="item.Version">{{ item.Version }}</md-table-cell>
							<md-table-cell @click.native="selected = item; save(); " md-label="Institución" class="selectable" :md-sort-by="getInstitutionCaption(item)">{{ getInstitutionCaption(item) }}</md-table-cell>
						</md-table-row>
					</md-table>
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
				<md-button @click="openSources = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Seleccionar</md-button>
		</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import SourcePopup from '@/backoffice/views/Metadata/SourcePopup';

export default {
  name: 'Fuentes',
  data() {
    return {
      openSources: false,
      source: null,
			sources: [],
			selected: null
    };
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
		SecondaryLabel() {
			return (this.Work.IsPublicData() ? '' : ' secundarias');
		}
  },
  methods: {
    CreateNewSource(){
			var loc = this;
			window.Context.Factory.GetCopy('Source', function(data) {
					data.Work = loc.Work.properties;
					data.Type = loc.Work.properties.Type;
					data.IsEditableByCurrentUser = true;
					loc.openEdition(data);
			});
    },
		getInstitutionCaption(item) {
			if (item.Institution === null) {
				return '';
			} else {
				return item.Institution.Caption;
			}
		},
    save() {
			if (this.selected === null) {
				alert('No ha seleccionado ninguna fuente.');
				return;
			}
			if (this.Work.ContainsSource(this.selected)) {
				alert('La fuente seleccionada ya es parte de ' + this.Work.ThisWorkLabel() + '.');
				return;
			}
			var loc = this;
			this.$refs.invoker.do(this.Work, this.Work.AddSource, this.selected).then(function() {
				loc.openSources = false;
				});
    },
    show() {
			var loc = this;
			window.Context.Sources.GetAll(function(data) {
				loc.sources = data;
				loc.openSources = true;
			});
    },
    openEdition(item) {
      this.$refs.SourcePopup.show(item, this.closeParentCallback);
		},
		closeParentCallback() {
			this.openSources = false;
		}
  },
  components: {
    SourcePopup
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
